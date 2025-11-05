-- Add test_type column to tests table
-- This separates auto-graded tests from manual-graded tests

-- Add the column
ALTER TABLE tests
ADD COLUMN IF NOT EXISTS test_type TEXT DEFAULT 'auto_graded'
CHECK (test_type IN ('auto_graded', 'manual_graded'));

-- Add comment to explain the field
COMMENT ON COLUMN tests.test_type IS 'Type of test: auto_graded (MCQ, True/False, Number only) or manual_graded (Short Text, Long Text only)';

-- Create an index for filtering by test type
CREATE INDEX IF NOT EXISTS idx_tests_test_type ON tests(test_type);

-- Set existing tests to auto_graded by default
UPDATE tests
SET test_type = 'auto_graded'
WHERE test_type IS NULL;
