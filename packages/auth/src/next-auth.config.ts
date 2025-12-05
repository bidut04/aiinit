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
    restaurantOwnerId?: string // ✅ ADDED
  }

  interface Session {
    user: {
      id: string
      email: string | null
      name: string | null
      role: string
      restaurantOwnerId?: string // ✅ ADDED
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    restaurantOwnerId?: string // ✅ ADDED
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

          return {
            id: user.id,
            email: user.email,
            name: user.name,
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
          const result = await verifyOTP({
            identifier: credentials.email,
            otp: credentials.otp,
            deleteAfterVerification: true
          })

          if (!result.valid) {
            throw new Error(result.message)
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { superAdminProfile: true }
          })

          if (!user || !user.superAdminProfile) {
            throw new Error('Super Admin not found')
          }

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
            email: user.email,
            name: user.name,
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

      // Parse name
      const nameParts = (credentials.name || '').trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      // Build where clause for finding existing records
      const whereClause = {
        OR: [
          credentials.email ? { email: credentials.email } : undefined,
          credentials.phone ? { phone: credentials.phone } : undefined
        ].filter(Boolean)
      }

      // Find existing user
      let user = await prisma.user.findFirst({
        where: whereClause,
        include: {
          restaurantOwner: true
        }
      })

      // Find existing restaurant owner (might be orphaned)
      const existingOwner = await prisma.restaurantOwner.findFirst({
        where: whereClause
      })

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: credentials.email || `temp-${Date.now()}@example.com`,
            phone: credentials.phone || null,
            name: credentials.name || null,
            role: 'RESTAURANT_OWNER',
            emailVerified: credentials.email ? new Date() : null,
            phoneVerified: credentials.phone ? true : false,
          }
        })

        // Handle restaurant owner
        if (existingOwner) {
          // Link orphaned restaurant owner to new user
          await prisma.restaurantOwner.update({
            where: { id: existingOwner.id },
            data: {
              userId: user.id,
              email: credentials.email || existingOwner.email,
              phone: credentials.phone || existingOwner.phone,
              firstName: firstName || existingOwner.firstName,
              lastName: lastName || existingOwner.lastName,
              verified: true
            }
          })
        } else {
          // Create new restaurant owner
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
        }
      } else {
        // User exists - update role if needed
        if (user.role !== 'RESTAURANT_OWNER') {
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              role: 'RESTAURANT_OWNER',
              name: credentials.name || user.name
            }
          })
        }

        // Handle restaurant owner
        if (!user.restaurantOwner) {
          if (existingOwner) {
            // Link existing owner to this user
            await prisma.restaurantOwner.update({
              where: { id: existingOwner.id },
              data: {
                userId: user.id,
                email: credentials.email || existingOwner.email,
                phone: credentials.phone || existingOwner.phone,
                firstName: firstName || existingOwner.firstName,
                lastName: lastName || existingOwner.lastName,
                verified: true
              }
            })
          } else {
            // Create new restaurant owner
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
          }
        } else {
          // Restaurant owner exists - just update verification
          await prisma.restaurantOwner.update({
            where: { id: user.restaurantOwner.id },
            data: {
              verified: true,
              email: credentials.email || user.restaurantOwner.email,
              phone: credentials.phone || user.restaurantOwner.phone,
              firstName: firstName || user.restaurantOwner.firstName,
              lastName: lastName || user.restaurantOwner.lastName,
            }
          })
        }
      }

      // Refetch user with restaurant owner
      const finalUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          restaurantOwner: true
        }
      })

      if (!finalUser || !finalUser.restaurantOwner) {
        throw new Error('Failed to create or fetch user with restaurant owner')
      }

      // Return user data
      return {
        id: finalUser.id,
        email: finalUser.email,
        name: finalUser.name,
        role: finalUser.role,
        restaurantOwnerId: finalUser.restaurantOwner.id
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
          const result = await verifyOTP({
            identifier,
            otp: credentials.otp,
            deleteAfterVerification: true
          })

          if (!result.valid) {
            throw new Error(result.message)
          }

          let user = await prisma.user.findFirst({
            where: {
              OR: [
                credentials.email ? { email: credentials.email } : undefined,
                credentials.phone ? { phone: credentials.phone } : undefined
              ].filter(Boolean) as any
            }
          })

          if (!user) {
            user = await prisma.user.create({
              data: {
                email: credentials.email || `temp-${Date.now()}@example.com`,
                phone: credentials.phone || null,
                name: credentials.name || null,
                role: 'CUSTOMER',
                emailVerified: credentials.email ? new Date() : null,
                phoneVerified: credentials.phone ? true : false,
              }
            })
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
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
          const result = await verifyOTP({
            identifier,
            otp: credentials.otp,
            deleteAfterVerification: true
          })

          if (!result.valid) {
            throw new Error(result.message)
          }

          let user = await prisma.user.findFirst({
            where: {
              OR: [
                credentials.email ? { email: credentials.email } : undefined,
                credentials.phone ? { phone: credentials.phone } : undefined
              ].filter(Boolean) as any
            },
            include: {
              deliveryPartner: true // ✅ ADDED: Include relation
            }
          })

          if (!user) {
            user = await prisma.user.create({
              data: {
                email: credentials.email || `temp-${Date.now()}@example.com`,
                phone: credentials.phone || null,
                name: credentials.firstName && credentials.lastName 
                  ? `${credentials.firstName} ${credentials.lastName}`
                  : null,
                role: 'DELIVERY_PARTNER',
                emailVerified: credentials.email ? new Date() : null,
                phoneVerified: credentials.phone ? true : false,
              }
            })

            // ✅ FIXED: Link userId properly
            await prisma.deliveryPartner.create({
              data: {
                userId: user.id, // ✅ ADDED: Link to user
                firstName: credentials.firstName || '',
                lastName: credentials.lastName || '',
                email: credentials.email || identifier,
                phone: credentials.phone || identifier,
                vehicleType: 'BIKE',
                vehicleNumber: '',
                licenseNumber: '',
                isVerified: false
              }
            })
          } else {
            if (user.role !== 'DELIVERY_PARTNER') {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { role: 'DELIVERY_PARTNER' }
              })
            }

            // ✅ FIXED: Create delivery partner if doesn't exist
            if (!user.deliveryPartner) {
              await prisma.deliveryPartner.create({
                data: {
                  userId: user.id,
                  firstName: credentials.firstName || '',
                  lastName: credentials.lastName || '',
                  email: credentials.email || user.email || identifier,
                  phone: credentials.phone || user.phone || identifier,
                  vehicleType: 'BIKE',
                  vehicleNumber: '',
                  licenseNumber: '',
                  isVerified: false
                }
              })
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
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
        token.restaurantOwnerId = user.restaurantOwnerId // ✅ FIXED: Now exists on User type
      }
      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.restaurantOwnerId = token.restaurantOwnerId // ✅ ADDED
      }
      return session
    },

    async signIn({ user, account }) {
      return true
    },

    async redirect({ url, baseUrl }) {
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