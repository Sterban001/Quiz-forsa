import { Router } from 'express'
import { supabase, supabaseAdmin } from '../config/supabase'
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.middleware'
import { validate, validateUuid } from '../middleware/validate.middleware'
import { createQuestionSchema, updateQuestionSchema } from '../validators/question.validator'
import { sanitizeText } from '../utils/sanitize'

const router = Router()

// Get all questions for a test
router.get('/test/:testId', authenticate, validateUuid('testId'), async (req: AuthRequest, res) => {
  try {
    const { testId } = req.params

    const { data, error } = await supabase
      .from('questions')
      .select('*, question_options(*)')
      .eq('test_id', testId)
      .order('order_index', { ascending: true })

    if (error) throw error

    return res.json({ success: true, data })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

// Create question (admin only)
router.post('/', authenticate, requireAdmin, validate(createQuestionSchema), async (req: AuthRequest, res) => {
  try {
    const { options, ...questionData } = req.body

    // Sanitize user-generated content to prevent XSS
    questionData.prompt = sanitizeText(questionData.prompt)
    if (questionData.explanation) {
      questionData.explanation = sanitizeText(questionData.explanation)
    }

    const { data: question, error: questionError } = await supabaseAdmin
      .from('questions')
      .insert(questionData)
      .select()
      .single()

    if (questionError) throw questionError

    // Insert options if provided
    if (options && options.length > 0) {
      // Sanitize each option label
      const optionsData = options.map((opt: any) => ({
        ...opt,
        label: sanitizeText(opt.label),
        question_id: question.id
      }))

      const { error: optionsError } = await supabaseAdmin
        .from('question_options')
        .insert(optionsData)

      if (optionsError) throw optionsError
    }

    // Fetch complete question with options
    const { data: completeQuestion } = await supabase
      .from('questions')
      .select('*, question_options(*)')
      .eq('id', question.id)
      .single()

    return res.status(201).json({ success: true, data: completeQuestion })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

// Update question (admin only)
router.put('/:id', authenticate, requireAdmin, validateUuid('id'), validate(updateQuestionSchema), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { options, ...questionData } = req.body

    // Sanitize user-generated content to prevent XSS
    if (questionData.prompt) {
      questionData.prompt = sanitizeText(questionData.prompt)
    }
    if (questionData.explanation) {
      questionData.explanation = sanitizeText(questionData.explanation)
    }

    const { error: questionError } = await supabaseAdmin
      .from('questions')
      .update(questionData)
      .eq('id', id)
      .select()
      .single()

    if (questionError) throw questionError

    // Update options if provided
    if (options) {
      // Delete existing options
      await supabaseAdmin
        .from('question_options')
        .delete()
        .eq('question_id', id)

      // Insert new options
      if (options.length > 0) {
        // Sanitize each option label
        const optionsData = options.map((opt: any) => ({
          ...opt,
          label: sanitizeText(opt.label),
          question_id: id
        }))

        const { error: optionsError } = await supabaseAdmin
          .from('question_options')
          .insert(optionsData)

        if (optionsError) throw optionsError
      }
    }

    // Fetch complete question with options
    const { data: completeQuestion } = await supabase
      .from('questions')
      .select('*, question_options(*)')
      .eq('id', id)
      .single()

    return res.json({ success: true, data: completeQuestion })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

// Delete question (admin only)
router.delete('/:id', authenticate, requireAdmin, validateUuid('id'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('questions')
      .delete()
      .eq('id', id)

    if (error) throw error

    return res.json({ success: true, data: { message: 'Question deleted successfully' } })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

export default router
