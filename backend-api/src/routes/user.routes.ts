import { Router } from 'express'
import { supabase, supabaseAdmin } from '../config/supabase'
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.middleware'
import { parsePaginationParams, getSupabaseRange, paginateResponse } from '../utils/pagination'
import { validateUuid } from '../middleware/validate.middleware'
import { updateUserSchema, adminUpdateUserSchema } from '../validators/user.validator'

const router = Router()

// Get all users (admin only, with pagination)
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { page, limit } = parsePaginationParams(req.query)
    const [from, to] = getSupabaseRange(page, limit)

    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

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

// Get user by ID (admin or self)
router.get('/:id', authenticate, validateUuid('id'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const isAdmin = req.user!.role === 'admin'

    // Check access
    if (!isAdmin && id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      })
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
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

// Update user profile
router.put('/:id', authenticate, validateUuid('id'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const isAdmin = req.user!.role === 'admin'

    // Check access
    if (!isAdmin && id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      })
    }

    // Validate with appropriate schema based on role
    const schema = isAdmin ? adminUpdateUserSchema : updateUserSchema
    const { error: validationError, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    })

    if (validationError) {
      const errors = validationError.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors }
      })
    }

    // Use admin client if admin is updating (to bypass RLS)
    const client = isAdmin ? supabaseAdmin : supabase
    const { data, error } = await client
      .from('profiles')
      .update(value)
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

export default router
