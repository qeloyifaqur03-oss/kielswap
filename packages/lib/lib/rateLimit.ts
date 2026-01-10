/**
 * Rate limiting utility
 * Uses Redis for production, in-memory Map for fallback
 */

import { redis } from './redis'

const RATE_LIMIT_WINDOW = 60 // seconds
const RATE_LIMIT_MAX_REQUESTS = 5 // requests per window

// In-memory fallback (used if Redis fails)
const memoryStore = new Map<string, { count: number; resetAt: number }>()

// Clean up expired entries from memory store every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of memoryStore.entries()) {
      if (value.resetAt < now) {
        memoryStore.delete(key)
      }
    }
  }, 60000)
}

/**
 * Check rate limit for an IP address
 * @param ip IP address or identifier
 * @returns true if allowed, false if rate limited
 */
export async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `rate_limit:${ip}`
  const now = Math.floor(Date.now() / 1000)

  // Try Redis first, fallback to memory if it fails
  try {
    const redisKey = `rate_limit:${ip}`
    
    // Get current count
    const count = await redis.get<number>(redisKey)
    
    if (count === null) {
      // First request in window
      await redis.set(redisKey, 1, { ex: RATE_LIMIT_WINDOW })
      return true
    }
    
    if (count >= RATE_LIMIT_MAX_REQUESTS) {
      // Rate limited
      return false
    }
    
    // Increment count
    await redis.incr(redisKey)
    return true
  } catch (redisError) {
    // Redis failed, fallback to memory
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[RateLimit] Redis failed, using memory fallback:', redisError)
    }
    
    // Fallback to in-memory store
    const memoryEntry = memoryStore.get(key)
    
    if (!memoryEntry || memoryEntry.resetAt < now) {
      // New window or expired
      memoryStore.set(key, {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW,
      })
      return true
    }
    
    if (memoryEntry.count >= RATE_LIMIT_MAX_REQUESTS) {
      // Rate limited
      return false
    }
    
    // Increment count
    memoryEntry.count++
    return true
  }
}

/**
 * Get client IP from request
 */
export function getClientIP(request: Request): string {
  // Try various headers (for proxies, load balancers, etc.)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // Take first IP if multiple
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }
  
  // Fallback (shouldn't happen in production with proper setup)
  return 'unknown'
}

