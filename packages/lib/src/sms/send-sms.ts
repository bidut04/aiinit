/**
 * Send SMS using your preferred provider
 * TODO: Integrate with Twilio, AWS SNS, MSG91, etc.
 */
export async function sendSMS(phone: string, message: string): Promise<void> {
  console.log(`📱 SMS to ${phone}: ${message}`)
  
  // TODO: Uncomment and configure your SMS provider
  
  // Example: Twilio
  // const client = twilio(
  //   process.env.TWILIO_ACCOUNT_SID,
  //   process.env.TWILIO_AUTH_TOKEN
  // )
  // await client.messages.create({
  //   body: message,
  //   to: phone,
  //   from: process.env.TWILIO_PHONE_NUMBER
  // })
  
  // Example: MSG91 (India)
  // const response = await fetch('https://api.msg91.com/api/v5/flow/', {
  //   method: 'POST',
  //   headers: {
  //     'authkey': process.env.MSG91_AUTH_KEY!,
  //     'content-type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     sender: process.env.MSG91_SENDER_ID,
  //     mobiles: phone,
  //     message: message
  //   })
  // })
}