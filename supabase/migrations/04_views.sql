-- Quiz Platform Database Schema
-- Migration 04: Analytics Views
-- This creates database views for analytics and reporting

-- ============================================================================
-- VIEW: test_statistics
-- ============================================================================
-- Aggregated statistics per test including attempts, scores, and pass rates

CREATE OR REPLACE VIEW test_statistics AS
SELECT
  t.id as test_id,
  t.title,
  t.category,
  t.status,
  t.created_by,
  t.created_at,

  -- Attempt counts
  COUNT(DISTINCT a.id) as total_attempts,
  COUNT(DISTINCT CASE WHEN a.status IN ('submitted', 'graded') THEN a.id END) as completed_attempts,
  COUNT(DISTINCT a.user_id) as unique_users,

  -- Score statistics
  ROUND(AVG(CASE WHEN a.status IN ('submitted', 'graded') THEN a.score END), 2) as avg_score,
  MAX(CASE WHEN a.status IN ('submitted', 'graded') THEN a.score END) as max_score_achieved,
  MIN(CASE WHEN a.status IN ('submitted', 'graded') THEN a.score END) as min_score_achieved,

  -- Time statistics
  ROUND(AVG(CASE WHEN a.status IN ('submitted', 'graded') THEN a.duration_seconds END), 0) as avg_duration_seconds,
  MIN(CASE WHEN a.status IN ('submitted', 'graded') THEN a.duration_seconds END) as min_duration_seconds,
  MAX(CASE WHEN a.status IN ('submitted', 'graded') THEN a.duration_seconds END) as max_duration_seconds,

  -- Pass rate calculation
  ROUND(
    COUNT(DISTINCT CASE
      WHEN a.status IN ('submitted', 'graded')
      AND (a.score::NUMERIC / NULLIF(a.max_score, 0) * 100) >= t.pass_score
      THEN a.id
    END)::NUMERIC /
    NULLIF(COUNT(DISTINCT CASE WHEN a.status IN ('submitted', 'graded') THEN a.id END), 0) * 100,
    2
  ) as pass_rate_percentage,

  -- Question count
  (SELECT COUNT(*) FROM questions WHERE test_id = t.id) as total_questions,

  -- Last attempt timestamp
  MAX(a.submitted_at) as last_attempt_at

FROM tests t
LEFT JOIN attempts a ON t.id = a.test_id
GROUP BY t.id, t.title, t.category, t.status, t.created_by, t.created_at, t.pass_score;

COMMENT ON VIEW test_statistics IS 'Aggregated test performance metrics including attempts, scores, and pass rates';

-- ============================================================================
-- VIEW: question_difficulty
-- ============================================================================
-- Performance metrics per question to identify difficulty level

CREATE OR REPLACE VIEW question_difficulty AS
SELECT
  q.id as question_id,
  q.test_id,
  q.type,
  q.prompt,
  q.points,
  q.order_index,

  -- Response statistics
  COUNT(aa.id) as total_responses,
  COUNT(CASE WHEN aa.is_correct = TRUE THEN 1 END) as correct_responses,
  COUNT(CASE WHEN aa.is_correct = FALSE THEN 1 END) as incorrect_responses,
  COUNT(CASE WHEN aa.is_correct IS NULL THEN 1 END) as pending_manual_grade,

  -- Correct percentage
  ROUND(
    COUNT(CASE WHEN aa.is_correct = TRUE THEN 1 END)::NUMERIC /
    NULLIF(COUNT(CASE WHEN aa.is_correct IS NOT NULL THEN 1 END), 0) * 100,
    2
  ) as correct_percentage,

  -- Time statistics
  ROUND(AVG(aa.time_spent_seconds), 0) as avg_time_seconds,
  MIN(aa.time_spent_seconds) as min_time_seconds,
  MAX(aa.time_spent_seconds) as max_time_seconds,

  -- Points statistics
  ROUND(AVG(aa.awarded_points), 2) as avg_points_awarded,

  -- Difficulty classification based on correct percentage
  CASE
    WHEN COUNT(CASE WHEN aa.is_correct IS NOT NULL THEN 1 END) < 5 THEN 'insufficient_data'
    WHEN ROUND(
      COUNT(CASE WHEN aa.is_correct = TRUE THEN 1 END)::NUMERIC /
      NULLIF(COUNT(CASE WHEN aa.is_correct IS NOT NULL THEN 1 END), 0) * 100,
      2
    ) >= 80 THEN 'easy'
    WHEN ROUND(
      COUNT(CASE WHEN aa.is_correct = TRUE THEN 1 END)::NUMERIC /
      NULLIF(COUNT(CASE WHEN aa.is_correct IS NOT NULL THEN 1 END), 0) * 100,
      2
    ) >= 50 THEN 'medium'
    ELSE 'hard'
  END as difficulty_level

