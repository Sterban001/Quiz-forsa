'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api/client'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [profile, setProfile] = useState({
    id: '',
    display_name: '',
    avatar_url: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoadingProfile(true)
      setError(null)

      const data = await apiClient.getCurrentUser()

      if (data.profile) {
        setProfile({
          id: data.profile.id,
          display_name: data.profile.display_name || '',
          avatar_url: data.profile.avatar_url || '',
        })
      }
    } catch (err: any) {
      console.error('Error loading profile:', err)
      setError(err.message || 'Failed to load profile')
      if (err.message?.includes('unauthorized') || err.message?.includes('not authenticated')) {
        router.push('/login')
      }
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (!profile.id) throw new Error('Profile ID not found')

      await apiClient.updateUser(profile.id, {
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      })

      setMessage({ type: 'success', text: 'Profile updated successfully' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' })
      if (err.message?.includes('unauthorized') || err.message?.includes('not authenticated')) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loadingProfile) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      {message && (
        <div
          className={`px-4 py-3 rounded mb-6 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={profile.display_name}
                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                placeholder="Your name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Avatar URL
              </label>
              <input
                type="url"
                value={profile.avatar_url}
                onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Supabase URL</span>
              <span className="text-gray-900 font-mono text-xs">
                {process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 40)}...
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Environment</span>
              <span className="text-gray-900">{process.env.NODE_ENV || 'development'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Version</span>
              <span className="text-gray-900">1.0.0</span>
            </div>
          </div>
        </div>

        {/* Database Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">✓</div>
              <div className="text-sm text-gray-600 mt-1">Connected</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">9</div>
              <div className="text-sm text-gray-600 mt-1">Tables</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">✓</div>
              <div className="text-sm text-gray-600 mt-1">RLS Enabled</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">✓</div>
              <div className="text-sm text-gray-600 mt-1">Auth Active</div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <h2 className="text-xl font-semibold text-red-900 mb-4">Danger Zone</h2>
          <p className="text-sm text-gray-600 mb-4">
            These actions are irreversible. Please be careful.
          </p>
          <div className="space-y-3">
            <button className="w-full md:w-auto px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors">
              Clear All Cache
            </button>
            <button className="w-full md:w-auto px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors ml-0 md:ml-3">
              Reset Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
