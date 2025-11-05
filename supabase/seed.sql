-- Seed data for Quiz Platform
-- Creates sample admin user and demo test

-- Note: You'll need to create the admin user in Supabase Auth first
-- Then update the UUID below with the actual user ID from auth.users

-- Example: Create admin profile (update UUID after creating user in Auth)
-- INSERT INTO profiles (id, role, display_name)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'admin', 'Admin User')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- For this seed, we'll create a sample test structure
-- You'll need to manually create an admin user and update created_by UUID

-- Sample Test (replace created_by UUID with your admin user ID)
DO $$
DECLARE
  admin_id UUID;
  test_id UUID;
  section1_id UUID;
  section2_id UUID;
  q1_id UUID;
  q2_id UUID;
  q3_id UUID;
  q4_id UUID;
  opt_id UUID;
BEGIN
  -- Try to get an admin user (you need to create one first via Supabase Auth)
  SELECT id INTO admin_id FROM profiles WHERE role = 'admin' LIMIT 1;

  IF admin_id IS NULL THEN
    RAISE NOTICE 'No admin user found. Please create an admin user first.';
    RAISE NOTICE 'Steps:';
    RAISE NOTICE '1. Go to Supabase Auth dashboard';
    RAISE NOTICE '2. Create a user with email: admin@quizapp.com';
    RAISE NOTICE '3. Update profiles table: UPDATE profiles SET role = ''admin'' WHERE id = ''user-uuid'';';
    RAISE NOTICE '4. Then run this seed file again';
    RETURN;
  END IF;

  RAISE NOTICE 'Creating sample test with admin user: %', admin_id;

  -- Create sample test
  INSERT INTO tests (
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
    status,
    created_by
  ) VALUES (
    'General Knowledge Quiz',
    'Test your general knowledge across various topics including science, history, and mathematics.',
    'General Knowledge',
    ARRAY['science', 'history', 'math'],
    30,
    'public',
    3,
    70,
    true,
    true,
    'published',
    admin_id
  ) RETURNING id INTO test_id;

  RAISE NOTICE 'Created test: %', test_id;

  -- Create sections
  INSERT INTO sections (test_id, title, description, order_index)
  VALUES (test_id, 'Science & Nature', 'Questions about scientific concepts and natural phenomena', 0)
  RETURNING id INTO section1_id;

  INSERT INTO sections (test_id, title, description, order_index)
  VALUES (test_id, 'Mathematics', 'Basic mathematical problems', 1)
  RETURNING id INTO section2_id;

  -- Question 1: MCQ Single
  INSERT INTO questions (
    test_id,
    section_id,
    type,
    prompt,
    explanation,
    order_index,
    points
  ) VALUES (
    test_id,
    section1_id,
    'mcq_single',
    'What is the chemical symbol for Gold?',
    'Gold''s chemical symbol is Au, derived from its Latin name "Aurum".',
    0,
    1
  ) RETURNING id INTO q1_id;

  -- Options for Q1
  INSERT INTO question_options (question_id, label, is_correct, order_index) VALUES
  (q1_id, 'Gd', false, 0),
  (q1_id, 'Au', true, 1),
  (q1_id, 'Go', false, 2),
  (q1_id, 'Ag', false, 3);

  -- Question 2: MCQ Multi
  INSERT INTO questions (
    test_id,
    section_id,
    type,
    prompt,
    explanation,
    order_index,
    points
  ) VALUES (
    test_id,
    section1_id,
    'mcq_multi',
    'Which of the following are prime numbers? (Select all that apply)',
    'Prime numbers are natural numbers greater than 1 that have no positive divisors other than 1 and themselves. 2, 3, 5, 7, 11, 13 are prime.',
    1,
    2
  ) RETURNING id INTO q2_id;

  -- Options for Q2
  INSERT INTO question_options (question_id, label, is_correct, order_index) VALUES
  (q2_id, '2', true, 0),
  (q2_id, '4', false, 1),
  (q2_id, '7', true, 2),
  (q2_id, '9', false, 3),
  (q2_id, '11', true, 4);

  -- Question 3: Number
  INSERT INTO questions (
    test_id,
    section_id,
    type,
    prompt,
    explanation,
    order_index,
    points,
    tolerance_numeric
  ) VALUES (
    test_id,
    section2_id,
    'number',
    'What is the value of π (pi) rounded to 2 decimal places?',
    'π (pi) is approximately 3.14159, which rounds to 3.14.',
    2,
    1,
    0.01
  ) RETURNING id INTO q3_id;

  -- Store correct answer in option (for number type)
  INSERT INTO question_options (question_id, label, is_correct, order_index) VALUES
  (q3_id, '3.14', true, 0);

  -- Question 4: Short Text
  INSERT INTO questions (
    test_id,
    section_id,
    type,
    prompt,
    explanation,
    order_index,
    points
  ) VALUES (
    test_id,
    section2_id,
    'short_text',
    'What is the capital of France?',
    'The capital city of France is Paris.',
    3,
    1
  ) RETURNING id INTO q4_id;

  -- Store correct answer in option (for short text - for reference)
  INSERT INTO question_options (question_id, label, is_correct, order_index) VALUES
  (q4_id, 'Paris', true, 0);

  -- Create another sample test (draft)
  INSERT INTO tests (
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
    'Advanced Programming Quiz',
    'Test your programming knowledge with advanced concepts.',
    'Programming',
    ARRAY['coding', 'algorithms', 'data-structures'],
    45,
    'public',
    2,
    75,
    'draft',
    admin_id
  );

  RAISE NOTICE 'Seed data created successfully!';
  RAISE NOTICE 'Published test ID: %', test_id;
END $$;
