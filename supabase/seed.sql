-- Quiz Platform Database Schema
-- Seed Data: Demo content for testing and development
-- This creates sample users, tests, questions, and attempts

-- NOTE: This seed data is for development only
-- DO NOT run this in production

-- ============================================================================
-- DEMO USERS
-- ============================================================================
-- These users must be created via Supabase Auth Dashboard first
-- Then update profiles table with their roles

-- Admin User: admin@example.com (password: admin123)
-- Student User 1: student1@example.com (password: student123)
-- Student User 2: student2@example.com (password: student123)

-- Update first user to admin (replace with actual user ID from auth.users)
-- UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_ADMIN_USER_ID';

-- ============================================================================
-- DEMO TESTS
-- ============================================================================

-- Demo Test 1: General Knowledge Quiz
INSERT INTO tests (
  id,
  title,
  description,
  category,
  tags,
  time_limit_minutes,
  visibility,
  max_attempts,
  pass_score,
  negative_marking,
  shuffle_questions,
  show_correct_answers,
  show_explanations,
  status,
  created_by
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'General Knowledge Quiz',
  'Test your general knowledge with this fun quiz covering various topics.',
  'General Knowledge',
  ARRAY['general', 'trivia', 'beginner'],
  10,
  'public',
  3,
  70,
  false,
  true,
  true,
  true,
  'published',
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
);

-- Demo Test 2: Mathematics Assessment
INSERT INTO tests (
  id,
  title,
  description,
  category,
  tags,
  time_limit_minutes,
  visibility,
  max_attempts,
  pass_score,
  negative_marking,
  shuffle_questions,
  show_correct_answers,
  show_explanations,
  status,
  created_by
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Basic Mathematics',
  'Assessment covering basic arithmetic and algebra concepts.',
  'Mathematics',
  ARRAY['math', 'arithmetic', 'intermediate'],
  15,
  'public',
  2,
  80,
  true,
  false,
  true,
  true,
  'published',
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
);

-- Demo Test 3: Programming Fundamentals (Draft)
INSERT INTO tests (
  id,
  title,
  description,
  category,
  tags,
  time_limit_minutes,
  visibility,
  max_attempts,
  pass_score,
  status,
  created_by
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Programming Fundamentals',
  'Basic programming concepts and syntax.',
  'Computer Science',
  ARRAY['programming', 'basics', 'draft'],
  20,
  'public',
  1,
  75,
  'draft',
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
);

-- ============================================================================
-- DEMO QUESTIONS - Test 1: General Knowledge
-- ============================================================================

-- Question 1: MCQ Single
INSERT INTO questions (id, test_id, type, prompt, explanation, order_index, points)
VALUES (
  '11111111-1111-1111-1111-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'mcq_single',
  'What is the capital of France?',
  'Paris is the capital and most populous city of France.',
  1,
  1
);

INSERT INTO question_options (question_id, label, is_correct, order_index) VALUES
  ('11111111-1111-1111-1111-000000000001', 'London', false, 1),
  ('11111111-1111-1111-1111-000000000001', 'Paris', true, 2),
  ('11111111-1111-1111-1111-000000000001', 'Berlin', false, 3),
  ('11111111-1111-1111-1111-000000000001', 'Madrid', false, 4);

-- Question 2: MCQ Multiple
INSERT INTO questions (id, test_id, type, prompt, explanation, order_index, points)
VALUES (
  '11111111-1111-1111-1111-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'mcq_multi',
  'Which of the following are programming languages? (Select all that apply)',
  'Python, Java, and JavaScript are all popular programming languages.',
  2,
  2
);

INSERT INTO question_options (question_id, label, is_correct, order_index) VALUES
  ('11111111-1111-1111-1111-000000000002', 'Python', true, 1),
  ('11111111-1111-1111-1111-000000000002', 'HTML', false, 2),
  ('11111111-1111-1111-1111-000000000002', 'Java', true, 3),
  ('11111111-1111-1111-1111-000000000002', 'CSS', false, 4),
  ('11111111-1111-1111-1111-000000000002', 'JavaScript', true, 5);

-- Question 3: True/False
INSERT INTO questions (id, test_id, type, prompt, explanation, order_index, points)
VALUES (
  '11111111-1111-1111-1111-000000000003',
  '11111111-1111-1111-1111-111111111111',
  'true_false',
  'The Earth is flat.',
  'The Earth is an oblate spheroid, not flat. This has been scientifically proven.',
  3,
  1
);

INSERT INTO question_options (question_id, label, is_correct, order_index) VALUES
  ('11111111-1111-1111-1111-000000000003', 'True', false, 1),
  ('11111111-1111-1111-1111-000000000003', 'False', true, 2);

-- Question 4: Number
INSERT INTO questions (id, test_id, type, prompt, explanation, order_index, points, tolerance_numeric)
VALUES (
  '11111111-1111-1111-1111-000000000004',
  '11111111-1111-1111-1111-111111111111',
  'number',
  'How many continents are there on Earth?',
  'There are 7 continents: Africa, Antarctica, Asia, Europe, North America, Oceania, and South America.',
  4,
  1,
  0
);

