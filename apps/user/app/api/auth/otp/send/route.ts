// // File: /api/auth/otp/send/route.ts
// // PURPOSE: Generate and send OTP for registration

// import prisma from "@workspace/database";
// import { NextRequest, NextResponse } from "next/server";
// import { generateOTP } from '@workspace/lib/otp';
// import { sendCustomerOTP, isValidEmail } from '@workspace/lib/email';

// interface SendOTPRequest {
//   email?: string;
//   phone?: string;
//   purpose?: string;
// }

// export const POST = async (req: NextRequest) => {
//   try {
//     // Parse request body
//     const body: SendOTPRequest = await req.json();
//     const { email, phone, purpose = 'verification' } = body;

//     // Validate that at least one identifier is provided
//     const identifier = email || phone;
//     if (!identifier) {
//       return NextResponse.json(
//         { error: 'Email or phone number is required' },
//         { status: 400 }
//       );
//     }

//     // Validate email format if provided
//     if (email && !isValidEmail(email)) {
//       return NextResponse.json(
//         { error: 'Invalid email format' },
//         { status: 400 }
//       );
//     }

//     // Rate limiting: Check recent OTP requests (60 seconds cooldown)
//     const recentOTP = await prisma.oTPVerification.findFirst({
//       where: {
//         OR: [
//           email ? { email: email } : null,
//           phone ? { phone: phone } : null
//         ].filter((item): item is NonNullable<typeof item> => item !== null),
//         createdAt: {
//           gt: new Date(Date.now() - 60 * 1000) // Last 60 seconds
//         }
//       },
//       orderBy: {
//         createdAt: 'desc'
//       }
//     });

//     if (recentOTP) {
//       const waitSeconds = Math.ceil(
//         (60 - (Date.now() - recentOTP.createdAt.getTime()) / 1000)
//       );
//       return NextResponse.json(
//         { 
//           error: 'Please wait before requesting another OTP',
//           waitSeconds 
//         },
//         { status: 429 }
//       );
//     }

//     // Check for account lockout (5 attempts in 15 minutes)
//     const recentAttempts = await prisma.oTPVerification.count({
//       where: {
//         OR: [
//           email ? { email: email } : null,
//           phone ? { phone: phone } : null
//         ].filter((item): item is NonNullable<typeof item> => item !== null),
//         createdAt: {
//           gt: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
//         }
//       }
//     });

//     if (recentAttempts >= 5) {
//       return NextResponse.json(
//         { error: 'Too many OTP requests. Please try again in 15 minutes.' },
//         { status: 423 }
//       );
//     }

//     // Generate 6-digit OTP
//     const genOtp = generateOTP(6);
    
//     // Set expiration time (10 minutes from now)
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

//     // Delete old OTPs for this identifier (cleanup)
//     await prisma.oTPVerification.deleteMany({
//       where: {
//         OR: [
//           email ? { email: email } : null,
//           phone ? { phone: phone } : null
//         ].filter((item): item is NonNullable<typeof item> => item !== null)
//       }
//     });

//     // Store OTP in database FIRST (before sending email)
//     const otpRecord = await prisma.oTPVerification.create({
//       data: {
//         email: email || null,
//         phone: phone || null,
//         otp: genOtp,
//         expiresAt: expiresAt,
//         // verified: false,
//         purpose: purpose
//       }
//     });

//     console.log(`OTP created in DB for ${identifier}: ${genOtp}`);

//     // Send OTP via email
//     if (email) {
//       try {
//         const emailSent = await sendCustomerOTP(email, genOtp, purpose, 10);
        
//         if (!emailSent) {
//           // If email fails, delete the OTP record
//           await prisma.oTPVerification.delete({
//             where: { id: otpRecord.id }
//           });

//           console.error('Failed to send OTP email');
//           return NextResponse.json(
//             { error: 'Failed to send OTP email. Please try again.' },
//             { status: 500 }
//           );
//         }

//         console.log(`OTP email sent successfully to ${email}`);
//       } catch (emailError) {
//         console.error('Email sending error:', emailError);
        
//         // Delete the OTP if email fails
//         await prisma.oTPVerification.delete({
//           where: { id: otpRecord.id }
//         });

//         return NextResponse.json(
//           { error: 'Failed to send OTP email. Please try again.' },
//           { status: 500 }
//         );
//       }
//     }

//     // TODO: Send OTP via SMS if phone is provided
//     if (phone) {
//       // await sendOTPSMS(phone, genOtp);
//       console.log(`SMS OTP for ${phone}: ${genOtp}`);
//     }

