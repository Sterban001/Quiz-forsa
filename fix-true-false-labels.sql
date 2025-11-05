-- Fix for True/False questions with missing option labels
-- Run this in Supabase SQL Editor

-- First, let's see which True/False questions have empty labels
SELECT
  q.id as question_id,
  q.prompt,
  qo.id as option_id,
  qo.label,
  qo.is_correct,
  qo.order_index
FROM questions q
JOIN question_options qo ON q.id = qo.question_id
WHERE q.type = 'true_false'
ORDER BY q.id, qo.order_index;

-- Fix: Update True/False options to have proper labels if they're empty
-- This updates based on order_index (0 = True, 1 = False)
UPDATE question_options
SET label = CASE
  WHEN order_index = 0 THEN 'True'
  WHEN order_index = 1 THEN 'False'
  ELSE label
END
WHERE question_id IN (
  SELECT id FROM questions WHERE type = 'true_false'
)
AND (label IS NULL OR label = '');

-- Verify the fix
SELECT
  q.id as question_id,
  q.prompt,
  qo.id as option_id,
  qo.label,
  qo.is_correct,
  qo.order_index
FROM questions q
JOIN question_options qo ON q.id = qo.question_id
WHERE q.type = 'true_false'
ORDER BY q.id, qo.order_index;
