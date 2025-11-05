# Question Types Guide - Quiz Platform

This guide explains how each question type works and how to set correct answers.

## Overview

The quiz platform supports **6 question types**, each with different grading methods:

| Question Type | Auto-Graded? | Requires Correct Answer? |
|--------------|--------------|--------------------------|
| MCQ Single | ✅ Yes | ✅ Yes - Check 1 box |
| MCQ Multiple | ✅ Yes | ✅ Yes - Check all correct boxes |
| True/False | ✅ Yes | ✅ Yes - Select True or False |
| Number | ✅ Yes | ✅ Yes - Enter number + tolerance |
| Short Text | ❌ No (Manual) | ❌ No - Admin grades manually |
| Long Text | ❌ No (Manual) | ❌ No - Admin grades manually |

---

## 1. Multiple Choice (Single Answer)

**How it works:**
- Student selects ONE option from the list
- System compares selected option with correct option
- Marks as correct only if the selection matches exactly

**Setting Correct Answer:**
1. Add question with type "Multiple Choice (Single Answer)"
2. Add 2+ answer options
3. **Check the checkbox** next to the ONE correct answer
4. Save question

**Example:**
```
Question: What is 2 + 2?
□ 3
☑ 4  ← Checked as correct
□ 5
□ 6
```

**Grading Logic:** (from database function line 330-366)
```sql
-- Compares selected option ID with correct option ID
is_correct := (selected_option = correct_option)
```

---

## 2. Multiple Choice (Multiple Answers)

**How it works:**
- Student can select MULTIPLE options
- System compares all selected options with all correct options
- Marks as correct only if ALL correct options are selected AND no incorrect options are selected

**Setting Correct Answer:**
1. Add question with type "Multiple Choice (Multiple Answers)"
2. Add 2+ answer options
3. **Check the checkboxes** next to ALL correct answers
4. Save question

**Example:**
```
Question: Which are prime numbers?
☑ 2  ← Checked as correct
☑ 3  ← Checked as correct
□ 4
☑ 5  ← Checked as correct
```

**Grading Logic:** (from database function line 342-349)
```sql
-- Arrays must match exactly (all correct options selected, no extra selections)
is_correct := (correct_options @> selected_options
               AND selected_options @> correct_options)
```

**Important:** Students must select ALL correct answers to get points. If they miss even one correct answer or select a wrong answer, they get 0 points.

---

## 3. True/False

**How it works:**
- Special case of MCQ Single with exactly 2 options: "True" and "False"
- System treats it as MCQ Single
- Student selects one option via radio buttons

**Setting Correct Answer:**
1. Add question with type "True/False"
2. Options automatically created as "True" and "False"
3. **Select the radio button** for the correct answer (True or False)
4. Save question

**Example:**
```
Question: The Earth is flat.
○ True
● False  ← Selected as correct
```

**Grading Logic:** Same as MCQ Single

---

## 4. Number

**How it works:**
- Student enters a numeric value
- System compares the number with correct answer
- Allows optional tolerance (e.g., ±0.1)

**Setting Correct Answer:**
1. Add question with type "Number"
2. **Enter the correct numerical answer** in "Correct Answer" field
3. **Optionally set tolerance** (e.g., 0.1 means ±0.1 is acceptable)
4. Save question

**Example:**
```
Question: What is the value of π (pi) to 2 decimal places?
Correct Answer: 3.14
Tolerance: 0.01

Accepts: 3.13, 3.14, 3.15
Rejects: 3.12, 3.16
```

**Grading Logic:** (from database function line 368-403)
```sql
-- With tolerance
is_correct := ABS(user_value - correct_value) <= tolerance

-- Without tolerance (exact match)
is_correct := user_value = correct_value
```

**Technical Detail:**
- The correct answer is stored in the `question_options` table
- The number is stored in the `label` field
- `is_correct` is set to `TRUE` for this option

---

## 5. Short Text

**How it works:**
- Student enters a short text answer (single line)
- **NOT auto-graded** - requires manual review by admin
- Answer is stored but marked as `is_correct = NULL`

**Setting Correct Answer:**
- **No correct answer needed**
- This type requires manual grading by the admin

**Admin Grading Process:**
1. Student submits test
2. Admin goes to "Attempts" → View attempt details
3. Admin reviews each short text answer
4. Admin awards points (0 to max points for that question)
5. System recalculates total score

**Example:**
```
Question: Explain the water cycle in 2-3 sentences.
Student Answer: [Text entered by student]

Admin reviews and awards: 0-5 points (out of 5 max)
```

