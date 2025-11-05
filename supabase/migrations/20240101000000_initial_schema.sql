-- Quiz Platform Database Schema
-- Complete schema with RLS policies for production

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================================
-- TABLES
-- ============================================================================

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);

-- Tests table
CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  cover_image_url TEXT,

  -- Timing
  time_limit_minutes INTEGER,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  per_question_time_seconds INTEGER,

  -- Access control
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private', 'unlisted')) DEFAULT 'public',
  access_code TEXT,

  -- Attempt rules
  max_attempts INTEGER NOT NULL DEFAULT 1,
  pass_score INTEGER NOT NULL DEFAULT 70,

  -- Question behavior
  negative_marking BOOLEAN NOT NULL DEFAULT FALSE,
  shuffle_questions BOOLEAN NOT NULL DEFAULT FALSE,
  show_correct_answers BOOLEAN NOT NULL DEFAULT TRUE,
  show_explanations BOOLEAN NOT NULL DEFAULT TRUE,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',

  -- Metadata
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tests_status ON tests(status);
CREATE INDEX idx_tests_visibility ON tests(visibility);
CREATE INDEX idx_tests_category ON tests(category);
CREATE INDEX idx_tests_created_by ON tests(created_by);
CREATE INDEX idx_tests_start_end ON tests(start_at, end_at);
CREATE INDEX idx_tests_tags ON tests USING GIN(tags);

-- Sections table (optional grouping)
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  per_section_time_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sections_test_id ON sections(test_id);
CREATE INDEX idx_sections_order ON sections(test_id, order_index);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE SET NULL,

  type TEXT NOT NULL CHECK (type IN ('mcq_single', 'mcq_multi', 'short_text', 'number')),
  prompt TEXT NOT NULL,
  explanation TEXT,

  order_index INTEGER NOT NULL DEFAULT 0,
  points NUMERIC NOT NULL DEFAULT 1,

  -- For number type questions
  tolerance_numeric NUMERIC,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_questions_test_id ON questions(test_id);
CREATE INDEX idx_questions_section_id ON questions(section_id);
CREATE INDEX idx_questions_type ON questions(type);
CREATE INDEX idx_questions_order ON questions(test_id, order_index);

-- Question options table (for MCQ)
CREATE TABLE question_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_question_options_question_id ON question_options(question_id);
CREATE INDEX idx_question_options_order ON question_options(question_id, order_index);

-- Attempts table
CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,

  score NUMERIC DEFAULT 0,
  max_score NUMERIC DEFAULT 0,

  status TEXT NOT NULL CHECK (status IN ('in_progress', 'submitted', 'graded')) DEFAULT 'in_progress',
  duration_seconds INTEGER DEFAULT 0,
  attempt_no INTEGER NOT NULL DEFAULT 1,

  -- Metadata
  device_info JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attempts_test_id ON attempts(test_id);
CREATE INDEX idx_attempts_user_id ON attempts(user_id);
CREATE INDEX idx_attempts_status ON attempts(status);
CREATE INDEX idx_attempts_user_test ON attempts(user_id, test_id);
CREATE INDEX idx_attempts_submitted ON attempts(submitted_at) WHERE submitted_at IS NOT NULL;

-- Attempt answers table
CREATE TABLE attempt_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

  -- Response stored as JSON for flexibility
  -- MCQ single: {"selected": "option_id"}
  -- MCQ multi: {"selected": ["option_id1", "option_id2"]}
  -- Short text: {"text": "answer"}
  -- Number: {"value": 42}
  response_json JSONB,

  -- Scoring
  is_correct BOOLEAN,
  awarded_points NUMERIC DEFAULT 0,

  -- Timing
  time_spent_seconds INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attempt_answers_attempt_id ON attempt_answers(attempt_id);
CREATE INDEX idx_attempt_answers_question_id ON attempt_answers(question_id);
CREATE INDEX idx_attempt_answers_is_correct ON attempt_answers(is_correct) WHERE is_correct IS NOT NULL;
CREATE UNIQUE INDEX idx_attempt_answers_unique ON attempt_answers(attempt_id, question_id);

