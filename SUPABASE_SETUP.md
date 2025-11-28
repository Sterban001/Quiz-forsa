# Supabase Database Setup Guide

Complete guide to setting up a fresh Supabase database for the Quiz Management Platform.

## Prerequisites

- Supabase account (free tier works fine)
- Access to Supabase Dashboard
- Database credentials (provided by Supabase)

## Setup Steps

### Step 1: Create a New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details:
   - **Name**: Quiz Platform (or your preferred name)
   - **Database Password**: Choose a strong password (save it securely)
   - **Region**: Select closest to your users
4. Wait for project initialization (~2 minutes)

### Step 2: Run Database Migrations

Navigate to **SQL Editor** in the Supabase Dashboard and run the migration files in order:

#### Migration 1: Core Schema (Tables)

1. Open `supabase/migrations/01_schema.sql`
2. Copy the entire contents
3. Paste into SQL Editor
4. Click "Run" or press `Ctrl+Enter`
5. Verify success (should see "Success. No rows returned")

**What this creates:**
- 9 core tables (profiles, tests, questions, attempts, etc.)
- All indexes for performance
- Column constraints and foreign keys

#### Migration 2: Row-Level Security Policies

1. Open `supabase/migrations/02_rls_policies.sql`
2. Copy and paste into SQL Editor
3. Run the query
4. Verify success

**What this creates:**
- Enables RLS on all tables
- 30+ security policies for data access control
- Admin and user role-based permissions

#### Migration 3: Functions and Triggers

1. Open `supabase/migrations/03_functions.sql`
2. Copy and paste into SQL Editor
3. Run the query
4. Verify success

**What this creates:**
- `handle_new_user()` - Auto-creates profile on signup
- `update_updated_at_column()` - Auto-updates timestamps
- `is_test_available_to_user()` - Access control helper
- `calculate_attempt_score()` - Automatic grading algorithm
- Triggers for automated operations

#### Migration 4: Analytics Views

1. Open `supabase/migrations/04_views.sql`
2. Copy and paste into SQL Editor
3. Run the query
4. Verify success

**What this creates:**
- `test_statistics` - Aggregated test performance data
- `question_difficulty` - Question performance metrics
- `user_performance` - Per-user statistics
- `recent_attempts` - Latest submissions with pass/fail

### Step 3: (Optional) Load Demo Data

**Warning:** Only run this in development/testing environments!

1. Open `supabase/seed.sql`
2. **First**, create an admin user via Authentication (see Step 4)
3. Update the seed file's `created_by` references with your admin user ID
4. Copy and paste into SQL Editor
5. Run the query

**What this creates:**
- 3 demo tests (2 published, 1 draft)
- 10 sample questions across different types
- Ready-to-test content

### Step 4: Create Admin User

You need at least one admin user to manage the platform.

#### Method A: Via Supabase Dashboard

1. Go to **Authentication** > **Users**
2. Click "Add User" > "Create new user"
3. Fill in:
   - Email: `admin@example.com` (or your email)
   - Password: Choose strong password
   - Auto Confirm User: ✅ Enable
4. Click "Create user"
5. Copy the user's UUID
6. Go to **SQL Editor** and run:
   ```sql
   UPDATE profiles
   SET role = 'admin'
   WHERE id = 'PASTE_USER_UUID_HERE';
   ```

#### Method B: Via Sign-up Flow

1. Use your app's signup feature
2. Register with your admin email
3. Follow SQL command above to promote to admin

### Step 5: Get API Credentials

1. Go to **Project Settings** > **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (for frontend apps)
   - **service_role** key (for backend API only - keep secret!)

### Step 6: Configure Environment Variables

#### Backend API (.env)

Create `backend-api/.env`:

```bash
PORT=4000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3005

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

#### Admin Panel (.env.local)

Create `admin-panel/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Student App (.env.local)

Create `student-app/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Verification

### Check Tables Created

Run this query in SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected output** (9 tables):
- attempt_answers
- attempts
- leaderboards
- profiles
- question_options
- questions
- sections
- test_whitelist
- tests

### Check RLS Policies

```sql
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Should show 30+ policies across all tables.

