import { NextAuthOptions } from "next-auth"
import { JWT } from "next-auth/jwt"
import { Session } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@workspace/database"
import { verifyOTP } from "@workspace/lib"
import bcrypt from "bcryptjs"

// ========================================
// TYPE EXTENSIONS
// ========================================

declare module "next-auth" {
  interface User {
    id: string
    email: string | null
    name: string | null
    role: string
  }

  interface Session {
    user: User
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  providers: [
    // ========================================
    // SUPER ADMIN - Password Authentication
    // ========================================
    CredentialsProvider({
      id: "super-admin-credentials",
      name: "Super Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { superAdminProfile: true }
          })

          if (!user || !user.superAdminProfile) {
            throw new Error('Invalid credentials')
          }

          // Check if account is locked
          if (user.superAdminProfile.lockedUntil && 
              user.superAdminProfile.lockedUntil > new Date()) {
            throw new Error('Account temporarily locked. Try again later.')
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password, 
            user.superAdminProfile.hashedPassword
          )

          if (!isValidPassword) {
            await prisma.superAdminProfile.update({
              where: { userId: user.id },
              data: {
                loginAttempts: { increment: 1 },
                lockedUntil: user.superAdminProfile.loginAttempts >= 4 
                  ? new Date(Date.now() + 15 * 60 * 1000)
                  : undefined
              }
            })
            throw new Error('Invalid credentials')
          }

          await prisma.superAdminProfile.update({
            where: { userId: user.id },
            data: {
              loginAttempts: 0,
              lockedUntil: null,
              lastLoginAt: new Date()
            }
          })

          if (!user) {
            throw new Error('User not found after OTP verification')
          }

          return {
            id: user.id,
            email: user.email || null,
            name: user.name || null,
            role: user.role
          }
        } catch (error) {
          console.error('Super Admin auth error:', error)
          throw error
        }
      }
    }),

    // ========================================
    // SUPER ADMIN - OTP Authentication
    // ========================================
    CredentialsProvider({
      id: "super-admin-otp",
      name: "Super Admin OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) {
          throw new Error('Email and OTP are required')
        }

        try {
          // Verify OTP
          const result = await verifyOTP({
            identifier: credentials.email,
            otp: credentials.otp,
            deleteAfterVerification: true
          })

          if (!result.valid) {
            throw new Error(result.message)
          }

          // Get super admin user
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { superAdminProfile: true }
          })

          if (!user || !user.superAdminProfile) {
            throw new Error('Super Admin not found')
          }

          // Update last login
          await prisma.superAdminProfile.update({
            where: { userId: user.id },
            data: {
              lastLoginAt: new Date(),
              loginAttempts: 0,
              lockedUntil: null
            }
          })

          return {
            id: user.id,
            email: user.email || null,
            name: user.name || null,
            role: user.role
          }
        } catch (error) {
          console.error('Super Admin OTP error:', error)
          throw error
        }
      }
    }),

    // ========================================
    // RESTAURANT OWNER - OTP Authentication
    // ========================================
   CredentialsProvider({
  id: "restaurant-owner-otp",
  name: "Restaurant Owner OTP",
  credentials: {
    email: { label: "Email", type: "email" },
    phone: { label: "Phone", type: "text" },
    otp: { label: "OTP", type: "text" },
    name: { label: "Name", type: "text" } // Frontend sends single name
  },
  async authorize(credentials) {
    if (!credentials?.otp) {
      throw new Error('OTP is required')
    }

    const identifier = credentials.email || credentials.phone
    if (!identifier) {
      throw new Error('Email or phone is required')
    }

    try {
      // Verify OTP
      const result = await verifyOTP({
        identifier,
        otp: credentials.otp,
        deleteAfterVerification: true
      })

      if (!result.valid) {
        throw new Error(result.message)
      }

      // Split name into firstName and lastName
      const nameParts = (credentials.name || '').trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      // Find existing user
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            credentials.email ? { email: credentials.email } : undefined,
            credentials.phone ? { phone: credentials.phone } : undefined
          ].filter(Boolean) as any
        },
        include: {
          restaurantOwner: true
        }
      })

      if (!user) {
  // Create new User
  user = await prisma.user.create({
    data: {
      email: credentials.email || `temp-${Date.now()}@example.com`,
      phone: credentials.phone || null,
      name: credentials.name || null,
      role: 'RESTAURANT_OWNER',
      emailVerified: credentials.email ? new Date() : null,
      phoneVerified: credentials.phone ? true : false,
    },
    include: {
      restaurantOwner: true
    }
  })

  // Create RestaurantOwner with split names
  await prisma.restaurantOwner.create({
    data: {
      userId: user.id,
      email: credentials.email || `temp-${Date.now()}@example.com`,
      phone: credentials.phone || `temp-${Date.now()}`,
      firstName: firstName,
      lastName: lastName,
      verified: true
    }
  })

  // Refetch to include the restaurantOwner
  const refetchedUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      restaurantOwner: true
    }
  })

  // ✅ Add null check here
  if (!refetchedUser) {
    throw new Error('Failed to create user')
  }
  
  user = refetchedUser

} else {
  // Update role if needed
  if (user.role !== 'RESTAURANT_OWNER') {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { 
        role: 'RESTAURANT_OWNER',
        name: credentials.name || user.name
      },
      include: {
        restaurantOwner: true
      }
    })
  }

  // Create RestaurantOwner if doesn't exist
  if (!user.restaurantOwner) {
    await prisma.restaurantOwner.create({
      data: {
        userId: user.id,
        email: credentials.email || user.email || `temp-${Date.now()}@example.com`,
        phone: credentials.phone || user.phone || `temp-${Date.now()}`,
        firstName: firstName,
        lastName: lastName,
        verified: true
      }
    })

    // Refetch with relation
    const refetchedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        restaurantOwner: true
      }
    })

    // ✅ Add null check here too
    if (!refetchedUser) {
      throw new Error('Failed to fetch user')
    }
    
    user = refetchedUser
  }
}