-- Test whitelist (for private tests)
CREATE TABLE test_whitelist (
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES profiles(id),
  PRIMARY KEY (test_id, user_id)
);

CREATE INDEX idx_test_whitelist_user_id ON test_whitelist(user_id);

-- Leaderboards table
CREATE TABLE leaderboards (
  id SERIAL PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  best_score NUMERIC NOT NULL DEFAULT 0,
  best_time_seconds INTEGER,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(test_id, user_id)
);

CREATE INDEX idx_leaderboards_test_id ON leaderboards(test_id, best_score DESC);
CREATE INDEX idx_leaderboards_user_id ON leaderboards(user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to handle new user creation
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

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tests_updated_at BEFORE UPDATE ON tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attempt_answers_updated_at BEFORE UPDATE ON attempt_answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check test availability for user
CREATE OR REPLACE FUNCTION is_test_available_to_user(test_id_param UUID, user_id_param UUID)
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

  -- Admins can see all tests
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Test must be published
  IF test_record.status != 'published' THEN
    RETURN FALSE;
  END IF;

  -- Check timing
  IF test_record.start_at IS NOT NULL AND test_record.start_at > NOW() THEN
    RETURN FALSE;
  END IF;

  IF test_record.end_at IS NOT NULL AND test_record.end_at < NOW() THEN
    RETURN FALSE;
  END IF;

  -- Check visibility
  IF test_record.visibility = 'public' OR test_record.visibility = 'unlisted' THEN
    RETURN TRUE;
  END IF;

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

-- Function to calculate attempt score
CREATE OR REPLACE FUNCTION calculate_attempt_score(attempt_id_param UUID)
RETURNS VOID AS $$
DECLARE
  total_score NUMERIC := 0;
  total_max_score NUMERIC := 0;
  test_record RECORD;
  answer_record RECORD;
  question_record RECORD;
BEGIN
  -- Get test settings
  SELECT t.* INTO test_record
  FROM attempts a
  JOIN tests t ON a.test_id = t.id
  WHERE a.id = attempt_id_param;

  -- Calculate total max score
  SELECT COALESCE(SUM(points), 0) INTO total_max_score
  FROM questions
  WHERE test_id = test_record.id;

  -- Loop through answers and calculate score
  FOR answer_record IN
    SELECT * FROM attempt_answers WHERE attempt_id = attempt_id_param
  LOOP
    -- Get question details
    SELECT * INTO question_record FROM questions WHERE id = answer_record.question_id;

    -- Score based on question type
    IF question_record.type IN ('mcq_single', 'mcq_multi') THEN
      -- Get correct option IDs
      DECLARE
        correct_options UUID[];
        selected_options UUID[];
        is_correct BOOLEAN := FALSE;
      BEGIN
        SELECT ARRAY_AGG(id) INTO correct_options
        FROM question_options
        WHERE question_id = question_record.id AND is_correct = TRUE;

        IF question_record.type = 'mcq_single' THEN
          selected_options := ARRAY[((answer_record.response_json->>'selected')::UUID)];
        ELSE
          SELECT ARRAY_AGG(value::TEXT::UUID) INTO selected_options
          FROM jsonb_array_elements_text(answer_record.response_json->'selected');
        END IF;

        -- Check if arrays match
        is_correct := (correct_options @> selected_options AND selected_options @> correct_options);

        IF is_correct THEN
          UPDATE attempt_answers
          SET is_correct = TRUE, awarded_points = question_record.points
          WHERE id = answer_record.id;
          total_score := total_score + question_record.points;
        ELSE
          UPDATE attempt_answers
          SET is_correct = FALSE, awarded_points = 0
          WHERE id = answer_record.id;

          -- Apply negative marking if enabled
          IF test_record.negative_marking THEN
            total_score := total_score - (question_record.points * 0.25);
          END IF;
        END IF;
      END;

    ELSIF question_record.type = 'number' THEN
      -- Get correct answer from first option (stored as label)
      DECLARE
        correct_value NUMERIC;
        user_value NUMERIC;
        is_correct BOOLEAN := FALSE;
      BEGIN
        SELECT (label::NUMERIC) INTO correct_value
        FROM question_options
        WHERE question_id = question_record.id AND is_correct = TRUE
        LIMIT 1;

        user_value := (answer_record.response_json->>'value')::NUMERIC;

        -- Check with tolerance
        IF question_record.tolerance_numeric IS NOT NULL THEN
          is_correct := ABS(user_value - correct_value) <= question_record.tolerance_numeric;
        ELSE
          is_correct := user_value = correct_value;
        END IF;

        IF is_correct THEN
          UPDATE attempt_answers
          SET is_correct = TRUE, awarded_points = question_record.points
          WHERE id = answer_record.id;
          total_score := total_score + question_record.points;
        ELSE
          UPDATE attempt_answers
          SET is_correct = FALSE, awarded_points = 0
          WHERE id = answer_record.id;

          IF test_record.negative_marking THEN
            total_score := total_score - (question_record.points * 0.25);
          END IF;
        END IF;
      END;
    END IF;
    -- Short text answers remain with is_correct = NULL for manual grading
  END LOOP;

  -- Update attempt with calculated score
  UPDATE attempts
  SET score = GREATEST(total_score, 0), max_score = total_max_score, status = 'graded'
  WHERE id = attempt_id_param;

  -- Update leaderboard
  INSERT INTO leaderboards (test_id, user_id, best_score, best_time_seconds, attempt_count)
  SELECT
    test_id,
    user_id,
    score,
    duration_seconds,
    1
  FROM attempts
  WHERE id = attempt_id_param
  ON CONFLICT (test_id, user_id) DO UPDATE SET
    best_score = CASE
      WHEN EXCLUDED.best_score > leaderboards.best_score THEN EXCLUDED.best_score
      ELSE leaderboards.best_score
    END,
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

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
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

-- Users can read all profiles (for leaderboards, etc.)
CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- TESTS POLICIES
-- ============================================================================

-- Users can read tests they have access to
CREATE POLICY "Users can read available tests"
  ON tests FOR SELECT
  USING (
    is_test_available_to_user(id, auth.uid())
  );

-- Admins can do everything with tests
CREATE POLICY "Admins can manage tests"
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

-- Users can read sections of available tests
CREATE POLICY "Users can read sections of available tests"
  ON sections FOR SELECT
  USING (
    is_test_available_to_user(test_id, auth.uid())
  );

-- Admins can manage sections
CREATE POLICY "Admins can manage sections"
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

-- Users can read questions of available tests
CREATE POLICY "Users can read questions of available tests"
  ON questions FOR SELECT
  USING (
    is_test_available_to_user(test_id, auth.uid())
  );

-- Admins can manage questions
CREATE POLICY "Admins can manage questions"
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

-- Users can read options of available questions
CREATE POLICY "Users can read question options"
  ON question_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM questions q
      WHERE q.id = question_id
      AND is_test_available_to_user(q.test_id, auth.uid())
    )
  );

