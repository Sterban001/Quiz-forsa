-- Migration 05: Add Result Release Controls
-- This adds columns to control when auto-graded test results are visible to students

-- Add result release columns to tests table
ALTER TABLE tests ADD COLUMN results_released BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tests ADD COLUMN results_release_date TIMESTAMPTZ;

-- Create index for filtering tests by release status
CREATE INDEX idx_tests_results_released ON tests(results_released);

-- Add comments
COMMENT ON COLUMN tests.results_released IS 'Whether results are visible to students (applies to auto-graded tests)';
COMMENT ON COLUMN tests.results_release_date IS 'Timestamp when results were released to students';

-- Note: No need to update existing tests since we're in development stage
-- For production migration, you might want to add:
-- UPDATE tests SET results_released = TRUE WHERE status = 'published';
