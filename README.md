# Quiz Platform - Production Ready

A full-stack quiz platform with mobile app (Flutter) and admin panel (Next.js) powered by Supabase.

## Features

### Admin Panel
- Secure admin authentication
- Create, edit, publish tests with rich configuration
- Question types: MCQ (single/multi), Short Text, Number
- Advanced settings: time limits, scheduling, access codes, shuffling
- Analytics dashboard with attempt tracking
- Manual grading for short text answers
- CSV export and test cloning

### Mobile App
- Email OTP authentication
- Browse published tests with search/filters
- Take tests with timer and auto-save
- Offline support (download, take, sync)
- Results with explanations
- Attempt history
- Local notifications

## Tech Stack

- **Mobile**: Flutter 3.24+, Riverpod 2.5+, go_router 14.2+, Hive 2.2+
- **Admin**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Postgres, Auth, Storage, Realtime)

## Prerequisites

- Flutter SDK 3.24 or higher
- Node.js 18+ and npm/yarn
- Supabase CLI
- Supabase account

## Project Structure

```
Quiz/
├── supabase/
│   ├── migrations/
│   │   └── 20240101000000_initial_schema.sql
│   └── seed.sql
├── admin-panel/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
├── mobile-app/
│   ├── lib/
│   │   ├── core/
│   │   ├── features/
│   │   ├── repositories/
│   │   └── main.dart
│   ├── test/
│   └── pubspec.yaml
└── README.md
```

## Setup Instructions

### 1. Supabase Setup

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key

#### Run Migrations
```bash
cd Quiz

# Login to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Seed database
psql -h your-db-host -U postgres -d postgres -f supabase/seed.sql
```

Or manually run the SQL files in Supabase SQL Editor:
1. Run `supabase/migrations/20240101000000_initial_schema.sql`
2. Run `supabase/seed.sql`

#### Configure Auth
1. Go to Authentication > Providers
2. Enable Email provider
3. Disable email confirmation (or configure SMTP)
4. Set up Email Templates for OTP

#### Configure Storage
1. Go to Storage
2. Create bucket: `test-images` (public)

### 2. Admin Panel Setup

```bash
cd admin-panel

# Install dependencies
npm install

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EOF

# Run development server
npm run dev
```

Admin panel will be available at http://localhost:3000

**Default Admin Credentials:**
- Email: admin@quizapp.com
- OTP: Check Supabase Auth logs or use real email

### 3. Mobile App Setup

```bash
cd mobile-app

# Install dependencies
flutter pub get

# Create .env file
cat > .env << EOF
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
EOF

# Run code generation
flutter pub run build_runner build --delete-conflicting-outputs

# Run app (iOS)
flutter run -t lib/main.dart --dart-define=SUPABASE_URL=your-url --dart-define=SUPABASE_ANON_KEY=your-key

# Or Android
flutter run -d android --dart-define=SUPABASE_URL=your-url --dart-define=SUPABASE_ANON_KEY=your-key
```

Alternatively, create `lib/core/config/env.dart`:
```dart
class Env {
  static const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'your-supabase-url',
  );
  static const supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'your-anon-key',
  );
}
```

### 4. Run Tests

```bash
# Flutter tests
cd mobile-app
flutter test

# Next.js tests (if added)
cd admin-panel
npm test
```

## Database Schema Overview

### Core Tables
- **profiles**: User profiles with roles (admin/user)
- **tests**: Test configuration and metadata
- **sections**: Optional test sections for organization
- **questions**: Questions with type and scoring rules
- **question_options**: MCQ options with correct answer flags
- **attempts**: User test attempts with scores
- **attempt_answers**: Individual question responses
- **test_whitelist**: Private test access control
- **leaderboards**: Best scores per user per test

### Security (RLS)
- Users can only read published tests (with visibility rules)
- Users can only write their own attempts
- Admins can manage all tests and questions
- Server-side scoring prevents tampering

## Usage Guide

### Creating Your First Test (Admin)

1. Login to admin panel with admin credentials
2. Navigate to Tests > Create Test
3. Fill in test details:
   - Title, description, category
   - Time limit, scheduling
   - Visibility (public/private/unlisted)
   - Pass score, negative marking, shuffle options
4. Add questions:
   - Click "Add Question"
   - Select question type
   - Enter prompt, options, correct answers
   - Set points and explanations
5. Publish test
6. Test will appear in mobile app

### Taking a Test (Mobile)

1. Open mobile app
2. Login with email OTP
3. Browse available tests
4. Tap test to view details
5. Enter access code if required
6. Start test
7. Answer questions (auto-saved)
8. Submit or wait for auto-submit
9. View results and explanations

### Offline Mode

1. Tap download icon on test card
2. Test downloads for offline use
3. Take test without internet
4. Answers stored locally
5. Auto-syncs when online

## Environment Variables

### Admin Panel (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

### Mobile App (--dart-define or lib/core/config/env.dart)
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
```

## Deployment

### Admin Panel (Vercel)
```bash
cd admin-panel
vercel deploy --prod
```

Add environment variables in Vercel dashboard.

### Mobile App
```bash
cd mobile-app

# iOS
flutter build ipa
# Upload to App Store Connect

# Android
flutter build appbundle
# Upload to Google Play Console
```

### Supabase
Already hosted. Ensure production database has migrations applied.

## API Endpoints

All data access goes through Supabase:
- Authentication: Supabase Auth API
- Database: Supabase Postgres with PostgREST
- Storage: Supabase Storage API
- Realtime: Supabase Realtime (optional)

## Troubleshooting

### Admin can't login
- Check user role in `profiles` table is 'admin'
- Verify email in Supabase Auth users

### Tests not showing in mobile app
- Ensure test status is 'published'
- Check visibility settings
- Verify start_at/end_at dates

### Offline sync not working
- Check internet connection
- Verify Supabase credentials
- Check Hive database initialization

### RLS errors
- Verify user JWT token
- Check RLS policies in Supabase
- Ensure user profile exists

## Support

For issues and questions:
1. Check Supabase logs
2. Check browser/app console
3. Review RLS policies
4. Verify environment variables

## License

MIT