### Check Functions

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

**Expected output:**
- calculate_attempt_score
- handle_new_user
- is_test_available_to_user
- update_updated_at_column

### Check Views

```sql
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected output:**
- question_difficulty
- recent_attempts
- test_statistics
- user_performance

### Test Authentication Flow

1. Go to your Student App at `http://localhost:3005`
2. Try signing up with a new account
3. Check Supabase Dashboard > **Authentication** > **Users**
4. Verify user appears
5. Check **Table Editor** > **profiles**
6. Verify profile was auto-created with `role = 'user'`

## Troubleshooting

### Error: "relation does not exist"

**Cause:** Tables not created yet

**Solution:** Run migration 01_schema.sql first

### Error: "permission denied for table"

**Cause:** RLS policies blocking access

**Solution:**
- Check if you're using the correct API key (anon key vs service role)
- Verify RLS policies are created (migration 02)
- Check if user has correct role in profiles table

### Error: "function does not exist"

**Cause:** Functions not created

**Solution:** Run migration 03_functions.sql

### Admin user can't access admin panel

**Solution:**
```sql
-- Verify admin role
SELECT id, role FROM profiles WHERE role = 'admin';

-- If no results, update user role
UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID';
```

### Scoring not working

**Solution:**
```sql
-- Test the scoring function directly
SELECT calculate_attempt_score('YOUR_ATTEMPT_ID');

-- Check if function exists
SELECT * FROM pg_proc WHERE proname = 'calculate_attempt_score';
```

### Views returning empty data

**Cause:** No attempts in database yet

**Solution:**
- Either load seed data
- Or create tests and have users take them
- Views populate automatically as data is added

## Database Maintenance

### Backup Database

Via Supabase Dashboard:
1. Go to **Database** > **Backups**
2. Click "Create backup"
3. Download when ready

### Reset Database (Development Only)

**Warning:** This deletes ALL data!

```sql
-- Drop all tables
DROP TABLE IF EXISTS leaderboards CASCADE;
DROP TABLE IF EXISTS attempt_answers CASCADE;
DROP TABLE IF EXISTS attempts CASCADE;
DROP TABLE IF EXISTS test_whitelist CASCADE;
DROP TABLE IF EXISTS question_options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop all views
DROP VIEW IF EXISTS test_statistics CASCADE;
DROP VIEW IF EXISTS question_difficulty CASCADE;
DROP VIEW IF EXISTS user_performance CASCADE;
DROP VIEW IF EXISTS recent_attempts CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS calculate_attempt_score CASCADE;
DROP FUNCTION IF EXISTS is_test_available_to_user CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Now re-run all migrations from scratch
```

### View Current Database Size

```sql
SELECT pg_size_pretty(pg_database_size(current_database()));
```

### Monitor Active Connections

```sql
SELECT count(*) as connections
FROM pg_stat_activity
WHERE datname = current_database();
```

## Production Deployment

When deploying to production:

1. **Enable Point-in-Time Recovery (PITR)**
   - Go to **Database** > **Backups**
   - Enable PITR for automatic backups

2. **Set up Connection Pooling**
   - Go to **Database** > **Connection Pooling**
   - Enable PgBouncer
   - Use pooled connection string in production

3. **Update CORS Origins**
   - Update `CORS_ORIGIN` in backend .env to production URLs

4. **Use Environment Secrets**
   - Store all keys in secure environment variables
   - Never commit .env files to git

5. **Monitor Usage**
   - Go to **Project Settings** > **Usage**
   - Watch database size, bandwidth, and API requests

## Need Help?

- **Supabase Docs**: https://supabase.com/docs
- **SQL Reference**: https://www.postgresql.org/docs/
- **Project Issues**: Check your codebase's README.md

## Summary

After completing all steps, you should have:

- ✅ 9 database tables with proper relationships
- ✅ 30+ RLS policies for security
- ✅ 4 helper functions for automation
- ✅ 4 analytics views for reporting
- ✅ At least one admin user
- ✅ Environment variables configured
- ✅ (Optional) Demo data loaded

Your Quiz Management Platform database is now ready to use!
