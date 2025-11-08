// packages/lib/src/otp/generate.ts

/**
 * Generate a numeric OTP
 */
export function generateOTP(length: number = 6): string {
  const digits = '0123456789'
  let otp = ''
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)]
  }
  
  return otp
}

/**
 * Generate numeric OTP within range (alternative method)
 */
export function generateNumericOTP(length: number = 6): string {
  const min = Math.pow(10, length - 1)
  const max = Math.pow(10, length) - 1
  return Math.floor(Math.random() * (max - min + 1) + min).toString()
}

/**
 * Generate alphanumeric OTP
 */
export function generateAlphanumericOTP(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let otp = ''
  
  for (let i = 0; i < length; i++) {
    otp += chars[Math.floor(Math.random() * chars.length)]
  }
  
  return otp
}