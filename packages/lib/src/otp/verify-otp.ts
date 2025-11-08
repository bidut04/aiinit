// packages/lib/src/otp/verify.ts
import { prisma } from '@workspace/database'

// ========================================
// TYPES
// ========================================
export interface StoreOTPOptions {
  email: string
  otp: string
  expiryMinutes?: number
  purpose?: string
}

export interface VerifyOTPOptions {
  identifier: string
  otp: string
  deleteAfterVerification?: boolean
}

export interface VerifyOTPResult {
  success: boolean
  message: string
  valid: boolean
  error?: string
}

// ========================================
// OTP STORAGE & VERIFICATION
// ========================================

/**
 * Store OTP in database
 */
export async function storeOTP(options: StoreOTPOptions): Promise<boolean> {
  const { email, otp, expiryMinutes = 10, purpose = 'verification' } = options

  try {
    // Delete old OTPs for this email
    await prisma.oTPVerification.deleteMany({
      where: { email }
    })

    // Create new OTP record
    await prisma.oTPVerification.create({
      data: {
        email,
        otp,
        purpose,
        expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
        attempts: 0
      }
    })

    console.log(`✅ OTP stored for ${email}`)
    return true
  } catch (error) {
    console.error('❌ Error storing OTP:', error)
    return false
  }
}

/**
 * Verify OTP
 */
export async function verifyOTP(options: VerifyOTPOptions): Promise<VerifyOTPResult> {
  const { identifier, otp, deleteAfterVerification = true } = options

  try {
    const otpRecord = await prisma.oTPVerification.findFirst({
      where: {
        email: identifier,
        otp,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!otpRecord) {
      // Increment failed attempts
      await prisma.oTPVerification.updateMany({
        where: { 
          email: identifier,
          expiresAt: { gt: new Date() }
        },
        data: { attempts: { increment: 1 } }
      })

      return {
        success: false,
        message: 'Invalid or expired OTP',
        valid: false,
        error: 'INVALID_OTP'
      }
    }

    // Check max attempts
    if (otpRecord.attempts >= 3) {
      await prisma.oTPVerification.delete({
        where: { id: otpRecord.id }
      })

      return {
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.',
        valid: false,
        error: 'MAX_ATTEMPTS_EXCEEDED'
      }
    }

    // OTP is valid - delete if requested
    if (deleteAfterVerification) {
      await prisma.oTPVerification.delete({
        where: { id: otpRecord.id }
      })
    }

    return {
      success: true,
      message: 'OTP verified successfully',
      valid: true
    }
  } catch (error) {
    console.error('❌ Verify OTP error:', error)
    return {
      success: false,
      message: 'Failed to verify OTP',
      valid: false,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    }
  }
}

/**
 * Check if OTP exists and is valid (without consuming it)
 */
export async function isOTPValid(identifier: string, otp: string): Promise<boolean> {
  try {
    const otpRecord = await prisma.oTPVerification.findFirst({
      where: {
        email: identifier,
        otp,
        expiresAt: { gt: new Date() },
        attempts: { lt: 3 }
      }
    })

    return !!otpRecord
  } catch (error) {
    console.error('❌ Error checking OTP validity:', error)
    return false
  }
}