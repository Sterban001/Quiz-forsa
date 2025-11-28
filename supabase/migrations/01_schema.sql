-- Quiz Platform Database Schema
-- Migration 01: Core Schema Tables
-- This creates all database tables with proper constraints and indexes

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================================
-- TABLE: profiles
-- ============================================================================
-- Extends auth.users with additional user information and roles

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users with role and metadata';
COMMENT ON COLUMN profiles.role IS 'User role: admin (full access) or user (student)';

-- ============================================================================
-- TABLE: tests
-- ============================================================================
-- Main test/quiz configuration table

CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  cover_image_url TEXT,

  -- Timing configuration
  time_limit_minutes INTEGER,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  per_question_time_seconds INTEGER,

  -- Access control
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private', 'unlisted')) DEFAULT 'public',
  access_code TEXT,

  -- Attempt rules
  max_attempts INTEGER NOT NULL DEFAULT 1,
  pass_score NUMERIC NOT NULL DEFAULT 70,

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
CREATE INDEX idx_tests_status_visibility ON tests(status, visibility) WHERE status = 'published';

COMMENT ON TABLE tests IS 'Quiz/test configuration and settings';
COMMENT ON COLUMN tests.visibility IS 'Test visibility: public (all), private (whitelist), unlisted (direct link)';
COMMENT ON COLUMN tests.status IS 'Test status: draft, published, or archived';
COMMENT ON COLUMN tests.negative_marking IS 'If true, deduct 25% of points for incorrect answers';

-- ============================================================================
-- TABLE: sections
-- ============================================================================
-- Optional grouping of questions within tests

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

COMMENT ON TABLE sections IS 'Optional sections for organizing questions within tests';

-- ============================================================================
-- TABLE: questions
-- ============================================================================
-- Individual questions within tests

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE SET NULL,

  type TEXT NOT NULL CHECK (type IN ('mcq_single', 'mcq_multi', 'short_text', 'long_text', 'number', 'true_false')),
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

COMMENT ON TABLE questions IS 'Questions within tests';
COMMENT ON COLUMN questions.type IS 'Question type: mcq_single, mcq_multi, true_false, short_text, long_text, or number';
COMMENT ON COLUMN questions.tolerance_numeric IS 'Acceptable tolerance range for numeric answers';

-- ============================================================================
-- TABLE: question_options
-- ============================================================================
-- Answer options for MCQ and True/False questions

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

COMMENT ON TABLE question_options IS 'Answer choices for MCQ/True-False questions; also stores correct numeric answers';
COMMENT ON COLUMN question_options.label IS 'Option text for MCQ; numeric value stored as text for number questions';

-- ============================================================================
-- TABLE: attempts
-- ============================================================================
-- Student test submission records

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
CREATE INDEX idx_attempts_user_test_status ON attempts(user_id, test_id, status);
CREATE INDEX idx_attempts_submitted ON attempts(submitted_at) WHERE submitted_at IS NOT NULL;

COMMENT ON TABLE attempts IS 'Student test submission records';
COMMENT ON COLUMN attempts.status IS 'Attempt status: in_progress, submitted, or graded';
COMMENT ON COLUMN attempts.attempt_no IS 'Attempt number for this user and test (1st, 2nd, etc.)';

-- ============================================================================
-- TABLE: attempt_answers
-- ============================================================================
-- Individual answer records for each question in an attempt

CREATE TABLE attempt_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

  -- Response stored as JSON for flexibility
  -- MCQ single: {"selected": "option_id"}
  -- MCQ multi: {"selected": ["option_id1", "option_id2"]}
  -- True/False: {"selected": "option_id"}
  -- Short/Long text: {"text": "answer"}
  -- Number: {"value": 42}
  response_json JSONB,

  -- Scoring
  is_correct BOOLEAN, -- NULL for text answers awaiting manual grading
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

COMMENT ON TABLE attempt_answers IS 'Individual answers within test attempts';
COMMENT ON COLUMN attempt_answers.response_json IS 'Answer data in JSON format, structure varies by question type';
COMMENT ON COLUMN attempt_answers.is_correct IS 'NULL indicates manual grading required (text questions)';

-- ============================================================================
-- TABLE: test_whitelist
-- ============================================================================
-- Access control for private tests

CREATE TABLE test_whitelist (
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES profiles(id),
  PRIMARY KEY (test_id, user_id)
);

CREATE INDEX idx_test_whitelist_user_id ON test_whitelist(user_id);

COMMENT ON TABLE test_whitelist IS 'Access control list for private tests';

-- ============================================================================
-- TABLE: leaderboards
-- ============================================================================
-- Best scores tracking per test per user

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
CREATE INDEX idx_leaderboards_score_time ON leaderboards(test_id, best_score DESC, best_time_seconds ASC);

COMMENT ON TABLE leaderboards IS 'Tracks best scores and attempt counts per user per test';
COMMENT ON COLUMN leaderboards.best_score IS 'Highest score achieved by this user on this test';
COMMENT ON COLUMN leaderboards.best_time_seconds IS 'Time taken for best scoring attempt';
