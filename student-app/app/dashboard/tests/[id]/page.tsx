'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Test {
  id: string
  title: string
  description: string
  category: string
  time_limit_minutes: number
  pass_score: number
  max_attempts: number
  negative_marking: boolean
  shuffle_questions: boolean
  show_answers_after: boolean
  tags: string[]
}

export default function TestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const testId = params.id as string
  const [test, setTest] = useState<Test | null>(null)
  const [questionCount, setQuestionCount] = useState(0)
  const [attemptCount, setAttemptCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [previousAttempts, setPreviousAttempts] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadTestDetails()
  }, [testId])

  const loadTestDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load test
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .select('*')
        .eq('id', testId)
        .single()

      if (testError) throw testError
      setTest(testData)

      // Count questions
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('test_id', testId)

      setQuestionCount(count || 0)

      // Load previous attempts
      const { data: attemptsData } = await supabase
        .from('attempts')
        .select('*')
        .eq('test_id', testId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (attemptsData) {
        setPreviousAttempts(attemptsData)
        setAttemptCount(attemptsData.length)
      }
    } catch (error: any) {
      console.error('Error loading test:', error)
      alert('Failed to load test details')
    } finally {
      setLoading(false)
    }
  }

  const handleStartTest = async () => {
    if (!test) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Create new attempt
    const { data: attempt, error } = await supabase
      .from('attempts')
      .insert({
        test_id: testId,
        user_id: user.id,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating attempt:', error)
      alert(`Failed to start test: ${error.message}`)
      return
    }

    router.push(`/dashboard/tests/${testId}/take?attempt=${attempt.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading test details...</div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
        Test not found
      </div>
    )
  }

  const canAttempt = attemptCount < test.max_attempts

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Tests
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{test.title}</h1>
        <p className="text-gray-600 mb-6">{test.description}</p>

        {test.category && (
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 font-medium rounded-full">
              {test.category}
            </span>
          </div>
        )}

        {test.tags && test.tags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {test.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="border-t border-gray-200 pt-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <div>
                <div className="text-sm text-gray-600">Questions</div>
                <div className="font-semibold">{questionCount}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-sm text-gray-600">Time Limit</div>
                <div className="font-semibold">{test.time_limit_minutes} minutes</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-sm text-gray-600">Pass Score</div>
                <div className="font-semibold">{test.pass_score}%</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <div>
                <div className="text-sm text-gray-600">Attempts</div>
                <div className="font-semibold">{attemptCount} / {test.max_attempts}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Rules</h2>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>You have {test.time_limit_minutes} minutes to complete the test</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>You need to score at least {test.pass_score}% to pass</span>
            </li>
            {test.negative_marking && (
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Negative marking is enabled for incorrect answers</span>
              </li>
            )}
            {test.shuffle_questions && (
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                <span>Questions will be shuffled randomly</span>
              </li>
            )}
          </ul>
        </div>

        {previousAttempts.length > 0 && (
          <div className="border-t border-gray-200 pt-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Previous Attempts</h2>
            <div className="space-y-3">
              {previousAttempts.map((attempt, index) => (
                <div key={attempt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">Attempt {previousAttempts.length - index}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(attempt.created_at).toLocaleDateString()} at {new Date(attempt.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    {attempt.status === 'completed' && (
                      <>
                        <div className={`font-semibold ${
                          attempt.score_percentage >= test.pass_score ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {attempt.score_percentage}%
                        </div>
                        <div className={`text-sm ${
                          attempt.score_percentage >= test.pass_score ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {attempt.score_percentage >= test.pass_score ? 'Passed' : 'Failed'}
                        </div>
                      </>
                    )}
                    {attempt.status === 'in_progress' && (
                      <span className="text-yellow-600">In Progress</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-6">
          {canAttempt ? (
            <button
              onClick={handleStartTest}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors"
            >
              Start Test
            </button>
          ) : (
            <div className="bg-gray-100 text-gray-600 py-4 px-6 rounded-lg text-center">
              You have reached the maximum number of attempts for this test
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
