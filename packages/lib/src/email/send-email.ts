import 'server-only' // Add this package

import nodemailer from 'nodemailer'
import { env } from '../utils/env'
import { 
  getSuperAdminOTPTemplate,
  getRestaurantOwnerOTPTemplate,
  getCustomerOTPTemplate,
  getDeliveryBoyOTPTemplate,
  
} from './templates'
import { storeOTP } from '../otp'  // Import from otp module

// ========================================
// TRANSPORTER CONFIGURATION
// ========================================
const transporter = nodemailer.createTransport({
  host: env.EMAIL_SERVER_HOST,
  port: parseInt(env.EMAIL_SERVER_PORT),
  secure: parseInt(env.EMAIL_SERVER_PORT) === 465,
  auth: {
    user: env.EMAIL_SERVER_USER,
    pass: env.EMAIL_SERVER_PASSWORD
  }
})

// ========================================
// TYPES (Email only)
// ========================================
export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

// ========================================
// EMAIL UTILITIES
// ========================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html, from } = options
  
  if (!isValidEmail(to)) {
    console.error('❌ Invalid email address:', to)
    return false
  }

  try {
    await transporter.sendMail({
      from: from || env.EMAIL_FROM,
      to,
      subject,
      html
    })
    
    console.log(`✅ Email sent successfully to ${to}`)
    return true
  } catch (error) {
    console.error('❌ Error sending email:', error)
    return false
  }
}

// ========================================
// EMAIL TEMPLATE FUNCTION
// ========================================

export function getRestaurantApplicationApprovedTemplate(
  restaurantName: string,
  otp: string,
  purpose: string = 'approved',
  expiryMinutes: number = 10
): string {
  const purposeText = purpose === 'approved' ? 'access your restaurant dashboard' : 'verify your account';

  return `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1f2937;">🍽️ Restaurant Partner Portal</h1>
      </div>
      <div style="background: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0;">
        <h2 style="color: #374151; margin-bottom: 20px;">🎉 Congratulations!</h2>
        <p style="color: #6b7280; margin-bottom: 20px; font-size: 16px;">
          <strong>${restaurantName}</strong> has been approved!
        </p>
        <p style="color: #6b7280; margin-bottom: 20px;">
          Use the verification code below to ${purposeText}:
        </p>
        <div style="background: white; border: 2px solid #f97316; border-radius: 8px; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937; margin: 30px 0;">
          ${otp}
        </div>
        <p style="color: #9ca3af; font-size: 14px; margin-top: 20px;">
          ⏰ This code will expire in ${expiryMinutes} minutes.
        </p>
        <p style="color: #9ca3af; font-size: 14px; margin-top: 10px;">
          🔒 Do not share this code with anyone.
        </p>
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 20px; border-radius: 4px;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>Next Steps:</strong><br/>
            1. Use this code to verify your account<br/>
            2. Complete your restaurant profile<br/>
            3. Add your menu items<br/>
            4. Start accepting orders!
          </p>
        </div>
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
        If you didn't request this code, you can safely ignore this email.
      </p>
    </div>
  `
}

// ========================================
// ROLE-SPECIFIC OTP SENDERS
// ========================================

export async function sendSuperAdminOTP(email: string, otp: string): Promise<boolean> {
  const stored = await storeOTP({ email, otp, expiryMinutes: 10 })
  if (!stored) return false

  return sendEmail({
    to: email,
    subject: 'Your Super Admin Login Code',
    html: getSuperAdminOTPTemplate(otp)
  })
}



export async function sendRestaurantOwnerOTP(
  email: string, 
  otp: string, 
  purpose: string = 'verification', 
  expiryMinutes: number = 10
): Promise<boolean> {
  const stored = await storeOTP({ email, otp, expiryMinutes, purpose })
  if (!stored) return false

  return sendEmail({
    to: email,
    subject: 'Your Restaurant Partner Verification Code',
    html: getRestaurantOwnerOTPTemplate(otp, purpose, expiryMinutes)
  })
}

export async function sendRestaurantApplicationApproved(
  email: string,
  restaurantName: string,
  otp: string,
  purpose: string = 'approved',
  expiryMinutes: number = 10
): Promise<boolean> {
  // Store the OTP first
  const stored = await storeOTP({ email, otp, expiryMinutes, purpose })
  if (!stored) {
    console.error('❌ Failed to store OTP for restaurant approval')
    return false
  }

  return sendEmail({
    to: email,
    subject: '🎉 Restaurant Application Approved - Access Your Dashboard',
    html: getRestaurantApplicationApprovedTemplate(restaurantName, otp, purpose, expiryMinutes)
  })
}

export async function sendCustomerOTP(
  email: string, 
  otp: string, 
  purpose: string = 'verification', 
  expiryMinutes: number = 10
): Promise<boolean> {
  const stored = await storeOTP({ email, otp, expiryMinutes, purpose })
  if (!stored) return false

  return sendEmail({
    to: email,
    subject: 'Your Verification Code',
    html: getCustomerOTPTemplate(otp, purpose, expiryMinutes)
  })
}

export async function sendDeliveryBoyOTP(
  email: string, 
  otp: string, 
  purpose: string = 'verification', 
  expiryMinutes: number = 10
): Promise<boolean> {
  const stored = await storeOTP({ email, otp, expiryMinutes, purpose })
  if (!stored) return false

  return sendEmail({
    to: email,
    subject: 'Your Delivery Partner Verification Code',
    html: getDeliveryBoyOTPTemplate(otp, purpose, expiryMinutes)
  })
}



export function getUserVerificationTemplate(
  restaurantName: string,
  otp: string,
  purpose: string = 'approved',
  expiryMinutes: number = 10
): string {
  const purposeText = purpose === 'approved' ? 'access your restaurant dashboard' : 'verify your account';

  return `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1f2937;">🍽️ Restaurant Partner Portal</h1>
      </div>
      <div style="background: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0;">
        <h2 style="color: #374151; margin-bottom: 20px;">🎉 Congratulations!</h2>
        <p style="color: #6b7280; margin-bottom: 20px; font-size: 16px;">
          <strong>${restaurantName}</strong> has been approved!
        </p>
        <p style="color: #6b7280; margin-bottom: 20px;">
          Use the verification code below to ${purposeText}:
        </p>
        <div style="background: white; border: 2px solid #f97316; border-radius: 8px; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937; margin: 30px 0;">
          ${otp}
        </div>
        <p style="color: #9ca3af; font-size: 14px; margin-top: 20px;">
          ⏰ This code will expire in ${expiryMinutes} minutes.
        </p>
        <p style="color: #9ca3af; font-size: 14px; margin-top: 10px;">
          🔒 Do not share this code with anyone.
        </p>
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 20px; border-radius: 4px;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>Next Steps:</strong><br/>
            1. Use this code to verify your account<br/>
            2. Complete your restaurant profile<br/>
            3. Add your menu items<br/>
            4. Start accepting orders!
          </p>
        </div>
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
        If you didn't request this code, you can safely ignore this email.
      </p>
    </div>
  `
}


