import { Router } from 'express'
import { supabase, supabaseAdmin } from '../config/supabase'
import { authenticate } from '../middleware/auth.middleware'
import { authLimiter, otpLimiter } from '../middleware/rateLimit.middleware'
import { validate } from '../middleware/validate.middleware'
import { loginSchema, sendOtpSchema, verifyOtpSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validator'

const router = Router()

// Login with email and password
router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return res.status(401).json({
        success: false,
        error: { message: error.message }
      })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    // Set secure HTTP-only cookie
    if (data.session?.access_token) {
      res.cookie('auth_token', data.session.access_token, {
        httpOnly: true,  // Prevents JavaScript access (XSS protection)
        secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
        sameSite: 'strict',  // CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
        path: '/'
      })
    }

    return res.json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
        profile
      }
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

// Google OAuth login
router.get('/google', async (req, res) => {
  try {
    // Determine redirect URL based on source parameter or referer
    const { source } = req.query
    const referer = req.headers.referer || req.headers.origin
    const adminUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const studentUrl = process.env.STUDENT_APP_URL || 'http://localhost:3005'

    let redirectUrl = adminUrl

    // Prioritize explicit source parameter
    if (source === 'student') {
      redirectUrl = studentUrl
    } else if (source === 'admin') {
      redirectUrl = adminUrl
    } else if (referer && (referer.includes(studentUrl) || referer.includes('localhost:3005'))) {
      // Fallback to referer check
      redirectUrl = studentUrl
    }

    // DEBUG: Log variables to Vercel Function Console
    console.log('--- OAUTH DEBUG ---')
    console.log(`Source Param: ${source}`)
    console.log(`Referer: ${referer}`)
    console.log(`Env STUDENT_APP_URL: ${process.env.STUDENT_APP_URL}`)
    console.log(`Env FRONTEND_URL: ${process.env.FRONTEND_URL}`)
    console.log(`Final Redirect Url: ${redirectUrl}`)
    console.log('-------------------')

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${redirectUrl}/auth/callback`
      }
    })

    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.message }
      })
    }

    // Redirect to Google OAuth
    return res.redirect(data.url)
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

// Send OTP
router.post('/otp/send', otpLimiter, validate(sendOtpSchema), async (req, res) => {
  try {
    const { email } = req.body

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true
      }
    })

    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.message }
      })
    }

    return res.json({
      success: true,
      data: { message: 'OTP sent successfully' }
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

// Verify OTP
router.post('/otp/verify', authLimiter, validate(verifyOtpSchema), async (req, res) => {
  try {
    const { email, token } = req.body

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })

    if (error) {
      return res.status(401).json({
        success: false,
        error: { message: error.message }
      })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user!.id)
      .single()

    // Set secure HTTP-only cookie
    if (data.session?.access_token) {
      res.cookie('auth_token', data.session.access_token, {
        httpOnly: true,  // Prevents JavaScript access (XSS protection)
        secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
        sameSite: 'strict',  // CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
        path: '/'
      })
    }

    return res.json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
        profile
      }
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

// Logout
router.post('/logout', authenticate, async (_req, res) => {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.message }
      })
    }

    // Clear the auth cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    })

    return res.json({
      success: true,
      data: { message: 'Logged out successfully' }
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const authReq = req as any

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authReq.user.id)
      .single()

    return res.json({
      success: true,
      data: {
        user: authReq.user,
        profile
      }
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

// Forgot password - send reset email
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), async (req, res) => {
  try {
    const { email } = req.body

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`
    })

    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.message }
      })
    }

    return res.json({
      success: true,
      data: { message: 'Password reset email sent successfully' }
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

// Reset password with token
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), async (req, res) => {
  try {
    const { password } = req.body

    // Get the access token from the Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'No access token provided' }
      })
    }

    const accessToken = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Create a Supabase client with the user's session
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired reset token' }
      })
    }

    // Update the user's password using the Admin API
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password }
    )

    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.message }
      })
    }

    return res.json({
      success: true,
      data: { message: 'Password reset successfully' }
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

export default router
