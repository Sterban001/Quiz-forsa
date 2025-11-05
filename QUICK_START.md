# Quick Start Guide - 30 Minutes to Running App

## Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] Flutter SDK 3.24+ installed
- [ ] Supabase account created
- [ ] Code editor ready

## Step 1: Supabase Setup (10 min)

### Create Project
1. Go to https://supabase.com
2. Click "New Project"
3. Fill in details, wait for provisioning
4. Copy Project URL and anon key from Settings > API

### Run Database Setup
1. Go to SQL Editor
2. Copy paste `supabase/migrations/20240101000000_initial_schema.sql`
3. Click Run
4. Copy paste `supabase/seed.sql`
5. Click Run

### Create Admin User
1. Go to Authentication > Users
2. Add user: `admin@example.com`
3. Note the user ID
4. In SQL Editor, run:
```sql
UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id';
```

## Step 2: Admin Panel (5 min)

```bash
cd admin-panel
npm install
cp .env.local.example .env.local
# Edit .env.local - add your Supabase URL and key
npm run dev
```

Open http://localhost:3000
Login with admin email + OTP

## Step 3: Mobile App (10 min)

```bash
cd mobile-app
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

Edit `lib/core/config/env.dart`:
```dart
static const String supabaseUrl = 'your-supabase-url';
static const String supabaseAnonKey = 'your-anon-key';
```

```bash
flutter run
```

## Step 4: Test It (5 min)

### Admin Panel:
1. Create a test
2. Add 2-3 questions
3. Publish it

### Mobile App:
1. Login with a different email
2. See your test
3. Take it
4. View results

## Done! 🎉

### Next Steps:
- Read `IMPLEMENTATION_GUIDE.md` for detailed setup
- Read `ADMIN_PANEL_COMPLETE.md` to implement full UI
- Read `FLUTTER_APP_COMPLETE.md` to implement full mobile UI
- Customize and deploy!

### Need Help?
- Check `IMPLEMENTATION_GUIDE.md` Common Issues
- Review Supabase logs
- Check console errors

### File Structure Quick Ref:
```
Quiz/
├── supabase/migrations/     - Database schema
├── admin-panel/             - Next.js admin dashboard
├── mobile-app/              - Flutter mobile app
├── README.md               - Overview
├── IMPLEMENTATION_GUIDE.md - Detailed setup
├── PROJECT_SUMMARY.md      - What's included
└── QUICK_START.md         - This file
```

Start with small steps, test frequently, and refer to the detailed guides when needed!
