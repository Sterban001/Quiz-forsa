'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [hasToken, setHasToken] = useState(false)
    const router = useRouter()

    useEffect(() => {
        // Check if there's an access_token in the URL hash (Supabase format)
        if (typeof window !== 'undefined') {
            const hashParams = new URLSearchParams(window.location.hash.substring(1))
            const accessToken = hashParams.get('access_token')

            if (accessToken) {
                // Set the token in the API client so it can be used for the reset request
                apiClient.setToken(accessToken)
                setHasToken(true)
            } else {
                setError('Invalid or missing reset token. Please request a new password reset link.')
            }
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            setLoading(false)
            return
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long')
            setLoading(false)
            return
        }

        try {
            await apiClient.resetPassword(password)
            setSuccess(true)
            setTimeout(() => {
                router.push('/login')
            }, 3000)
        } catch (err: any) {
            setError(err.message || 'Failed to reset password')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-lg shadow-xl p-8">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <svg
                                    className="h-6 w-6 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Password reset successful
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Your password has been reset successfully. Redirecting to login...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-xl p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Reset your password
                        </h1>
                        <p className="text-gray-600">
                            Enter your new password below.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                New password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                minLength={8}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Must be at least 8 characters long
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Confirm new password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                minLength={8}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !hasToken}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Resetting...' : 'Reset password'}
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => router.push('/login')}
                                className="text-sm text-blue-600 hover:text-blue-700"
                            >
                                Back to login
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
