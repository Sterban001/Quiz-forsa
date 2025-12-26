import { createClient } from 'redis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// Create Redis client
export const redisClient = createClient({
  url: REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis: Too many reconnection attempts, giving up')
        return new Error('Too many retries')
      }
      // Exponential backoff: wait longer between each retry
      return Math.min(retries * 100, 3000)
    },
  },
})

// Event handlers
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err)
})

redisClient.on('connect', () => {
  console.log('Redis Client: Attempting to connect...')
})

redisClient.on('ready', () => {
  console.log('Redis Client: Connected and ready')
})

redisClient.on('reconnecting', () => {
  console.log('Redis Client: Reconnecting...')
})

redisClient.on('end', () => {
  console.log('Redis Client: Connection closed')
})

// Connect to Redis
export async function connectRedis() {
  try {
    // Prevent connecting to localhost Redis in production (Vercel)
    if (process.env.NODE_ENV === 'production' && REDIS_URL.includes('localhost')) {
      console.warn('Skipping Redis connection: Cannot connect to localhost in production.')
      return
    }

    if (!redisClient.isOpen) {
      // Add a timeout to prevent hanging the serverless function
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis connection timeout')), 2000)
      )

      await Promise.race([
        redisClient.connect(),
        timeout
      ])
    }
  } catch (error) {
    console.error('Failed to connect to Redis:', error)
    console.warn('Running without Redis cache. Install and start Redis for better performance.')
  }
}

// Helper function to check if Redis is available
export function isRedisAvailable(): boolean {
  return redisClient.isOpen && redisClient.isReady
}

// Cache helper functions
export const cache = {
  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!isRedisAvailable()) return null

    try {
      const value = await redisClient.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Redis GET error:', error)
      return null
    }
  },

  /**
   * Set a value in cache with optional expiry (in seconds)
   */
  async set(key: string, value: any, expirySeconds?: number): Promise<boolean> {
    if (!isRedisAvailable()) return false

    try {
      const stringValue = JSON.stringify(value)
      if (expirySeconds) {
        await redisClient.setEx(key, expirySeconds, stringValue)
      } else {
        await redisClient.set(key, stringValue)
      }
      return true
    } catch (error) {
      console.error('Redis SET error:', error)
      return false
    }
  },

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<boolean> {
    if (!isRedisAvailable()) return false

    try {
      await redisClient.del(key)
      return true
    } catch (error) {
      console.error('Redis DEL error:', error)
      return false
    }
  },

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string): Promise<number> {
    if (!isRedisAvailable()) return 0

    try {
      const keys = await redisClient.keys(pattern)
      if (keys.length > 0) {
        return await redisClient.del(keys)
      }
      return 0
    } catch (error) {
      console.error('Redis DEL PATTERN error:', error)
      return 0
    }
  },

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!isRedisAvailable()) return false

    try {
      const result = await redisClient.exists(key)
      return result === 1
    } catch (error) {
      console.error('Redis EXISTS error:', error)
      return false
    }
  },

  /**
   * Set expiry on an existing key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!isRedisAvailable()) return false

    try {
      await redisClient.expire(key, seconds)
      return true
    } catch (error) {
      console.error('Redis EXPIRE error:', error)
      return false
    }
  },
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing Redis connection...')
  await redisClient.quit()
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing Redis connection...')
  await redisClient.quit()
})