-- Admins can manage options
CREATE POLICY "Admins can manage question options"
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
CREATE POLICY "Users can read own attempts"
  ON attempts FOR SELECT
  USING (user_id = auth.uid());

-- Users can create attempts for available tests
CREATE POLICY "Users can create attempts"
  ON attempts FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND is_test_available_to_user(test_id, auth.uid())
    AND (
      -- Check max attempts
      (SELECT COUNT(*) FROM attempts
       WHERE test_id = attempts.test_id
       AND user_id = auth.uid()
       AND status = 'submitted') <
      (SELECT max_attempts FROM tests WHERE id = attempts.test_id)
    )
  );

-- Users can update their own in-progress attempts
CREATE POLICY "Users can update own in-progress attempts"
  ON attempts FOR UPDATE
  USING (user_id = auth.uid() AND status = 'in_progress')
  WITH CHECK (user_id = auth.uid());

-- Admins can read all attempts
CREATE POLICY "Admins can read all attempts"
  ON attempts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update attempts (for manual grading)
CREATE POLICY "Admins can update attempts"
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
CREATE POLICY "Users can read own answers"
  ON attempt_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM attempts
      WHERE id = attempt_id
      AND user_id = auth.uid()
    )
  );

-- Users can create answers for their attempts
CREATE POLICY "Users can create answers"
  ON attempt_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM attempts
      WHERE id = attempt_id
      AND user_id = auth.uid()
      AND status = 'in_progress'
    )
  );

