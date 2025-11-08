// import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma'
// import { sendOTPEmail } from '@/lib/email'
// import { generateOTP } from '@/lib/utils'

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json()
//     const { email } = body

//     if (!email) {
//       return NextResponse.json(
//         { error: 'Email is required' },
//         { status: 400 }
//       )
//     }

//     // Check if user exists and has super admin profile
//     const user = await prisma.user.findUnique({
//       where: { email },
//       include: { superAdminProfile: true }
//     })

//     if (!user || !user.superAdminProfile) {
//       return NextResponse.json(
//         { error: 'Invalid request' },
//         { status: 400 }
//       )
//     }

//     // Clean up existing OTPs
//     await prisma.oTPVerification.deleteMany({
//       where: { email }
//     })

//     // Generate new OTP
//     const otp = generateOTP()
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

//     // Store new OTP
//     await prisma.oTPVerification.create({
//       data: {
//         email,
//         otp,
//         expiresAt,
//         attempts: 0
//       }
//     })

//     // Send OTP via email
//     const emailSent = await sendOTPEmail(email, otp)

//     if (!emailSent) {
//       return NextResponse.json(
//         { error: 'Failed to resend OTP. Please try again.' },
//         { status: 500 }
//       )
//     }

//     return NextResponse.json({
//       message: 'OTP resent successfully',
//       expiresAt
//     })

//   } catch (error) {
//     console.error('Resend OTP error:', error)
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     )
//   }
// }

// app/api/auth/otp/resend/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@workspace/database'
import bcrypt from 'bcryptjs'

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/email/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    })
    return response.ok
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      include: { superAdminProfile: true }
    })

    if (!user || !user.superAdminProfile) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { error: 'If this email is registered, a new OTP has been sent.' },
        { status: 200 }
      )
    }

    // Check for rate limiting - must wait 60 seconds
    const existingOTP = await prisma.oTPVerification.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' }
    })

    if (existingOTP) {
      const timeSinceLastOTP = Date.now() - existingOTP.createdAt.getTime()
      if (timeSinceLastOTP < 60000) {
        return NextResponse.json(
          { 
            error: 'Please wait before requesting a new OTP',
            waitSeconds: Math.ceil((60000 - timeSinceLastOTP) / 1000)
          },
          { status: 429 }
        )
      }
    }

    // Generate new OTP
    const otp = generateOTP()
    const hashedOTP = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // Delete old OTPs
    await prisma.oTPVerification.deleteMany({
      where: { email }
    })

    // Store new OTP
    await prisma.oTPVerification.create({
      data: {
        email,
        otp: hashedOTP,
        purpose: 'LOGIN_VERIFY',

        expiresAt,
        attempts: 0
      }
    })

    // Send email
    const emailSent = await sendOTPEmail(email, otp)

    if (!emailSent) {
      await prisma.oTPVerification.deleteMany({
        where: { email, expiresAt }
      })
      
      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again.' },
        { status: 500 }
      )
    }

    console.log(`OTP resent successfully to ${email}`)

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully'
    })

  } catch (error) {
    console.error('Resend OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}