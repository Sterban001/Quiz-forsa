 # Quiz-Quiz Platform Context

> **Last Updated:** 2025-12-26

## Project Overview
A comprehensive quiz management platform with separate admin and student interfaces, built with modern web technologies. Enables educators to create, manage, and grade quizzes while students can take tests and track their progress.

## Architecture

```
┌─────────────┐     ┌─────────────┐
│ Admin Panel │     │ Student App │
│  (Port 3000)│     │ (Port 3005) │
│  Next.js 14 │     │  Next.js 14 │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └───────┬───────────┘
               │
       ┌───────▼────────┐
       │  Backend API   │
       │  (Port 4000)   │
       │  Express.js    │
       └────────┬───────┘
                │
       ┌────────▼────────┐
       │   Supabase DB   │
       │   PostgreSQL    │
       └─────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Admin Panel** | Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui, Zustand |
| **Student App** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Backend API** | Express.js, TypeScript, Joi validation |
| **Database** | Supabase (PostgreSQL + Auth) |
| **Security** | Helmet, CORS, Rate Limiting (Redis), RLS Policies |

## Project Structure

```
Quiz-Quiz/
├── admin-panel/          # Admin dashboard (Next.js)
│   ├── app/              # App router pages (dashboard, login)
│   ├── components/       # Reusable UI components
│   ├── lib/              # API client, utilities
│   └── middleware.ts     # Auth middleware
│
├── student-app/          # Student interface (Next.js)
│   ├── app/              # App router pages
│   ├── lib/              # Supabase client
│   └── middleware.ts     # Auth middleware
│
├── backend-api/          # REST API server (Express.js)
│   └── src/
│       ├── config/       # Supabase, Redis config
│       ├── middleware/   # Auth, validation, rate limiting
│       ├── routes/       # API endpoint definitions
│       ├── utils/        # Helpers
│       └── validators/   # Joi schemas
│
├── supabase/
│   ├── migrations/       # Database schema (5 files)
│   └── seed.sql          # Demo data
│
└── start-all.bat         # Windows script to start all services
```

## Database Schema

**9 Core Tables:**
1. `profiles` - User profiles with roles (admin/user)
2. `tests` - Quiz configuration and settings
3. `sections` - Optional question grouping
4. `questions` - Individual questions (6 types)
5. `question_options` - Answer choices for MCQ/True-False
6. `attempts` - Student test submissions
7. `attempt_answers` - Individual answer records
8. `test_whitelist` - Private test access control
9. `leaderboards` - Best scores per user per test

**Question Types:**
- `mcq_single` - Single correct answer (auto-graded)
- `mcq_multi` - Multiple correct answers (auto-graded)
- `true_false` - Boolean question (auto-graded)
- `number` - Numeric with tolerance (auto-graded)
- `short_text` - Brief text (manual grading)
- `long_text` - Essay-style (manual grading)

## API Endpoints

30 endpoints across 6 modules:
- **Auth** (9): Login, Google OAuth, forgot password, reset password, logout, profile, OTP send/verify (legacy)
- **Tests** (6): CRUD, clone test
- **Questions** (4): CRUD with options
- **Attempts** (5): Start, answer, submit, view results
- **Users** (3): List, view, update
- **Analytics** (3): Dashboard stats, test statistics, leaderboards

## Authentication System

### Supported Login Methods
1. **Email/Password** - Traditional authentication with secure password hashing
2. **Google OAuth** - One-click sign-in with Google accounts
3. **Password Reset** - Email-based password recovery flow
4. **Account Linking** - Automatic identity linking when same email used with different providers

### Key Features
- **Multi-Provider Support**: Users can sign in with email/password OR Google OAuth
- **Automatic Account Linking**: Supabase automatically links identities when emails match
- **Admin Role Protection**: Admin panel requires `role: 'admin'` in profiles table
- **Secure Token Management**: HTTP-only cookies with SameSite protection
- **Dynamic OAuth Redirects**: Backend detects source app (admin/student) and redirects accordingly

### Authentication Flow
```
User Login → Supabase Auth → Backend Validation → Profile Check → Set Cookie → Redirect
```

**Admin Panel** (Port 3000):
- Requires admin role for access
- OAuth callback checks admin role before allowing access

**Student App** (Port 3005):
- No role restrictions
- OAuth callback redirects directly to dashboard

## Key Configuration

### Environment Variables

**Backend API** (`.env`):
- `PORT=4000`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ORIGIN=http://localhost:3000,http://localhost:3005`
- `REDIS_URL` (optional)

