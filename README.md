# Quiz Management Platform

A comprehensive, enterprise-grade quiz management system with separate admin panel and student app, built with modern web technologies and strong security.

## 🏗️ Architecture

The platform uses a **fully separated architecture** with three independent applications:

```
┌─────────────┐     ┌─────────────┐
│ Admin Panel │     │ Student App │
│  (Port 3000)│     │ (Port 3005) │
│  Next.js    │     │  Next.js    │
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

**Key Benefits:**
- No direct database access from frontends
- Centralized business logic and validation
- Independent deployment and scaling
- Enhanced security through API gateway

## ✨ Features

### Admin Panel
- 📝 Create and manage tests with rich configuration
- ❓ Multiple question types: MCQ (single/multi), True/False, Number, Text
- ⚙️ Advanced settings: time limits, scheduling, access codes, negative marking
- 📊 Analytics dashboard with performance metrics
- ✏️ Manual grading interface for text answers
- 👥 User management and role control
- 📈 Real-time test statistics and leaderboards

### Student App
- 🔐 Email/Password and OTP authentication
- 🔍 Browse and search published tests
- ⏱️ Take tests with countdown timer and auto-save
- 📋 View detailed results with explanations
- 📜 Complete attempt history
- 🏆 View leaderboards

### Backend API
- 🛡️ JWT authentication with Supabase
- 🔒 Role-based access control (admin/user)
- ✅ Comprehensive input validation (Joi schemas)
- 🚦 Rate limiting with Redis
- 🌐 CORS protection for multiple origins
- 📝 Request logging and error handling
- ⚡ Auto-grading algorithm with negative marking

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **UI Components** | shadcn/ui (Admin only), Radix UI |
| **Backend** | Express.js, TypeScript |
| **Database** | Supabase (PostgreSQL + Auth + Storage) |
| **Validation** | Joi (Backend), Zod (Admin Frontend) |
| **State Management** | Zustand (Admin), React Context (Student) |
| **Security** | Helmet, CORS, Rate Limiting, RLS Policies |
| **Caching** | Redis (optional but recommended) |

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Supabase Account** (free tier works)
- **Redis** (optional, for rate limiting)
- **Git** (for cloning the repository)

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd "Test Forsa"
```

### 2. Set Up Supabase Database

Follow the detailed guide: **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

**Summary:**
1. Create a new Supabase project
2. Run migration files in SQL Editor (4 files in `supabase/migrations/`)
3. Create an admin user
4. Copy API credentials

### 3. Configure Environment Variables

#### Backend API

Create `backend-api/.env`:

```bash
PORT=4000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# CORS (comma-separated)
CORS_ORIGIN=http://localhost:3000,http://localhost:3005

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

#### Admin Panel

Create `admin-panel/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### Student App

Create `student-app/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Install Dependencies

```bash
# Backend API
cd backend-api
npm install

# Admin Panel
cd ../admin-panel
npm install

# Student App
cd ../student-app
npm install
```

### 5. Start All Services

**Option A: Using the batch script (Windows)**

```bash
# From project root
start-all.bat
```

**Option B: Manual start (3 terminals)**

```bash
# Terminal 1: Backend API
cd backend-api
npm run dev

# Terminal 2: Admin Panel
cd admin-panel
npm run dev

