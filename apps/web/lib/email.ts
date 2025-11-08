import nodemailer from 'nodemailer'

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})
 

export async function sendOTPEmail(email: string, otp: string) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Your  Admin Login Code',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937;">Super Admin Portal</h1>
            <div style="width: 80px; height: 80px; background: #ef4444; border-radius: 50%; margin: 20px auto; display: flex; align-items: center; justify-content: center;">
              <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
          </div>
          <div style="background: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0; text-align: center;">
            <h2 style="color: #374151; margin-bottom: 20px;">Your Login Code</h2>
            <div style="background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 8px;">${otp}</span>
            </div>
            <p style="color: #6b7280; margin-bottom: 0;">This code will expire in 10 minutes.</p>
          </div>
          <p style="color: #9ca3af; font-size: 14px; text-align: center;">
            🔒 This is a secure administrative area. Do not share this code with anyone.
          </p>
        </div>
      `
    })
    
    console.log(`OTP sent successfully to ${email}`)
    return true
  } catch (error) {
    console.error('Error sending OTP email:', error)
    return false
  }
}

export async function sendEmail({
  to,
  subject,
  html
}: {
  to: string
  subject: string
  html: string
}) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    })
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}