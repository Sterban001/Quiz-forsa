'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Test {
  id: string
  title: string
  description: string
  category: string
  time_limit_minutes: number
  pass_score: number
  max_attempts: number
  tags: string[]
  test_type: string
}

export default function DashboardPage() {
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({})
  const supabase = createClient()

  useEffect(() => {
    loadTests()
  }, [])

  const loadTests = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load published tests
      const { data: testsData, error: testsError } = await supabase
        .from('tests')
        .select('*')
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })

      if (testsError) throw testsError

      setTests(testsData || [])

      // Load attempt counts for each test
      const { data: attemptsData } = await supabase
        .from('attempts')
        .select('test_id')
        .eq('user_id', user.id)

      if (attemptsData) {
        const counts: Record<string, number> = {}
        attemptsData.forEach((attempt) => {
          counts[attempt.test_id] = (counts[attempt.test_id] || 0) + 1
        })
        setAttemptCounts(counts)
      }
    } catch (error: any) {
      console.error('Error loading tests:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading available tests...</p>
        </div>
      </div>
    )
  }

  if (tests.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-lg border border-blue-200 p-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Tests Available Yet</h3>
          <p className="text-gray-600 text-lg mb-6">
            New quizzes and assessments will appear here when they're published by your instructor.
          </p>
          <p className="text-gray-500 text-sm">Check back soon!</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Available Tests</h1>
            <p className="text-gray-600 text-lg">
              Choose a test to challenge yourself and showcase your knowledge
            </p>
          </div>
          <button
            onClick={() => loadTests()}
            className="px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg font-medium transition-all shadow-sm hover:shadow flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats Bar */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">{tests.length}</div>
              <div className="text-blue-100 text-sm">Available Tests</div>
            </div>
            <div className="text-center border-l border-r border-blue-400">
              <div className="text-3xl font-bold mb-1">
                {Object.values(attemptCounts).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-blue-100 text-sm">Total Attempts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">
                {tests.filter(t => (attemptCounts[t.id] || 0) < t.max_attempts).length}
              </div>
              <div className="text-blue-100 text-sm">Ready to Take</div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tests.map((test) => {
          const attemptCount = attemptCounts[test.id] || 0
          const canAttempt = attemptCount < test.max_attempts
          const isManualGraded = test.test_type === 'manual_graded'

          return (
            <div
              key={test.id}
              className={`bg-white rounded-xl shadow-md border-2 transition-all duration-300 overflow-hidden ${
                canAttempt
                  ? 'border-gray-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1'
                  : 'border-gray-200 opacity-75'
              }`}
            >
              {/* Card Header with Gradient */}
              <div className={`h-2 ${canAttempt ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gray-300'}`}></div>

              <div className="p-6">
                {/* Title and Description */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900 flex-1 line-clamp-2">{test.title}</h3>
                    {isManualGraded && (
                      <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full whitespace-nowrap">
                        Manual Review
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">{test.description}</p>
                </div>

                {/* Category Badge */}
                {test.category && (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200">
                      <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                      {test.category}
                    </span>
                  </div>
                )}

                {/* Tags */}
                {test.tags && test.tags.length > 0 && (
                  <div className="mb-5 flex flex-wrap gap-2">
                    {test.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                    {test.tags.length > 3 && (
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-md">
                        +{test.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Test Info Grid */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">{test.time_limit_minutes} minutes</div>
                      <div className="text-xs text-gray-500">Time limit</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">{test.pass_score}% to pass</div>
                      <div className="text-xs text-gray-500">Passing score</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      canAttempt ? 'bg-blue-100' : 'bg-red-100'
                    }`}>
                      <svg className={`w-4 h-4 ${canAttempt ? 'text-blue-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">
                        {attemptCount}/{test.max_attempts} attempts used
                      </div>
                      <div className="text-xs text-gray-500">
                        {test.max_attempts - attemptCount} remaining
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <Link
                  href={`/dashboard/tests/${test.id}`}
                  className={`block w-full text-center py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    canAttempt
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={(e) => !canAttempt && e.preventDefault()}
                >
                  {canAttempt ? (
                    <span className="flex items-center justify-center gap-2">
                      View Test Details
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  ) : (
                    'Maximum Attempts Reached'
                  )}
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
