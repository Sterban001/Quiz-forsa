'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AttemptDetailPage() {
  const params = useParams()
  const router = useRouter()
  const attemptId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState<any>(null)
  const [answers, setAnswers] = useState<any[]>([])

  useEffect(() => {
    loadAttemptDetails()
  }, [attemptId])

  const loadAttemptDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const attemptData = await apiClient.getAttempt(attemptId)
      setAttempt(attemptData)

      // The API returns attempt with answers included
      if (attemptData.answers) {
        setAnswers(attemptData.answers)
      }
    } catch (err: any) {
      console.error('Error loading attempt:', err)
      setError(err.message || 'Failed to load attempt details')
      if (err.message?.includes('unauthorized') || err.message?.includes('not authenticated')) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-600">Loading attempt details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
        <Link href="/dashboard/attempts" className="text-blue-600 hover:text-blue-800">
          Back to Attempts
        </Link>
      </div>
    )
  }

  if (!attempt) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          Attempt not found
        </div>
      </div>
    )
  }

  const scorePercentage = attempt.max_score > 0 ? (attempt.score / attempt.max_score) * 100 : 0
  const passed = scorePercentage >= (attempt.test?.pass_score || attempt.tests?.pass_score || 70)

  const correctAnswers = answers?.filter(a => a.is_correct).length || 0
  const totalQuestions = answers?.length || 0

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/attempts" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
          ← Back to Attempts
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Attempt Details</h1>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-medium text-gray-600 mb-3">Student Information</h2>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Student:</span>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {attempt.profiles?.display_name || attempt.user?.display_name || 'Unknown Student'}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Test:</span>
                <Link
                  href={`/dashboard/tests/${attempt.test?.id || attempt.tests?.id}`}
                  className="ml-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  {attempt.test?.title || attempt.tests?.title}
                </Link>
              </div>
              <div>
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                  attempt.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : attempt.status === 'in_progress'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {attempt.status}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Started:</span>
                <span className="ml-2 text-sm text-gray-900">
                  {new Date(attempt.started_at).toLocaleString()}
                </span>
              </div>
              {attempt.submitted_at && (
                <div>
                  <span className="text-sm text-gray-600">Submitted:</span>
                  <span className="ml-2 text-sm text-gray-900">
                    {new Date(attempt.submitted_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium text-gray-600 mb-3">Performance</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Score</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {attempt.score.toFixed(1)} / {attempt.max_score.toFixed(1)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${passed ? 'bg-green-600' : 'bg-red-600'}`}
                    style={{ width: `${Math.min(scorePercentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    Pass Score: {attempt.test?.pass_score || attempt.tests?.pass_score || 70}%
                  </span>
                  <span className={`text-sm font-medium ${passed ? 'text-green-600' : 'text-red-600'}`}>
                    {scorePercentage.toFixed(1)}% {passed ? '(Passed)' : '(Failed)'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
                  <div className="text-xs text-gray-600">Correct</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{totalQuestions - correctAnswers}</div>
                  <div className="text-xs text-gray-600">Incorrect</div>
                </div>
              </div>

              {attempt.duration_seconds > 0 && (
                <div className="text-sm text-gray-600">
                  <span>Time Taken:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {Math.floor(attempt.duration_seconds / 60)}m {attempt.duration_seconds % 60}s
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Question-by-Question Review</h2>

        {!answers || answers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No answers found for this attempt.
          </div>
        ) : (
          <div className="space-y-6">
            {answers.map((answer: any, index: number) => {
              const question = answer.question || answer.questions
              const studentResponse = answer.response_json

              return (
                <div
                  key={answer.id}
                  className={`border rounded-lg p-4 ${
                    answer.is_correct
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">Question {index + 1}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          answer.is_correct
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {answer.is_correct ? 'Correct' : 'Incorrect'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {answer.awarded_points} / {question.points} points
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium mb-3">{question.prompt}</p>

                      {/* Student's Answer */}
                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-700">Student's Answer:</span>
                        <div className="mt-1 ml-4">
                          {question.type === 'mcq_single' || question.type === 'mcq_multi' ? (
                            <div className="space-y-1">
                              {question.question_options?.map((opt: any) => {
                                const isSelected = Array.isArray(studentResponse)
                                  ? studentResponse.includes(opt.id)
                                  : studentResponse === opt.id

                                return (
                                  <div
                                    key={opt.id}
                                    className={`text-sm p-2 rounded ${
                                      isSelected
                                        ? opt.is_correct
                                          ? 'bg-green-100 text-green-900 font-medium'
                                          : 'bg-red-100 text-red-900'
                                        : opt.is_correct
                                        ? 'bg-blue-50 text-blue-900'
                                        : 'text-gray-600'
                                    }`}
                                  >
                                    {isSelected && (opt.is_correct ? '✓ ' : '✗ ')}
                                    {opt.is_correct && !isSelected && '✓ (Correct) '}
                                    {opt.label}
                                  </div>
                                )
                              })}
                            </div>
                          ) : question.type === 'true_false' ? (
                            <span className={`font-medium ${
                              answer.is_correct ? 'text-green-900' : 'text-red-900'
                            }`}>
                              {studentResponse === true ? 'True' : 'False'}
                            </span>
                          ) : (
                            <span className={`font-medium ${
                              answer.is_correct ? 'text-green-900' : 'text-red-900'
                            }`}>
                              {typeof studentResponse === 'object'
                                ? JSON.stringify(studentResponse)
                                : studentResponse || '(No answer)'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Correct Answer (if wrong) */}
                      {!answer.is_correct && question.question_options && (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-700">Correct Answer:</span>
                          <div className="mt-1 ml-4 space-y-1">
                            {question.question_options
                              .filter((opt: any) => opt.is_correct)
                              .map((opt: any) => (
                                <div key={opt.id} className="text-sm text-green-900 font-medium">
                                  ✓ {opt.label}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Explanation */}
                      {question.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                          <span className="text-sm font-medium text-blue-900">Explanation:</span>
                          <p className="text-sm text-blue-800 mt-1">{question.explanation}</p>
                        </div>
                      )}

                      {/* Time spent */}
                      {answer.time_spent_seconds > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          Time spent: {answer.time_spent_seconds}s
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
