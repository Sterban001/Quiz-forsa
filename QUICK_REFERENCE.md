# Quick Reference Guide

## 🚨 Critical Information

### Environment Status
- **Backend API**: Port 4000 (Express + TypeScript)
- **Admin Panel**: Port 3000 (Next.js)
- **Student App**: Port 3005 (Next.js)
- **Database**: Supabase (PostgreSQL)
- **Cache**: Redis (optional)

### User Accounts
- **Admin**: `mdrizvanali01@gmail.com` (UUID: `db2a7433-bfa1-41f7-9558-4eae172f5f30`)
- **Student**: `sterban739@gmail.com` (UUID: `bbb9592e-b213-4bcc-8986-b998c410eb31`)

---

## 🔧 Recent Changes (Nov 25, 2025)

### Backend API - Critical Fix
**File**: `backend-api/src/routes/attempt.routes.ts`

All write operations now use `supabaseAdmin` instead of `supabase`:
- ✅ Line 2: Added import
- ✅ Line 48: GET attempt - `supabaseAdmin`
- ✅ Line 93: Create attempt - `supabaseAdmin`
- ✅ Line 117, 137: Save answer - `supabaseAdmin`
- ✅ Line 162, 176, 183: Submit attempt - `supabaseAdmin`

**Why**: Prevents infinite recursion in RLS policies

### Rate Limiting
**File**: `backend-api/src/middleware/rateLimit.middleware.ts`
- Line 11: Increased from 100 to **500 requests/15min** (development)
- **⚠️ For production**: Change back to 100

### Error Messages
**File**: `admin-panel/lib/api/client.ts`
- Lines 68-79: Now shows detailed validation errors

---

## 🏃 Starting the System

### Option 1: Windows Batch Script
```bash
start-all.bat
```

### Option 2: Manual Start (3 terminals)
```bash
# Terminal 1
cd backend-api && npm run dev

# Terminal 2
cd admin-panel && npm run dev

# Terminal 3
cd student-app && npm run dev
```

---

## 🐛 Common Issues & Solutions

### Issue: Infinite Recursion in Attempts
**Error**: "infinite recursion detected in policy for relation 'attempts'"
**Solution**: Already fixed - backend uses `supabaseAdmin` for writes

### Issue: 403 Forbidden When Saving Answers
**Solution**: Already fixed - ownership checks use `supabaseAdmin`

### Issue: Cannot Coerce to Single JSON Object
**Solution**: Already fixed - result fetching uses `supabaseAdmin`

### Issue: Rate Limited (429)
**Solution**: Wait 1 minute, or increase rate limit in `rateLimit.middleware.ts`

### Issue: Validation Failed
**Solution**:
1. Restart backend API
2. Check error message for specific field issues
3. For MCQ questions: **Must check at least one correct answer checkbox!**

---

## 📝 Database Schema

### Field Name Reference (Common Mistakes)
| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `passing_percentage` | `pass_score` |
| `time_limit` | `time_limit_minutes` |
| `question_text` | `prompt` |
| `text` (options) | `label` |
| `order_num` | `order_index` |

### Question Types
1. `mcq_single` - Single correct answer ✅ Auto-graded
2. `mcq_multi` - Multiple correct answers ✅ Auto-graded
3. `true_false` - Boolean ✅ Auto-graded
4. `number` - Numeric with tolerance ✅ Auto-graded
5. `short_text` - Brief text ❌ Manual grading
6. `long_text` - Essay ❌ Manual grading

---

## 🔐 Security Model

### Supabase Clients
- **`supabase`**: RLS enforced (use for READ operations)
- **`supabaseAdmin`**: RLS bypassed (use for WRITE operations)

### When to Use Each
| Operation | Client | Reason |
|-----------|--------|--------|
| GET attempts | `supabase` | RLS filters to user's own |
| POST create attempt | `supabaseAdmin` | Prevents RLS recursion |
| POST save answer | `supabaseAdmin` | Bypasses RLS after ownership check |
| POST submit test | `supabaseAdmin` | Needs to update score/status |

**Security**: Backend middleware handles authentication and ownership verification before using admin client.

---

## 📊 Testing Checklist

### Admin Panel
- [ ] Login as admin
- [ ] Create test
- [ ] Add questions (check correct answer!)
- [ ] Publish test
- [ ] View analytics

### Student App
- [ ] Login as student
- [ ] Browse tests
- [ ] Start test
- [ ] Answer questions
- [ ] Submit test
- [ ] View results
- [ ] Check history

---

## 🔍 Debugging Commands

### Check Backend Status
```bash
curl http://localhost:4000/health
```

### View Backend Logs
Check the terminal where `npm run dev` is running

### Check Database
```sql
-- In Supabase SQL Editor

-- Check attempts
SELECT * FROM attempts ORDER BY created_at DESC LIMIT 5;

-- Check user role
SELECT id, email, role FROM profiles WHERE email = 'your-email@example.com';

-- Check test status
SELECT id, title, status, visibility FROM tests;
```

### Clear Rate Limit (Redis)
```bash
# If using Redis CLI
redis-cli FLUSHDB
```

---

## 📄 Documentation Files

- **[SESSION_SUMMARY_2025-11-25.md](./SESSION_SUMMARY_2025-11-25.md)** - Today's fixes (LATEST)
- **[SESSION_SUMMARY.md](./SESSION_SUMMARY.md)** - Schema alignment
- **[README.md](./README.md)** - Project overview
- **[SECURITY_GUIDE.md](./SECURITY_GUIDE.md)** - Security details
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Database setup

---

## ⚡ Quick Commands

### Restart Backend
```bash
cd backend-api
# Ctrl+C to stop
npm run dev
```

### Check Ports in Use
```bash
netstat -ano | findstr :4000
netstat -ano | findstr :3000
netstat -ano | findstr :3005
```

### Kill Process by PID
```bash
taskkill //PID <PID_NUMBER> //F
```

---

## 🎯 Next Session To-Do

1. Test manual grading for text questions
2. Test all 6 question types thoroughly
3. Deploy to staging environment
4. Set up monitoring/logging
5. Performance testing with load

---

**Last Updated**: November 25, 2025
**Status**: ✅ All core features working
