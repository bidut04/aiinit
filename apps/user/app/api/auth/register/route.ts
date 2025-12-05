// ==========================================
// RECOMMENDED APPROACH
// ==========================================

// ==========================================
// 1. REGISTRATION API - Creates Unverified User
// ==========================================

import db from '@workspace/database'
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server'
// import { sendVerificationEmail } from '@workspace/lib'; // You need to implement this

// import {sendCustomerOTP} from '@workspace/lib'
interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export const POST = async (req: NextRequest) => {
  try {
    const { name, email, phone, password, confirmPassword }: RegisterData = await req.json();
    
    // Validate all fields
    if (!name || !email || !phone || !password || !confirmPassword) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate phone format
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { message: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: "Password and confirm password must be the same" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: phone }
        ]
      }
    })
    
    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { message: "Email already registered" },
          { status: 409 }
        )
      }
      if (existingUser.phone === phone) {
        return NextResponse.json(
          { message: "Phone number already registered" },
          { status: 409 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Create user (UNVERIFIED)
    // const createUser = await db.user.create({
    //   data: {
    //     name: name,
    //     email: email,
    //     phone: phone,
    //     role: 'CUSTOMER',
    //     password: hashedPassword,
    //     isActive: true,
    //     emailVerified: null, // NOT VERIFIED YET
    //     phoneVerified: false,
    //   }
    // })

    // Send verification email
    // await sendVerificationEmail(createUser.email, createUser.id);

    return NextResponse.json(
      { 
        success: true,
        message: "Validation successful",
        data: {
          name,
          email,
          phone,
          hashedPassword
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'Email or phone already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }}
