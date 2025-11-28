'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function QuestionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<any[]>([])

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      setError(null)

      // Note: The API doesn't have a "get all questions" endpoint
      // So we need to get tests first, then questions for each test
      const tests = await apiClient.getTests()

      // Get questions from all tests
      const allQuestions: any[] = []
      for (const test of tests) {
        const testQuestions = await apiClient.getQuestions(test.id)
        testQuestions.forEach((q: any) => {
          allQuestions.push({
            ...q,
            test: {
              id: test.id,
              title: test.title
            }
          })
        })
      }

      // Sort by created_at descending and limit to 50
      const sortedQuestions = allQuestions
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50)

      setQuestions(sortedQuestions)
    } catch (err: any) {
      console.error('Error loading questions:', err)
      setError(err.message || 'Failed to load questions')
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
        <div className="text-gray-600">Loading questions...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          Error loading questions: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Questions</h1>
          <p className="text-gray-600 mt-1">Browse and manage all questions</p>
        </div>
      </div>

      {questions.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="max-w-sm mx-auto">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
            <p className="text-gray-600 mb-6">Questions are created within tests. Start by creating a test first.</p>
            <Link
              href="/dashboard/tests/new"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Create a Test
            </Link>
          </div>
        </div>
      )}

      {questions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {questions.map((question: any) => (
                  <tr key={question.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md truncate">
                        {question.prompt}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/tests/${question.test?.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {question.test?.title || 'Unknown Test'}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {question.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {question.points}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(question.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
