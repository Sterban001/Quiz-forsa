'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type QuestionType = 'mcq_single' | 'mcq_multi' | 'true_false' | 'short_text' | 'long_text' | 'number'

interface Option {
  id: string
  label: string
  is_correct: boolean
  order_index: number
}

interface Question {
  id: string
  type: QuestionType
  prompt: string
  explanation: string
  points: number
  order_index: number
  options: Option[]
  tolerance_numeric?: number
}

interface Test {
  id: string
  title: string
  description: string
  category: string
  time_limit_minutes: number
  pass_score: number
  status: 'draft' | 'published' | 'archived'
  visibility: 'public' | 'private' | 'unlisted'
  shuffle_questions: boolean
  show_correct_answers: boolean
  show_explanations: boolean
  negative_marking: boolean
  created_at: string
  updated_at: string
}

export default function ViewTestDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const testId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [test, setTest] = useState<Test | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])

  useEffect(() => {
    loadTest()
  }, [testId])

  const loadTest = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch test details
      const testData = await apiClient.getTest(testId)
      setTest(testData)

      // Fetch questions
      const questionsData = await apiClient.getQuestions(testId)

      const formattedQuestions = questionsData.map((q: any) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        explanation: q.explanation || '',
        points: q.points,
        order_index: q.order_index,
        tolerance_numeric: q.tolerance_numeric,
        options: (q.question_options || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((opt: any) => ({
            id: opt.id,
            label: opt.label,
            is_correct: opt.is_correct,
            order_index: opt.order_index,
          })),
      }))

      setQuestions(formattedQuestions)
    } catch (err: any) {
      console.error('Error loading test:', err)
      setError(err.message || 'Failed to load test details')
      if (err.message?.includes('unauthorized') || err.message?.includes('not authenticated')) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const getQuestionTypeLabel = (type: QuestionType): string => {
    const labels = {
      mcq_single: 'Multiple Choice (Single)',
      mcq_multi: 'Multiple Choice (Multiple)',
      true_false: 'True/False',
      short_text: 'Short Text',
      long_text: 'Long Text',
      number: 'Number',
    }
    return labels[type] || type
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  const getVisibilityBadge = (visibility: string) => {
    const colors = {
      public: 'bg-blue-100 text-blue-800',
      private: 'bg-purple-100 text-purple-800',
      unlisted: 'bg-orange-100 text-orange-800',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[visibility as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {visibility}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading test details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">{error}</div>
          <Link href="/dashboard/tests" className="text-blue-600 hover:text-blue-800">
            Back to Tests
          </Link>
        </div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Test not found</div>
      </div>
    )
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/tests"
            className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Tests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{test.title}</h1>
        </div>
        <Link
          href={`/dashboard/tests/${testId}/edit`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Edit Test
        </Link>
      </div>

      {/* Test Details Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Test Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <p className="text-gray-900">{test.title}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <p className="text-gray-900">{test.category}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            {getStatusBadge(test.status)}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visibility
            </label>
            {getVisibilityBadge(test.visibility)}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Limit
            </label>
            <p className="text-gray-900">{test.time_limit_minutes} minutes</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pass Score
            </label>
            <p className="text-gray-900">{test.pass_score}%</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Questions
            </label>
            <p className="text-gray-900">{questions.length}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Points
            </label>
            <p className="text-gray-900">{totalPoints}</p>
          </div>
        </div>

        {test.description && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <p className="text-gray-700 whitespace-pre-wrap">{test.description}</p>
          </div>
        )}

        {/* Test Settings */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Settings
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={test.shuffle_questions}
                disabled
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">Shuffle Questions</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={test.show_correct_answers}
                disabled
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">Show Correct Answers</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={test.show_explanations}
                disabled
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">Show Explanations</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={test.negative_marking}
                disabled
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">Negative Marking</label>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Created:</span>{' '}
            {new Date(test.created_at).toLocaleString()}
          </div>
          <div>
            <span className="font-medium">Last Updated:</span>{' '}
            {new Date(test.updated_at).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Questions ({questions.length})
        </h2>

        {questions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No questions added yet</p>
            <Link
              href={`/dashboard/tests/${testId}/edit`}
              className="text-blue-600 hover:text-blue-800"
            >
              Add Questions →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                {/* Question Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-900">
                        Question {index + 1}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {getQuestionTypeLabel(question.type)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {question.points} {question.points === 1 ? 'point' : 'points'}
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium whitespace-pre-wrap">
                      {question.prompt}
                    </p>
                  </div>
                </div>

                {/* Options for MCQ/True-False */}
                {(question.type === 'mcq_single' ||
                  question.type === 'mcq_multi' ||
                  question.type === 'true_false') && (
                  <div className="mt-4 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {question.type === 'mcq_multi' ? 'Options (Multiple correct answers):' : 'Options:'}
                    </label>
                    {question.options.map((option, optIndex) => (
                      <div
                        key={option.id}
                        className={`flex items-center p-3 rounded border ${
                          option.is_correct
                            ? 'bg-green-50 border-green-500'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                            {String.fromCharCode(65 + optIndex)}
                          </span>
                          <span className="text-gray-900">{option.label}</span>
                        </div>
                        {option.is_correct && (
                          <span className="text-green-700 text-sm font-medium">
                            ✓ Correct
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Number question tolerance */}
                {question.type === 'number' && question.tolerance_numeric !== undefined && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Answer Tolerance
                    </label>
                    <p className="text-gray-900">±{question.tolerance_numeric}</p>
                  </div>
                )}

                {/* Text questions */}
                {(question.type === 'short_text' || question.type === 'long_text') && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 italic">
                      Text answer - requires manual grading
                    </p>
                  </div>
                )}

                {/* Explanation */}
                {question.explanation && (
                  <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <label className="block text-sm font-medium text-blue-900 mb-1">
                      Explanation
                    </label>
                    <p className="text-blue-800 text-sm whitespace-pre-wrap">
                      {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
