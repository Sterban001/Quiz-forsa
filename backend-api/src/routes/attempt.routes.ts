import { Router } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { authenticate, AuthRequest } from '../middleware/auth.middleware'
import { attemptLimiter } from '../middleware/rateLimit.middleware'
import { parsePaginationParams, getSupabaseRange, paginateResponse } from '../utils/pagination'
import { validate, validateUuid } from '../middleware/validate.middleware'
import { startAttemptSchema, saveAnswerSchema } from '../validators/attempt.validator'

const router = Router()

// Get all attempts (admin sees all, students see their own)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { page, limit } = parsePaginationParams(req.query)
    const [from, to] = getSupabaseRange(page, limit)
    const isAdmin = req.user!.role === 'admin'

    let query = supabaseAdmin
      .from('attempts')
      .select('*, tests(title, pass_score, results_released), profiles(display_name, avatar_url)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (!isAdmin) {
      query = query.eq('user_id', req.user!.id)
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

// Get single attempt with answers
router.get('/:id', authenticate, validateUuid('id'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const isAdmin = req.user!.role === 'admin'

    const { data: attempt, error } = await supabaseAdmin
      .from('attempts')
      .select(`
        *,
        tests(*),
        profiles(display_name, avatar_url),
        attempt_answers(
          *,
          questions(*, question_options(*))
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    // Check access
    if (!isAdmin && attempt.user_id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      })
    }

    // Hide results if not released (for non-admin users)
    if (!isAdmin && !attempt.tests.results_released && attempt.status === 'submitted') {
      // Return attempt with scores/answers hidden
      return res.json({
        success: true,
        data: {
          ...attempt,
          score: null,
          max_score: null,
          attempt_answers: null,
          results_pending: true
        }
      })
    }

    return res.json({ success: true, data: attempt })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

// Start attempt
router.post('/start', authenticate, attemptLimiter, validate(startAttemptSchema), async (req: AuthRequest, res) => {
  try {
    const { test_id } = req.body

    const attemptData = {
      test_id,
      user_id: req.user!.id,
      status: 'in_progress',
      started_at: new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('attempts')
      .insert(attemptData)
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

// Save answer
router.post('/:id/answer', authenticate, validateUuid('id'), validate(saveAnswerSchema), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { question_id, response_json, time_spent } = req.body

    // Verify attempt belongs to user
    const { data: attempt } = await supabaseAdmin
      .from('attempts')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!attempt || attempt.user_id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      })
    }

    const answerData = {
      attempt_id: id,
      question_id,
      response_json,
      time_spent
    }

    const { data, error } = await supabaseAdmin
      .from('attempt_answers')
      .upsert(answerData, {
        onConflict: 'attempt_id,question_id'
      })
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

// Submit attempt
router.post('/:id/submit', authenticate, validateUuid('id'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    // Verify attempt belongs to user and get test info
    const { data: attempt } = await supabaseAdmin
      .from('attempts')
      .select('user_id, test_id, tests(results_released)')
      .eq('id', id)
      .single()

    if (!attempt || attempt.user_id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      })
    }

    // Call scoring function
    const { error } = await supabaseAdmin.rpc('calculate_attempt_score', {
      p_attempt_id: id
    })

    if (error) throw error

    // Determine status based on results_released flag
    const test = attempt.tests as any
    const newStatus = test?.results_released ? 'graded' : 'submitted'

    // Update attempt status
    const { data: updatedAttempt, error: updateError } = await supabaseAdmin
      .from('attempts')
      .update({
        status: newStatus,
        submitted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    return res.json({ success: true, data: updatedAttempt })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

export default router

