# 🚀 Setup Instructions for Your Supabase Instance

**Project ID:** `shjzrrqyoqieqnvfngip`
**Project URL:** https://shjzrrqyoqieqnvfngip.supabase.co

## ✅ Environment Variables Updated

I've already updated all three applications with your Supabase credentials:

- ✅ [backend-api/.env](backend-api/.env:5) - Backend API configuration
- ✅ [admin-panel/.env.local](admin-panel/.env.local:2) - Admin Panel configuration
- ✅ [student-app/.env.local](student-app/.env.local:1) - Student App configuration

## ⚠️ Action Required: Get Service Role Key

You need to add the **service_role key** to the backend API:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/shjzrrqyoqieqnvfngip
2. Navigate to **Settings** → **API**
3. Scroll down to **Project API keys**
4. Copy the **service_role** key (NOT the anon key - it's a different one)
5. Open [backend-api/.env](backend-api/.env:7)
6. Replace `YOUR_SERVICE_ROLE_KEY_HERE` with the actual service role key

**Important:** The service role key is secret and should never be exposed to frontend apps!

## 📊 Step 1: Run Database Migrations

You need to run 4 migration files in your Supabase SQL Editor. **Run them in order!**

### Open SQL Editor

1. Go to https://supabase.com/dashboard/project/shjzrrqyoqieqnvfngip/sql
2. Click "New query" for each migration

### Migration 1: Schema (Tables & Indexes)

**File:** [supabase/migrations/01_schema.sql](supabase/migrations/01_schema.sql:1)

1. Open the file in your IDE
2. Copy **all contents** (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click **Run** or press `Ctrl+Enter`
5. ✅ Verify: Should see "Success. No rows returned"

**Creates:** 9 tables (profiles, tests, sections, questions, question_options, attempts, attempt_answers, test_whitelist, leaderboards)

### Migration 2: Row-Level Security

**File:** [supabase/migrations/02_rls_policies.sql](supabase/migrations/02_rls_policies.sql:1)

1. Copy all contents
2. Paste into a new SQL Editor query
3. Click **Run**
4. ✅ Verify: Should complete without errors

**Creates:** 30+ RLS policies for data security

### Migration 3: Functions & Triggers

**File:** [supabase/migrations/03_functions.sql](supabase/migrations/03_functions.sql:1)

1. Copy all contents
2. Paste into a new SQL Editor query
3. Click **Run**
4. ✅ Verify: Should complete without errors

**Creates:**
- `handle_new_user()` - Auto-creates profile when user signs up
- `calculate_attempt_score()` - Auto-grading algorithm
- `is_test_available_to_user()` - Access control
- Various triggers

### Migration 4: Analytics Views

**File:** [supabase/migrations/04_views.sql](supabase/migrations/04_views.sql:1)

1. Copy all contents
2. Paste into a new SQL Editor query
3. Click **Run**
4. ✅ Verify: Should complete without errors

**Creates:** 4 views (test_statistics, question_difficulty, user_performance, recent_attempts)

## 🔍 Verify Database Setup

Run this query in SQL Editor to verify everything was created:

```sql
-- Check tables (should return 9 rows)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check functions (should return 4)
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Check views (should return 4)
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS policies (should return 30+)
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public';
```

**Expected results:**
- ✅ 9 tables
- ✅ 4 functions
- ✅ 4 views
- ✅ 30+ policies

## 👤 Step 2: Create Admin User

### Option A: Via Supabase Dashboard (Recommended)

1. Go to **Authentication** → **Users**: https://supabase.com/dashboard/project/shjzrrqyoqieqnvfngip/auth/users
2. Click **Add user** → **Create new user**
3. Fill in:
   - **Email:** Your admin email (e.g., `admin@example.com`)
   - **Password:** Choose a strong password
   - **Auto Confirm User:** ✅ Check this box
4. Click **Create user**
5. Copy the user's **UUID** (the ID column)
6. Go back to SQL Editor and run:

```sql
-- Replace 'YOUR_USER_UUID' with the actual UUID you copied
UPDATE profiles
SET role = 'admin'
WHERE id = 'YOUR_USER_UUID';

-- Verify admin was created
SELECT id, role, display_name FROM profiles WHERE role = 'admin';
```

### Option B: Via Student App Signup

1. Start all services (see Step 3)
2. Go to http://localhost:3005
3. Sign up with your admin email
4. Go to Supabase SQL Editor and run:

```sql
-- Find your user
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5;

-- Promote to admin (replace with your ID)
UPDATE profiles
SET role = 'admin'
WHERE id = 'YOUR_USER_UUID';
```

## 🎯 Step 3: Start All Services

### Option A: Using Batch Script (Windows)

```bash
# From project root
start-all.bat
```

This will open 3 terminal windows:
- Backend API (port 4000)
- Admin Panel (port 3000)
- Student App (port 3005)

### Option B: Manual Start (3 terminals)

**Terminal 1 - Backend API:**
```bash
cd backend-api
npm run dev
```

**Terminal 2 - Admin Panel:**
```bash
cd admin-panel
npm run dev
```

**Terminal 3 - Student App:**
```bash
cd student-app
npm run dev
```

## 🧪 Step 4: Test the Setup

### Test 1: Admin Panel Login

1. Open http://localhost:3000
2. Login with your admin credentials
3. ✅ Should see admin dashboard

### Test 2: Create a Test

1. Go to **Tests** → **Create New Test**
2. Fill in:
   - Title: "Sample Quiz"
   - Description: "Testing the setup"
   - Time Limit: 10 minutes
   - Pass Score: 70
3. Click **Save**
4. ✅ Test should be created

### Test 3: Add Questions

1. Open your test
2. Click **Add Question**
3. Select "MCQ Single Choice"
4. Fill in:
   - Prompt: "What is 2 + 2?"
   - Options: 3, 4, 5, 6
   - Mark "4" as correct
   - Points: 1
5. Click **Save**
6. ✅ Question should be added

### Test 4: Publish Test

1. Change test status to **Published**
2. ✅ Test is now visible to students

### Test 5: Student Takes Test

1. Open http://localhost:3005 (Student App)
2. Sign up / login as a student
3. Find your published test
4. Click **Start Test**
5. Answer the question
6. Submit test
7. ✅ Should see score immediately

### Test 6: View Results (Admin)

1. Back to Admin Panel
2. Go to **Attempts**
3. ✅ Should see the student's submission
4. Click to view details
5. ✅ Should see auto-graded score

## 📊 Optional: Load Demo Data

If you want sample tests and questions for testing:

1. First, create an admin user (Step 2)
2. Update [supabase/seed.sql](supabase/seed.sql:57) to use your admin's UUID:
   ```sql
   -- Find this line (appears 3 times):
   created_by
   ) VALUES (
     ...
     (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
   );
   ```
3. Copy entire contents of `supabase/seed.sql`
4. Paste into Supabase SQL Editor
5. Run the query
6. ✅ Should create 2 sample tests with questions

**Demo content:**
- General Knowledge Quiz (5 questions)
- Basic Mathematics (5 questions)
- Programming Fundamentals (draft, no questions)

## 🐛 Troubleshooting

### Backend API won't start

**Error:** `Port 4000 already in use`
- Kill the process using port 4000
- Or change PORT in [backend-api/.env](backend-api/.env:1)

**Error:** `Supabase connection failed`
- Check your service role key in [backend-api/.env](backend-api/.env:7)
- Verify Supabase URL is correct

### Admin can't login

1. Check admin user exists:
   ```sql
   SELECT * FROM profiles WHERE role = 'admin';
   ```
2. If empty, follow Step 2 to create admin user

### Students can't see tests

**Check test status:**
```sql
SELECT id, title, status, visibility FROM tests;
```
- Status should be `'published'`
- Visibility should be `'public'`

**Update if needed:**
```sql
UPDATE tests SET status = 'published', visibility = 'public' WHERE id = 'YOUR_TEST_ID';
```

### Scoring not working

1. Check function exists:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'calculate_attempt_score';
   ```
2. If empty, re-run [03_functions.sql](supabase/migrations/03_functions.sql:1)

3. Test scoring manually:
   ```sql
   -- Find an attempt
   SELECT id FROM attempts WHERE status = 'submitted' LIMIT 1;

   -- Run scoring
   SELECT calculate_attempt_score('YOUR_ATTEMPT_ID');

   -- Check result
   SELECT * FROM attempts WHERE id = 'YOUR_ATTEMPT_ID';
   ```

### CORS Errors

If you see CORS errors in browser console:

1. Check [backend-api/.env](backend-api/.env:10):
   ```bash
   CORS_ORIGIN=http://localhost:3000,http://localhost:3005
   ```
2. Restart backend API

## ✅ Setup Complete Checklist

Before you start developing, verify:

- [ ] All 4 migrations ran successfully
- [ ] Service role key added to backend .env
- [ ] At least 1 admin user created
- [ ] Backend API starts without errors (port 4000)
- [ ] Admin Panel starts and you can login (port 3000)
- [ ] Student App starts and you can register (port 3005)
- [ ] Created a test with questions
- [ ] Published the test
- [ ] Student can take the test
- [ ] Auto-grading works
- [ ] Results show in admin panel

## 🎉 You're Ready!

Your Quiz Management Platform is now fully set up with a fresh Supabase database!

**Next steps:**
- Create more tests and questions
- Invite students to register
- Monitor analytics in admin dashboard
- Review [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md:1) for production deployment

**Documentation:**
- [README.md](README.md:1) - Platform overview
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md:1) - Detailed Supabase guide
- [SECURITY_GUIDE.md](SECURITY_GUIDE.md:1) - Security features
- [MANUAL_GRADING_GUIDE.md](MANUAL_GRADING_GUIDE.md:1) - Grade text answers

---

**Need help?** Check the troubleshooting section above or review the documentation files.
