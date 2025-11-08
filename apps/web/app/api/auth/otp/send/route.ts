import { NextRequest, NextResponse } from 'next/server'
import { generateOTP } from '@workspace/lib/otp'
import { 
  sendSuperAdminOTP,
  isValidEmail
} from '@workspace/lib/email'
import bcrypt from 'bcryptjs'
import { prisma } from '@workspace/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('📧 Processing OTP request for:', email)

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    console.log('🔍 Looking up user in database...')

    // Verify user credentials first
    const user = await prisma.user.findUnique({
      where: { email },
      include: { superAdminProfile: true }
    })

    console.log('👤 User found:', !!user)
    console.log('👤 Has super admin profile:', !!user?.superAdminProfile)

    if (!user || !user.superAdminProfile) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if account is locked
    if (user.superAdminProfile.lockedUntil && 
        user.superAdminProfile.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.superAdminProfile.lockedUntil.getTime() - Date.now()) / 60000
      )
      return NextResponse.json(
        { error: `Account locked. Try again in ${remainingMinutes} minutes.` },
        { status: 423 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      password,
      user.superAdminProfile.hashedPassword
    )

    console.log('🔐 Password valid:', isValidPassword)

    if (!isValidPassword) {
      const newAttempts = user.superAdminProfile.loginAttempts + 1
      const shouldLock = newAttempts >= 5

      await prisma.superAdminProfile.update({
        where: { userId: user.id },
        data: {
          loginAttempts: newAttempts,
          lockedUntil: shouldLock 
            ? new Date(Date.now() + 15 * 60 * 1000)
            : null
        }
      })
      
      return NextResponse.json(
        { 
          error: 'Invalid credentials',
          attemptsRemaining: shouldLock ? 0 : 5 - newAttempts
        },
        { status: 401 }
      )
    }

    // Reset login attempts
    if (user.superAdminProfile.loginAttempts > 0) {
      await prisma.superAdminProfile.update({
        where: { userId: user.id },
        data: {
          loginAttempts: 0,
          lockedUntil: null
        }
      })
    }

    // Check for existing valid OTP
    const existingOTP = await prisma.oTPVerification.findFirst({
      where: {
        email,
        expiresAt: { gt: new Date() }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (existingOTP) {
      const secondsRemaining = Math.ceil(
        (existingOTP.expiresAt.getTime() - Date.now()) / 1000
      )
      
      console.log('⏰ Existing OTP found, expires in:', secondsRemaining, 'seconds')
      
      return NextResponse.json(
        { 
          message: 'OTP already sent. Please check your email.',
          canResend: false,
          expiresAt: existingOTP.expiresAt,
          secondsRemaining
        },
        { status: 200 }
      )
    }

    // Generate new OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    console.log('🔢 Generated OTP:', otp.substring(0, 2) + '****') // Log partial OTP for debugging

    // Clean up expired OTPs for this email
    await prisma.oTPVerification.deleteMany({
      where: {
        email,
        expiresAt: { lt: new Date() }
      }
    })

    // Store new OTP in database
    await prisma.oTPVerification.create({
      data: {
        email,
        otp,
        purpose: 'LOGIN_VERIFY',
        expiresAt,
        attempts: 0
      }
    })

    console.log('💾 OTP stored in database')

    // Send OTP via email
    try {
      console.log('📨 Attempting to send OTP email...')
      
      const emailSent = await sendSuperAdminOTP(email, otp)

      if (!emailSent) {
        console.error('❌ Email sending returned false')
        
        // Clean up the OTP we just created
        await prisma.oTPVerification.deleteMany({
          where: { email, otp }
        })
        
        return NextResponse.json(
          { error: 'Failed to send OTP. Please try again.' },
          { status: 500 }
        )
      }
      
      console.log('✅ OTP email sent successfully')
      
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError)
      
      // Clean up the OTP we just created
      await prisma.oTPVerification.deleteMany({
        where: { email, otp }
      })
      
      return NextResponse.json(
        { error: 'Failed to send email. Please try again.' },
        { status: 500 }
      )
    }

    // Mask email for response
    const [localPart, domain] = email.split('@')
    const maskedEmail = localPart.length > 2 
      ? `${localPart.substring(0, 2)}${'*'.repeat(localPart.length - 2)}@${domain}`
      : `${localPart.charAt(0)}***@${domain}`

    return NextResponse.json({
      message: 'OTP sent successfully',
      maskedEmail,
      expiresAt,
      validFor: '10 minutes'
    })

  } catch (error) {
    console.error('❌ Send OTP error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        debug: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        } : undefined
      },
      { status: 500 }
    )
  }
}