import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, otp } = body

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      )
    }

    // Find OTP record
    const otpRecord = await prisma.oTPVerification.findFirst({
      where: {
        email,
        otp,
        expiresAt: { gt: new Date() }
      }
    })

    if (!otpRecord) {
      // Increment attempts for any existing OTP
      await prisma.oTPVerification.updateMany({
        where: { email },
        data: { attempts: { increment: 1 } }
      })
      
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    // Check attempt limit
    if (otpRecord.attempts >= 3) {
      await prisma.oTPVerification.delete({
        where: { id: otpRecord.id }
      })
      
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new OTP.' },
        { status: 429 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { superAdminProfile: true }
    })

    if (!user || !user.superAdminProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Clean up OTP
    await prisma.oTPVerification.delete({
      where: { id: otpRecord.id }
    })

    // Update last login
    await prisma.superAdminProfile.update({
      where: { userId: user.id },
      data: {
        lastLoginAt: new Date(),
        loginAttempts: 0,
        lockedUntil: null
      }
    })

    // Create a temporary verification token that the frontend can use
    // to complete the NextAuth sign-in process
    const verificationToken = await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: generateVerificationToken(),
        expires: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      }
    })

    return NextResponse.json({
      message: 'OTP verified successfully',
      verificationToken: verificationToken.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })

  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}