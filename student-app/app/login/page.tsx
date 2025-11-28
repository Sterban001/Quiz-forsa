'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('otp')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      await apiClient.login(email, password)

      // Successfully logged in
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      setMessage(error.message || 'Error logging in')
    } finally {
      setLoading(false)
    }
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      await apiClient.sendOtp(email)
      setMessage('OTP sent! Check your email.')
      setStep('otp')
    } catch (error: any) {
      setMessage(error.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      await apiClient.verifyOtp(email, otp)

      // Successfully verified, redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      setMessage(error.message || 'Failed to verify OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Platform</h1>
          <p className="text-gray-600">
            {authMode === 'password'
              ? 'Student Login'
              : step === 'email'
              ? 'Login with OTP'
              : 'Enter OTP Code'}
          </p>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.includes('Error') || message.includes('Failed')
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}

        {authMode === 'password' ? (
          <form onSubmit={handlePasswordLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password (min 6 characters)"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login / Sign Up'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('otp')
                  setMessage('')
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Use OTP instead
              </button>
            </div>
          </form>
        ) : step === 'email' ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('password')
                  setMessage('')
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Use password instead
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                One-Time Password
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('email')
                setOtp('')
                setMessage('')
              }}
              className="w-full text-sm text-gray-600 hover:text-gray-900"
            >
              Back to email
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>New student? Just enter your email to get started!</p>
          {authMode === 'otp' && step === 'email' && (
            <p className="mt-2 text-xs text-gray-500">You'll receive a 6-digit code via email</p>
          )}
        </div>
      </div>
    </div>
  )
}