return {
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role
}
    } catch (error) {
      console.error('Restaurant Owner OTP error:', error)
      throw error
    }
  }
}),

    // ========================================
    // CUSTOMER - OTP Authentication
    // ========================================
    CredentialsProvider({
      id: "customer-otp",
      name: "Customer OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        phone: { label: "Phone", type: "text" },
        otp: { label: "OTP", type: "text" },
        name: { label: "Name", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.otp) {
          throw new Error('OTP is required')
        }

        const identifier = credentials.email || credentials.phone
        if (!identifier) {
          throw new Error('Email or phone is required')
        }

        try {
          // Verify OTP
          const result = await verifyOTP({
            identifier,
            otp: credentials.otp,
            deleteAfterVerification: true
          })

          if (!result.valid) {
            throw new Error(result.message)
          }

          // Find or create User
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: credentials.email || undefined },
                { phone: credentials.phone || undefined }
              ].filter(condition => Object.values(condition)[0] !== undefined)
            }
          })

          if (!user) {
            // Create new Customer
            user = await prisma.user.create({
              data: {
                email: credentials.email ? credentials.email : `temp-${Date.now()}@example.com`,
                ...(credentials.phone && { phone: credentials.phone }),
                name: credentials.name || null,
                role: 'CUSTOMER',
                ...(credentials.email && { emailVerified: new Date() }),
                ...(credentials.phone && { phoneVerified: true }),
              }
            })
          }

          return {
            id: user.id,
            email: user.email || null,
            name: user.name || null,
            role: user.role
          }
        } catch (error) {
          console.error('Customer OTP error:', error)
          throw error
        }
      }
    }),

    // ========================================
    // DELIVERY PARTNER - OTP Authentication
    // ========================================
    CredentialsProvider({
      id: "delivery-partner-otp",
      name: "Delivery Partner OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        phone: { label: "Phone", type: "text" },
        otp: { label: "OTP", type: "text" },
        firstName: { label: "First Name", type: "text" },
        lastName: { label: "Last Name", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.otp) {
          throw new Error('OTP is required')
        }

        const identifier = credentials.email || credentials.phone
        if (!identifier) {
          throw new Error('Email or phone is required')
        }

        try {
          // Verify OTP
          const result = await verifyOTP({
            identifier,
            otp: credentials.otp,
            deleteAfterVerification: true
          })

          if (!result.valid) {
            throw new Error(result.message)
          }

          // Find or create User
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: credentials.email || undefined },
                { phone: credentials.phone || undefined }
              ].filter(condition => Object.values(condition)[0] !== undefined)
            }
          })

          if (!user) {
            // Create new Delivery Partner User
            user = await prisma.user.create({
              data: {
                ...(credentials.email ? { email: credentials.email } : { email: `temp-${Date.now()}@example.com` }),
                ...(credentials.phone && { phone: credentials.phone }),
                name: credentials.firstName && credentials.lastName 
                  ? `${credentials.firstName} ${credentials.lastName}`
                  : null,
                role: 'DELIVERY_PARTNER',
                ...(credentials.email && { emailVerified: new Date() }),
                ...(credentials.phone && { phoneVerified: true }),
              }
            })

            // Create DeliveryPartner record
            await prisma.deliveryPartner.create({
              data: {
                firstName: credentials.firstName || '',
                lastName: credentials.lastName || '',
                email: credentials.email || identifier,
                phone: credentials.phone || identifier,
                vehicleType: 'BIKE', // Default, can be updated later
                vehicleNumber: '', // To be filled during onboarding
                licenseNumber: '', // To be filled during onboarding
                isVerified: false
              }
            })
          } else {
            // Update role if needed
            if (user.role !== 'DELIVERY_PARTNER') {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { role: 'DELIVERY_PARTNER' }
              })
            }
          }

          return {
            id: user.id,
            email: user.email || null,
            name: user.name || null,
            role: user.role
          }
        } catch (error) {
          console.error('Delivery Partner OTP error:', error)
          throw error
        }
      }
    })
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },

    async signIn({ user, account }) {
      // All providers are allowed
      return true
    },

    async redirect({ url, baseUrl }) {
      // Redirect based on role
      // This is a basic implementation - customize per app
      if (url.startsWith(baseUrl)) {
        return url
      }
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }
      return baseUrl
    }
  },

  events: {
    async signIn({ user, account }) {
      console.log(`✅ User ${user.email} signed in via ${account?.provider}`)
    }
  }
}