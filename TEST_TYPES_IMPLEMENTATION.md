# Test Types Implementation Guide

## Overview

The quiz platform now supports **two distinct test types** to prevent confusion between auto-graded and manually-graded questions:

1. **Auto-Graded Tests** - For objective questions with definite answers
2. **Manual-Graded Tests** - For subjective questions requiring human review

---

## Why Separate Test Types?

### Problem
Previously, admins could mix MCQ questions (auto-graded) with text questions (manual-graded) in the same test, which caused:
- Confusion about when results would be available
- Partial scores shown to students before manual grading was complete
- Students not knowing if they needed to wait for admin review
- Admins not knowing which tests needed manual review

### Solution
Now tests are explicitly one type or the other:
- **Auto-Graded**: Results appear immediately after submission
- **Manual-Graded**: Results appear after admin completes grading

---

## Test Type Comparison

| Feature | Auto-Graded | Manual-Graded |
|---------|-------------|---------------|
| **Question Types** | MCQ Single, MCQ Multi, True/False, Number | Short Text, Long Text |
| **Grading** | Instant (by system) | Manual (by admin) |
| **Results** | Immediate | After admin review |
| **Correct Answers** | Must be set when creating question | Not applicable |
| **Use Cases** | Knowledge tests, quizzes, exams | Essays, explanations, code reviews |
| **Pass/Fail** | Calculated automatically | Set by admin after grading |
| **Feedback** | Can show correct answers + explanations | Admin provides written feedback |

---

## Implementation Details

### Database Changes

**Migration File:** `supabase/migrations/add-test-type.sql`

```sql
ALTER TABLE tests
ADD COLUMN IF NOT EXISTS test_type TEXT DEFAULT 'auto_graded'
CHECK (test_type IN ('auto_graded', 'manual_graded'));
```

**Values:**
- `auto_graded` - Default for new tests
- `manual_graded` - For essay/text-based tests

### Admin Panel Changes

#### 1. Create New Test Page
**File:** `admin-panel/app/dashboard/tests/new/page.tsx`

**New Field:**
```tsx
<select name="test_type">
  <option value="auto_graded">Auto-Graded (MCQ, True/False, Number)</option>
  <option value="manual_graded">Manual-Graded (Short Text, Long Text)</option>
</select>
```

**Helper Text:**
- Auto-Graded: "Supports: Multiple Choice, True/False, Number questions - Instant scoring"
- Manual-Graded: "Supports: Short Text, Long Text questions - Requires manual grading by admin"

#### 2. Edit Test Page - Question Type Restrictions
**File:** `admin-panel/app/dashboard/tests/[id]/edit/page.tsx`

**Question Type Dropdown:**
- If `test.test_type === 'auto_graded'`:
  - Only shows: MCQ Single, MCQ Multi, True/False, Number
- If `test.test_type === 'manual_graded'`:
  - Only shows: Short Text, Long Text

**Enforcement:**
The UI prevents admins from adding incompatible question types to a test.

---

## Admin Workflow

### Creating an Auto-Graded Test

1. **Go to:** Dashboard → Tests → Create New Test
2. **Select:** Test Type: "Auto-Graded"
3. **Create test** and add questions
4. **Available question types:** MCQ, True/False, Number only
5. **For each question:**
   - Add options/answers
   - **Check/select the correct answer(s)**
   - Add explanations (optional)
6. **Publish** when ready
7. **Students:** See results immediately after submission

### Creating a Manual-Graded Test

1. **Go to:** Dashboard → Tests → Create New Test
2. **Select:** Test Type: "Manual-Graded"
3. **Create test** and add questions
4. **Available question types:** Short Text, Long Text only
5. **For each question:**
   - Write the question prompt
   - Add grading rubric in explanation field (optional)
6. **Publish** when ready
7. **After students submit:**
   - Go to Dashboard → Attempts
   - Click "View Details" on each attempt
   - Review text answers
   - Award points for each question
   - System recalculates total score automatically

---

## Student Experience

### Auto-Graded Tests

**Before Test:**
- Badge shows "AUTO-GRADED"
- Description states "Results available immediately"

**During Test:**
- Standard question answering
- Timer counts down
- Can navigate between questions

**After Submission:**
- ✅ **Results appear immediately**
- See score, percentage, pass/fail
- View correct answers (if enabled)
- Read explanations

**Timeline:** Instant feedback

### Manual-Graded Tests

**Before Test:**
- Badge shows "MANUAL-GRADED"
- Description states "Results available after review"

**During Test:**
- Answer text questions
- Timer counts down
- Can navigate between questions

**After Submission:**
- ⏳ **Status: "Pending Review"**
- Message: "Your answers are being reviewed by the instructor"
- Cannot see score yet

**After Admin Grades:**
- ✅ **Status: "Graded"**
- See score, percentage, pass/fail
- View admin feedback

**Timeline:** Hours to days (depends on admin)

---

## Technical Details

### Question Type Mapping

```typescript
const AUTO_GRADED_TYPES = ['mcq_single', 'mcq_multi', 'true_false', 'number']
const MANUAL_GRADED_TYPES = ['short_text', 'long_text']
```

### Validation Rules

**On Test Creation:**
- `test_type` is required
- Defaults to `auto_graded`

**On Question Creation:**
- Check `test.test_type`
- Only allow compatible question types
- UI prevents selection of incompatible types