**Grading Logic:** (from database function line 405)
```sql
-- Short text answers remain with is_correct = NULL for manual grading
-- Admin later updates awarded_points field
```

---

## 6. Long Text

**How it works:**
- Same as Short Text, but allows multi-line text input
- **NOT auto-graded** - requires manual review by admin
- Useful for essays, explanations, code snippets

**Setting Correct Answer:**
- **No correct answer needed**
- This type requires manual grading by the admin

**Use Cases:**
- Essay questions
- Code writing questions
- Detailed explanations
- Problem-solving with work shown

---

## Auto-Grading Summary

### Immediately Auto-Graded (When Test is Submitted):
1. ✅ MCQ Single
2. ✅ MCQ Multiple
3. ✅ True/False
4. ✅ Number

### Requires Manual Grading:
5. ❌ Short Text - Admin reviews and assigns points
6. ❌ Long Text - Admin reviews and assigns points

---

## Common Issues & Solutions

### Issue 1: Student gets 0% even with correct answers
**Cause:** Admin didn't check the boxes for correct answers when creating the question

**Solution:**
1. Go to Admin Panel → Tests
2. Click "Edit" on the test
3. Click "Edit" on each question
4. **Check the checkboxes** next to correct answers
5. Save each question

### Issue 2: Number questions always marked wrong
**Cause:** Correct answer not set OR tolerance too strict

**Solution:**
1. Edit the number question
2. Ensure "Correct Answer" field has a value
3. Add appropriate tolerance if needed (e.g., 0.1 for ±0.1)
4. Save question

### Issue 3: True/False shows as MCQ in results
**Cause:** Database constraint missing `true_false` type

**Solution:**
1. Run SQL fix in `fix-question-types.sql`
2. Recreate the question as True/False type

### Issue 4: Text questions show 0 points
**Cause:** Text questions require manual grading

**Solution:**
1. Go to Admin Panel → Attempts
2. Click "View Details" on the student's attempt
3. Review each text answer
4. Award points (0 to max)
5. Score auto-updates

---

## Database Schema Reference

### `questions` table:
```sql
- id (UUID)
- test_id (UUID)
- type (text) -- mcq_single, mcq_multi, true_false, short_text, long_text, number
- prompt (text) -- Question text
- explanation (text) -- Shown after submission
- points (integer) -- Max points for this question
- tolerance_numeric (numeric) -- Only for number type
```

### `question_options` table:
```sql
- id (UUID)
- question_id (UUID)
- label (text) -- Option text OR correct number for number type
- is_correct (boolean) -- TRUE for correct answers
- order_index (integer) -- Display order
```

### `attempt_answers` table:
```sql
- id (UUID)
- attempt_id (UUID)
- question_id (UUID)
- response_json (jsonb) -- Student's answer
- is_correct (boolean) -- NULL for text questions, TRUE/FALSE for others
- awarded_points (numeric) -- Points awarded (may be partial for manual grading)
```

---

## Grading Function

The database function `calculate_attempt_score(attempt_id)` handles all auto-grading:

**Location:** `supabase/migrations/20240101000000_initial_schema.sql` lines 302-438

**What it does:**
1. Loops through all answers in an attempt
2. For MCQ/True-False: Compares selected options with correct options
3. For Number: Compares numeric value with tolerance
4. For Text: Skips (leaves as NULL for manual grading)
5. Applies negative marking if enabled (25% deduction for wrong answers)
6. Updates attempt score and leaderboard

**Called when:**
- Student submits a test (from student app)
- Admin manually triggers recalculation (after manual grading)

---

## Best Practices

1. **Always set correct answers** for auto-graded questions before publishing
2. **Test your test** - Take it as a student to verify grading works correctly
3. **Use appropriate tolerances** for number questions (e.g., 0.01 for money, 0.1 for approximations)
4. **Provide explanations** - Help students learn from their mistakes
5. **Mix question types** - Use MCQ for facts, text for critical thinking
6. **Review manual grading regularly** - Don't let text answers pile up ungraded
7. **Check test before publishing** - Verify all questions have correct answers marked

---

## Quick Reference Card

| Want to test... | Use this type | Set correct answer by... |
|----------------|---------------|-------------------------|
| Factual knowledge with one right answer | MCQ Single | Checking 1 checkbox |
| Multiple facts (all must be correct) | MCQ Multi | Checking all correct checkboxes |
| True or false statement | True/False | Selecting True or False radio |
| Calculation result | Number | Entering number + tolerance |
| Short written response | Short Text | Manual grading |
| Essay or detailed answer | Long Text | Manual grading |

---

**Last Updated:** 2025-11-02
**System Version:** Quiz Platform v1.0
