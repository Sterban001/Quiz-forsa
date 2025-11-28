# Quiz Platform Backend API

RESTful API server for the Quiz Platform built with Express.js and TypeScript.

## Features

- **Authentication**: JWT-based authentication with Supabase
- **Test Management**: CRUD operations for tests and questions
- **Attempt Management**: Handle test attempts and submissions
- **Analytics**: Dashboard statistics and leaderboards
- **Role-based Access**: Admin and student roles with different permissions

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
PORT=4000
NODE_ENV=development

# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# JWT
JWT_SECRET=your-jwt-secret
```

### 3. Run Development Server

```bash
npm run dev
```

Server will start on `http://localhost:4000`

### 4. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/otp/send` - Send OTP to email
- `POST /api/auth/otp/verify` - Verify OTP
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Tests

- `GET /api/tests` - Get all tests (with filters)
- `GET /api/tests/:id` - Get single test with questions
- `POST /api/tests` - Create test (admin only)
- `PUT /api/tests/:id` - Update test (admin only)
- `DELETE /api/tests/:id` - Delete test (admin only)
- `POST /api/tests/:id/clone` - Clone test (admin only)

### Questions

- `GET /api/questions/test/:testId` - Get all questions for a test
- `POST /api/questions` - Create question (admin only)
- `PUT /api/questions/:id` - Update question (admin only)
- `DELETE /api/questions/:id` - Delete question (admin only)

### Attempts

- `GET /api/attempts` - Get all attempts (filtered by role)
- `GET /api/attempts/:id` - Get single attempt with answers
- `POST /api/attempts/start` - Start new attempt
- `POST /api/attempts/:id/answer` - Save answer
- `POST /api/attempts/:id/submit` - Submit attempt

### Users

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile

### Analytics

- `GET /api/analytics/dashboard` - Dashboard statistics (admin only)
- `GET /api/analytics/tests` - Test statistics (admin only)
- `GET /api/analytics/leaderboard/:testId` - Test leaderboard

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-token>
```

Get the token from the login or OTP verify response.

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error message here"
  }
}
```

## CORS Configuration

The API accepts requests from:
- `http://localhost:3000` (Admin Panel)
- `http://localhost:3001` (Student App)

Update `CORS_ORIGIN` in `.env` to add more origins.

## Development

```bash
# Run in watch mode
npm run dev

# Lint code
npm run lint

# Build
npm run build
```

## Project Structure

```
backend-api/
├── src/
│   ├── config/
│   │   └── supabase.ts          # Supabase client configuration
│   ├── middleware/
│   │   ├── auth.middleware.ts    # Authentication middleware
│   │   ├── error.middleware.ts   # Error handler
│   │   └── notFound.middleware.ts # 404 handler
│   ├── routes/
│   │   ├── auth.routes.ts        # Authentication routes
│   │   ├── test.routes.ts        # Test management routes
│   │   ├── question.routes.ts    # Question routes
│   │   ├── attempt.routes.ts     # Attempt routes
│   │   ├── user.routes.ts        # User routes
│   │   └── analytics.routes.ts   # Analytics routes
│   └── index.ts                  # Main server file
├── package.json
├── tsconfig.json
└── .env
```

## License

MIT
