import { NextAuthOptions } from "next-auth"
import EmailProvider from "next-auth/providers/email"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { prisma } from "@workspace/database";
import bcrypt from "bcryptjs"
import { sendEmail } from "./email"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Email Provider for magic link authentication
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      sendVerificationRequest: async ({ identifier, url }) => {
        await sendEmail({
          to: identifier,
          subject: "Sign in to Super Admin Panel",
          html: `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1f2937;">Super Admin Portal</h1>
                <div style="width: 80px; height: 80px; background: #ef4444; border-radius: 50%; margin: 20px auto; display: flex; align-items: center; justify-content: center;">
                  <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
              </div>
              <div style="background: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0;">
                <h2 style="color: #374151; margin-bottom: 20px;">Sign in to your account</h2>
                <p style="color: #6b7280; margin-bottom: 30px;">Click the button below to sign in to the Super Admin Portal. This link will expire in 24 hours.</p>
                <a href="${url}" style="display: inline-block; background: #2563eb; color: white; padding: 15px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Sign In</a>
              </div>
              <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                🔒 This is a secure administrative area. All activities are logged and monitored.
              </p>
            </div>
          `
        })
      }
    }),

    // OTP Provider for one-time password authentication
    CredentialsProvider({
      id: "otp",
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) {
          throw new Error('Email and OTP are required')
        }

        try {
          const otpRecord = await prisma.oTPVerification.findFirst({
            where: {
              email: credentials.email,
              otp: credentials.otp,
              expiresAt: { gt: new Date() }
            }
          })

          if (!otpRecord) {
            await prisma.oTPVerification.updateMany({
              where: { email: credentials.email },
              data: { attempts: { increment: 1 } }
            })
            throw new Error('Invalid or expired OTP')
          }

          if (otpRecord.attempts >= 3) {
            await prisma.oTPVerification.delete({
              where: { id: otpRecord.id }
            })
            throw new Error('Too many failed attempts. Please request a new OTP.')
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { superAdminProfile: true }
          })

          if (!user || !user.superAdminProfile) {
            throw new Error('User not found')
          }

          await prisma.oTPVerification.delete({
            where: { id: otpRecord.id }
          })

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
            email: user.email!,
            name: user.name,
            role: 'SUPERADMIN'
          }
        } catch (error) {
          console.error('OTP verification error:', error)
          throw error
        }
      }
    }),

    // Credentials Provider for email/password authentication
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
            email: user.email!,
            name: user.name,
            role: 'SUPERADMIN'
          }

        } catch (error) {
          console.error('Auth error:', error)
          throw error
        }
      }
    })
  ],

  pages: {
    signIn: '/superAdmin-login',
    verifyRequest: '/auth/verify-request',
    error: '/superAdmin-login',
  },

  callbacks: {
    // 🔥 KEY FIX: For Email Provider, fetch role from database in JWT callback
    async jwt({ token, user, account, trigger }) {
      // For credentials/OTP providers - user object has role
      if (user && (user as any).role) {
        token.id = user.id
        token.role = (user as any).role
        console.log('JWT: Set role from user object:', token.role)
      }
      // For Email Provider - fetch from database
      else if (user?.email && !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { superAdminProfile: true }
        })
        
        if (dbUser?.superAdminProfile) {
          token.id = dbUser.id
          token.role = 'SUPERADMIN'
          console.log('JWT: Set role from database for email provider:', token.role)
        }
      }
      
      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        console.log('Session: Added role to session:', session.user.role)
      }
      return session
    },

    async signIn({ user, account }) {
      console.log('SignIn callback - Provider:', account?.provider)
      
      // Allow sign in for email provider
      if (account?.provider === "email") {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { superAdminProfile: true }
        })
        
        if (dbUser?.superAdminProfile) {
          console.log('SignIn: Email provider - Super admin verified')
          return true
        }
        console.log('SignIn: Email provider - Not a super admin')
        return false
      }

      // For OTP provider
      if (account?.provider === "otp") {
        return true
      }

      // For credentials provider
      if (account?.provider === "super-admin-credentials") {
        return true
      }

      return false
    },

    async redirect({ baseUrl }) {
      return `${baseUrl}/restaurants`
    }
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },

  events: {
    async signIn({ user, account }) {
      console.log(`User ${user.email} signed in via ${account?.provider}`)
    }
  }
}