'use client'

import { Suspense, useState, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function OTPVerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Get all data from URL params
  const email = searchParams.get('email')
  const name = searchParams.get('name')
  const hashedPassword = searchParams.get('hashedPassword')
  const isSignUp = searchParams.get('isSignUp') === 'true'
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!email) {
      router.push('/auth/register')
    }
    
    // Debug log
    console.log('🔍 OTP Verify Page Data:', {
      email,
      hasName: !!name,
      hasHashedPassword: !!hashedPassword,
      isSignUp
    })
  }, [email, name, hashedPassword, isSignUp, router])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(0, 1)
    }

    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError('')

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (!/^\d+$/.test(pastedData)) return

    const newOtp = [...otp]
    pastedData.split('').forEach((char, index) => {
      if (index < 6) {
        newOtp[index] = char
      }
    })
    setOtp(newOtp)
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Prepare request body
      const requestBody: any = {
        email,
        otp: otpCode,
      }

      // If this is signup, include registration data
      if (isSignUp && name && hashedPassword) {
        requestBody.isSignUp = true
        requestBody.name = name
        requestBody.hashedPassword = hashedPassword
      }

      console.log('🚀 Sending verify request:', {
        email,
        hasOTP: !!otpCode,
        isSignUp,
        hasName: !!name,
        hasHashedPassword: !!hashedPassword
      })

      // Verify OTP with your API
      const verifyResponse = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const verifyData = await verifyResponse.json()

      console.log('📨 Verify response:', verifyData)

      if (!verifyResponse.ok) {
        setError(verifyData.message || 'Invalid OTP. Please try again.')
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        return
      }

      // OTP verified successfully
      if (isSignUp) {
        // For signup, show success and redirect to login or dashboard
        alert('Account created successfully! Please login.')
        router.push('/auth/authentication')
      } else {
        // For password reset or other flows
        // Handle accordingly
        router.push('/auth/authentication')
      }

    } catch (err) {
      console.error('Verification error:', err)
      setError('An error occurred. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) return

    setResendLoading(true)
    setResendSuccess(false)
    setError('')

    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setResendSuccess(true)
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        setTimeout(() => setResendSuccess(false), 3000)
      } else {
        if (response.status === 429) {
          setError(`Please wait ${data.waitSeconds || 60} seconds before requesting another OTP`)
        } else {
          setError(data.message || 'Failed to resend OTP')
        }
      }
    } catch (err) {
      setError('Failed to resend OTP. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  if (!email) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <div className="bg-blue-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isSignUp ? 'Verify Your Email' : 'Enter Verification Code'}
          </h2>
          <p className="text-gray-600">
            We sent a 6-digit code to
          </p>
          <p className="font-medium text-gray-900 mt-1">{email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                disabled={loading}
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {resendSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-green-700">New OTP sent successfully!</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold rounded-lg transition-all disabled:bg-blue-400 disabled:cursor-not-allowed"
            disabled={loading || otp.some(d => !d)}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying...
              </span>
            ) : (
              isSignUp ? 'Verify & Create Account' : 'Verify & Continue'
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <span>Didn't receive the code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            >
              {resendLoading ? 'Sending...' : 'Resend'}
            </button>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <a
              href="/auth/register"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to registration
            </a>
          </div>

          <p className="text-xs text-gray-500">
            OTP expires in 10 minutes
          </p>
        </div>
      </div>
    </div>
  )
}

export default function OTPVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-gray-700 text-lg">Loading...</div>
      </div>
    }>
      <OTPVerifyContent />
    </Suspense>
  )
}