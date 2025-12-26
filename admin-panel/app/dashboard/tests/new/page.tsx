'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api/client'
import { useRouter } from 'next/navigation'

export default function NewTestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    time_limit_minutes: 60,
    visibility: 'private',
    status: 'draft',
    max_attempts: 1,
    pass_score: 50,
    negative_marking: false,
    shuffle_questions: false,
    show_correct_answers: true,
    show_explanations: true,
    results_released: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const data = await apiClient.createTest({
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      })

      router.push(`/dashboard/tests/${data.id}/edit`)
    } catch (err: any) {
      setError(err.message || 'Failed to create test')
      if (err.message?.includes('unauthorized') || err.message?.includes('not authenticated')) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
        type === 'number' ? parseInt(value) || 0 : value
    }))
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Test</h1>
        <p className="text-gray-600 mt-1">Set up a new quiz or assessment</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Title *
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., General Knowledge Quiz"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Brief description of the test..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="e.g., Science, Math, History"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., beginner, practice, quiz"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Limit (minutes)
            </label>
            <input
              type="number"
              name="time_limit_minutes"
              value={formData.time_limit_minutes}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Attempts
            </label>
            <input
              type="number"
              name="max_attempts"
              value={formData.max_attempts}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <select
              name="visibility"
              value={formData.visibility}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
              <option value="whitelist">Whitelist Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pass Score (%)
            </label>
            <input
              type="number"
              name="pass_score"
              value={formData.pass_score}
              onChange={handleChange}
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="shuffle_questions"
              checked={formData.shuffle_questions}
              onChange={handleChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Shuffle Questions</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="negative_marking"
              checked={formData.negative_marking}
              onChange={handleChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Enable Negative Marking</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="show_correct_answers"
              checked={formData.show_correct_answers}
              onChange={handleChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Show Correct Answers After Submission</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="show_explanations"
              checked={formData.show_explanations}
              onChange={handleChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Show Explanations</span>
          </label>

          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              name="results_released"
              checked={formData.results_released}
              onChange={handleChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Auto-Release Results</span>
              <p className="text-xs text-gray-500 mt-1">
                If unchecked, students won't see their scores until you manually release results.
                Useful for reviewing auto-graded tests before showing results.
              </p>
            </div>
          </label>
        </div>

        <div className="flex gap-3 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Create Test'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
