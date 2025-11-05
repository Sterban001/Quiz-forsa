-- Fix question types constraint to include true_false and long_text
-- Run this in Supabase SQL Editor

-- Drop the old constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;

-- Add new constraint with all question types
ALTER TABLE questions ADD CONSTRAINT questions_type_check
  CHECK (type IN ('mcq_single', 'mcq_multi', 'short_text', 'long_text', 'number', 'true_false'));

-- Verify it worked
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'questions_type_check';
