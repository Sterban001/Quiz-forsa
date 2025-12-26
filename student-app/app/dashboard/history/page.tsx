'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'
import Link from 'next/link'

export default function HistoryPage() {
  const [attempts, setAttempts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const data = await apiClient.getAttempts()
      setAttempts(data || [])
    } catch (error: any) {
      console.error('Error loading history:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your history...</p>
        </div>
      </div>
    )
  }

  if (attempts.length === 0) {
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Test History Yet</h3>
          <p className="text-gray-600 text-lg mb-6">
            You haven't taken any tests yet. Start your learning journey today!
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
          >
            Browse Available Tests
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    )
  }

  const stats = {
    total: attempts.length,
    completed: attempts.filter((a) => a.status === 'graded').length,
    pending: attempts.filter((a) => a.status === 'submitted').length,
    passed: attempts.filter((a) => {
      if (a.status !== 'graded') return false
      const percentage = a.max_score > 0 ? (a.score / a.max_score) * 100 : 0
      return percentage >= Number(a.tests.pass_score)
    }).length,
    avgScore: attempts.filter((a) => a.status === 'graded').length > 0
      ? Math.round(
        attempts
          .filter((a) => a.status === 'graded')
          .reduce((sum, a) => {
            const percentage = a.max_score > 0 ? (a.score / a.max_score) * 100 : 0
            return sum + percentage
          }, 0) /
        attempts.filter((a) => a.status === 'graded').length
      )
      : 0,
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Test History</h1>
        <p className="text-gray-600 text-lg">Track your progress and review past attempts</p>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid md:grid-cols-5 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.total}</div>
          <div className="text-blue-100 text-sm font-medium">Total Attempts</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.completed}</div>
          <div className="text-green-100 text-sm font-medium">Completed & Graded</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.pending}</div>
          <div className="text-yellow-100 text-sm font-medium">Pending Review</div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.passed}</div>
          <div className="text-indigo-100 text-sm font-medium">Tests Passed</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.avgScore}%</div>
          <div className="text-purple-100 text-sm font-medium">Average Score</div>
        </div>
      </div>

      {/* Attempts Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Test
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Result
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {attempts.map((attempt) => {
                const percentage = attempt.max_score > 0 ? Math.round((attempt.score / attempt.max_score) * 100) : 0
                const passScoreNum = Number(attempt.tests.pass_score)
                const passed = percentage >= passScoreNum

                // Debug logging
                console.log('Test:', attempt.tests.title, {
                  percentage,
                  passScore: attempt.tests.pass_score,
                  passScoreNum,
                  passed,
                  score: attempt.score,
                  maxScore: attempt.max_score
                })

                const isPendingReview = attempt.status === 'submitted'
                const isCompleted = attempt.status === 'graded'

                return (
                  <tr key={attempt.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900 mb-1">{attempt.tests.title}</div>
                        {attempt.tests.category && (
                          <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                            </svg>
                            {attempt.tests.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {new Date(attempt.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {new Date(attempt.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isPendingReview ? (
                        <div className="flex items-center gap-2 text-gray-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-sm font-medium">Hidden</span>
                        </div>
                      ) : isCompleted ? (
                        <div className="text-sm">
                          <div className="font-bold text-2xl text-gray-900">{percentage}%</div>
                          <div className="text-gray-500 text-xs mt-1">
                            {attempt.score}/{attempt.max_score} points
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 font-medium">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isPendingReview ? (
                        <span className="px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-200">
                          <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          Under Review
                        </span>
                      ) : (
                        <span className={`px-3 py-1.5 inline-flex text-xs font-semibold rounded-lg ${attempt.status === 'graded'
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : attempt.status === 'submitted'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                          {attempt.status === 'graded' ? 'Graded' : attempt.status.charAt(0).toUpperCase() + attempt.status.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isPendingReview ? (
                        <span className="text-sm text-gray-500 font-medium italic">Awaiting results</span>
                      ) : isCompleted ? (
                        <span className={`px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-bold rounded-lg ${passed
                          ? 'bg-green-100 text-green-700 border-2 border-green-300'
                          : 'bg-red-100 text-red-700 border-2 border-red-300'
                          }`}>
                          {passed ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                          {passed ? 'PASSED' : 'FAILED'}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 font-medium">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/dashboard/tests/${attempt.tests.id}/result?attempt=${attempt.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow"
                      >
                        View Details
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
