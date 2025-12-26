'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'

export default function AuthCallbackPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Get the access token from URL hash (Supabase OAuth flow)
                const hashParams = new URLSearchParams(window.location.hash.substring(1))
                const accessToken = hashParams.get('access_token')
                const errorParam = hashParams.get('error')
                const errorDescription = hashParams.get('error_description')

                console.log('OAuth Callback - Access Token:', accessToken ? 'Present' : 'Missing')

                // Check for OAuth errors
                if (errorParam) {
                    console.error('OAuth error:', errorParam, errorDescription)
                    setError(errorDescription || 'Authentication failed')
                    setTimeout(() => {
                        router.push('/login?error=oauth_failed')
                    }, 2000)
                    return
                }

                if (!accessToken) {
                    console.error('No access token in URL hash')
                    setError('No access token received')
                    setTimeout(() => {
                        router.push('/login?error=auth_failed')
                    }, 2000)
                    return
                }

                // Set the token in the API client FIRST
                apiClient.setToken(accessToken)
                console.log('Token set in API client')

                // Also set as cookie for middleware
                document.cookie = `auth_token=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
                console.log('Cookie set')

                // Small delay to ensure token is set
                await new Promise(resolve => setTimeout(resolve, 100))

                console.log('Student authenticated, redirecting to dashboard')
                // Success! Redirect to dashboard (no admin check for students)
                router.push('/dashboard')
            } catch (error: any) {
                console.error('Auth callback error:', error)
                // Clear the cookie on error
                document.cookie = 'auth_token=; path=/; max-age=0'
                setError(error.message || 'Authentication failed')
                setTimeout(() => {
                    router.push('/login?error=auth_failed')
                }, 2000)
            }
        }

        handleCallback()
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-xl p-8">
                    <div className="text-center">
                        {error ? (
                            <>
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                    <svg
                                        className="h-6 w-6 text-red-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">
                                    Authentication Error
                                </h2>
                                <p className="text-gray-600 mb-4">{error}</p>
                                <p className="text-sm text-gray-500">Redirecting to login...</p>
                            </>
                        ) : (
                            <>
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">
                                    Completing sign in...
                                </h2>
                                <p className="text-gray-600">Please wait while we verify your account.</p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
