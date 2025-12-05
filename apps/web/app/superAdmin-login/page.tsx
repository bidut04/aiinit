


'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Card } from '@workspace/ui/components/card'
import { toast } from 'react-hot-toast'

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'credentials' | 'email'>('credentials')
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/restaurants/dashboard'
  const error = searchParams.get('error')

  useEffect(() => {
    if (error) {
      switch (error) {
        case 'CredentialsSignin':
          toast.error('Invalid credentials or account locked')
          break
        case 'EmailSignin':
          toast.error('Unable to send email. Please try again.')
          break
        case 'Signin':
          toast.error('Access denied. Super admin privileges required.')
          break
        case 'SessionRequired':
          toast.error('Please sign in to access this page')
          break
        default:
          toast.error('An error occurred during authentication')
      }
    }
  }, [error])

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Email and password are required')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 423) {
          toast.error('Account temporarily locked. Try again in 15 minutes.')
        } else if (response.status === 429) {
          toast.error(`Please wait ${data.waitSeconds || 60} seconds before requesting another OTP`)
        } else {
          toast.error(data.error || 'Authentication failed')
        }
        return
      }

      toast.success('OTP sent! Check your email.')
      const verifyUrl = `/auth/otp-verify?email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`
      router.push(verifyUrl)

    } catch (error) {
      console.error('Login error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Email is required for magic link')
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl
      })

      if (result?.error) {
        if (result.error === 'EmailSignin') {
          toast.error('Unable to send email. Please check your email address.')
        } else {
          toast.error('Failed to send magic link')
        }
      } else {
        toast.success('Magic link sent! Check your email.')
        router.push('/auth/verify-request')
      }
    } catch (error) {
      console.error('Magic link error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="w-full max-w-md p-8 bg-white/95 backdrop-blur-sm shadow-2xl">
        <div className="text-center mb-8">
          <div className="bg-red-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Super Admin Portal</h2>
          <p className="text-gray-600 mt-2">Secure Platform Access</p>
        </div>

        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setLoginMethod('credentials')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginMethod === 'credentials'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            2FA Login
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('email')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginMethod === 'email'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Magic Link
          </button>
        </div>

        {loginMethod === 'credentials' ? (
          <form onSubmit={handleCredentialsLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                required
                className="w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yourplatform.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                required
                className="w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending OTP...
                </div>
              ) : (
                'Continue'
              )}
            </Button>

            <p className="text-xs text-center text-gray-500">
              We'll send a verification code to your email
            </p>
          </form>
        ) : (
          <form onSubmit={handleMagicLinkLogin} className="space-y-6">
            <div>
              <label htmlFor="magic-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <Input
                id="magic-email"
                type="email"
                required
                className="w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yourplatform.com"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-2">
                We'll send you a secure login link
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending Magic Link...
                </div>
              ) : (
                'Send Magic Link'
              )}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            This is a secure administrative area. All activities are logged and monitored.
          </p>
        </div>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex">
            <svg className="w-4 h-4 text-amber-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-xs text-amber-700">
              <p className="font-medium">Security Notice</p>
              <p>Account will be locked for 15 minutes after 5 failed login attempts.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}