import nodemailer from 'nodemailer'
import { env } from '../utils/env'

// Create transporter
const transporter = nodemailer.createTransport({
  host: env.EMAIL_SERVER_HOST,
  port: parseInt(env.EMAIL_SERVER_PORT),
  secure: parseInt(env.EMAIL_SERVER_PORT) === 465,
  auth: {
    user: env.EMAIL_SERVER_USER,
    pass: env.EMAIL_SERVER_PASSWORD
  }
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: options.from || env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html
    })
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

export async function sendSuperAdminOTP(email: string, otp: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Super Admin Verification Code',
    html: `
      <h1>Super Admin Verification</h1>
      <p>Your verification code is: <strong>${otp}</strong></p>
      <p>This code expires in 10 minutes.</p>
      <p>Do not share this code with anyone.</p>
    `
  })
}

export async function sendRestaurantOwnerOTP(
  email: string,
  otp: string,
  purpose: string,
  expiryMinutes: number
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Restaurant Partner Verification Code',
    html: `
      <h1>Restaurant Partner Verification</h1>
      <p>Your verification code is: <strong>${otp}</strong></p>
      <p>This code expires in ${expiryMinutes} minutes.</p>
      <p>Purpose: ${purpose}</p>
    `
  })
}

export async function sendCustomerOTP(
  email: string,
  otp: string,
  purpose: string,
  expiryMinutes: number
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Your Verification Code',
    html: `
      <h1>Verification Code</h1>
      <p>Your verification code is: <strong>${otp}</strong></p>
      <p>This code expires in ${expiryMinutes} minutes.</p>
      <p>Do not share this code with anyone.</p>
    `
  })
}

export async function sendDeliveryBoyOTP(
  email: string,
  otp: string,
  purpose: string,
  expiryMinutes: number
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Delivery Partner Verification Code',
    html: `
      <h1>Delivery Partner Verification</h1>
      <p>Your verification code is: <strong>${otp}</strong></p>
      <p>This code expires in ${expiryMinutes} minutes.</p>
      <p>Purpose: ${purpose}</p>
    `
  })
}