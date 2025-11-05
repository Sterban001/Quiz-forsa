'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    totalAttempts: 0,
    completedTests: 0,
    averageScore: 0,
    passedTests: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUser(user)

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      // Load stats
      const { data: attempts } = await supabase
        .from('attempts')
        .select(`
          *,
          tests (pass_score)
        `)
        .eq('user_id', user.id)

      if (attempts) {
        const completed = attempts.filter((a) => a.status === 'completed')
        const passed = completed.filter((a) => a.score_percentage >= a.tests.pass_score)
        const avgScore = completed.length > 0
          ? Math.round(completed.reduce((sum, a) => sum + a.score_percentage, 0) / completed.length)
          : 0

        setStats({
          totalAttempts: attempts.length,
          completedTests: completed.length,
          averageScore: avgScore,
          passedTests: passed.length,
        })
      }
    } catch (error: any) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
        <p className="text-gray-600 mt-1">View your account information and statistics</p>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {profile?.display_name || 'Student'}
            </h3>
            <p className="text-gray-600">{user?.email}</p>
            <div className="mt-2">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Student Account
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Email</div>
              <div className="font-medium text-gray-900">{user?.email}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Member Since</div>
              <div className="font-medium text-gray-900">
                {user?.created_at && new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Last Sign In</div>
              <div className="font-medium text-gray-900">
                {user?.last_sign_in_at && new Date(user.last_sign_in_at).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Account Status</div>
              <div className="font-medium text-green-600">Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-6">Performance Statistics</h4>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-blue-700 font-medium">Total Attempts</div>
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-blue-900">{stats.totalAttempts}</div>
          </div>

          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-green-700 font-medium">Tests Passed</div>
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-green-900">{stats.passedTests}</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-purple-700 font-medium">Average Score</div>
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-purple-900">{stats.averageScore}%</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-orange-700 font-medium">Completed Tests</div>
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-orange-900">{stats.completedTests}</div>
          </div>
        </div>

        {stats.completedTests > 0 && (
          <div className="border-t border-gray-200 pt-6">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Success Rate</h5>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div
                  className="bg-green-600 h-4 rounded-full"
                  style={{
                    width: `${Math.round((stats.passedTests / stats.completedTests) * 100)}%`,
                  }}
                />
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {Math.round((stats.passedTests / stats.completedTests) * 100)}%
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
