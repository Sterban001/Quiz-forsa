# Quiz Platform - Deployment Guide

## Overview

This guide will help you deploy the Quiz Platform to a new environment with a fresh Supabase instance.

---

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- Git installed
- Basic command line knowledge

---

## Step 1: Create New Supabase Project

1. **Go to** [https://supabase.com](https://supabase.com)
2. **Sign in** or create a new account
3. **Click** "New Project"
4. **Fill in:**
   - Organization: Select or create one
   - Project Name: `quiz-platform` (or any name)
   - Database Password: **Save this securely!**
   - Region: Choose closest to your users
5. **Click** "Create new project"
6. **Wait** for the project to finish setting up (~2 minutes)

---

## Step 2: Get Supabase Credentials

Once your project is ready:

1. **Go to** Project Settings (gear icon in sidebar)
2. **Click** "API" section
3. **Copy these values:**
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

---

## Step 3: Run Database Migrations

### Option A: Using Supabase Dashboard (Recommended for clients)

1. **Go to** SQL Editor in Supabase Dashboard
2. **Click** "New Query"
3. **Run migrations in this exact order:**

#### Migration 1: Initial Schema
```sql
-- Copy and paste the ENTIRE contents of:
-- supabase/migrations/20240101000000_initial_schema.sql
```

#### Migration 2: Add Test Type
```sql
-- Copy and paste the ENTIRE contents of:
-- supabase/migrations/add-test-type.sql
```

#### Migration 3: Fix True/False Labels (if needed)
```sql
-- Copy and paste the ENTIRE contents of:
-- fix-true-false-labels.sql
```

4. **Click** "Run" for each migration
5. **Verify** tables were created:
   - Go to Table Editor
   - You should see: profiles, tests, questions, question_options, attempts, attempt_answers

### Option B: Using Supabase CLI (For developers)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

---

## Step 4: Set Up Redis Cloud (Optional but Recommended)

Redis provides caching and persistent rate limiting for better performance and security.

### Why Redis?
- ✅ Rate limiting works across server restarts
- ✅ Supports multiple server instances
- ✅ Prevents abuse (login attempts, OTP spam, etc.)
- ✅ FREE tier: 30MB (enough for 10,000+ users)

### Setup Steps

1. **Go to** [https://redis.com/try-free/](https://redis.com/try-free/)
2. **Sign up** (no credit card required)
3. **Create database:**
   - Plan: **Free**
   - Region: **US-East-1** (or closest to your users)
   - Name: `quiz-platform-cache`
4. **Wait** 1-2 minutes for database creation
5. **Copy connection details:**
   - Click on your database
   - Find the connection string (looks like):
   ```
   redis://default:PASSWORD@redis-xxxxx.ec2.cloud.redislabs.com:PORT
   ```

### Costs
- **Free tier:** $0/month forever (30MB memory, 30 connections)
- **Upgrade options:** $5/mo for 100MB (only if you need more)

**For 10,000 active users, free tier is sufficient!**

---

## Step 5: Configure Environment Variables

### For Backend API

1. **Navigate to** `backend-api` folder
2. **Create** `.env` file (copy from `.env.example`)
3. **Add:**

```env
PORT=4000
NODE_ENV=development

# Supabase
SUPABASE_URL=your-project-url-here
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3005

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Redis (optional - app works without it)
# For local development: redis://localhost:6379
# For Redis Cloud: redis://default:PASSWORD@ENDPOINT:PORT
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_ENDPOINT:YOUR_PORT
```

### For Admin Panel

1. **Navigate to** `admin-panel` folder
2. **Create** `.env.local` file
3. **Add:**

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### For Student App

1. **Navigate to** `student-app` folder
2. **Create** `.env.local` file
3. **Add:**

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**⚠️ IMPORTANT:** Replace placeholder values with actual credentials from Steps 2 and 4.

---

## Step 6: Install Dependencies

Open three terminal windows:

### Terminal 1: Backend API
```bash
cd backend-api
npm install
```

### Terminal 2: Admin Panel
```bash
cd admin-panel
npm install
```

### Terminal 3: Student App
```bash
cd student-app
npm install
```

---

## Step 7: Create First Admin User

### Method 1: Via Supabase Dashboard

1. **Go to** Authentication → Users in Supabase Dashboard
2. **Click** "Add user" → "Create new user"
3. **Fill in:**
   - Email: `admin@example.com` (or your admin email)
   - Password: Set a secure password
   - Auto Confirm User: ✅ **Check this**
4. **Click** "Create user"
5. **Copy the User ID** (UUID)

6. **Go to** SQL Editor
7. **Run this query** (replace `USER_ID_HERE`):

```sql
-- Insert admin profile
INSERT INTO profiles (id, email, role, display_name)
VALUES (
  'USER_ID_HERE',
  'admin@example.com',
  'admin',
  'Admin User'
);
```

### Method 2: Via Sign Up (Then Manual Update)

1. **Start the admin panel** (see Step 7)
2. **Go to** signup page
3. **Create an account**
4. **Go to** Supabase Dashboard → Table Editor → profiles
5. **Find your profile** and edit it
6. **Change** `role` from `student` to `admin`
7. **Save**
8. **Refresh** the admin panel

---

## Step 8: Start Development Servers

### Terminal 1: Backend API (Port 4000)
```bash
cd backend-api
npm run dev
```

**Look for:**
```
Redis Client: Connected and ready
🚀 Backend API server running on http://localhost:4000
📊 Environment: development
💾 Redis: Connected ✓
```

**Test:** Open http://localhost:4000/health
```json
{
  "status": "ok",
  "message": "Backend API is running",
  "redis": "connected"
}
```

### Terminal 2: Admin Panel (Port 3000)
```bash
cd admin-panel
npm run dev
```

### Terminal 3: Student App (Port 3005)
```bash
cd student-app
npm run dev
```

**Access:**
- Backend API: [http://localhost:4000](http://localhost:4000)
- Admin Panel: [http://localhost:3000](http://localhost:3000)
- Student App: [http://localhost:3005](http://localhost:3005)

---

## Step 9: Verify Installation

### Backend API Checklist
- [ ] Server starts without errors
- [ ] Redis shows "Connected ✓" (or "Not available" if skipped)
- [ ] Health endpoint returns correct response
- [ ] No errors in console

### Admin Panel Checklist
- [ ] Can log in with admin credentials
- [ ] Dashboard shows stats (0 tests, 0 attempts, etc.)
- [ ] Can create a new test
- [ ] Can add questions to test
- [ ] Can publish test

### Student App Checklist
- [ ] Can sign up as a new student
- [ ] Can see published tests
- [ ] Can take a test
- [ ] Can submit and see results (auto-graded)
- [ ] Can see "Pending Review" for manual-graded tests

---

## Step 10: Production Deployment (Optional)

### Deploy Backend API

#### Option 1: Railway.app (Recommended - includes free Redis)
1. Go to [https://railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Add Redis service (free addon)
4. Add environment variables (from your `.env`)
5. Deploy

#### Option 2: Render.com
1. Go to [https://render.com](https://render.com)
2. Create Web Service from GitHub
3. Add Redis Cloud URL to environment
4. Deploy

### Deploy Admin Panel (Vercel)

```bash
cd admin-panel
npx vercel
```

Add environment variables in Vercel Dashboard:
- `NEXT_PUBLIC_API_URL` (your backend URL)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Deploy Student App (Vercel)

```bash
cd student-app
npx vercel
```

Same environment variables as admin panel.

### Alternative: Deploy to Other Platforms

- **Netlify:** Works similarly to Vercel
- **Railway:** Good for full-stack apps
- **DigitalOcean App Platform:** Affordable option
- **AWS Amplify:** If using AWS ecosystem

---

## Configuration Options

### Email Settings (Supabase)

1. **Go to** Authentication → Email Templates
2. **Customize:**
   - Confirmation email
   - Password reset email
   - Magic link email

3. **Go to** Authentication → Providers
4. **Configure:**
   - Enable/disable email/password
   - Enable social providers (Google, GitHub, etc.)

### Security Settings

1. **Go to** Authentication → Policies
2. **Verify RLS policies** are enabled on all tables
3. **Review** the policies created by migrations

### Storage (Optional)

If you want to add file uploads later:

1. **Go to** Storage in Supabase Dashboard
2. **Create buckets** as needed
3. **Set policies** for access control

---

## Troubleshooting

### Redis shows "disconnected" or "Not available"
- ✅ Check `REDIS_URL` is correctly formatted
- ✅ Verify Redis Cloud database is active
- ✅ Test connection: `redis-cli -u YOUR_REDIS_URL ping`
- ✅ App still works without Redis (graceful degradation)
- ✅ Restart backend after changing `.env`

### Cannot connect to Supabase
- ✅ Check environment variables are correct
- ✅ Verify Supabase project is active
- ✅ Check for typos in URL/keys
- ✅ Restart dev servers after changing .env

### Migrations fail
- ✅ Run migrations in order (initial schema first)
- ✅ Check for syntax errors
- ✅ Verify you have database permissions
- ✅ Try running one migration at a time

### Cannot log in
- ✅ Verify user exists in Authentication → Users
- ✅ Check profile role is set to 'admin' or 'student'
- ✅ Confirm email is verified
- ✅ Try password reset if needed

### Ports already in use
```bash
# Admin panel (change from 3000)
npm run dev -- -p 3001

# Student app (change from 3005)
npm run dev -- -p 3006
```

### Build errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

---

## Database Backup & Restore

### Backup
```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Or via Dashboard
# Go to Database → Backups → Download
```

### Restore
```bash
# Using Supabase CLI
supabase db reset

# Then run your backup
psql -h your-db-host -U postgres -d postgres -f backup.sql
```

---

## Security Best Practices

### For Production

1. **Environment Variables**
   - ✅ Never commit `.env.local` files
   - ✅ Use production keys only in production
   - ✅ Rotate keys if exposed

2. **Database**
   - ✅ Row Level Security (RLS) enabled on all tables
   - ✅ Regular backups scheduled
   - ✅ Monitor query performance

3. **Authentication**
   - ✅ Strong password requirements
   - ✅ Enable email confirmation
   - ✅ Consider 2FA for admin users
   - ✅ Set session timeout

4. **Application**
   - ✅ Use HTTPS in production
   - ✅ Set proper CORS policies
   - ✅ Input validation on all forms
   - ✅ Rate limiting on API endpoints

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check for pending reviews (manual-graded tests)

**Weekly:**
- Review database performance
- Check storage usage
- Backup database

**Monthly:**
- Update dependencies (`npm outdated`)
- Review security advisories
- Clean up old test attempts (if desired)

---

## Support & Documentation

### Key Files to Share with Client

1. **This deployment guide** (`DEPLOYMENT_GUIDE.md`)
2. **Manual grading guide** (`MANUAL_GRADING_GUIDE.md`)
3. **Test types guide** (`TEST_TYPES_IMPLEMENTATION.md`)
4. **Project overview** (`README.md`)

### Getting Help

- **Supabase Docs:** [https://supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs:** [https://nextjs.org/docs](https://nextjs.org/docs)
- **GitHub Issues:** Create issues for bugs or feature requests

---

## Checklist for Client Handoff

- [ ] New Supabase project created
- [ ] All migrations run successfully
- [ ] Admin user created and tested
- [ ] Environment variables configured
- [ ] Both apps running locally
- [ ] Test the full workflow (create test → student takes it → view results)
- [ ] Documentation provided
- [ ] Production deployment (if applicable)
- [ ] Client has access to Supabase dashboard
- [ ] Client knows how to create admin users
- [ ] Client knows how to grade manual tests

---

## Post-Deployment

### Training the Client

Ensure the client understands:
1. How to create tests (auto-graded vs manual-graded)
2. How to add questions and set correct answers
3. How to publish tests
4. How to review and grade manual submissions
5. How to view student attempts and analytics

### Ongoing Support

Consider providing:
- Video tutorials
- Admin user guide
- FAQ document
- Support contact information

---

**Version:** 1.0
**Last Updated:** 2025-11-02
**Status:** Production Ready ✅
