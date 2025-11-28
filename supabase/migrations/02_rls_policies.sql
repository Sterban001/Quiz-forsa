-- Quiz Platform Database Schema
-- Migration 02: Row Level Security Policies
-- This sets up RLS policies to control data access at the database level

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Anyone can read profiles (for leaderboards, display names, etc.)
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users cannot change their own role
CREATE POLICY "profiles_update_no_role_change"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- ============================================================================
-- TESTS POLICIES
-- ============================================================================

-- Users can read tests they have access to (via helper function)
CREATE POLICY "tests_select_available"
  ON tests FOR SELECT
  USING (is_test_available_to_user(id, auth.uid()));

-- Admins can perform all operations on tests
CREATE POLICY "tests_all_admin"
  ON tests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- SECTIONS POLICIES
-- ============================================================================

-- Users can read sections of tests they have access to
CREATE POLICY "sections_select_available"
  ON sections FOR SELECT
  USING (is_test_available_to_user(test_id, auth.uid()));

-- Admins can manage sections
CREATE POLICY "sections_all_admin"
  ON sections FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- QUESTIONS POLICIES
-- ============================================================================

-- Users can read questions of tests they have access to
CREATE POLICY "questions_select_available"
  ON questions FOR SELECT
  USING (is_test_available_to_user(test_id, auth.uid()));

-- Admins can manage questions
CREATE POLICY "questions_all_admin"
  ON questions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- QUESTION OPTIONS POLICIES
-- ============================================================================

-- Users can read options of questions they have access to
CREATE POLICY "question_options_select_available"
  ON question_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM questions q
      WHERE q.id = question_id
      AND is_test_available_to_user(q.test_id, auth.uid())
    )
  );

-- Admins can manage question options
CREATE POLICY "question_options_all_admin"
  ON question_options FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- ATTEMPTS POLICIES
-- ============================================================================

-- Users can read their own attempts
CREATE POLICY "attempts_select_own"
  ON attempts FOR SELECT
  USING (user_id = auth.uid());

-- Admins can read all attempts
CREATE POLICY "attempts_select_admin"
  ON attempts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can create attempts for tests they have access to
CREATE POLICY "attempts_insert_user"
  ON attempts FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND is_test_available_to_user(test_id, auth.uid())
    AND (
      -- Check max attempts limit
      (SELECT COUNT(*) FROM attempts
       WHERE test_id = attempts.test_id
       AND user_id = auth.uid()
       AND status IN ('submitted', 'graded')) <
      (SELECT max_attempts FROM tests WHERE id = attempts.test_id)
    )
  );

-- Users can update their own in-progress attempts
CREATE POLICY "attempts_update_own"
  ON attempts FOR UPDATE
  USING (user_id = auth.uid() AND status = 'in_progress')
  WITH CHECK (user_id = auth.uid());

-- Admins can update any attempt (for manual grading)
CREATE POLICY "attempts_update_admin"
  ON attempts FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- ATTEMPT ANSWERS POLICIES
-- ============================================================================

-- Users can read their own answers
CREATE POLICY "attempt_answers_select_own"
  ON attempt_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM attempts
      WHERE id = attempt_id
      AND user_id = auth.uid()
    )
  );

-- Admins can read all answers
CREATE POLICY "attempt_answers_select_admin"
  ON attempt_answers FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can insert answers for their own in-progress attempts
CREATE POLICY "attempt_answers_insert_own"
  ON attempt_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM attempts
      WHERE id = attempt_id
      AND user_id = auth.uid()
      AND status = 'in_progress'
    )
  );

-- Users can update answers in their own in-progress attempts
CREATE POLICY "attempt_answers_update_own"
  ON attempt_answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM attempts
      WHERE id = attempt_id
      AND user_id = auth.uid()
      AND status = 'in_progress'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM attempts
      WHERE id = attempt_id
      AND user_id = auth.uid()
      AND status = 'in_progress'
    )
  );

-- Admins can update any answer (for manual grading)
CREATE POLICY "attempt_answers_update_admin"
  ON attempt_answers FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- TEST WHITELIST POLICIES
-- ============================================================================

-- Users can read their own whitelist entries
CREATE POLICY "test_whitelist_select_own"
  ON test_whitelist FOR SELECT
  USING (user_id = auth.uid());

-- Admins can manage all whitelist entries
CREATE POLICY "test_whitelist_all_admin"
  ON test_whitelist FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- LEADERBOARDS POLICIES
-- ============================================================================

-- Users can read leaderboards for public/unlisted tests
CREATE POLICY "leaderboards_select_public"
  ON leaderboards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tests
      WHERE id = test_id
      AND (visibility IN ('public', 'unlisted') OR visibility = 'private')
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Leaderboards are updated via the calculate_attempt_score function
-- No direct user insert/update policies needed
-- The function uses SECURITY DEFINER to bypass RLS
