export function getDeliveryBoyOTPTemplate(
  otp: string,
  purpose: string = 'verification',
  expiryMinutes: number = 10
): string {
  const purposeText = purpose === 'signin' ? 'sign in to your delivery dashboard' 
    : purpose === 'signup' ? 'complete your delivery partner registration'
    : 'verify your account'

  return `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1f2937;">🚴 Delivery Partner Portal</h1>
      </div>
      <div style="background: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0;">
        <h2 style="color: #374151; margin-bottom: 20px;">Hello Partner!</h2>
        <p style="color: #6b7280; margin-bottom: 20px;">
          You requested to ${purposeText}. Use the code below to continue:
        </p>
        <div style="background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937; margin: 30px 0;">
          ${otp}
        </div>
        <p style="color: #9ca3af; font-size: 14px; margin-top: 20px;">
          ⏰ This code will expire in ${expiryMinutes} minutes.
        </p>
        <p style="color: #9ca3af; font-size: 14px;">
          🔒 Do not share this code with anyone.
        </p>
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
        If you didn't request this code, you can safely ignore this email.
      </p>
    </div>
  `
}