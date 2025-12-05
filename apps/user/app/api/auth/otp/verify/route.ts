import { NextResponse } from 'next/server'
import { verifyOTP } from '@workspace/lib/otp'
import { isValidEmail } from '@workspace/lib/email'
import prisma from '@workspace/database'

interface VerifyOTPRequest {
  email?: string
  phone?: string
  otp: string
  // Registration data (only needed for signup)
  name?: string
  password?: string
  hashedPassword?: string
  isSignUp?: boolean
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as VerifyOTPRequest
    const { email, phone, otp, name, hashedPassword, isSignUp } = body

    console.log("📥 Received verify OTP request:", { 
      email, 
      phone, 
      hasOTP: !!otp, 
      isSignUp,
      hasName: !!name,
      hasHashedPassword: !!hashedPassword
    });

    // Validate identifier
    const identifier = email || phone
    if (!identifier) {
      return NextResponse.json(
        { success: false, message: 'Email or phone is required' },
        { status: 400 }
      )
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 }
      )
    }

    if (!otp || otp.length !== 6) {
      return NextResponse.json(
        { success: false, message: 'Invalid OTP format' },
        { status: 400 }
      )
    }

    // If signup, validate required registration data
    if (isSignUp) {
      console.log("🔵 Signup validation check:", { hasName: !!name, hasHashedPassword: !!hashedPassword, hasEmail: !!email });
      
      if (!name || !hashedPassword || !email) {
        return NextResponse.json(
          { success: false, message: 'Name, email, and password are required for signup' },
          { status: 400 }
        )
      }
    }

    console.log("🔍 Verifying OTP...");

    // Verify OTP
    const result = await verifyOTP({
      identifier,
      otp,
      deleteAfterVerification: true
    })

    if (!result.valid) {
      console.log("❌ OTP verification failed:", result.message);
      return NextResponse.json(
        { 
          success: false, 
          message: result.message,
          error: result.error
        },
        { status: 401 }
      )
    }

    console.log("✅ OTP verified successfully");

    // ✅ If signup, create user in database AFTER successful OTP verification
    if (isSignUp) {
      console.log("🟢 Starting user creation process...");
      
      try {
        // Check if user already exists
        console.log("🔍 Checking for existing user with:", { email, phone });
        
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              email ? { email } : undefined,
              phone ? { phone } : undefined
            ].filter(Boolean)
          }
        })

        if (existingUser) {
          console.log("🔴 User already exists:", existingUser.id);
          return NextResponse.json(
            { success: false, message: 'User already exists with this email or phone' },
            { status: 409 }
          )
        }

        console.log("🟢 No existing user found, creating new user...");
        console.log("📝 User data:", {
          name,
          email,
          phone: phone || null,
          hasPassword: !!hashedPassword,
          role: 'CUSTOMER'
        });

        // Create user with verified status
        const newUser = await prisma.user.create({
          data: {
            name: name!,
            email: email!,
            phone: phone || null,
            password: hashedPassword!,
            role: 'CUSTOMER',
            isActive: true,
            emailVerified: email ? new Date() : null,
            phoneVerified: phone ? true : false,
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            emailVerified: true,
            phoneVerified: true,
          }
        })

        console.log("✅ User created successfully:", newUser.id);

        return NextResponse.json({ 
          success: true, 
          message: 'OTP verified and account created successfully!',
          data: {
            identifier,
            verified: true,
            user: newUser
          }
        })

      } catch (dbError: any) {
        console.error('❌ Database error during user creation:', dbError);
        console.error('Error details:', {
          code: dbError.code,
          meta: dbError.meta,
          message: dbError.message
        });
        
        // If user creation fails, return appropriate error
        if (dbError.code === 'P2002') {
          return NextResponse.json(
            { success: false, message: 'User already exists' },
            { status: 409 }
          )
        }

        return NextResponse.json(
          { success: false, message: 'Failed to create user account' },
          { status: 500 }
        )
      }
    }

    // For non-signup (like password reset), just return success
    console.log("✅ Non-signup OTP verification complete");
    return NextResponse.json({ 
      success: true, 
      message: 'OTP verified successfully',
      data: {
        identifier,
        verified: true
      }
    })

  } catch (error) {
    console.error('❌ Verify OTP error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to verify OTP' 
      },
      { status: 500 }
    )
  }
}