import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Import routes
import authRoutes from './routes/auth.routes'
import testRoutes from './routes/test.routes'
import questionRoutes from './routes/question.routes'
import attemptRoutes from './routes/attempt.routes'
import userRoutes from './routes/user.routes'
import analyticsRoutes from './routes/analytics.routes'

// Import middleware
import { errorHandler } from './middleware/error.middleware'
import { notFoundHandler } from './middleware/notFound.middleware'
import { apiLimiter } from './middleware/rateLimit.middleware'

// Import Redis configuration
import { connectRedis, isRedisAvailable } from './config/redis'

const app = express()
const PORT = process.env.PORT || 4000

// Security Headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],  // Keep for now - removing requires CSS refactoring
      imgSrc: ["'self'", "data:", "https://*.supabase.co"],
      connectSrc: ["'self'", "https://*.supabase.co", "https://*.upstash.io"],  // Added Upstash for Redis
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],  // Added Google Fonts
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],        // Prevents base tag hijacking
      formAction: ["'self'"],     // Restricts form submissions
      upgradeInsecureRequests: [] // Upgrade HTTP to HTTPS
    },
  },
  // Additional security headers
  hsts: {
    maxAge: 31536000,  // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'  // Prevent clickjacking
  },
  noSniff: true,  // Prevent MIME type sniffing
  xssFilter: true,  // Enable XSS filter
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'  // Control referrer information
  }
}))

// Additional Security Headers (beyond Helmet defaults)
app.use((_req, res, next) => {
  // Permissions Policy - disable sensitive browser features
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()')
  next()
})

// CORS configuration - whitelist specific origins
const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || [
  'http://localhost:3000',
  'http://localhost:3005',
  'https://quiz-forsa.vercel.app',
  'https://quiz-forsa-9vq9.vercel.app',
  'https://quiz-forsa-pkj7.vercel.app'
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,  // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400  // Cache preflight requests for 24 hours
}))
app.use(morgan('combined'))
app.use(cookieParser())  // Parse cookies from requests

// Prevent caching of all API responses (especially important for auth endpoints)
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  next()
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Apply rate limiting to all API routes
app.use('/api', apiLimiter)

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend API is running',
    redis: isRedisAvailable() ? 'connected' : 'disconnected'
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/tests', testRoutes)
app.use('/api/questions', questionRoutes)
app.use('/api/attempts', attemptRoutes)
app.use('/api/users', userRoutes)
app.use('/api/analytics', analyticsRoutes)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

// Initialize Redis and start server
// Initialize Redis and start server
async function initializeServices() {
  if (!isRedisAvailable()) {
    await connectRedis()
  }
}

// Local development startup
if (require.main === module) {
  initializeServices().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Backend API server running on http://localhost:${PORT}`)
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`💾 Redis: ${isRedisAvailable() ? 'Connected ✓' : 'Not available (running without cache)'}`)
    })
  }).catch((error) => {
    console.error('Failed to start server:', error)
    process.exit(1)
  })
}

// For Vercel/Serverless
// Ensure Redis is connected on every request (or reused if container is warm)
app.use(async (_req, _res, next) => {
  if (!isRedisAvailable()) {
    try {
      await connectRedis()
    } catch (error) {
      console.error('Redis connection failed:', error)
      // Continue without Redis if it fails, or handle error
    }
  }
  next()
})

export { app }
export default app

