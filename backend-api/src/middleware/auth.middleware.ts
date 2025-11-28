import { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/supabase'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'No token provided' }
      })
    }

    const token = authHeader.substring(7)

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired token' }
      })
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return res.status(403).json({
        success: false,
        error: { message: 'User profile not found' }
      })
    }

    req.user = {
      id: user.id,
      email: user.email!,
      role: profile.role
    }

    return next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(500).json({
      success: false,
      error: { message: 'Authentication failed' }
    })
  }
}

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: { message: 'Admin access required' }
    })
  }
  return next()
}
