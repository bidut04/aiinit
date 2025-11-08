import { NextResponse } from 'next/server'
import { verifyOTP } from '@workspace/lib/otp'
import { isValidEmail } from '@workspace/lib/email'

interface VerifyOTPRequest {
  email?: string
  phone?: string
  otp: string
  name?: string
  isSignUp?: boolean
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as VerifyOTPRequest
    const { email, phone, otp, name, isSignUp } = body

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

    // Verify OTP
    const result = await verifyOTP({
      identifier,
      otp,
      deleteAfterVerification: true
    })

    if (!result.valid) {
      return NextResponse.json(
        { 
          success: false, 
          message: result.message,
          error: result.error
        },
        { status: 401 }
      )
    }

    // If signup, create user in database
    if (isSignUp) {
      // TODO: Create user logic here
      // const user = await prisma.restaurantOwner.create({ ... })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'OTP verified successfully',
      data: {
        identifier,
        verified: true
      }
    })

  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to verify OTP' 
      },
      { status: 500 }
    )
  }
}