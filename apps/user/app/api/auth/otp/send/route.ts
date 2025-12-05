// apps/user/app/api/auth/otp/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@workspace/database';
import { generateOTP } from '@workspace/lib/otp'; // This just generates the OTP string

// Email validation helper
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// Phone validation helper
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{9,14}$/;
  return phoneRegex.test(phone.replace(/[\s()-]/g, ''));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, phone, purpose = 'login' } = body;

    console.log('📨 OTP Request:', { email, phone, purpose });

    // Validate input - must have email (phone is optional based on your schema)
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate phone format if provided
    if (phone && !isValidPhone(phone)) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Check if user exists (for login purpose)
    if (purpose === 'login') {
      const user = await db.user.findFirst({
        where: {
          OR: [
            { email },
            phone ? { phone } : undefined
          ].filter(Boolean) as Array<{ email?: string } | { phone?: string }>
        }
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'No account found. Please register first.' },
          { status: 404 }
        );
      }

      if (!user.isActive) {
        return NextResponse.json(
          { success: false, message: 'Account is deactivated.' },
          { status: 403 }
        );
      }
    }

    // Rate limiting - check for recent OTP (1 per minute)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentOTP = await db.oTPVerification.findFirst({
      where: {
        email,
        createdAt: {
          gte: oneMinuteAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (recentOTP) {
      const secondsRemaining = Math.ceil((recentOTP.createdAt.getTime() + 60000 - Date.now()) / 1000);
      return NextResponse.json(
        {
          success: false,
          message: `Please wait ${secondsRemaining} seconds before requesting another OTP`,
          retryAfter: secondsRemaining
        },
        { status: 429 }
      );
    }

    // Account lockout - check for too many attempts (5 in 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentAttempts = await db.oTPVerification.findMany({
      where: {
        email,
        createdAt: {
          gte: fifteenMinutesAgo
        }
      }
    });

    if (recentAttempts.length >= 5) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many OTP requests. Please try again in 15 minutes.',
          retryAfter: 900
        },
        { status: 429 }
      );
    }

    // Delete old/expired OTPs for this email (cleanup)
    await db.oTPVerification.deleteMany({
      where: {
        email,
        expiresAt: {
          lt: new Date()
        }
      }
    });

    // Generate OTP code (6 digits)
    const otpCode = generateOTP(6);
    
    // Calculate expiration (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    // Save OTP to database
    await db.oTPVerification.create({
      data: {
        email,
        phone: phone || null,
        otp: otpCode,
        purpose,
        expiresAt,
        attempts: 0,
      }
    });

    // TODO: Send OTP via email service (SendGrid, Resend, Nodemailer, etc.)
    // For now, just log it in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 DEV MODE - OTP Code:', otpCode);
      console.log('🔐 Email:', email);
      console.log('🔐 Expires at:', expiresAt);
    }

    // In production, you would send the email here:
    // await sendOTPEmail(email, otpCode);

    console.log('✅ OTP generated and saved:', { email, phone, purpose, expiresAt });

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email',
      expiresIn: 10,
      // Only include OTP in development mode for testing
      ...(process.env.NODE_ENV === 'development' && { otp: otpCode })
    });

  } catch (error: any) {
    console.error('❌ Send OTP error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to send OTP. Please try again.',
      },
      { status: 500 }
    );
  }
}