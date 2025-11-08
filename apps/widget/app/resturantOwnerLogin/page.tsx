'use client'
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { AlertCircle, User, Mail, Phone, CreditCard, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FormData {
  email: string;
  phone: string;
  name: string;
  aadharNumber: string;
  otp: string;
}

interface FormErrors {
  [key: string]: string;
}

type AuthStep = 'credentials' | 'otp-verification';

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [authStep, setAuthStep] = useState<AuthStep>('credentials');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState<FormData>({
    email: '',
    phone: '',
    name: '',
    aadharNumber: '',
    otp: ''
  });
const router = useRouter(); // ✅ Add this line at the top

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const re = /^[6-9]\d{9}$/;
    return re.test(phone);
  };

  const validateAadhar = (aadhar: string): boolean => {
    const re = /^\d{12}$/;
    return re.test(aadhar);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email && !formData.phone) {
      newErrors.email = 'Either email or phone is required';
      newErrors.phone = 'Either email or phone is required';
    } else {
      if (formData.email && !validateEmail(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
      if (formData.phone && !validatePhone(formData.phone)) {
        newErrors.phone = 'Invalid phone number (10 digits, starting with 6-9)';
      }
    }

    if (isSignUp) {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      }
      if (formData.aadharNumber && !validateAadhar(formData.aadharNumber)) {
        newErrors.aadharNumber = 'Invalid Aadhar number (12 digits)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const identifier = formData.email || formData.phone;
      
      // Call your send OTP API
      const response = await fetch('/api/owner/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          name: formData.name || undefined,
          aadharNumber: formData.aadharNumber || undefined,
          isSignUp
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      setSuccessMessage(`OTP sent to ${formData.email ? 'email' : 'phone'}!`);
      setAuthStep('otp-verification');

    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

 const handleVerifyOTP = async (e: React.FormEvent) => {
  e.preventDefault();
  setSuccessMessage('');

  if (!formData.otp) {
    setErrors({ otp: 'OTP is required' });
    return;
  }

  if (formData.otp.length !== 6) {
    setErrors({ otp: 'OTP must be 6 digits' });
    return;
  }

  setLoading(true);

  try {
    // Use NextAuth signIn with your custom provider
    const result = await signIn('restaurant-owner-otp', {
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      otp: formData.otp,
      name: formData.name || undefined,
      redirect: false,
      callbackUrl: '/restaurant/dashboard'
    });

    console.log('SignIn Result:', result); // Debug log

    // ✅ Check if signIn was successful
    if (result?.ok) {
      // Success - redirect to dashboard
      setSuccessMessage('Authentication successful! Redirecting...');
      setTimeout(() => {
        router.push('/restaurant/dashboard');
      }, 1500);
      return;
    }

    // ❌ Handle error cases
    if (result?.error) {
      // Try to parse the error if it's a JSON string
      let errorData;
      try {
        errorData = JSON.parse(result.error);
      } catch {
        // If not JSON, treat as regular error message
        throw new Error(result.error);
      }

      // Handle "already applied" case with application status
      if (errorData.applicationId && errorData.status) {
        switch (errorData.status) {
          case 'APPROVED':
            setSuccessMessage('You already have an approved restaurant. Redirecting to dashboard...');
            setTimeout(() => router.push('/restaurant/dashboard'), 1500);
            return;
            
          case 'PENDING':
            setErrors({ 
              submit: 'Your restaurant application is pending approval. Please wait for admin review.' 
            });
            return;
            
          case 'REJECTED':
            setErrors({ 
              submit: 'Your previous application was rejected. Please contact support for more information.' 
            });
            return;
            
          default:
            throw new Error(errorData.error || 'Application status unknown');
        }
      }
      
      // Generic error
      throw new Error(errorData.error || result.error);
    }

    // ⚠️ This should rarely happen - result is neither ok nor error
    throw new Error('Unexpected response from authentication');

  } catch (error) {
    console.error('Verify OTP Error:', error); // Debug log
    setErrors({ 
      submit: error instanceof Error ? error.message : 'Invalid OTP or authentication failed' 
    });
  } finally {
    setLoading(false);
  }
};

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setAuthStep('credentials');
    setErrors({});
    setSuccessMessage('');
    setFormData({
      email: '',
      phone: '',
      name: '',
      aadharNumber: '',
      otp: ''
    });
  };

  const goBack = () => {
    setAuthStep('credentials');
    setErrors({});
    setSuccessMessage('');
    setFormData(prev => ({ ...prev, otp: '' }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <User className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {authStep === 'otp-verification' 
              ? 'Verify OTP' 
              : isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-600 mt-2">
            {authStep === 'otp-verification'
              ? `Enter the OTP sent to ${formData.email || formData.phone}`
              : isSignUp ? 'Register as a restaurant owner' : 'Sign in to your account'}
          </p>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <div className="text-green-600 text-sm">{successMessage}</div>
          </div>
        )}

        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-red-600 text-sm">{errors.submit}</div>
          </div>
        )}

        {authStep === 'credentials' ? (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address {!formData.phone && '*'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.email 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-orange-500'
                  }`}
                  placeholder="owner@restaurant.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="text-center text-sm text-gray-500">OR</div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number {!formData.email && '*'}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.phone 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-orange-500'
                  }`}
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        errors.name 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-orange-500'
                      }`}
                      placeholder="John Doe"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aadhar Number (Optional)
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="aadharNumber"
                      value={formData.aadharNumber}
                      onChange={handleChange}
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        errors.aadharNumber 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-orange-500'
                      }`}
                      placeholder="123456789012"
                      maxLength={12}
                    />
                  </div>
                  {errors.aadharNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.aadharNumber}</p>
                  )}
                </div>
              </>
            )}

            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:bg-orange-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Change email/phone</span>
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP *
              </label>
              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                className={`w-full px-4 py-3 text-center text-2xl tracking-widest border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  errors.otp 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-orange-500'
                }`}
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
              />
              {errors.otp && (
                <p className="mt-1 text-sm text-red-600">{errors.otp}</p>
              )}
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:bg-orange-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full text-orange-600 hover:text-orange-700 font-medium text-sm"
            >
              Resend OTP
            </button>
          </div>
        )}

        {authStep === 'credentials' && (
          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-orange-600 hover:text-orange-700 font-medium text-sm"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}