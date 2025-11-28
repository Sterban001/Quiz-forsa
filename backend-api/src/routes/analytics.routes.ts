import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.middleware'

const router = Router()

// Get dashboard statistics (admin only)
router.get('/dashboard', authenticate, requireAdmin, async (_req: AuthRequest, res) => {
  try {
    // Get counts
    const [testsCount, attemptsCount, usersCount] = await Promise.all([
      supabase.from('tests').select('id', { count: 'exact', head: true }),
      supabase.from('attempts').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true })
    ])

    // Get average score
    const { data: avgScoreData } = await supabase
      .from('attempts')
      .select('score, max_score')
      .eq('status', 'submitted')

    let avgScore = 0
    if (avgScoreData && avgScoreData.length > 0) {
      const totalPercentage = avgScoreData.reduce((sum, attempt) => {
        return sum + (attempt.max_score > 0 ? (attempt.score / attempt.max_score) * 100 : 0)
      }, 0)
      avgScore = totalPercentage / avgScoreData.length
    }

    // Get recent attempts
    const { data: recentAttempts } = await supabase
      .from('attempts')
      .select('*, tests(title), profiles(display_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(10)

    return res.json({
      success: true,
      data: {
        totalTests: testsCount.count || 0,
        totalAttempts: attemptsCount.count || 0,
        totalUsers: usersCount.count || 0,
        avgScore: Math.round(avgScore),
        recentAttempts
      }
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

// Get test statistics (admin only)
router.get('/tests', authenticate, requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('test_statistics')
      .select('*')

    if (error) throw error

    return res.json({ success: true, data })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})

// Get leaderboard for a test
router.get('/leaderboard/:testId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { testId } = req.params

    const { data, error } = await supabase
      .from('leaderboards')
      .select('*, profiles(display_name, avatar_url)')
      .eq('test_id', testId)
      .order('best_score', { ascending: false })
      .limit(100)

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
