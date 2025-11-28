-- Quiz Platform Database Schema
-- Migration 03: Functions and Triggers
-- This creates helper functions, triggers, and the scoring algorithm

-- ============================================================================
-- TRIGGER FUNCTION: handle_new_user
-- ============================================================================
-- Automatically creates a profile when a new user signs up via Supabase Auth

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (
    NEW.id,
    'user',
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Execute when new user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates profile for new Supabase Auth users';

-- ============================================================================
-- TRIGGER FUNCTION: update_updated_at_column
-- ============================================================================
-- Automatically updates the updated_at timestamp on row updates

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at column
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tests_updated_at
  BEFORE UPDATE ON tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attempt_answers_updated_at
  BEFORE UPDATE ON attempt_answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically sets updated_at to current timestamp';

-- ============================================================================
-- HELPER FUNCTION: is_test_available_to_user
-- ============================================================================
-- Determines if a user has access to view/take a test based on visibility,
-- scheduling, and whitelist rules

CREATE OR REPLACE FUNCTION is_test_available_to_user(
  test_id_param UUID,
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  test_record RECORD;
  user_role TEXT;
BEGIN
  -- Get test details
  SELECT * INTO test_record FROM tests WHERE id = test_id_param;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Get user role
  SELECT role INTO user_role FROM profiles WHERE id = user_id_param;

  -- Admins can see all tests regardless of status/visibility
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Test must be published for regular users
  IF test_record.status != 'published' THEN
    RETURN FALSE;
  END IF;

  -- Check if test has started
  IF test_record.start_at IS NOT NULL AND test_record.start_at > NOW() THEN
    RETURN FALSE;
  END IF;

  -- Check if test has ended
  IF test_record.end_at IS NOT NULL AND test_record.end_at < NOW() THEN
    RETURN FALSE;
  END IF;

  -- Public and unlisted tests are accessible
  IF test_record.visibility IN ('public', 'unlisted') THEN
    RETURN TRUE;
  END IF;

  -- Private tests require whitelist entry
  IF test_record.visibility = 'private' THEN
    RETURN EXISTS (
      SELECT 1 FROM test_whitelist
      WHERE test_whitelist.test_id = test_id_param
      AND test_whitelist.user_id = user_id_param
    );
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_test_available_to_user(UUID, UUID) IS 'Checks if user can access test based on visibility, scheduling, and whitelist';

-- ============================================================================
-- SCORING FUNCTION: calculate_attempt_score
-- ============================================================================
-- Automatically grades MCQ and numeric questions, applies negative marking,
-- and updates leaderboards

CREATE OR REPLACE FUNCTION calculate_attempt_score(p_attempt_id UUID)
RETURNS VOID AS $$
DECLARE
  total_score NUMERIC := 0;
  total_max_score NUMERIC := 0;
  v_test_id UUID;
  v_negative_marking BOOLEAN;
  answer_record RECORD;
  question_record RECORD;
BEGIN
  -- Get test settings
  SELECT a.test_id, t.negative_marking
  INTO v_test_id, v_negative_marking
  FROM attempts a
  JOIN tests t ON a.test_id = t.id
  WHERE a.id = p_attempt_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt not found: %', p_attempt_id;
  END IF;

  -- Calculate total max score
  SELECT COALESCE(SUM(points), 0) INTO total_max_score
  FROM questions
  WHERE test_id = v_test_id;

  -- Loop through all answers and calculate score
  FOR answer_record IN
    SELECT * FROM attempt_answers WHERE attempt_id = p_attempt_id
  LOOP
    -- Get question details
    SELECT * INTO question_record FROM questions WHERE id = answer_record.question_id;

    -- ========================================================================
    -- MCQ SINGLE & MULTI-CHOICE QUESTIONS
    -- ========================================================================
    IF question_record.type IN ('mcq_single', 'mcq_multi', 'true_false') THEN
      DECLARE
        correct_options UUID[];
        selected_options UUID[];
        answer_is_correct BOOLEAN := FALSE;
      BEGIN
        -- Get correct option IDs
        SELECT ARRAY_AGG(qo.id) INTO correct_options
        FROM question_options qo
        WHERE qo.question_id = question_record.id AND qo.is_correct = TRUE;

        -- Extract selected option(s) from JSON response
        IF question_record.type = 'mcq_single' OR question_record.type = 'true_false' THEN
          -- Single selection
          selected_options := ARRAY[((answer_record.response_json->>'selected')::UUID)];
        ELSE
          -- Multiple selections
          SELECT ARRAY_AGG(value::TEXT::UUID) INTO selected_options
          FROM jsonb_array_elements_text(answer_record.response_json->'selected');
        END IF;

        -- Check if arrays match exactly (all correct, no extra)
        answer_is_correct := (
          correct_options @> selected_options AND
          selected_options @> correct_options
        );

        IF answer_is_correct THEN
          -- Award full points
          UPDATE attempt_answers
          SET is_correct = TRUE, awarded_points = question_record.points
          WHERE id = answer_record.id;
          total_score := total_score + question_record.points;
        ELSE
          -- No points, apply negative marking if enabled
          UPDATE attempt_answers
          SET is_correct = FALSE, awarded_points = 0
          WHERE id = answer_record.id;

          IF v_negative_marking THEN
            total_score := total_score - (question_record.points * 0.25);
          END IF;
        END IF;
      END;

    -- ========================================================================
    -- NUMERIC QUESTIONS
    -- ========================================================================
    ELSIF question_record.type = 'number' THEN
      DECLARE
        correct_value NUMERIC;
        user_value NUMERIC;
        answer_is_correct BOOLEAN := FALSE;
      BEGIN
        -- Get correct numeric value from option label
        SELECT (qo.label::NUMERIC) INTO correct_value
        FROM question_options qo
        WHERE qo.question_id = question_record.id AND qo.is_correct = TRUE
        LIMIT 1;

        -- Extract user's numeric answer
        user_value := (answer_record.response_json->>'value')::NUMERIC;

        -- Check if answer is within tolerance
        IF question_record.tolerance_numeric IS NOT NULL THEN
          answer_is_correct := ABS(user_value - correct_value) <= question_record.tolerance_numeric;
        ELSE
          answer_is_correct := user_value = correct_value;
        END IF;

        IF answer_is_correct THEN
          UPDATE attempt_answers
          SET is_correct = TRUE, awarded_points = question_record.points
          WHERE id = answer_record.id;
          total_score := total_score + question_record.points;
        ELSE
          UPDATE attempt_answers
          SET is_correct = FALSE, awarded_points = 0
          WHERE id = answer_record.id;

          IF v_negative_marking THEN
            total_score := total_score - (question_record.points * 0.25);
          END IF;
        END IF;
      END;

    -- ========================================================================
    -- TEXT QUESTIONS (SHORT & LONG)
    -- ========================================================================
    -- Leave is_correct = NULL for manual grading by admin
    -- awarded_points remains 0 until admin grades
    END IF;
  END LOOP;

  -- Ensure score is never negative
  total_score := GREATEST(total_score, 0);

  -- Update attempt with calculated score
  UPDATE attempts
  SET
    score = total_score,
    max_score = total_max_score,
    status = 'graded'
  WHERE id = p_attempt_id;

  -- Update or insert leaderboard entry
  INSERT INTO leaderboards (test_id, user_id, best_score, best_time_seconds, attempt_count)
  SELECT
    test_id,
    user_id,
    score,
    duration_seconds,
    1
  FROM attempts
  WHERE id = p_attempt_id
  ON CONFLICT (test_id, user_id) DO UPDATE SET
    -- Update best score if this attempt scored higher
    best_score = CASE
      WHEN EXCLUDED.best_score > leaderboards.best_score THEN EXCLUDED.best_score
      ELSE leaderboards.best_score
    END,
    -- Update best time if scored higher or same score but faster
    best_time_seconds = CASE
      WHEN EXCLUDED.best_score > leaderboards.best_score THEN EXCLUDED.best_time_seconds
      WHEN EXCLUDED.best_score = leaderboards.best_score AND
           (leaderboards.best_time_seconds IS NULL OR EXCLUDED.best_time_seconds < leaderboards.best_time_seconds)
      THEN EXCLUDED.best_time_seconds
      ELSE leaderboards.best_time_seconds
    END,
    attempt_count = leaderboards.attempt_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_attempt_score(UUID) IS 'Auto-grades attempt, applies negative marking, updates leaderboard';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION is_test_available_to_user(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION calculate_attempt_score(UUID) TO authenticated, service_role;
