# Quiz Platform - System Documentation

## Overview
The Quiz Platform is a full-stack web application consisting of:
- **Admin Panel** (Port 3003): For creating and managing tests
- **Student Web App** (Port 3005): For taking tests and viewing results
- **Database**: Supabase PostgreSQL with Row Level Security

## System Architecture

### Technology Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Authentication**: Password-based authentication via Supabase Auth

### Database Schema

#### Core Tables
1. **tests** - Test configurations
   - id, title, description, subject, duration_minutes, pass_score
   - negative_marking, allow_review, shuffle_questions, is_published

2. **questions** - Test questions
   - id, test_id, type (mcq_single, mcq_multi, number, short_text, long_text, true_false)
   - prompt, points, order_index, tolerance_numeric

3. **question_options** - Answer choices for MCQ questions
   - id, question_id, label, is_correct, order_index

4. **attempts** - Student test submissions
   - id, test_id, user_id, status (in_progress, submitted, graded)
   - score, max_score, started_at, submitted_at, duration_seconds

5. **attempt_answers** - Individual question responses
   - id, attempt_id, question_id, response_json
   - is_correct, awarded_points

6. **leaderboards** - Best scores tracking
   - test_id, user_id, best_score, best_time_seconds, attempt_count

## Student Web Application

### Running the App
```bash
cd student-app
npm install
npm run dev
# Runs on http://localhost:3005
```

### Key Features

#### 1. Authentication ([app/login/page.tsx](student-app/app/login/page.tsx))
- Password-based login/signup
- Automatic account creation if user doesn't exist
- Session persistence

#### 2. Dashboard ([app/dashboard/page.tsx](student-app/app/dashboard/page.tsx))
- Lists all published tests
- Shows test details: duration, pass score, question count
- Manual refresh button to reload data
- "Start Test" button for each test

#### 3. Test Preview ([app/dashboard/tests/[id]/page.tsx](student-app/app/dashboard/tests/[id]/page.tsx))
- Shows test overview before starting
- Displays test rules and settings
- Creates attempt record when "Start Test" is clicked

#### 4. Test Taking Interface ([app/dashboard/tests/[id]/take/page.tsx](student-app/app/dashboard/tests/[id]/take/page.tsx))
- **Timer**: Real-time countdown, auto-submits when expired
- **Question Navigation**: Sidebar shows all questions with status (answered/unanswered)
- **Question Types**:
  - MCQ Single: Radio buttons
  - MCQ Multiple: Checkboxes
  - Number: Numeric input with tolerance support
  - Short Text: Text input
  - Long Text: Textarea
  - True/False: Radio buttons

- **Answer Format** (stored in response_json):
  ```json
  // MCQ Single / True-False
  {"selected": "uuid-of-option"}

  // MCQ Multiple
  {"selected": ["uuid1", "uuid2"]}

  // Number
  {"value": 42}

  // Text
  {"text": "answer text"}
  ```

- **Submission Process**:
  1. Validates all questions answered
  2. Inserts answers into attempt_answers table
  3. Updates attempt status to 'submitted' with submitted_at timestamp
  4. Calls calculate_attempt_score() function
  5. Redirects to results page

#### 5. Results Page ([app/dashboard/tests/[id]/result/page.tsx](student-app/app/dashboard/tests/[id]/result/page.tsx))
- Shows final score and percentage
- Pass/Fail status based on test pass_score threshold
- Time taken to complete test
- Detailed breakdown by question:
  - Question text
  - Student's answer
  - Correct answer
  - Points awarded
  - Correctness indicator

#### 6. History Page ([app/dashboard/history/page.tsx](student-app/app/dashboard/history/page.tsx))
- Statistics cards:
  - Total attempts
  - Completed tests
  - Tests passed
  - Average score
- Table of all attempts with:
  - Test name
  - Date submitted
  - Score percentage
  - Status (graded/submitted)
  - Pass/Fail result
  - Link to view results

