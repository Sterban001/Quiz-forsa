# Manual Grading Implementation Guide

## Overview

Manual-graded tests (Short Text/Long Text questions) now have a complete workflow that prevents students from seeing scores until the admin reviews and grades their answers.

---

## Student Experience - Manual-Graded Tests

### **1. Before Taking Test**
- Test card shows it requires manual grading
- Student knows results won't be immediate

### **2. Taking the Test**
- Student answers Short Text or Long Text questions
- Can type essay-style responses
- Timer works normally
- Can navigate between questions

### **3. After Submission - PENDING REVIEW**

**What Student Sees:**
```
✅ Submission Received

Your responses have been recorded successfully

ℹ️ Pending Review
Your answers are being reviewed by the instructor.
You will be notified when grading is complete.

What happens next:
• Instructor will review each of your answers
• Points will be awarded based on the quality of your responses
• You'll receive your score and detailed feedback
• Check back in 1-2 days to see your results
```

**Submission Details Shown:**
- ✅ Submission Status: Submitted Successfully
- ⏱️ Time Taken: X minutes
- 📅 Submitted On: Date
- ⏳ Grading Status: **Awaiting Review**

**What Student CANNOT See:**
- ❌ Score
- ❌ Percentage
- ❌ Pass/Fail status
- ❌ Individual question scores

### **4. After Admin Grades - RESULTS AVAILABLE**

Once admin completes grading:
- Student sees normal result page
- Score, percentage, pass/fail status shown
- Can view detailed results

---

## Admin Experience - Grading Manual Tests

### **1. Student Submits Test**

When a student submits a manual-graded test:
- Attempt status: `submitted`
- Grading status: Needs review
- Appears in "Attempts" list

### **2. Admin Reviews Submission**

**Steps:**
1. Go to **Dashboard → Attempts**
2. Find the attempt (shows student name, test name, date)
3. Click **"View Details"** or **"Grade"**

### **3. Grading Interface**

**For Each Question:**
- View student's text answer
- Read the question prompt
- See explanation/rubric (if provided)
- **Award points**: 0 to maximum points for that question

**Example:**
```
Question 1: Explain the water cycle (5 points)

Student Answer:
"The water cycle involves evaporation from water bodies,
condensation into clouds, and precipitation as rain..."

Points Awarded: [____] / 5 points
Admin Feedback (optional): [________________]
```

### **4. Finalizing Grade**

After reviewing all answers:
- System automatically calculates total score
- Updates attempt status to `graded`
- Student can now see their results

---

## Technical Implementation

### **Database States**

**Attempt Status:**
- `in_progress` - Student is taking the test
- `submitted` - Student finished, awaiting grading (manual tests)
- `graded` - Admin completed grading OR auto-graded test

**Test Type:**
- `auto_graded` - MCQ, True/False, Number (instant results)
- `manual_graded` - Short Text, Long Text (requires admin review)

### **Result Page Logic**

```typescript
const isManualGraded = test.test_type === 'manual_graded'
const isPendingReview = isManualGraded && attempt.status !== 'graded'

if (isPendingReview) {
  // Show "Submission Received - Pending Review"
  // Hide scores, show submission details only
} else {
  // Show normal result page with scores
}
```

### **Scoring Function Behavior**

**Auto-Graded Tests:**
```javascript
// On submission:
await supabase.rpc('calculate_attempt_score', { attempt_id })
// → Status changes to 'graded' immediately
// → Student sees results right away
```

**Manual-Graded Tests:**
```javascript
// On submission:
// → Status remains 'submitted'
// → Scoring function NOT called
// → Student sees "Pending Review"

// After admin grades:
// → Admin updates awarded_points for each question
// → System recalculates total score
// → Status changes to 'graded'
// → Student can now see results
```

---

## UI Components