INSERT INTO question_options (question_id, label, is_correct) VALUES
  ('11111111-1111-1111-1111-000000000004', '7', true);

-- Question 5: Short Text
INSERT INTO questions (id, test_id, type, prompt, explanation, order_index, points)
VALUES (
  '11111111-1111-1111-1111-000000000005',
  '11111111-1111-1111-1111-111111111111',
  'short_text',
  'What is the chemical symbol for water?',
  'The chemical formula for water is H₂O (H2O).',
  5,
  1
);

-- ============================================================================
-- DEMO QUESTIONS - Test 2: Mathematics
-- ============================================================================

-- Question 1: Basic Addition
INSERT INTO questions (id, test_id, type, prompt, explanation, order_index, points, tolerance_numeric)
VALUES (
  '22222222-2222-2222-2222-000000000001',
  '22222222-2222-2222-2222-222222222222',
  'number',
  'What is 15 + 27?',
  'Adding 15 and 27 gives 42.',
  1,
  2,
  0
);

INSERT INTO question_options (question_id, label, is_correct) VALUES
  ('22222222-2222-2222-2222-000000000001', '42', true);

-- Question 2: Multiplication
INSERT INTO questions (id, test_id, type, prompt, explanation, order_index, points)
VALUES (
  '22222222-2222-2222-2222-000000000002',
  '22222222-2222-2222-2222-222222222222',
  'mcq_single',
  'What is 8 × 7?',
  'Multiplying 8 by 7 equals 56.',
  2,
  2
);

INSERT INTO question_options (question_id, label, is_correct, order_index) VALUES
  ('22222222-2222-2222-2222-000000000002', '54', false, 1),
  ('22222222-2222-2222-2222-000000000002', '56', true, 2),
  ('22222222-2222-2222-2222-000000000002', '58', false, 3),
  ('22222222-2222-2222-2222-000000000002', '60', false, 4);

-- Question 3: Division (with tolerance)
INSERT INTO questions (id, test_id, type, prompt, explanation, order_index, points, tolerance_numeric)
VALUES (
  '22222222-2222-2222-2222-000000000003',
  '22222222-2222-2222-2222-222222222222',
  'number',
  'What is 100 ÷ 3? (Round to 2 decimal places)',
  'Dividing 100 by 3 gives approximately 33.33.',
  3,
  2,
  0.01
);

INSERT INTO question_options (question_id, label, is_correct) VALUES
  ('22222222-2222-2222-2222-000000000003', '33.33', true);

-- Question 4: Algebra
INSERT INTO questions (id, test_id, type, prompt, explanation, order_index, points)
VALUES (
  '22222222-2222-2222-2222-000000000004',
  '22222222-2222-2222-2222-222222222222',
  'mcq_single',
  'If x + 5 = 12, what is the value of x?',
  'Subtracting 5 from both sides: x = 12 - 5 = 7.',
  4,
  3
);

INSERT INTO question_options (question_id, label, is_correct, order_index) VALUES
  ('22222222-2222-2222-2222-000000000004', '5', false, 1),
  ('22222222-2222-2222-2222-000000000004', '6', false, 2),
  ('22222222-2222-2222-2222-000000000004', '7', true, 3),
  ('22222222-2222-2222-2222-000000000004', '8', false, 4);

-- Question 5: Word Problem
INSERT INTO questions (id, test_id, type, prompt, explanation, order_index, points)
VALUES (
  '22222222-2222-2222-2222-000000000005',
  '22222222-2222-2222-2222-222222222222',
  'long_text',
  'A train travels 120 km in 2 hours. Explain how you would calculate its average speed and what it would be.',
  'Average speed = Distance ÷ Time = 120 km ÷ 2 hours = 60 km/h. This requires dividing the total distance by the total time.',
  5,
  3
);

-- ============================================================================
-- NOTES
-- ============================================================================

-- To create actual attempts and test the scoring system:
-- 1. Register users via Supabase Auth Dashboard or your app
-- 2. Update one profile to admin role
-- 3. Students can take the published tests
-- 4. Scoring will happen automatically via calculate_attempt_score()

-- Example SQL to manually create an attempt (for testing):
/*
INSERT INTO attempts (test_id, user_id, status)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'YOUR_USER_ID',
  'in_progress'
);

INSERT INTO attempt_answers (attempt_id, question_id, response_json)
VALUES (
  'YOUR_ATTEMPT_ID',
  '11111111-1111-1111-1111-000000000001',
  '{"selected": "CORRECT_OPTION_ID"}'
);

UPDATE attempts SET status = 'submitted', submitted_at = NOW() WHERE id = 'YOUR_ATTEMPT_ID';
SELECT calculate_attempt_score('YOUR_ATTEMPT_ID');
*/