**Frontend Apps** (`.env.local`):
- `NEXT_PUBLIC_API_URL=http://localhost:4000/api`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Quick Start

```bash
# Option 1: Windows batch script
start-all.bat

# Option 2: Manual (3 terminals)
cd backend-api && npm run dev   # Port 4000
cd admin-panel && npm run dev   # Port 3000
cd student-app && npm run dev   # Port 3005
```

## Security Model

- Backend uses two Supabase clients:
  - `supabase` - RLS enforced (for operations where RLS policies are properly configured)
  - `supabaseAdmin` - RLS bypassed (for operations requiring admin access or where application-level filtering is used)
- JWT authentication with Supabase Auth
- Rate limiting: 500 req/15min (dev), 100 req/15min (prod)
- Row-Level Security policies on all tables
- **Attempts Table**: Uses `supabaseAdmin` with application-level user_id filtering for security
- **RLS Policies**: Configured for attempts table (select_own, select_admin, insert_user, update_own, update_admin)

## Related Documentation

- [README.md](./README.md) - Full setup guide
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Production deployment
- [SECURITY_GUIDE.md](./SECURITY_GUIDE.md) - Security implementation
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Database setup
- [MANUAL_GRADING_GUIDE.md](./MANUAL_GRADING_GUIDE.md) - Text answer grading
- [QUESTION_TYPES_GUIDE.md](./QUESTION_TYPES_GUIDE.md) - Question type reference

## Known Issues

**None** - All critical bugs have been resolved as of 2025-12-20.

## Current State

### ✅ Fully Functional Features
- **Authentication**: Email/password and Google OAuth with automatic account linking
- **Test Creation**: All 6 question types supported with full CRUD operations
- **Test Taking**: Students can start, answer, and submit tests
- **Result Display**: Correct PASSED/FAILED badges based on pass_score
- **Test History**: All user attempts display correctly with statistics
- **Manual Grading**: Text-based questions can be graded by admins
- **Leaderboards**: Top scores tracked per test
- **Rate Limiting**: Redis-based protection against abuse
- **Row Level Security**: Proper RLS policies on all tables

### 🔧 Recent Fixes (2025-12-20)
- Fixed type comparison issues with `pass_score` (string vs number)
- Resolved RLS blocking by using `supabaseAdmin` for attempts queries
- Added null-safe handling for `results_released` field
- Created comprehensive RLS policies for attempts table

### 📊 Platform Status
- **Backend API**: Running on port 4000, fully operational
- **Admin Panel**: Running on port 3000, fully operational  
- **Student App**: Running on port 3005, fully operational
- **Database**: Supabase PostgreSQL with 9 tables, all migrations applied
- **Authentication**: Multi-provider support with account linking working correctly

---

## Recent Changes

### 2025-12-26 - Full Production Vercel Deployment & Debugging
**Summary:** Successfully deployed Backend API, Student App, and Admin Panel to Vercel production environment with full cross-origin communication and serverless optimization.

**Previous State (Morning 2025-12-26):**
- **Backend**: Local Express server (~4000) only. Not configured for serverless.
- **Frontend**: Apps pointing to localhost APIs.
- **Deployment**: Zero production presence. Vercel builds failed due to missing configs.
- **Infrastructure**: Redis TCP connection hardcoded to localhost (incompatible with serverless).

### Deployment & Start Scripts
- **Backend**: Hosted on Vercel at `https://quiz-forsa.vercel.app`.
  - **Important**: Uses `api/index.ts` wrapper.
  - **Cold Start**: Redis connection has 2s timeout.
  - **OAuth**: Google Login redirects based on `?source=student/admin`. **Ignores localhost env vars in production.**
- **Admin Panel**: Hosted on Vercel at `https://quiz-forsa-pkj7.vercel.app`.
- **Student App**: Hosted on Vercel at `https://quiz-forsa-9vq9.vercel.app`.

### Recent Changes
- **2025-12-27**: Fixed Admin Panel Email Login (Cookie SameSite Issue)
  - **Context**: Email/password login worked for Student App but not Admin Panel.
  - **Root Cause**: Cookie `sameSite: 'strict'` prevented cross-origin cookie transmission.
  - **Fix**: Changed `sameSite` to `'none'` in `auth.routes.ts` to allow cookies between subdomains.
  - **Files**: `backend-api/src/routes/auth.routes.ts`.

