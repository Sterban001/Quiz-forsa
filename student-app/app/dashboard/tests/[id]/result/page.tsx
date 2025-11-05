'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResultPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const testId = params.id as string
  const attemptId = searchParams.get('attempt')

  const [attempt, setAttempt] = useState<any>(null)
  const [test, setTest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!attemptId) {
      router.push(`/dashboard/tests/${testId}`)
      return
    }
    loadResults()
  }, [])

  const loadResults = async () => {
    try {
      // Load attempt
      const { data: attemptData, error: attemptError } = await supabase
        .from('attempts')
        .select('*')
        .eq('id', attemptId)
        .single()

      if (attemptError) throw attemptError
      setAttempt(attemptData)

      // Load test
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .select('*')
        .eq('id', testId)
        .single()

      if (testError) throw testError
      setTest(testData)
    } catch (error: any) {
      console.error('Error loading results:', error)
      alert('Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading results...</div>
      </div>
    )
  }

  if (!attempt || !test) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
        Results not found
      </div>
    )
  }

  const isManualGraded = test.test_type === 'manual_graded'
  const isPendingReview = isManualGraded && attempt.status !== 'graded'
  const scorePercentage = attempt.max_score > 0 ? Math.round((attempt.score / attempt.max_score) * 100) : 0
  const passed = scorePercentage >= test.pass_score
  const timeTaken = attempt.submitted_at && attempt.started_at
    ? Math.round((new Date(attempt.submitted_at).getTime() - new Date(attempt.started_at).getTime()) / 1000 / 60)
    : null

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
        {/* Pending Review State for Manual-Graded Tests */}
        {isPendingReview ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 bg-yellow-100">
                <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold mb-2 text-yellow-600">
                Submission Received
              </h1>
              <p className="text-gray-600 text-lg mb-4">
                Your responses have been recorded successfully
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-left">
                    <h3 className="font-semibold text-blue-900 mb-2">Pending Review</h3>
                    <p className="text-sm text-blue-800 mb-3">
                      Your answers are being reviewed by the instructor. You will be notified when grading is complete.
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>What happens next:</strong>
                    </p>
                    <ul className="text-sm text-blue-700 list-disc list-inside space-y-1 mt-2">
                      <li>Instructor will review each of your answers</li>
                      <li>Points will be awarded based on the quality of your responses</li>
                      <li>You'll receive your score and detailed feedback</li>
                      <li>Check back in 1-2 days to see your results</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Details */}
            <div className="border-t border-gray-200 pt-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Submission Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Submission Status</div>
                    <div className="text-lg font-semibold text-green-600">Submitted Successfully</div>
                  </div>
                </div>

                {timeTaken && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Time Taken</div>
                      <div className="text-lg font-semibold text-gray-900">{timeTaken} minutes</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Submitted On</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {new Date(attempt.submitted_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Grading Status</div>
                    <div className="text-lg font-semibold text-yellow-600">Awaiting Review</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Result Header - Only show for graded tests */}
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                passed ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {passed ? (
                  <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <h1 className={`text-4xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
                {passed ? 'Congratulations!' : 'Not Passed'}
              </h1>
              <p className="text-gray-600 text-lg">
                {passed ? 'You have successfully passed the test!' : 'Keep practicing and try again!'}
              </p>
            </div>

            {/* Score Display */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {scorePercentage}%
                  </div>
                  <div className="text-sm text-gray-600">Your Score</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {test.pass_score}%
                  </div>
                  <div className="text-sm text-gray-600">Pass Score</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {attempt.score || 0} / {attempt.max_score || 0}
                  </div>
                  <div className="text-sm text-gray-600">Points</div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="border-t border-gray-200 pt-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Statistics</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {timeTaken && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Time Taken</div>
                      <div className="text-lg font-semibold text-gray-900">{timeTaken} minutes</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <div className={`text-lg font-semibold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                      {passed ? 'Passed' : 'Failed'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Your Performance</span>
                <span>{attempt.score_percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${passed ? 'bg-green-600' : 'bg-red-600'}`}
                  style={{ width: `${Math.min(100, attempt.score_percentage)}%` }}
                />
              </div>
            </div>

          </>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/dashboard"
            className="flex-1 text-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Back to Tests
          </Link>
          <Link
            href={`/dashboard/tests/${testId}`}
            className="flex-1 text-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            View Test Details
          </Link>
          <Link
            href="/dashboard/history"
            className="flex-1 text-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            View All Results
          </Link>
        </div>
      </div>
    </div>
  )
}
