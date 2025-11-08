
// app/api/auth/send-otp/route.ts
import { NextResponse } from 'next/server'
import { generateOTP } from '@workspace/lib/otp'
import { 
  sendRestaurantOwnerOTP,
  isValidEmail
} from '@workspace/lib/email'
import { prisma } from '@workspace/database'

interface SendOTPRequest {
  identifier?: string
  email?: string
  phone?: string
  name?: string
  aadharNumber?: string
  isSignUp: boolean
  role?: 'RESTAURANT_OWNER' | 'SUPERADMIN' | 'CUSTOMER' | 'DELIVERY_PARTNER'| 'ADMIN' // ✅ Add other roles as needed
}

export async function POST(request: Request) {
  try {
    // Parse request
    const text = await request.text()
    console.log('📥 Raw request body:', text)
    
    const body = JSON.parse(text) as SendOTPRequest
    console.log('📥 Parsed body:', body)

    const { identifier, email, phone, name, aadharNumber, isSignUp, role = 'RESTAURANT_OWNER' } = body

    // Get the actual identifier (email or phone)
    const actualIdentifier = identifier || email || phone

    if (!actualIdentifier) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email or phone is required' 
        },
        { status: 400 }
      )
    }

    // Determine if it's email or phone
    const isEmail = email || (identifier && isValidEmail(identifier))
    
    if (isEmail && !isValidEmail(actualIdentifier)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid email address' 
        },
        { status: 400 }
      )
    }

    // Check if user exists WITH THE SPECIFIC ROLE
    const existingUser = await prisma.user.findFirst({
      where: {
        AND: [
          {
            OR: [
              ...(email ? [{ email }] : []),
              ...(phone ? [{ phone }] : [])
            ]
          },
          { role: role } // ✅ Check for specific role
        ]
      }
    })

    console.log('🔍 Existing user with role', role, ':', existingUser ? 'Found' : 'Not found')
    console.log('🔄 Is signup:', isSignUp)

    // SIGN UP - user with this role must NOT exist
    if (isSignUp && existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          message: `A ${role.toLowerCase().replace('_', ' ')} account with this ${isEmail ? 'email' : 'phone'} already exists. Please sign in instead.` 
        },
        { status: 409 }
      )
    }

    // SIGN IN - user with this role must exist
    if (!isSignUp && !existingUser) {
      // Check if user exists with different role
      const userWithDifferentRole = await prisma.user.findFirst({
  where: {
    OR: [
      ...(email ? [{ email }] : []),
      ...(phone ? [{ phone }] : [])
    ]
  }
})


      if (userWithDifferentRole) {
        return NextResponse.json(
          { 
            success: false, 
            message: `This ${isEmail ? 'email' : 'phone'} is registered as ${userWithDifferentRole.role.toLowerCase().replace('_', ' ')}. Please use the correct login page.` 
          },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { 
          success: false, 
          message: 'Account not found. Please sign up first.' 
        },
        { status: 404 }
      )
    }

    // Generate OTP
    const otp = generateOTP(6)
    console.log('🔐 Generated OTP:', otp) // Remove in production

    // Send OTP (currently only supporting email)
    if (isEmail) {
      const success = await sendRestaurantOwnerOTP(
        actualIdentifier, 
        otp, 
        isSignUp ? 'registration' : 'login', 
        10
      )

      if (!success) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Failed to send OTP. Please try again.' 
          },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        message: 'OTP sent successfully to your email',
        expiresIn: '10 minutes'
      })
    } else {
      // Phone OTP - store in database for testing
      console.log('📱 Phone OTP not implemented yet. OTP:', otp)
      
      await prisma.oTPVerification.create({
        data: {
          email: actualIdentifier, // Using email field for phone number temporarily
          otp: otp,
          purpose: isSignUp ? 'registration' : 'login',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          attempts: 0
        }
      })

      return NextResponse.json({ 
        success: true, 
        message: 'OTP sent successfully to your phone',
        expiresIn: '10 minutes',
        // Remove this in production
        debug: { otp }
      })
    }

  } catch (error) {
    console.error('❌ Send OTP error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to send OTP' 
      },
      { status: 500 }
    )
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Send OTP endpoint is working',
    method: 'POST required'
  })
}