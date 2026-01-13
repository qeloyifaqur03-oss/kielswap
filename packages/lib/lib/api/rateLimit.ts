/**
 * Enhanced rate limiting utility with per-route limits
 * Uses Upstash Redis for production, in-memory Map for fallback
 */

import { redis } from '../redis'

export interface RateLimitConfig {
  maxRequests: number
  windowSeconds: number
}

// Route-specific rate limit configurations
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'token-price': { maxRequests: 60, windowSeconds: 60 },
  'status': { maxRequests: 120, windowSeconds: 60 },
  'quote': { maxRequests: 30, windowSeconds: 60 },
  'route-plan': { maxRequests: 30, windowSeconds: 60 },
  'execute': { maxRequests: 10, windowSeconds: 60 },
  'early-access': { maxRequests: 5, windowSeconds: 600 }, // 10 minutes
  'feedback': { maxRequests: 10, windowSeconds: 600 }, // 10 minutes
  'access-verify': { maxRequests: 10, windowSeconds: 600 }, // 10 minutes
  'access-check': { maxRequests: 20, windowSeconds: 60 },
  'access-logout': { maxRequests: 20, windowSeconds: 60 },
  'default': { maxRequests: 30, windowSeconds: 60 },
}

// In-memory fallback store
interface MemoryEntry {
  count: number
  resetAt: number
}

const memoryStore = new Map<string, MemoryEntry>()

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

let hasWarnedAboutMemoryFallback = false

/**
 * Check rate limit for a route and IP
 * @param routeName Route identifier (e.g., 'token-price', 'quote')
 * @param ip IP address or identifier
 * @returns { allowed: boolean, retryAfter?: number }
 */
export async function checkRateLimit(
  routeName: string,
  ip: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const config = RATE_LIMITS[routeName] || RATE_LIMITS.default
  const key = `rate_limit:${routeName}:${ip}`
  const now = Math.floor(Date.now() / 1000)

  // Check if Upstash Redis is available
  const hasRedis = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

  if (hasRedis) {
    try {
      const redisKey = `rate_limit:${routeName}:${ip}`
      
      // Get current count
      const count = await redis.get<number>(redisKey)
      
      if (count === null) {
        // First request in window
        await redis.set(redisKey, 1, { ex: config.windowSeconds })
        return { allowed: true }
      }
      
      if (count >= config.maxRequests) {
        // Rate limited - calculate retry after
        const ttl = await redis.ttl(redisKey)
        return { allowed: false, retryAfter: ttl > 0 ? ttl : config.windowSeconds }
      }
      
      // Increment count
      await redis.incr(redisKey)
      return { allowed: true }
    } catch (redisError) {
      // Redis failed, fallback to memory
      if (!hasWarnedAboutMemoryFallback) {
        console.warn('[ratelimit] upstash env missing or Redis failed, using in-memory fallback')
        hasWarnedAboutMemoryFallback = true
      }
    }
  } else {
    // No Redis configured - use memory fallback
    if (!hasWarnedAboutMemoryFallback) {
      console.warn('[ratelimit] upstash env missing, using in-memory fallback')
      hasWarnedAboutMemoryFallback = true
    }
  }
  
  // Fallback to in-memory store
  const memoryEntry = memoryStore.get(key)
  
  if (!memoryEntry || memoryEntry.resetAt < now * 1000) {
    // New window or expired
    memoryStore.set(key, {
      count: 1,
      resetAt: now * 1000 + config.windowSeconds * 1000,
    })
    return { allowed: true }
  }
  
  if (memoryEntry.count >= config.maxRequests) {
    // Rate limited
    const retryAfter = Math.ceil((memoryEntry.resetAt - now * 1000) / 1000)
    return { allowed: false, retryAfter: retryAfter > 0 ? retryAfter : config.windowSeconds }
  }
  
  // Increment count
  memoryEntry.count++
  return { allowed: true }
}

/**
 * Get client IP from request
 * Extracts IP from x-forwarded-for (first IP), x-real-ip, or returns 'unknown'
 */
export function getClientIP(request: Request | { headers: Headers }): string {
  // Handle different request types
  const headers = request instanceof Request 
    ? request.headers 
    : (request as any).headers || new Headers()
  
  // Try x-forwarded-for (first IP if multiple)
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const firstIP = forwarded.split(',')[0].trim()
    if (firstIP) return firstIP
  }
  
  // Try x-real-ip
  const realIP = headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }
  
  // Fallback
  return 'unknown'
}
