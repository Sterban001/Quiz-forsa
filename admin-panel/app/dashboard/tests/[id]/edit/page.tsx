'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api/client'
import { useParams, useRouter } from 'next/navigation'

type QuestionType = 'mcq_single' | 'mcq_multi' | 'true_false' | 'short_text' | 'long_text' | 'number'

interface Option {
  id?: string
  label: string
  is_correct: boolean
  order_index: number
}

interface Question {
  id?: string
  type: QuestionType
  prompt: string
  explanation: string
  points: number
  order_index: number
  options: Option[]
  tolerance_numeric?: number
}

export default function EditTestPage() {
  const params = useParams()
  const router = useRouter()
  const testId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [test, setTest] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [showTestDetailsForm, setShowTestDetailsForm] = useState(false)
  const [editedTestDetails, setEditedTestDetails] = useState<any>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    loadTest()
  }, [testId])

  const loadTest = async () => {
    try {
      setLoading(true)
      setError(null)

      const testData = await apiClient.getTest(testId)
      setTest(testData)

      const questionsData = await apiClient.getQuestions(testId)

      const formattedQuestions = questionsData.map((q: any) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        explanation: q.explanation || '',
        points: q.points,
        order_index: q.order_index,
        tolerance_numeric: q.tolerance_numeric,
        options: q.question_options?.sort((a: any, b: any) => a.order_index - b.order_index) || [],
      }))

      setQuestions(formattedQuestions)
    } catch (err: any) {
      console.error('Error loading test:', err)
      setError(err.message || 'Failed to load test')
      if (err.message?.includes('unauthorized') || err.message?.includes('not authenticated')) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddQuestion = () => {
    // Default to MCQ single choice
    const defaultType: QuestionType = 'mcq_single'

    // MCQ questions need default options
    const defaultOptions = [
      { label: '', is_correct: false, order_index: 0 },
      { label: '', is_correct: false, order_index: 1 },
    ]

    setEditingQuestion({
      type: defaultType,
      prompt: '',
      explanation: '',
      points: 1,
      order_index: questions.length,
      options: defaultOptions,
    })
    setShowQuestionForm(true)
  }

  // Update options when question type changes
  const handleQuestionTypeChange = (newType: QuestionType) => {
    if (!editingQuestion) return

    let newOptions = editingQuestion.options

    if (newType === 'true_false') {
      newOptions = [
        { label: 'True', is_correct: false, order_index: 0 },
        { label: 'False', is_correct: false, order_index: 1 },
      ]
    } else if (newType === 'number') {
      newOptions = [{ label: '', is_correct: true, order_index: 0 }]
    } else if (newType === 'short_text' || newType === 'long_text') {
      newOptions = []
    } else if (editingQuestion.type === 'true_false' || editingQuestion.type === 'number') {
      // Switching from true/false or number to MCQ
      newOptions = [
        { label: '', is_correct: false, order_index: 0 },
        { label: '', is_correct: false, order_index: 1 },
      ]
    }

    setEditingQuestion({
      ...editingQuestion,
      type: newType,
      options: newOptions,
    })
  }

  const handleSaveQuestion = async () => {
    if (!editingQuestion) return

    setSaving(true)
    try {
      if (editingQuestion.id) {
        // Update existing question
        await apiClient.updateQuestion(editingQuestion.id, {
          type: editingQuestion.type,
          prompt: editingQuestion.prompt,
          explanation: editingQuestion.explanation,
          points: editingQuestion.points,
          tolerance_numeric: editingQuestion.tolerance_numeric,
          options: editingQuestion.options.map((opt, idx) => ({
            label: opt.label,
            is_correct: opt.is_correct,
            order_index: idx,
          })),
        })
      } else {
        // Create new question
        await apiClient.createQuestion({
          test_id: testId,
          type: editingQuestion.type,
          prompt: editingQuestion.prompt,
          explanation: editingQuestion.explanation,
          points: editingQuestion.points,
          order_index: editingQuestion.order_index,
          tolerance_numeric: editingQuestion.tolerance_numeric,
          options: editingQuestion.options.map((opt, idx) => ({
            label: opt.label,
            is_correct: opt.is_correct,
            order_index: idx,
          })),
        })
      }

      await loadTest()
      setShowQuestionForm(false)
      setEditingQuestion(null)
      setHasUnsavedChanges(false) // Questions are saved immediately
    } catch (err: any) {
      console.error('Error saving question:', err)
      alert('Failed to save question: ' + err.message)
      if (err.message?.includes('unauthorized') || err.message?.includes('not authenticated')) {
        router.push('/login')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return

    try {
      await apiClient.deleteQuestion(questionId)
      await loadTest()
    } catch (err: any) {
      console.error('Error deleting question:', err)
      alert('Failed to delete question: ' + err.message)
      if (err.message?.includes('unauthorized') || err.message?.includes('not authenticated')) {
        router.push('/login')
      }
    }
  }

  const handleTestDetailChange = (field: string, value: any) => {
    setTest({ ...test, [field]: value })
    setHasUnsavedChanges(true)
  }

  const handleSaveAllChanges = async () => {
    if (!test.title?.trim()) {
      alert('Test title is required')
      return
    }

    setSaving(true)
    try {
      // Save test details
      await apiClient.updateTest(testId, {
        title: test.title,
        description: test.description,
        category: test.category,
        time_limit_minutes: test.time_limit_minutes,
        pass_score: test.pass_score,
        status: test.status,
        visibility: test.visibility,
      })

      setHasUnsavedChanges(false)
      alert('Changes saved successfully!')
    } catch (err: any) {
      console.error('Error saving changes:', err)
      alert('Failed to save changes: ' + err.message)
      if (err.message?.includes('unauthorized') || err.message?.includes('not authenticated')) {
        router.push('/login')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => router.push('/dashboard/tests')}
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Tests
        </button>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          Test not found
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{test.title}</h1>
          <p className="text-gray-600 mt-1">Manage questions and test settings</p>
        </div>
        <div className="flex gap-3">
          {hasUnsavedChanges && (
            <button
              onClick={handleSaveAllChanges}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          )}
          <button
            onClick={() => router.push('/dashboard/tests')}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Back to Tests
          </button>
        </div>
      </div>

      {/* Test Details - Editable */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Test Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Title *</label>
            <input
              type="text"
              value={test.title}
              onChange={(e) => handleTestDetailChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter test title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <input
              type="text"
              value={test.category || ''}
              onChange={(e) => handleTestDetailChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., General, Science, Math"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (minutes)</label>
            <input
              type="number"
              value={test.time_limit_minutes}
              onChange={(e) => handleTestDetailChange('time_limit_minutes', parseInt(e.target.value) || 10)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pass Score (%)</label>
            <input
              type="number"
              value={test.pass_score}
              onChange={(e) => handleTestDetailChange('pass_score', parseInt(e.target.value) || 70)}
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={test.status}
              onChange={(e) => handleTestDetailChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
            <select
              value={test.visibility}
              onChange={(e) => handleTestDetailChange('visibility', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
              <option value="whitelist">Whitelist Only</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={test.description || ''}
              onChange={(e) => handleTestDetailChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter test description"
            />
          </div>

          <div className="md:col-span-2 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-gray-600 block mb-1">Questions</span>
              <span className="font-medium">{questions.length}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-gray-600 block mb-1">Total Points</span>
              <span className="font-medium">{questions.reduce((sum, q) => sum + q.points, 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Questions</h2>
          <button
            onClick={handleAddQuestion}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Question
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No questions yet. Click "Add Question" to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {question.type}
                      </span>
                      <span className="text-sm text-gray-600">{question.points} points</span>
                    </div>
                    <p className="text-gray-900 font-medium mb-2">{question.prompt}</p>
                    {question.options && question.options.length > 0 && (
                      <div className="space-y-1 ml-4">
                        {question.options.map((opt: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <span className={opt.is_correct ? 'text-green-600 font-medium' : 'text-gray-600'}>
                              {opt.is_correct && '✓ '}
                              {opt.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingQuestion(question)
                        setShowQuestionForm(true)
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id!)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Question Form Modal */}
      {showQuestionForm && editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-semibold mb-4">
              {editingQuestion.id ? 'Edit Question' : 'Add New Question'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                <select
                  value={editingQuestion.type}
                  onChange={(e) => handleQuestionTypeChange(e.target.value as QuestionType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="mcq_single">Multiple Choice (Single Answer)</option>
                  <option value="mcq_multi">Multiple Choice (Multiple Answers)</option>
                  <option value="true_false">True/False</option>
                  <option value="number">Number</option>
                  <option value="short_text">Short Text</option>
                  <option value="long_text">Long Text</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  MCQ, True/False, and Number questions are auto-graded. Text questions require manual grading.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Question Text *</label>
                <textarea
                  value={editingQuestion.prompt}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, prompt: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Explanation</label>
                <textarea
                  value={editingQuestion.explanation}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                <input
                  type="number"
                  value={editingQuestion.points}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, points: parseInt(e.target.value) || 1 })}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Options for MCQ */}
              {(editingQuestion.type === 'mcq_single' || editingQuestion.type === 'mcq_multi') && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Answer Options</label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuestion({
                          ...editingQuestion,
                          options: [...editingQuestion.options, { label: '', is_correct: false, order_index: editingQuestion.options.length }]
                        })
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Option
                    </button>
                  </div>
                  <div className="space-y-2">
                    {editingQuestion.options.map((option, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="checkbox"
                          checked={option.is_correct}
                          onChange={(e) => {
                            const newOptions = [...editingQuestion.options]
                            newOptions[idx].is_correct = e.target.checked
                            setEditingQuestion({ ...editingQuestion, options: newOptions })
                          }}
                          className="mt-2"
                        />
                        <input
                          type="text"
                          value={option.label}
                          onChange={(e) => {
                            const newOptions = [...editingQuestion.options]
                            newOptions[idx].label = e.target.value
                            setEditingQuestion({ ...editingQuestion, options: newOptions })
                          }}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuestion({
                              ...editingQuestion,
                              options: editingQuestion.options.filter((_, i) => i !== idx)
                            })
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Check the box(es) for correct answer(s)</p>
                </div>
              )}

              {/* Info message for text questions - no options needed */}
              {(editingQuestion.type === 'short_text' || editingQuestion.type === 'long_text') && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">Manual Grading Required</h4>
                      <p className="text-sm text-blue-800">
                        Text questions don't have predefined correct answers. You will review and grade each student's response manually after they submit the test.
                      </p>
                      <p className="text-sm text-blue-700 mt-2">
                        <strong>Tip:</strong> Use the "Explanation" field above to write grading criteria or a rubric for yourself.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Options for True/False */}
              {editingQuestion.type === 'true_false' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
                  <div className="space-y-2">
                    {['True', 'False'].map((value, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="true_false"
                          checked={editingQuestion.options[idx]?.is_correct || false}
                          onChange={() => {
                            setEditingQuestion({
                              ...editingQuestion,
                              options: [
                                { label: 'True', is_correct: value === 'True', order_index: 0 },
                                { label: 'False', is_correct: value === 'False', order_index: 1 }
                              ]
                            })
                          }}
                          className="h-4 w-4"
                        />
                        <label className="text-gray-900">{value}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Correct answer for Number questions */}
              {editingQuestion.type === 'number' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer *</label>
                    <input
                      type="number"
                      step="any"
                      value={editingQuestion.options[0]?.label || ''}
                      onChange={(e) => {
                        setEditingQuestion({
                          ...editingQuestion,
                          options: [{ label: e.target.value, is_correct: true, order_index: 0 }]
                        })
                      }}
                      placeholder="Enter the correct numerical answer"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tolerance (optional)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editingQuestion.tolerance_numeric || ''}
                      onChange={(e) => {
                        setEditingQuestion({
                          ...editingQuestion,
                          tolerance_numeric: e.target.value ? parseFloat(e.target.value) : undefined
                        })
                      }}
                      placeholder="e.g., 0.1 (accepts answer ± 0.1)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Allow answers within ±N of the correct value
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveQuestion}
                disabled={saving || !editingQuestion.prompt}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Question'}
              </button>
              <button
                onClick={() => {
                  setShowQuestionForm(false)
                  setEditingQuestion(null)
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