# Terminal 3: Student App
cd student-app
npm run dev
```

### 6. Access Applications

- **Admin Panel**: http://localhost:3000
- **Student App**: http://localhost:3005
- **Backend API**: http://localhost:4000

**Default Admin Login:**
- Use the admin account you created in Supabase setup

## 📁 Project Structure

```
Test Forsa/
├── admin-panel/          # Admin dashboard (Next.js)
│   ├── app/              # App router pages
│   ├── components/       # Reusable UI components
│   ├── lib/              # API client, utilities
│   └── package.json
│
├── student-app/          # Student interface (Next.js)
│   ├── app/              # App router pages
│   ├── lib/              # API client, utilities
│   └── package.json
│
├── backend-api/          # REST API server (Express.js)
│   ├── src/
│   │   ├── config/       # Supabase, Redis config
│   │   ├── middleware/   # Auth, validation, rate limiting
│   │   ├── routes/       # API endpoint definitions
│   │   ├── validators/   # Joi schemas
│   │   └── index.ts      # Server entry point
│   └── package.json
│
├── supabase/
│   ├── migrations/       # Database schema migrations
│   │   ├── 01_schema.sql
│   │   ├── 02_rls_policies.sql
│   │   ├── 03_functions.sql
│   │   └── 04_views.sql
│   └── seed.sql          # Demo data (optional)
│
├── SUPABASE_SETUP.md     # Detailed database setup guide
├── DEPLOYMENT_GUIDE.md   # Production deployment instructions
├── SECURITY_GUIDE.md     # Security best practices
├── MANUAL_GRADING_GUIDE.md  # How to grade text answers
├── QUESTION_TYPES_GUIDE.md  # Question type reference
├── start-all.bat         # Windows batch script to start all services
└── README.md             # This file
```

## 🗄️ Database Schema

**9 Core Tables:**

1. **profiles** - User profiles with roles (admin/user)
2. **tests** - Quiz configuration and settings
3. **sections** - Optional question grouping
4. **questions** - Individual questions
5. **question_options** - Answer choices for MCQ/True-False
6. **attempts** - Student test submissions
7. **attempt_answers** - Individual answer records
8. **test_whitelist** - Private test access control
9. **leaderboards** - Best scores per user per test

**Key Features:**
- Row-Level Security (RLS) on all tables
- Automatic grading via `calculate_attempt_score()` function
- 4 analytics views for reporting
- Automatic profile creation on user signup

## 🔐 Security Features

- ✅ JWT authentication with secure HttpOnly cookies
- ✅ Role-based access control (RBAC)
- ✅ Row-Level Security (RLS) policies
- ✅ Input validation on all endpoints (Joi)
- ✅ Rate limiting (per-endpoint configuration)
- ✅ CORS whitelist protection
- ✅ Helmet security headers (CSP, HSTS, XSS protection)
- ✅ SQL injection prevention (parameterized queries)
- ✅ Server-side scoring (no answer tampering)

## 🎯 Question Types

| Type | Auto-Graded | Description |
|------|-------------|-------------|
| **MCQ Single** | ✅ Yes | Multiple choice, one correct answer |
| **MCQ Multiple** | ✅ Yes | Multiple choice, multiple correct answers |
| **True/False** | ✅ Yes | Boolean question with two options |
| **Number** | ✅ Yes | Numeric answer with tolerance range |
| **Short Text** | ❌ Manual | Brief text answer (requires admin grading) |
| **Long Text** | ❌ Manual | Essay-style answer (requires admin grading) |

**Scoring:**
- Correct answers award full points
- Negative marking (optional): -25% of points for incorrect answers
- Score can never go below zero
- Text answers marked as "pending" until manually graded

## 📊 API Endpoints

**26 Total Endpoints Across 6 Modules:**

- **Auth** (5): Login, OTP send/verify, logout, get profile
- **Tests** (6): CRUD operations, clone test
- **Questions** (4): CRUD operations with options
- **Attempts** (5): Start, answer, submit, view results
- **Users** (3): List, view, update profile
- **Analytics** (3): Dashboard stats, test statistics, leaderboards

All endpoints have:
- ✅ 100% input validation coverage
- ✅ Role-based authorization
- ✅ Rate limiting
- ✅ Error handling

## 🧪 Testing the Setup

### 1. Create a Test (Admin Panel)

1. Login as admin at http://localhost:3000
2. Go to **Tests** > **Create New Test**
3. Fill in title, description, time limit, pass score
4. Save as draft

### 2. Add Questions

1. Open your draft test
2. Click **Add Question**
3. Select question type (MCQ, Number, Text, etc.)
4. Enter question prompt, options, correct answer(s)
5. Set points value
6. Save question

### 3. Publish Test

1. Review all questions
2. Change test status to **Published**
3. Test is now visible to students

### 4. Take Test (Student App)

1. Register/login at http://localhost:3005
2. Browse tests and select your published test
3. Click **Start Test**
4. Answer questions
5. Submit test
6. View results immediately

### 5. View Analytics (Admin Panel)

1. Go to **Analytics** dashboard
2. View test statistics
3. Check question difficulty
4. Review leaderboards

## 🌐 Production Deployment

See **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for detailed instructions.

**Quick Checklist:**
- [ ] Deploy backend to Railway/Render/DigitalOcean
- [ ] Deploy frontends to Vercel
- [ ] Set up Supabase production project
- [ ] Configure production environment variables
- [ ] Update CORS origins
- [ ] Enable HTTPS (SSL certificates)
- [ ] Set up Redis for production
- [ ] Configure custom domain (optional)
- [ ] Enable Supabase PITR backups
- [ ] Set up monitoring and logging

## 📚 Documentation

- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Database setup and configuration
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment
- **[SECURITY_GUIDE.md](./SECURITY_GUIDE.md)** - Security implementation details
- **[SESSION_SUMMARY.md](./SESSION_SUMMARY.md)** - Schema alignment session (Nov 25)
- **[SESSION_SUMMARY_2025-11-25.md](./SESSION_SUMMARY_2025-11-25.md)** - RLS fixes & testing session (Nov 25)
- **[MANUAL_GRADING_GUIDE.md](./MANUAL_GRADING_GUIDE.md)** - How to grade text answers
- **[QUESTION_TYPES_GUIDE.md](./QUESTION_TYPES_GUIDE.md)** - Question type reference

## 🐛 Troubleshooting

### Backend API won't start

**Check:**
- Is port 4000 available? (Change in .env if needed)
- Are environment variables set correctly?
- Is Supabase connection string valid?

### Admin can't login

**Check:**
```sql
-- In Supabase SQL Editor
SELECT * FROM profiles WHERE role = 'admin';
```
If empty, promote a user:
```sql
UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID';
```

### Students can't see published tests

**Check:**
- Test status is 'published'
- Start/end dates are valid (or NULL)
- Test visibility is 'public' or user is whitelisted

### Scoring not working

**Check:**
- Backend API is running
- Function `calculate_attempt_score` exists in database
- Attempt status is 'submitted' (not 'in_progress')

### CORS errors in browser

**Update backend .env:**
```bash
CORS_ORIGIN=http://localhost:3000,http://localhost:3005
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database powered by [Supabase](https://supabase.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

## 📞 Support

For issues, questions, or contributions:
- Create an issue in the repository
- Check existing documentation files
- Review Supabase and Next.js documentation

---

**Built with ❤️ for educators and learners**