#### 7. Profile Page ([app/dashboard/profile/page.tsx](student-app/app/dashboard/profile/page.tsx))
- User information display
- Logout functionality

## Grading System

### Auto-Grading Function
The `calculate_attempt_score()` PostgreSQL function ([fix_grading_function_v2.sql](fix_grading_function_v2.sql)) automatically grades submissions:

#### MCQ Single/Multiple Choice
- Compares selected option IDs with correct option IDs
- Awards full points if exact match
- Awards 0 points if incorrect
- Applies negative marking (25% deduction) if enabled in test settings

#### Number Questions
- Compares numeric answer with correct value
- Supports tolerance range (e.g., 3.14 ± 0.01)
- Awards full points if within tolerance
- Negative marking applies if enabled

#### Short/Long Text
- **Not auto-graded** (is_correct remains NULL)
- Requires manual grading by admin
- Can be implemented later with keyword matching or AI grading

#### Scoring Logic
```sql
-- For each correct answer
total_score += question.points

-- For each incorrect answer (if negative marking enabled)
total_score -= question.points * 0.25

-- Final score (cannot go below 0)
final_score = GREATEST(total_score, 0)
```

### Leaderboard Updates
After grading, the function automatically updates leaderboards:
- Tracks best score per user per test
- Records best time (for tiebreakers)
- Counts total attempts
- Only updates if new score is better

## Row Level Security (RLS)

### attempts Table Policies
```sql
-- Users can only insert their own attempts
CREATE POLICY "Users can create attempts"
  ON attempts FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can only read their own attempts
CREATE POLICY "Users can read own attempts"
  ON attempts FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own attempts
CREATE POLICY "Users can update own attempts"
  ON attempts FOR UPDATE
  USING (user_id = auth.uid());
```

### attempt_answers Table Policies
```sql
-- Users can insert answers for their own attempts
CREATE POLICY "Users can create answers"
  ON attempt_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM attempts
      WHERE attempts.id = attempt_answers.attempt_id
      AND attempts.user_id = auth.uid()
    )
  );

-- Users can read answers for their own attempts
CREATE POLICY "Users can read own answers"
  ON attempt_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM attempts
      WHERE attempts.id = attempt_answers.attempt_id
      AND attempts.user_id = auth.uid()
    )
  );

-- Users can delete their own answers (for retrying questions)
CREATE POLICY "Users can delete own answers"
  ON attempt_answers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM attempts
      WHERE attempts.id = attempt_answers.attempt_id
      AND attempts.user_id = auth.uid()
    )
  );
```

## Testing & Debugging

### Test Data
Sample data is available in [seed.sql](supabase/seed.sql):
- Admin user: admin@test.com / admin123
- Sample test: "General Knowledge Quiz"
  - 4 questions (MCQ single, MCQ multi, number, short text)
  - 5 points total
  - 60% pass score (3/5 points)
  - Negative marking enabled

### Manual Grading Test
Use [test_grading_function.sql](test_grading_function.sql) to manually test grading:
```sql
-- Get latest attempt
SELECT id, status, score, max_score FROM attempts ORDER BY created_at DESC LIMIT 1;

-- Check saved answers
SELECT aa.*, q.type, q.prompt FROM attempt_answers aa
JOIN questions q ON aa.question_id = q.id
WHERE aa.attempt_id = '<attempt-id>';

-- Run grading manually
SELECT calculate_attempt_score('<attempt-id>');

-- Check results
SELECT id, status, score, max_score FROM attempts WHERE id = '<attempt-id>';
```

### Debug Queries
Use [debug_current_attempt.sql](debug_current_attempt.sql) to inspect test submissions:
```sql
-- 1. Check attempt record
-- 2. Count saved answers
-- 3. View answer details with response_json
-- 4. Compare with correct answers
```

### Force Reset for Testing
Use [force_delete_attempts.sql](force_delete_attempts.sql) to clear all attempts:
```sql
-- Temporarily disables RLS to delete all attempts
-- Useful for testing multiple submissions
```

## Common Issues & Solutions

