import rateLimit from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { redisClient, isRedisAvailable } from '../config/redis'

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs (increased for development)
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Use Redis store if available, otherwise use memory store
  store: isRedisAvailable()
    ? new RedisStore({
        // @ts-expect-error - Known issue with rate-limit-redis types
        client: redisClient,
        prefix: 'rl:api:',
      })
    : undefined,
})

/**
 * Strict rate limiter for authentication routes
 * 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again after 15 minutes.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  store: isRedisAvailable()
    ? new RedisStore({
        // @ts-expect-error - Known issue with rate-limit-redis types
        client: redisClient,
        prefix: 'rl:auth:',
      })
    : undefined,
})

/**
 * OTP rate limiter
 * 3 OTP requests per 15 minutes per IP
 */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 OTP requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many OTP requests, please try again after 15 minutes.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: isRedisAvailable()
    ? new RedisStore({
        // @ts-expect-error - Known issue with rate-limit-redis types
        client: redisClient,
        prefix: 'rl:otp:',
      })
    : undefined,
})

/**
 * Create/Update operations rate limiter
 * 30 requests per 15 minutes per IP
 */
export const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 create/update requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many create/update requests, please slow down.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: isRedisAvailable()
    ? new RedisStore({
        // @ts-expect-error - Known issue with rate-limit-redis types
        client: redisClient,
        prefix: 'rl:create:',
      })
    : undefined,
})

/**
 * Test attempt rate limiter
 * Prevents abuse of test taking
 * 10 attempts per hour per IP
 */
export const attemptLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 test attempts per hour
  message: {
    success: false,
    error: {
      message: 'Too many test attempts, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: isRedisAvailable()
    ? new RedisStore({
        // @ts-expect-error - Known issue with rate-limit-redis types
        client: redisClient,
        prefix: 'rl:attempt:',
      })
    : undefined,
})