-- Users can update their own in-progress answers
CREATE POLICY "Users can update own in-progress answers"
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

-- Admins can read all answers
CREATE POLICY "Admins can read all answers"
  ON attempt_answers FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update answers (for manual grading)
CREATE POLICY "Admins can update answers"
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
CREATE POLICY "Users can read own whitelist"
  ON test_whitelist FOR SELECT
  USING (user_id = auth.uid());

-- Admins can manage whitelist
CREATE POLICY "Admins can manage whitelist"
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

-- Everyone can read leaderboards for public tests
CREATE POLICY "Users can read leaderboards"
  ON leaderboards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tests
      WHERE id = test_id
      AND (visibility = 'public' OR visibility = 'unlisted')
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- System can insert/update leaderboards (via function)
-- No direct user policies needed as updates happen through calculate_attempt_score function

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- Test statistics view
CREATE OR REPLACE VIEW test_statistics AS
SELECT
  t.id as test_id,
  t.title,
  t.category,
  t.status,
  COUNT(DISTINCT a.id) as total_attempts,
  COUNT(DISTINCT CASE WHEN a.status = 'submitted' THEN a.id END) as completed_attempts,
  COUNT(DISTINCT a.user_id) as unique_users,
  ROUND(AVG(CASE WHEN a.status = 'submitted' THEN a.score END), 2) as avg_score,
  ROUND(AVG(CASE WHEN a.status = 'submitted' THEN a.duration_seconds END), 0) as avg_duration_seconds,
  ROUND(
    COUNT(DISTINCT CASE WHEN a.status = 'submitted' AND a.score >= t.pass_score THEN a.id END)::NUMERIC /
    NULLIF(COUNT(DISTINCT CASE WHEN a.status = 'submitted' THEN a.id END), 0) * 100,
    2
  ) as pass_rate
FROM tests t
LEFT JOIN attempts a ON t.id = a.test_id
GROUP BY t.id, t.title, t.category, t.status, t.pass_score;

-- Question difficulty view
CREATE OR REPLACE VIEW question_difficulty AS
SELECT
  q.id as question_id,
  q.test_id,
  q.type,
  q.prompt,
  COUNT(aa.id) as total_responses,
  COUNT(CASE WHEN aa.is_correct = TRUE THEN 1 END) as correct_responses,
  ROUND(
    COUNT(CASE WHEN aa.is_correct = TRUE THEN 1 END)::NUMERIC /
    NULLIF(COUNT(aa.id), 0) * 100,
    2
  ) as correct_percentage,
  ROUND(AVG(aa.time_spent_seconds), 0) as avg_time_seconds
FROM questions q
LEFT JOIN attempt_answers aa ON q.id = aa.question_id
GROUP BY q.id, q.test_id, q.type, q.prompt;

-- Grant access to views
GRANT SELECT ON test_statistics TO authenticated;
GRANT SELECT ON question_difficulty TO authenticated;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_attempts_user_test_status ON attempts(user_id, test_id, status);
CREATE INDEX idx_tests_status_visibility ON tests(status, visibility) WHERE status = 'published';
CREATE INDEX idx_leaderboards_score_time ON leaderboards(test_id, best_score DESC, best_time_seconds ASC);
