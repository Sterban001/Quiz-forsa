'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Extract the component using useSearchParams
function LoginContent() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()

    // Check for error parameters in URL (from OAuth callback)
    useState(() => {
        const errorParam = searchParams.get('error')
        if (errorParam) {
            const errorMessages: Record<string, string> = {
                'admin_required': 'Access denied. Admin role required to access this panel.',
                'auth_failed': 'Authentication failed. Please try again.',
                'oauth_failed': 'Google sign-in failed. Please try again.',
                'account_exists': 'An account with this email already exists. Please sign in with your original method.'
            }
            setError(errorMessages[errorParam] || 'An error occurred during sign in.')
        }
    })

    const handleGoogleLogin = async () => {
        setLoading(true)
        setError(null)

        try {
            // Redirect to backend Google OAuth endpoint
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
            // Remove trailing /api if present to avoid duplication
            const baseUrl = apiUrl.replace(/\/api$/, '')
            window.location.href = `${baseUrl}/api/auth/google?source=admin`
        } catch (err: any) {
            setError(err.message || 'Failed to initiate Google sign-in')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Quiz Admin Panel
                        </h1>
                        <p className="text-gray-600">
                            Enter your credentials to continue
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="text-center mb-6">
                        <p className="text-gray-700 mb-2 font-medium">
                            Admin Panel Access
                        </p>
                        <p className="text-sm text-gray-600">
                            Sign in with your authorized Google account
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Sign in with Google
                    </button>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        <p className="text-center text-sm text-gray-600 mt-4">
                            Admin access only. Contact system administrator for access.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
            <LoginContent />
        </Suspense>
    )
}