### Issue 1: Answers Not Saving
**Symptoms**: Submission succeeds but score is 0/0
**Cause**: RLS policies blocking INSERT operations
**Solution**: Check RLS policies don't have overly restrictive conditions

### Issue 2: Grading Function Fails
**Symptoms**: PostgreSQL error during submission
**Cause**: Ambiguous column references (multiple tables with same column name)
**Solution**: Use fully qualified column names with table aliases
```sql
-- Bad
SELECT is_correct FROM question_options WHERE ...

-- Good
SELECT qo.is_correct FROM question_options qo WHERE ...
```

### Issue 3: Wrong Score Calculation
**Symptoms**: Score doesn't match expected value
**Cause**: Answer format doesn't match what grading function expects
**Solution**: Ensure response_json follows correct format:
- MCQ: `{selected: "uuid"}` or `{selected: ["uuid1", "uuid2"]}`
- Number: `{value: 42}`
- Text: `{text: "answer"}`

### Issue 4: Dashboard Shows Old Data
**Symptoms**: UI doesn't update after database changes
**Cause**: React state caching
**Solution**: Use the "Refresh" button on dashboard or reload page

### Issue 5: Test Timer Not Working
**Symptoms**: Timer shows NaN or doesn't count down
**Cause**: Missing started_at timestamp or duration_minutes
**Solution**: Ensure attempt record has started_at and test has duration_minutes set

## API Endpoints (Supabase RPC)

### calculate_attempt_score(attempt_id_param UUID)
- **Purpose**: Auto-grades a submitted test attempt
- **Parameters**: UUID of the attempt
- **Returns**: VOID (updates attempt and leaderboard tables)
- **Usage**:
```typescript
await supabase.rpc('calculate_attempt_score', {
  attempt_id_param: attemptId
})
```

## Environment Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Student App Environment Variables
Create `student-app/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://irqphcvvvdrflsgselky.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### Database Setup
1. Run migrations to create tables
2. Apply RLS policies
3. Create grading function using [fix_grading_function_v2.sql](fix_grading_function_v2.sql)
4. Load test data using [seed.sql](supabase/seed.sql)

## Security Considerations

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Grading function runs with SECURITY DEFINER to bypass RLS for calculations

### Authentication
- Passwords are hashed by Supabase Auth
- Session tokens stored in secure cookies
- No sensitive data exposed in client-side code

### Data Validation
- Question types validated before saving
- Answer formats validated before submission
- Score calculations protected by database constraints

## Performance Optimizations

### Database Indexes
- Primary keys on all tables
- Foreign key indexes for joins
- Unique constraint on (attempt_id, question_id) in attempt_answers

### Client-Side
- Server-side rendering for initial page loads
- Client-side navigation for instant page transitions
- Optimistic UI updates where appropriate

## Future Enhancements

### Planned Features
1. **AI-powered text answer grading** - Use LLM to grade short/long text responses
2. **Real-time collaboration** - Multiple students taking test simultaneously
3. **Analytics dashboard** - Admin view of student performance trends
4. **Question bank** - Reusable question library across tests
5. **Mobile app** - Flutter application for iOS/Android
6. **Offline mode** - Take tests without internet, sync later
7. **Adaptive testing** - Adjust difficulty based on student performance
8. **Proctoring** - Webcam monitoring, tab switching detection

### Known Limitations
1. Text questions require manual grading
2. No support for image/video questions yet
3. No batch operations for admins
4. Limited analytics on student performance

## Support & Troubleshooting

### Logs
- Check browser console for client-side errors
- Check Supabase logs for database errors
- Enable verbose logging in development mode

### Database Access
- Use Supabase SQL Editor for direct database queries
- Check RLS policies if data access issues occur
- Use debug SQL scripts for inspection

### Getting Help
- Check this documentation first
- Review error messages carefully
- Use debug scripts to inspect data
- Check RLS policies if access denied

---

**Last Updated**: 2025-11-01
**Version**: 1.0
**Status**: Production Ready ✅
