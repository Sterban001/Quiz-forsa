'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

interface Question {
  id: string
  type: string
  prompt: string
  points: number
  order_index: number
  question_options: Array<{
    id: string
    label: string
    order_index: number
  }>
}

export default function TakeTestPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const testId = params.id as string
  const attemptId = searchParams.get('attempt')

  const [test, setTest] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!attemptId) {
      alert('Invalid attempt')
      router.push(`/dashboard/tests/${testId}`)
      return
    }
    loadTest()
  }, [])

  useEffect(() => {
    if (timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmitTest()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining])

  const loadTest = async () => {
    try {
      // Load test
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .select('*')
        .eq('id', testId)
        .single()

      if (testError) throw testError
      setTest(testData)
      setTimeRemaining(testData.time_limit_minutes * 60)

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select(`
          *,
          question_options (*)
        `)
        .eq('test_id', testId)
        .order('order_index')

      if (questionsError) throw questionsError

      let processedQuestions = questionsData.map((q: any) => ({
        ...q,
        question_options: q.question_options.sort((a: any, b: any) => a.order_index - b.order_index),
      }))

      // Shuffle questions if enabled
      if (testData.shuffle_questions) {
        processedQuestions = processedQuestions.sort(() => Math.random() - 0.5)
      }

      setQuestions(processedQuestions)
    } catch (error: any) {
      console.error('Error loading test:', error)
      alert('Failed to load test')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers({
      ...answers,
      [questionId]: value,
    })
  }

  const handleSubmitTest = async () => {
    if (submitting) return

    if (!confirm('Are you sure you want to submit your test?')) return

    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Save all answers
      const answersToInsert = Object.entries(answers).map(([questionId, answer]) => {
        const question = questions.find((q) => q.id === questionId)
        let responseJson: any = {}

        if (question?.type === 'mcq_single' || question?.type === 'true_false') {
          responseJson = { selected: answer }
        } else if (question?.type === 'mcq_multi') {
          responseJson = { selected: answer }
        } else if (question?.type === 'short_text' || question?.type === 'long_text') {
          responseJson = { text: answer }
        } else if (question?.type === 'number') {
          responseJson = { value: parseFloat(answer) || 0 }
        }

        return {
          attempt_id: attemptId,
          question_id: questionId,
          response_json: responseJson,
        }
      })

      console.log('Answers to insert:', answersToInsert)

      // Delete existing answers (in case of re-submission)
      const { error: deleteError } = await supabase
        .from('attempt_answers')
        .delete()
        .eq('attempt_id', attemptId)

      if (deleteError) {
        console.error('Delete error:', deleteError)
      }

      // Insert new answers
      if (answersToInsert.length > 0) {
        console.log('Inserting', answersToInsert.length, 'answers')
        const { data: insertData, error: answersError } = await supabase
          .from('attempt_answers')
          .insert(answersToInsert)
          .select()

        console.log('Insert result:', { data: insertData, error: answersError })

        if (answersError) {
          console.error('Insert error details:', answersError)
          throw answersError
        }
      } else {
        console.warn('No answers to insert!')
      }

      // Mark attempt as submitted
      const { error: updateError } = await supabase
        .from('attempts')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', attemptId)

      if (updateError) throw updateError

      // Only call scoring function for auto-graded tests
      // Manual-graded tests will be scored by admin later
      if (test.test_type === 'auto_graded') {
        const { error: scoreError } = await supabase.rpc('calculate_attempt_score', {
          attempt_id_param: attemptId,
        })

        if (scoreError) {
          console.error('Scoring error:', scoreError)
        }
      }

      router.push(`/dashboard/tests/${testId}/result?attempt=${attemptId}`)
    } catch (error: any) {
      console.error('Error submitting test:', error)
      alert(`Failed to submit test: ${error.message || error}`)
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading test...</div>
      </div>
    )
  }

  if (!test || questions.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
        Test not available
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
            <p className="text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${
              timeRemaining < 300 ? 'text-red-600' : 'text-gray-900'
            }`}>
              {formatTime(timeRemaining)}
            </div>
            <div className="text-sm text-gray-600">Time Remaining</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
              {currentQuestion.type.replace('_', ' ').toUpperCase()}
            </span>
            <span className="text-gray-600 text-sm">{currentQuestion.points} points</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{currentQuestion.prompt}</h2>
        </div>

        {/* Answer Options */}
        <div className="space-y-3">
          {currentQuestion.type === 'mcq_single' && (
            <>
              {currentQuestion.question_options.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors"
                >
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    value={option.id}
                    checked={answers[currentQuestion.id] === option.id}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 text-gray-900">{option.label}</span>
                </label>
              ))}
            </>
          )}

          {currentQuestion.type === 'mcq_multi' && (
            <>
              {currentQuestion.question_options.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors"
                >
                  <input
                    type="checkbox"
                    value={option.id}
                    checked={answers[currentQuestion.id]?.includes(option.id) || false}
                    onChange={(e) => {
                      const currentAnswers = answers[currentQuestion.id] || []
                      if (e.target.checked) {
                        handleAnswerChange(currentQuestion.id, [...currentAnswers, option.id])
                      } else {
                        handleAnswerChange(
                          currentQuestion.id,
                          currentAnswers.filter((id: string) => id !== option.id)
                        )
                      }
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 text-gray-900">{option.label}</span>
                </label>
              ))}
            </>
          )}

          {currentQuestion.type === 'true_false' && (
            <>
              {currentQuestion.question_options.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors"
                >
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    value={option.id}
                    checked={answers[currentQuestion.id] === option.id}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 text-gray-900">{option.label}</span>
                </label>
              ))}
            </>
          )}

          {currentQuestion.type === 'short_text' && (
            <input
              type="text"
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Type your answer..."
            />
          )}

          {currentQuestion.type === 'long_text' && (
            <textarea
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Type your answer..."
            />
          )}

          {currentQuestion.type === 'number' && (
            <input
              type="number"
              step="any"
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Enter a number..."
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center gap-4">
        <button
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        <div className="flex gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                index === currentQuestionIndex
                  ? 'bg-blue-600 text-white'
                  : answers[questions[index].id]
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmitTest}
            disabled={submitting}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}