//     // Return success response
//     return NextResponse.json(
//       {
//         success: true,
//         message: `OTP sent successfully to your ${email ? 'email' : 'phone'}`
//       },
//       { status: 200 }
//     );

//   } catch (error) {
//     console.error('Send OTP error:', error);
    
//     return NextResponse.json(
//       { 
//         error: 'Failed to send OTP. Please try again.',
//         success: false
//       },
//       { status: 500 }
//     );
//   }
// };


// File: /api/auth/otp/send/route.ts
// PURPOSE: Generate and send OTP for registration

import prisma from "@workspace/database";
import { NextRequest, NextResponse } from "next/server";
import { generateOTP } from "@workspace/lib/otp";
import { sendCustomerOTP, isValidEmail } from "@workspace/lib/email";

interface SendOTPRequest {
  email?: string;
  phone?: string;
  purpose?: string;
}

export const POST = async (req: NextRequest) => {
  try {
    const body: SendOTPRequest = await req.json();
    const { email, phone, purpose = "verification" } = body;

    // Validate identifier
    const identifier = email || phone;
    if (!identifier) {
      return NextResponse.json(
        { error: "Email or phone number is required" },
        { status: 400 }
      );
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    /** -------------------------------------------
     * RATE LIMIT: 1 OTP per minute
     * ------------------------------------------ */
    const recentOTP = await prisma.oTPVerification.findFirst({
      where: {
        OR: [
          email ? { email } : null,
          phone ? { phone } : null,
        ].filter(Boolean) as any,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) }
      },
      orderBy: { createdAt: "desc" }
    });

    if (recentOTP) {
      const waitSeconds = Math.ceil(
        60 - (Date.now() - recentOTP.createdAt.getTime()) / 1000
      );

      return NextResponse.json(
        {
          error: "Please wait before requesting another OTP",
          waitSeconds
        },
        { status: 429 }
      );
    }

    /** -------------------------------------------
     * ATTEMPT LIMIT: 5 OTPs per 15 minutes
     * ------------------------------------------ */
    const recentAttempts = await prisma.oTPVerification.count({
      where: {
        OR: [
          email ? { email } : null,
          phone ? { phone } : null,
        ].filter(Boolean) as any,
        createdAt: { gt: new Date(Date.now() - 15 * 60 * 1000) }
      }
    });

    if (recentAttempts >= 5) {
      return NextResponse.json(
        {
          error: "Too many OTP requests. Please try again in 15 minutes."
        },
        { status: 423 }
      );
    }

    /** -------------------------------------------
     * Generate & store OTP
     * ------------------------------------------ */
    const genOtp = generateOTP(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Cleanup old OTPs
    await prisma.oTPVerification.deleteMany({
      where: {
        OR: [
          email ? { email } : null,
          phone ? { phone } : null,
        ].filter(Boolean) as any
      }
    });

    // Create OTP record
    const otpRecord = await prisma.oTPVerification.create({
      data: {
        email: email || null,
        phone: phone || null,
        otp: genOtp,
        purpose,
        expiresAt
      }
    });

    console.log(`OTP Created for ${identifier}: ${genOtp}`);

    /** -------------------------------------------
     * Send Email OTP
     * ------------------------------------------ */
    if (email) {
      try {
        const emailSent = await sendCustomerOTP(email, genOtp, purpose, 10);

        if (!emailSent) {
          console.error("OTP email FAILED");

          // SAFE DELETE — never throws error
          await prisma.oTPVerification.deleteMany({
            where: { id: otpRecord.id }
          });

          return NextResponse.json(
            { error: "Failed to send OTP email" },
            { status: 500 }
          );
        }

        console.log(`OTP email sent to ${email}`);
      } catch (err) {
        console.error("Email sending error:", err);

        // SAFE DELETE
        await prisma.oTPVerification.deleteMany({
          where: { id: otpRecord.id }
        });

        return NextResponse.json(
          { error: "Failed to send OTP email" },
          { status: 500 }
        );
      }
    }

    /** -------------------------------------------
     * SMS (TODO)
     * ------------------------------------------ */
    if (phone) {
      console.log(`SMS OTP for ${phone}: ${genOtp}`);
      // await sendOTPSMS(phone, genOtp);
    }

    return NextResponse.json(
      {
        success: true,
        message: `OTP sent successfully to your ${email ? "email" : "phone"}`,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Send OTP error:", err);
    return NextResponse.json(
      {
        error: "Failed to send OTP",
        success: false
      },
      { status: 500 }
    );
  }
};

