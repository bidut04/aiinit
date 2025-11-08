// import { NextAuthOptions } from "next-auth"
// import CredentialsProvider from "next-auth/providers/credentials"
// import { PrismaAdapter } from "@next-auth/prisma-adapter"
// import { prisma } from "@workspace/database"
// import { verifyOTP } from "@workspace/lib"

// export const authOptions: NextAuthOptions = {
//   adapter: PrismaAdapter(prisma),
//   session: {
//     strategy: "jwt",
//     maxAge: 24 * 60 * 60, // 24 hours
//   },
//   pages: {
//     signIn: "/login",
//     error: "/auth/error",
//   },
//   providers: [
//     // ========================================
//     // RESTAURANT OWNER - OTP Authentication
//     // ========================================
//     CredentialsProvider({
//       id: "restaurant-owner-otp",
//       name: "Restaurant Owner OTP",
//       credentials: {
//         email: { label: "Email", type: "email" },
//         phone: { label: "Phone", type: "text" },
//         otp: { label: "OTP", type: "text" },
//         firstName: { label: "First Name", type: "text" },
//         lastName: { label: "Last Name", type: "text" }
//       },
//       async authorize(credentials) {
//         if (!credentials?.otp) {
//           throw new Error('OTP is required')
//         }

//         const identifier = credentials.email || credentials.phone
//         if (!identifier) {
//           throw new Error('Email or phone is required')
//         }

//         try {
//           // Verify OTP
//           const result = await verifyOTP({
//             identifier,
//             otp: credentials.otp,
//             deleteAfterVerification: true
//           })

//           if (!result.valid) {
//             throw new Error(result.message)
//           }

//           // Find or create User
//           let user = await prisma.user.findFirst({
//             where: {
//               OR: [
//                 { email: credentials.email || undefined },
//                 { phone: credentials.phone || undefined }
//               ]
//             },
//             include: {
//               restaurantOwner: true
//             }
//           })

//           if (!user) {
//             // Create new User with RESTAURANT_OWNER role
//             user = await prisma.user.create({
//               data: {
//                 email: credentials.email || `temp-${Date.now()}@example.com`,
//                 phone: credentials.phone || null,
//                 name: credentials.firstName && credentials.lastName 
//                   ? `${credentials.firstName} ${credentials.lastName}`
//                   : null,
//                 role: 'RESTAURANT_OWNER',
//                 emailVerified: credentials.email ? new Date() : null,
//                 phoneVerified: credentials.phone ? true : false,
//               },
//               include: {
//                 restaurantOwner: true
//               }
//             })

//             // Create RestaurantOwner record
//             await prisma.restaurantOwner.create({
//               data: {
//                 userId: user.id,
//                 email: credentials.email || `temp-${Date.now()}@example.com`,
//                 phone: credentials.phone || `temp-${Date.now()}`,
//                 firstName: credentials.firstName || '',
//                 lastName: credentials.lastName || '',
//                 verified: true
//               }
//             })
//           } else {
//             // Update existing user to RESTAURANT_OWNER if needed
//             if (user.role !== 'RESTAURANT_OWNER') {
//               user = await prisma.user.update({
//                 where: { id: user.id },
//                 data: { role: 'RESTAURANT_OWNER' },
//                 include: {
//                   restaurantOwner: true
//                 }
//               })
//             }

//             // Check if RestaurantOwner exists, create if not
//             if (!user.restaurantOwner) {
//               await prisma.restaurantOwner.create({
//                 data: {
//                   userId: user.id,
//                   email: credentials.email || user.email || `temp-${Date.now()}@example.com`,
//                   phone: credentials.phone || user.phone || `temp-${Date.now()}`,
//                   firstName: credentials.firstName || '',
//                   lastName: credentials.lastName || '',
//                   verified: true
//                 }
//               })
//             }
//           }

//           return {
//             id: user.id,
//             email: user.email,
//             name: user.name,
//             role: user.role
//           }
//         } catch (error) {
//           console.error('Restaurant Owner OTP error:', error)
//           throw error
//         }
//       }
//     })
//   ],

//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         token.id = user.id
//         token.role = user.role
//       }
//       return token
//     },

//     async session({ session, token }) {
//       if (token && session.user) {
//         session.user.id = token.id as string
//         session.user.role = token.role as string
//       }
//       return session
//     },

//     async signIn({ user }) {
//       // Only allow RESTAURANT_OWNER role
//       return user.role === 'RESTAURANT_OWNER'
//     },

//     async redirect({ url, baseUrl }) {
//       // Redirect to dashboard after login
//       if (url.startsWith(baseUrl)) {
//         return url
//       }
//       if (url.startsWith("/")) {
//         return `${baseUrl}${url}`
//       }
//       return `${baseUrl}/dashboard`
//     }
//   },

//   events: {
//     async signIn({ user, account }) {
//       console.log(`✅ Restaurant Owner ${user.email} signed in via ${account?.provider}`)
//     }
//   }
// }