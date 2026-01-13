/**
 * Rate limiting utility (legacy - re-exported from api/rateLimit)
 * @deprecated Use api/rateLimit for new code
 */

// Re-export new API
export { checkRateLimit, getClientIP, RATE_LIMITS } from './api/rateLimit'
