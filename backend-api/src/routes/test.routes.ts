import { Router } from 'express'
import { supabase, supabaseAdmin } from '../config/supabase'
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.middleware'
import { createLimiter } from '../middleware/rateLimit.middleware'
import { parsePaginationParams, getSupabaseRange, paginateResponse } from '../utils/pagination'
import { validate, validateUuid } from '../middleware/validate.middleware'
import { createTestSchema, updateTestSchema } from '../validators/test.validator'

const router = Router()

// Get all tests (with filters and pagination)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { status, visibility, category } = req.query
    const { page, limit } = parsePaginationParams(req.query)
    const [from, to] = getSupabaseRange(page, limit)
    const isAdmin = req.user!.role === 'admin'

    let query = supabase
      .from('tests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    // Apply filters
    if (status) query = query.eq('status', status)
    if (visibility) query = query.eq('visibility', visibility)
    if (category) query = query.eq('category', category)

    // Non-admins can only see published tests
    if (!isAdmin) {
      query = query.eq('status', 'published')
    }

    const { data, error, count } = await query

    if (error) throw error

    const paginatedData = paginateResponse(data || [], page, limit, count || 0)
    return res.json({ success: true, ...paginatedData })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

// Get single test
router.get('/:id', authenticate, validateUuid('id'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const isAdmin = req.user!.role === 'admin'

    let query = supabase
      .from('tests')
      .select('*, questions(*, question_options(*))')
      .eq('id', id)
      .single()

    const { data, error } = await query

    if (error) throw error

    // Check visibility
    if (!isAdmin && data.status !== 'published') {
      return res.status(403).json({
        success: false,
        error: { message: 'Test not available' }
      })
    }

    return res.json({ success: true, data })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

// Create test (admin only)
router.post('/', authenticate, requireAdmin, createLimiter, validate(createTestSchema), async (req: AuthRequest, res) => {
  try {
    const testData = {
      ...req.body,
      created_by: req.user!.id
    }

    const { data, error } = await supabaseAdmin
      .from('tests')
      .insert(testData)
      .select()
      .single()

    if (error) throw error

    return res.status(201).json({ success: true, data })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

// Update test (admin only)
router.put('/:id', authenticate, requireAdmin, createLimiter, validateUuid('id'), validate(updateTestSchema), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const updateData = { ...req.body }

    const { data, error } = await supabaseAdmin
      .from('tests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return res.json({ success: true, data })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

// Delete test (admin only)
router.delete('/:id', authenticate, requireAdmin, validateUuid('id'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('tests')
      .delete()
      .eq('id', id)

    if (error) throw error

    return res.json({ success: true, data: { message: 'Test deleted successfully' } })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

// Clone test (admin only)
router.post('/:id/clone', authenticate, requireAdmin, createLimiter, validateUuid('id'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    // Get original test with questions
    const { data: originalTest, error: fetchError } = await supabase
      .from('tests')
      .select('*, questions(*, question_options(*))')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Create new test
    const { questions, ...testData } = originalTest
    const newTestData = {
      ...testData,
      id: undefined,
      title: `${testData.title} (Copy)`,
      status: 'draft',
      created_by: req.user!.id,
      created_at: undefined,
      updated_at: undefined
    }

    const { data: newTest, error: createError } = await supabaseAdmin
      .from('tests')
      .insert(newTestData)
      .select()
      .single()

    if (createError) throw createError

    // Clone questions
    if (questions && questions.length > 0) {
      for (const question of questions) {
        const { question_options, ...questionData } = question
        const newQuestionData = {
          ...questionData,
          id: undefined,
          test_id: newTest.id,
          created_at: undefined,
          updated_at: undefined
        }

        const { data: newQuestion, error: questionError } = await supabaseAdmin
          .from('questions')
          .insert(newQuestionData)
          .select()
          .single()

        if (questionError) throw questionError

        // Clone options
        if (question_options && question_options.length > 0) {
          const newOptions = question_options.map((opt: any) => ({
            ...opt,
            id: undefined,
            question_id: newQuestion.id,
            created_at: undefined,
            updated_at: undefined
          }))

          const { error: optionsError } = await supabaseAdmin
            .from('question_options')
            .insert(newOptions)

          if (optionsError) throw optionsError
        }
      }
    }

    return res.status(201).json({ success: true, data: newTest })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

// Release results for entire test (admin only)
router.post('/:id/release-results', authenticate, requireAdmin, validateUuid('id'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    // Update test to mark results as released
    const { error: testError } = await supabaseAdmin
      .from('tests')
      .update({
        results_released: true,
        results_release_date: new Date().toISOString()
      })
      .eq('id', id)

    if (testError) throw testError

    // Update all submitted attempts for this test to graded status
    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from('attempts')
      .update({ status: 'graded' })
      .eq('test_id', id)
      .eq('status', 'submitted')
      .select()

    if (attemptsError) throw attemptsError

    return res.json({
      success: true,
      data: {
        message: 'Results released successfully',
        affected_attempts: attempts?.length || 0
      }
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

// Release results for individual attempt (admin only)
router.post('/attempts/:attemptId/release-result', authenticate, requireAdmin, validateUuid('attemptId'), async (req: AuthRequest, res) => {
  try {
    const { attemptId } = req.params

    // Update attempt status to graded
    const { data: attempt, error } = await supabaseAdmin
      .from('attempts')
      .update({ status: 'graded' })
      .eq('id', attemptId)
      .eq('status', 'submitted')
      .select()
      .single()

    if (error) throw error

    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: { message: 'Attempt not found or already graded' }
      })
    }

    return res.json({
      success: true,
      data: {
        message: 'Result released successfully',
        attempt
      }
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

export default router


