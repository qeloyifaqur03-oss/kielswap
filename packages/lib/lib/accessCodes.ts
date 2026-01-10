/**
 * @deprecated Access codes are now stored in Redis and validated server-side.
 * Use /api/access/verify endpoint instead.
 * 
 * This file is kept for backwards compatibility but should not be used.
 * All access codes are now in scripts/access-codes.txt and seeded to Redis.
 */

/**
 * @deprecated Use server-side validation via /api/access/verify instead
 */
export function isValidAccessCode(_code: string): boolean {
  console.warn(
    'isValidAccessCode() is deprecated. Access codes are now validated server-side via Redis.'
  )
  return false
}



