- **2025-12-27**: Fixed Google OAuth Redirects & Supabase Config
  - **Context**: Users were being redirected to localhost after Google Login.
  - **Fixes**:
    1.  Updated Backend `auth.routes.ts` to ignore `localhost` in environment variables.
    2.  Added explicit `?source` query parameter to Student/Admin login flows.
    3.  Corrected Supabase "Site URL" to Production Admin URL.
    4.  Whitelisted Vercel production URLs in Supabase Redirects.
  - **Files**: `backend-api/src/routes/auth.routes.ts`, `student-app/app/login/page.tsx`, `admin-panel/app/login/page.tsx`.

- **2025-12-27**: Vercel Backend Deployment Fixes
  - **Context**: Initial deployment failed due to "Invalid Export" and DB timeouts.
**Current State (Evening 2025-12-26):**
- **Backend**: Deployed to Vercel Serverless (`api/index.ts` handler).
    - **Live URL**: `https://quiz-forsa.vercel.app`
    - **Optimization**: Zero-config rewrites, cold-start protection (conditional Redis).
- **Frontend**:
    - **Student App**: `https://quiz-forsa-9vq9.vercel.app`
    - **Admin Panel**: `https://quiz-forsa-pkj7.vercel.app`
- **Security**: CORS Allow-List enforced for production domains.
- **Stability**: Robust Redis connection logic (timeouts + skip localhost in prod) prevents 504 server hangs.

**Changes & Fixes Implemented:**
1.  **Serverless Conversion**:
    -   Created `api/index.ts` to wrap Express app in a Vercel handler function.
    -   Refactored `src/index.ts` to use Named Exports (`export { app }`) to fix TypeScript interop crashes.
    -   Disabled `tsc` build in `package.json` to let Vercel handle serverless compilation.
    -   Created `vercel.json` with rewrite rules for standard Express routing.
2.  **Crash Debugging**:
    -   Fixed `FUNCTION_INVOCATION_FAILED` by adding `api/` to `tsconfig.json` include path.
    -   Fixed `Invalid export found` by switching from default to named exports.
    -   Fixed `504 Gateway Timeout` by adding 2s timeout to Redis connection and skipping localhost connection in production env.
3.  **Environment Configuration**:
    -   Updated `CORS_ORIGIN` to include live Vercel frontend URLs.
    -   Added `FRONTEND_URL` to backend to fix Google OAuth redirecting to localhost.
    -   Verified `SUPABASE_URL` interaction (using standard client).

**Files Affected:**
-   `backend-api/vercel.json` (New)
-   `backend-api/api/index.ts` (New)
-   `backend-api/src/index.ts` (Refactored)
-   `backend-api/src/config/redis.ts` (Hardened)
-   `backend-api/tsconfig.json` (Updated)
-   `backend-api/package.json` (Build script updated)
-   `backend-api/src/routes/auth.routes.ts` (Observed)

### 2025-12-26 - Vercel Configuration

### 2025-12-20 - Result Display and RLS Policy Fixes
**Summary:** Fixed critical bugs preventing test results from displaying correctly and attempts from loading

**Issues Found:**
1. **FAILED Badge Showing on Passed Tests**: Tests with 100% score incorrectly showed "FAILED" badge
2. **Failed to Load Results Error**: Clicking "View Details" on attempts resulted in error
3. **Attempts Not Showing in History**: User test history showed "0 Total Attempts" despite attempts existing in database
4. **RLS Policy Blocking Queries**: Row Level Security policies were blocking legitimate API queries

**Root Causes:**
1. **Type Comparison Issue**: `pass_score` from PostgreSQL NUMERIC type was returned as string, causing incorrect `>=` comparisons
2. **Undefined Field Handling**: New `results_released` field was `undefined` for existing tests, breaking conditional logic
3. **Missing API Fields**: Backend API wasn't selecting `pass_score` and `results_released` from tests table
4. **RLS Authentication Context**: Backend used `supabase` client without user auth context, causing RLS to block all queries

**Changes:**

*Student App Frontend:*
- `app/dashboard/history/page.tsx` - Fixed pass/fail calculation by converting `pass_score` to Number in stats (line 78-81) and table rows (line 196)
- `app/dashboard/tests/[id]/result/page.tsx` - Fixed `isResultsPending` logic to handle undefined `results_released` (line 64) and pass/fail calculation (line 67)