**On Test Submission:**
- Auto-graded: Call `calculate_attempt_score()` immediately
- Manual-graded: Mark as "pending_review", skip scoring function

### Grading Function Logic

**File:** `supabase/migrations/20240101000000_initial_schema.sql`
**Function:** `calculate_attempt_score()`

```sql
-- Auto-grades MCQ, True/False, Number questions
-- Skips Short Text, Long Text (leaves is_correct = NULL)
-- For manual-graded tests, admin updates awarded_points manually
```

---

## Migration Guide

### For Existing Tests

**Option 1: Run SQL to Set Type (Recommended)**
```sql
-- Set all existing tests to auto_graded by default
UPDATE tests
SET test_type = 'auto_graded'
WHERE test_type IS NULL;

-- Manually change specific tests to manual_graded if they have text questions
UPDATE tests
SET test_type = 'manual_graded'
WHERE id IN (
  SELECT DISTINCT test_id
  FROM questions
  WHERE type IN ('short_text', 'long_text')
);
```

**Option 2: Admin Panel**
1. Edit each test
2. Set Test Type field
3. Save

### For Tests with Mixed Question Types

**Problem:** Some old tests may have both auto-graded AND manual-graded questions

**Solution:**
1. **Identify mixed tests:**
   ```sql
   SELECT t.id, t.title,
     COUNT(CASE WHEN q.type IN ('mcq_single', 'mcq_multi', 'true_false', 'number') THEN 1 END) as auto_count,
     COUNT(CASE WHEN q.type IN ('short_text', 'long_text') THEN 1 END) as manual_count
   FROM tests t
   JOIN questions q ON t.id = q.test_id
   GROUP BY t.id, t.title
   HAVING auto_count > 0 AND manual_count > 0;
   ```

2. **Split into two tests:**
   - Clone the test
   - Test A: Keep only auto-graded questions, set type to `auto_graded`
   - Test B: Keep only manual-graded questions, set type to `manual_graded`

3. **Or choose dominant type:**
   - If mostly auto-graded: Remove text questions
   - If mostly manual-graded: Remove MCQ questions

---

## API Changes

### Creating a Test

**POST /tests**
```json
{
  "title": "Math Quiz",
  "test_type": "auto_graded",  // NEW FIELD
  "description": "...",
  "..."
}
```

### Response
```json
{
  "id": "...",
  "title": "Math Quiz",
  "test_type": "auto_graded",  // INCLUDED IN RESPONSE
  "..."
}
```

---

## UI Indicators

### Test Cards (Student Dashboard)
```tsx
{test.test_type === 'auto_graded' ? (
  <span className="bg-green-100 text-green-800">⚡ Auto-Graded</span>
) : (
  <span className="bg-orange-100 text-orange-800">📝 Manual Review</span>
)}
```

### Test Detail Page
```tsx
<div className="info-box">
  {test.test_type === 'auto_graded' ? (
    <p>✓ Results available immediately after submission</p>
  ) : (
    <p>⏰ Results available after instructor review (typically 1-2 days)</p>
  )}
</div>
```

### Results Page
```tsx
{attempt.status === 'pending_review' && (
  <div className="text-yellow-600">
    ⏳ Your answers are being reviewed...
  </div>
)}
```

---

## Benefits

### For Admins
✅ Clear separation of auto vs manual grading workload
✅ Easy to identify which tests need manual review
✅ Prevents accidental mixing of question types
✅ Better organization and planning

### For Students
✅ Know when to expect results
✅ No confusion about partial scores
✅ Clear expectations set upfront
✅ Better user experience

### For System
✅ Cleaner database queries
✅ More accurate analytics
✅ Simpler grading logic
✅ Better performance

---

## Testing Checklist

- [ ] Run migration: `add-test-type.sql`
- [ ] Create new auto-graded test
- [ ] Add MCQ question to auto-graded test
- [ ] Verify cannot add Short Text to auto-graded test
- [ ] Create new manual-graded test
- [ ] Add Short Text question to manual-graded test
- [ ] Verify cannot add MCQ to manual-graded test
- [ ] Student takes auto-graded test → sees results immediately
- [ ] Student takes manual-graded test → sees "pending review"
- [ ] Admin grades manual test → student sees updated score
- [ ] Test filters work in admin dashboard
- [ ] Analytics separate auto vs manual tests

---

## FAQ

**Q: Can I change a test's type after creating it?**
A: Technically yes, but not recommended if it already has questions. Better to create a new test.

**Q: What happens to old tests without test_type set?**
A: They default to `auto_graded`. Update them as needed.

**Q: Can I mix question types in one test?**
A: No, this is now prevented by the UI to avoid confusion.

**Q: What if I need both MCQ and essay questions?**
A: Create two separate tests - one auto-graded for MCQ, one manual-graded for essays.

**Q: How do students know which type of test they're taking?**
A: The test detail page shows a badge and description explaining grading type.

**Q: Does test_type affect scoring?**
A: Yes - auto-graded tests call the scoring function immediately, manual-graded tests wait for admin.

---

## Future Enhancements

**Possible additions:**
- Hybrid test type (auto-grade MCQ, manual-grade text in same test)
- Partial auto-grading for manual tests
- AI-assisted grading for text questions
- Rubric templates for manual grading
- Batch grading interface
- Grading assignments to multiple admins
- Student self-assessment before final grade

---

**Last Updated:** 2025-11-02
**Version:** 1.0
**Status:** Implemented ✅
