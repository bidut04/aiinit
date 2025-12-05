// types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      restaurantOwnerId?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string; // ✅ ADDED: Make id required
    role: string; // ✅ FIXED: Changed from optional to required
    restaurantOwnerId?: string; // ✅ ADDED: For restaurant owner ID
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string; // ✅ FIXED: Changed from optional to required
    role: string; // ✅ FIXED: Changed from optional to required
    restaurantOwnerId?: string; // ✅ ADDED: For restaurant owner ID
  }
}

// ===========================================
// Your authOptions with callbacks
// ===========================================

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  // ... your other config
  providers: [
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
        // ... your existing logic ...

        // ✅ FIXED: Return object now matches User interface
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image || null, // ✅ Required by DefaultUser
          role: user.role, // ✅ Now matches required string type
          restaurantOwnerId: user.restaurantOwner?.id
        };
      }
    })
  ],
  callbacks: {
    // ✅ REQUIRED: JWT callback to pass custom fields to token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.restaurantOwnerId = user.restaurantOwnerId;
      }
      return token;
    },

    // ✅ REQUIRED: Session callback to pass custom fields to session
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.restaurantOwnerId = token.restaurantOwnerId;
      }
      return session;
    }
  }
};