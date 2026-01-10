import { Redis } from "@upstash/redis";

/**
 * Gets a Redis client instance with validated environment variables.
 * Must be called after environment variables are loaded (e.g., after loadEnvConfig in scripts).
 * Note: This uses the edge-compatible Redis client.
 */
export function getRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url) {
    throw new Error("UPSTASH_REDIS_REST_URL is not set. Add it to .env.local and re-run.");
  }

  if (!token) {
    throw new Error("UPSTASH_REDIS_REST_TOKEN is not set. Add it to .env.local and re-run.");
  }

  return new Redis({ url, token });
}

/**
 * Redis client instance for server-side use in Next.js (API routes, middleware, etc.)
 * Uses Edge-compatible Redis client for better performance in Edge runtime.
 * Environment variables are already loaded in Next.js runtime.
 * Only use this in server-side contexts (API routes, middleware, server components).
 * 
 * Lazy initialization: singleton is created only when accessed, not at module load time.
 * This allows scripts to import the module without triggering env checks.
 */
let _redisInstance: Redis | null = null;

export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    // Lazy initialization on first access
    if (!_redisInstance) {
      if (typeof window !== 'undefined') {
        throw new Error("redis instance can only be used server-side. Use getRedis() in scripts that need env loading.");
      }

      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!url || !token) {
        // In Next.js runtime, env should be set, but we throw a helpful error if not
        const errorMsg = process.env.NODE_ENV !== "production"
          ? `UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set. Ensure these are in your .env.local file and restart the Next.js server.`
          : "Redis configuration error";
        throw new Error(errorMsg);
      }

      _redisInstance = new Redis({ url, token });
    }
    
    const value = (_redisInstance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(_redisInstance);
    }
    return value;
  }
});