*Backend API:*
- `src/routes/attempt.routes.ts` - Changed from `supabase` to `supabaseAdmin` client to bypass RLS (line 18), added `pass_score` and `results_released` to tests selection (line 20)

*Database Migrations:*
- `supabase/migrations/05_add_results_release.sql` - Added `results_released` boolean and `results_release_date` timestamp columns to tests table
- `supabase/migrations/06_attempts_rls_policies.sql` - NEW: Created RLS policies for attempts table (select_own, select_admin, insert_own, update_own, update_admin)

**Context/Reasoning:**
- PostgreSQL NUMERIC types are returned as strings by Supabase client, requiring explicit Number() conversion for comparisons
- RLS policies were enabled on attempts table but no policies existed, causing all queries to be blocked by default
- Using `supabaseAdmin` bypasses RLS while still maintaining security through application-level filtering by user_id
- Null-safe checks for new fields ensure backward compatibility with existing test data

**Verified Working:**
- ✅ PASSED/FAILED badges display correctly based on score percentage vs pass_score
- ✅ "View Details" button successfully loads attempt details
- ✅ Test history shows all user attempts with correct statistics
- ✅ Account linking works - same email with different providers (email/password + Google OAuth) links to same account

**Files Affected:**
- Modified: `student-app/app/dashboard/history/page.tsx`
- Modified: `student-app/app/dashboard/tests/[id]/result/page.tsx`
- Modified: `backend-api/src/routes/attempt.routes.ts`
- Created: `supabase/migrations/05_add_results_release.sql`
- Updated: `context.md` - Added comprehensive documentation of bug fixes and current state

### 2025-12-19 - Authentication System Overhaul
**Summary:** Modernized authentication with Google OAuth, password reset, and account linking

**Changes:**
- **Removed OTP Login**: Simplified authentication by removing OTP-based login from both admin panel and student app
- **Added Google OAuth**: Integrated "Sign in with Google" for one-click authentication
- **Password Reset Flow**: Implemented forgot password and reset password pages with email verification
- **Account Linking**: Automatic identity linking prevents duplicate accounts when same email used with different providers
- **Dynamic OAuth Redirects**: Backend detects source app (port 3000 vs 3005) and redirects accordingly
- **Enhanced Security**: Added user-friendly error messages and improved token handling

**Context/Reasoning:**
- OTP login was redundant with email/password and Google OAuth
- Google OAuth provides better UX and reduces friction for new users
- Password reset is essential for user account recovery
- Account linking ensures data consistency across authentication methods
- Dynamic redirects allow single OAuth configuration for multiple apps

**Files Affected:**

*Admin Panel:*
- `app/login/page.tsx` - Removed OTP, added Google OAuth button and forgot password link
- `app/forgot-password/page.tsx` - NEW: Password reset request page
- `app/reset-password/page.tsx` - NEW: Password reset confirmation page
- `app/auth/callback/page.tsx` - NEW: OAuth callback with admin role check
- `middleware.ts` - Added public routes for auth pages
- `lib/api/client.ts` - Added forgotPassword and resetPassword methods

*Student App:*
- `app/login/page.tsx` - Removed OTP, added Google OAuth and forgot password
- `app/forgot-password/page.tsx` - NEW: Password reset request page
- `app/reset-password/page.tsx` - NEW: Password reset confirmation page
- `app/auth/callback/page.tsx` - NEW: OAuth callback (no admin check)
- `middleware.ts` - Added public routes for auth pages

*Backend API:*
- `src/routes/auth.routes.ts` - Added Google OAuth, forgot password, and reset password endpoints with dynamic redirect logic
- `src/validators/auth.validator.ts` - Added validation schemas for new endpoints

*Configuration:*
- Google Cloud Console - OAuth credentials configured
- Supabase Dashboard - Google provider enabled with client ID and secret

### 2025-12-18 - Documentation Cleanup
**Summary:** Consolidated documentation files and created context.md

**Changes:**
- Created `context.md` with comprehensive project overview
- Removed redundant session summary and cleanup documentation files
- Kept essential documentation: README, deployment, security, setup guides

**Files Affected:**
- Created: `context.md`
- Removed: `SESSION_SUMMARY.md`, `SESSION_SUMMARY_2025-11-25.md`, `CLEANUP_SUMMARY.md`, `QUICK_REFERENCE.md`, `SETUP_INSTRUCTIONS.md`