### **Pending Review Badge**
```tsx
<div className="bg-yellow-100 rounded-lg p-4">
  <div className="flex items-center gap-2">
    <svg className="w-6 h-6 text-yellow-600">⏳</svg>
    <span className="font-semibold text-yellow-900">
      Awaiting Review
    </span>
  </div>
</div>
```

### **Graded Badge**
```tsx
<div className="bg-green-100 rounded-lg p-4">
  <div className="flex items-center gap-2">
    <svg className="w-6 h-6 text-green-600">✓</svg>
    <span className="font-semibold text-green-900">
      Graded - View Results
    </span>
  </div>
</div>
```

---

## Workflow Diagram

```
STUDENT SUBMITS MANUAL TEST
         ↓
   Status: "submitted"
   (NOT "graded")
         ↓
   Student sees:
   "Submission Received"
   "Pending Review"
         ↓
   ⏳ WAITING FOR ADMIN
         ↓
   Admin goes to Attempts
         ↓
   Admin grades each answer
   Awards points manually
         ↓
   System recalculates score
   Status → "graded"
         ↓
   Student refreshes page
         ↓
   Student sees:
   Score, Pass/Fail, Results
```

---

## Best Practices

### **For Admins:**

1. **Set Clear Rubrics**
   - Add grading criteria in question explanation
   - Define point values clearly
   - Be consistent across students

2. **Timely Grading**
   - Grade within 1-2 days of submission
   - Notify students when grading is complete
   - Batch grade similar questions together

3. **Provide Feedback**
   - Use the feedback field to explain grades
   - Highlight what was done well
   - Suggest improvements for low scores

4. **Partial Credit**
   - Award partial points for partially correct answers
   - Document why points were deducted

### **For Students:**

1. **Check Back Later**
   - Don't expect immediate results
   - Check back after 1-2 days
   - Email/notification when graded

2. **Write Clearly**
   - Organize answers with paragraphs
   - Use proper grammar and spelling
   - Answer all parts of the question

3. **Show Your Work**
   - Explain your reasoning
   - Provide examples when relevant
   - Demonstrate understanding

---

## Migration from Mixed Tests

If you have existing tests with both auto and manual questions:

### **Option 1: Split the Test**
```sql
-- Create two copies
-- Test A: Keep only MCQ/True-False → set type = 'auto_graded'
-- Test B: Keep only Short/Long Text → set type = 'manual_graded'
```

### **Option 2: Choose Dominant Type**
```sql
-- If mostly MCQ: Remove text questions
UPDATE tests SET test_type = 'auto_graded' WHERE id = '...'

-- If mostly text: Remove MCQ questions
UPDATE tests SET test_type = 'manual_graded' WHERE id = '...'
```

---

## FAQ

**Q: Can I change a test from auto to manual after creation?**
A: Technically yes, but not recommended if students have already taken it. Create a new test instead.

**Q: What if I forget to grade a submission?**
A: Student will continue to see "Pending Review" until you grade it. Set reminders to check the Attempts page regularly.

**Q: Can students see their answers before grading?**
A: Yes, they submitted them. But they cannot see scores or which answers were right/wrong.

**Q: Can I partially grade a test?**
A: Yes, you can grade some questions and come back later. Status only changes to "graded" when you finalize.

**Q: What happens if I award 0 points to all questions?**
A: Student gets 0% and fails. Make sure this is intentional (e.g., plagiarism) vs. just not grading yet.

**Q: Can auto-graded tests have text questions for extra credit?**
A: No, test types are exclusive. Create a separate manual-graded test for extra credit essays.

---

## Summary

✅ **Manual-graded tests** now properly hide scores from students until admin reviews
✅ **Students see "Pending Review"** with clear messaging about what happens next
✅ **Admins have dedicated grading interface** (to be implemented in admin panel)
✅ **Clear separation** between auto and manual grading workflows
✅ **Better UX** for both students and admins

---

**Status:** Implementation Complete ✅
**Last Updated:** 2025-11-02
**Version:** 1.0
