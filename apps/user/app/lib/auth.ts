import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import db from '@workspace/database';
import { verifyOTP } from "@workspace/lib/otp";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  phone?: string | null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // Email/Password Credentials Provider
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { 
          label: "Email", 
          type: "email", 
          placeholder: "example123@gmail.com" 
        },
        password: { 
          label: "Password", 
          type: "password" 
        }
      },
      async authorize(credentials) {
        try {
          // Validate input
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email and password are required');
          }

          // Find user by email
          const existingUser = await db.user.findUnique({
            where: {
              email: credentials.email
            }
          });

          if (!existingUser) {
            throw new Error('Invalid credentials');
          }

          // Check if user has a password (not OAuth user)
          if (!existingUser.password) {
            throw new Error('Please sign in with Google');
          }

          // Verify password
          const validPassword = await bcrypt.compare(
            credentials.password, 
            existingUser.password
          );

          if (!validPassword) {
            throw new Error('Invalid credentials');
          }

          // Check if user is active
          if (!existingUser.isActive) {
            throw new Error('Account is deactivated');
          }

          // Return user object
          return {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role,
            image: existingUser.image,
          };

        } catch (error) {
          console.error('Authentication error:', error);
          throw error;
        }
      }
    }),

    // OTP Login Provider (for existing users only)
    CredentialsProvider({
      id: "otp-login",
      name: "OTP Login",
      credentials: {
        email: { 
          label: "Email", 
          type: "email" 
        },
        phone: { 
          label: "Phone", 
          type: "text" 
        },
        otp: { 
          label: "OTP", 
          type: "text" 
        }
      },
      async authorize(credentials) {
        try {
          console.log('🔐 OTP Login attempt:', { 
            email: credentials?.email, 
            phone: credentials?.phone,
            hasOTP: !!credentials?.otp 
          });

          // Validate input
          if (!credentials?.otp) {
            throw new Error('OTP is required');
          }

          if (!credentials?.email && !credentials?.phone) {
            throw new Error('Email or phone is required');
          }

          const identifier = credentials.email || credentials.phone;

          // Verify OTP
          const result = await verifyOTP({
            identifier: identifier!,
            otp: credentials.otp,
            deleteAfterVerification: true
          });

          console.log('🔍 OTP verification result:', result);

          if (!result.valid) {
            throw new Error(result.message || 'Invalid OTP');
          }

          // Find existing user (must exist for login)
          const user = await db.user.findFirst({
            where: {
              OR: [
                credentials.email ? { email: credentials.email } : undefined,
                credentials.phone ? { phone: credentials.phone } : undefined
              ].filter(Boolean) as Array<{ email?: string } | { phone?: string }>
            }
          });

          if (!user) {
            throw new Error('User not found. Please register first.');
          }

          // Check if user is active
          if (!user.isActive) {
            throw new Error('Account is deactivated');
          }

          // Update verification status if logging in with unverified identifier
          await db.user.update({
            where: { id: user.id },
            data: {
              emailVerified: credentials.email && !user.emailVerified 
                ? new Date() 
                : user.emailVerified,
              phoneVerified: credentials.phone 
                ? true 
                : user.phoneVerified,
            }
          });

          console.log('✅ OTP login successful for user:', user.id);

          // Return user object
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          };

        } catch (error) {
          console.error('❌ OTP login error:', error);
          throw error;
        }
      }
    })
  ],

  // Session configuration
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // JWT configuration
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Custom pages
  pages: {
    signIn: "/auth/authentication",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },

  // Callbacks
  callbacks: {
    // JWT callback - runs when JWT is created or updated
    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
      }

      // Update email verification for Google sign-in
      if (account?.provider === "google") {
        try {
          await db.user.update({
            where: { id: token.id as string },
            data: { 
              emailVerified: new Date(),
              image: user.image 
            }
          });
        } catch (error) {
          console.error('Error updating user on Google sign-in:', error);
        }
      }

      // Handle token updates
      if (trigger === "update") {
        const updatedUser = await db.user.findUnique({
          where: { id: token.id as string }
        });

        if (updatedUser) {
          token.name = updatedUser.name;
          token.email = updatedUser.email;
          token.role = updatedUser.role;
        }
      }

      return token;
    },

    // Session callback - runs when session is checked
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
       
        session.user.name = token.name as string;
         session.user.token = token.id as string;
      }
      return session;
    },

    // Sign in callback - control if user is allowed to sign in
    async signIn({ user, account, profile }) {
      try {
        // For Google OAuth
        if (account?.provider === "google") {
          const existingUser = await db.user.findUnique({
            where: { email: user.email! }
          });

          // Create user if doesn't exist
          if (!existingUser) {
            await db.user.create({
              data: {
                email: user.email!,
                name: user.name,
                image: user.image,
                emailVerified: new Date(),
                role: 'CUSTOMER',
              }
            });
          } else {
            // Update existing user
            await db.user.update({
              where: { email: user.email! },
              data: {
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
                emailVerified: new Date(),
              }
            });
          }
        }

        return true;
      } catch (error) {
        console.error('Sign in error:', error);
        return false;
      }
    }
  },

  // Events
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token.email}`);
    },
  },

  // Debug mode (disable in production)
  debug: process.env.NODE_ENV === 'development',

  // Secret for JWT
  secret: process.env.NEXTAUTH_SECRET,
};