FROM questions q
LEFT JOIN attempt_answers aa ON q.id = aa.question_id
GROUP BY q.id, q.test_id, q.type, q.prompt, q.points, q.order_index;

COMMENT ON VIEW question_difficulty IS 'Question performance metrics with difficulty classification';

-- ============================================================================
-- VIEW: user_performance
-- ============================================================================
-- Per-user statistics across all tests

CREATE OR REPLACE VIEW user_performance AS
SELECT
  p.id as user_id,
  p.display_name,
  p.role,

  -- Attempt statistics
  COUNT(DISTINCT a.id) as total_attempts,
  COUNT(DISTINCT CASE WHEN a.status IN ('submitted', 'graded') THEN a.id END) as completed_attempts,
  COUNT(DISTINCT a.test_id) as unique_tests_attempted,

  -- Score statistics
  ROUND(AVG(CASE WHEN a.status IN ('submitted', 'graded') THEN a.score END), 2) as avg_score,
  MAX(CASE WHEN a.status IN ('submitted', 'graded') THEN a.score END) as best_score,

  -- Time statistics
  ROUND(AVG(CASE WHEN a.status IN ('submitted', 'graded') THEN a.duration_seconds END), 0) as avg_duration_seconds,

  -- Pass statistics
  COUNT(DISTINCT CASE
    WHEN a.status IN ('submitted', 'graded')
    AND (a.score::NUMERIC / NULLIF(a.max_score, 0) * 100) >= (SELECT pass_score FROM tests WHERE id = a.test_id)
    THEN a.id
  END) as tests_passed,

  COUNT(DISTINCT CASE
    WHEN a.status IN ('submitted', 'graded')
    AND (a.score::NUMERIC / NULLIF(a.max_score, 0) * 100) < (SELECT pass_score FROM tests WHERE id = a.test_id)
    THEN a.id
  END) as tests_failed,

  -- Pass rate
  ROUND(
    COUNT(DISTINCT CASE
      WHEN a.status IN ('submitted', 'graded')
      AND (a.score::NUMERIC / NULLIF(a.max_score, 0) * 100) >= (SELECT pass_score FROM tests WHERE id = a.test_id)
      THEN a.id
    END)::NUMERIC /
    NULLIF(COUNT(DISTINCT CASE WHEN a.status IN ('submitted', 'graded') THEN a.id END), 0) * 100,
    2
  ) as pass_rate_percentage,

  -- Leaderboard positions
  COUNT(DISTINCT l.id) as leaderboard_entries,

  -- Timestamps
  MIN(a.started_at) as first_attempt_at,
  MAX(a.submitted_at) as last_attempt_at

FROM profiles p
LEFT JOIN attempts a ON p.id = a.user_id
LEFT JOIN leaderboards l ON p.id = l.user_id
WHERE p.role = 'user' -- Only students, not admins
GROUP BY p.id, p.display_name, p.role;

COMMENT ON VIEW user_performance IS 'Per-user performance statistics across all tests';

-- ============================================================================
-- VIEW: recent_attempts
-- ============================================================================
-- Most recent test attempts with user and test details

CREATE OR REPLACE VIEW recent_attempts AS
SELECT
  a.id as attempt_id,
  a.test_id,
  t.title as test_title,
  t.category as test_category,
  a.user_id,
  p.display_name as user_name,
  a.status,
  a.score,
  a.max_score,
  ROUND((a.score::NUMERIC / NULLIF(a.max_score, 0) * 100), 2) as percentage,
  CASE
    WHEN (a.score::NUMERIC / NULLIF(a.max_score, 0) * 100) >= t.pass_score THEN true
    ELSE false
  END as passed,
  a.duration_seconds,
  a.attempt_no,
  a.started_at,
  a.submitted_at,
  a.created_at

FROM attempts a
JOIN tests t ON a.test_id = t.id
JOIN profiles p ON a.user_id = p.id
WHERE a.status IN ('submitted', 'graded')
ORDER BY a.submitted_at DESC;

COMMENT ON VIEW recent_attempts IS 'Recent test submissions with calculated percentages and pass/fail status';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant SELECT access to authenticated users
GRANT SELECT ON test_statistics TO authenticated;
GRANT SELECT ON question_difficulty TO authenticated;
GRANT SELECT ON user_performance TO authenticated;
GRANT SELECT ON recent_attempts TO authenticated;

-- Admins can see all, users can only see their own data
-- RLS policies on base tables will still apply when views are queried
