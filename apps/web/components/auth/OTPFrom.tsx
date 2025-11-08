'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { toast } from 'react-hot-toast'

export default function OTPForm() {
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [canResend, setCanResend] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  useEffect(() => {
    if (!email) {
      router.push('/superAdmin-login')
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [email, router])

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('OTP verified successfully!')
        
        // Sign in with NextAuth after OTP verification
        const result = await signIn('super-admin-credentials', {
          email,
          password: 'otp-verified', // Special flag
          redirect: false
        })

        if (result?.error) {
          toast.error('Authentication failed')
        } else {
          router.push('/super-admin/dashboard')
        }
      } else {
        toast.error(data.error || 'Invalid OTP')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/otp/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('OTP resent successfully!')
        setCanResend(false)
        setCountdown(60)
        
        // Restart countdown
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              setCanResend(true)
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        toast.error(data.error || 'Failed to resend OTP')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!email) {
    return null
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Verify OTP</h1>
        <p className="text-gray-600 mt-2">
          Enter the 6-digit code sent to {email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}
        </p>
      </div>

      <form onSubmit={handleVerifyOTP} className="space-y-4">
        <div>
          <label htmlFor="otp" className="block text-sm font-medium mb-1">
            Verification Code
          </label>
          <Input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            className="w-full text-center text-2xl tracking-widest"
            placeholder="000000"
            maxLength={6}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || otp.length !== 6}
          className="w-full"
        >
          {isLoading ? 'Verifying...' : 'Verify OTP'}
        </Button>
      </form>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          Didn't receive the code?
        </p>
        
        {canResend ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleResendOTP}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Resend OTP'}
          </Button>
        ) : (
          <p className="text-sm text-gray-500">
            Resend available in {countdown}s
          </p>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={() => router.push('/superAdmin-login')}
        className="w-full"
      >
        Back to Login
      </Button>
    </div>
  )
}
