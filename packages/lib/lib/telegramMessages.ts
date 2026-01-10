/**
 * Telegram message builders
 * Creates formatted HTML messages for Telegram notifications
 */

/**
 * Sanitize and truncate text
 */
function sanitizeText(text: string | undefined | null, maxLength: number = 1200): string {
  if (!text || !text.trim()) {
    return '—'
  }
  
  const trimmed = text.trim()
  if (trimmed.length <= maxLength) {
    return trimmed
  }
  
  return trimmed.substring(0, maxLength) + '…'
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Format field value (sanitize and escape)
 */
function formatField(value: string | undefined | null): string {
  const sanitized = sanitizeText(value, 1200)
  if (sanitized === '—') {
    return '—'
  }
  return escapeHtml(sanitized)
}

/**
 * Format wallet address (truncate if too long)
 */
function formatWallet(address: string | undefined | null): string {
  if (!address || !address.trim()) {
    return '—'
  }
  
  const trimmed = address.trim()
  if (trimmed.length <= 64) {
    return escapeHtml(trimmed)
  }
  
  // Truncate long addresses
  return escapeHtml(trimmed.substring(0, 64) + '…')
}

/**
 * Format X/Twitter handle
 */
function formatXHandle(handle: string | undefined | null): string {
  if (!handle || !handle.trim()) {
    return '—'
  }
  
  let trimmed = handle.trim()
  
  // Remove @ if present
  if (trimmed.startsWith('@')) {
    trimmed = trimmed.substring(1)
  }
  
  // If it looks like a URL, return as-is (escaped)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return escapeHtml(trimmed)
  }
  
  // Otherwise format as @username
  return '@' + escapeHtml(trimmed)
}

export interface EarlyAccessPayload {
  twitterHandle?: string
  walletAddress?: string
  interest?: string
}

/**
 * Build Early Access Request message
 */
export function buildEarlyAccessMessage(payload: EarlyAccessPayload): string {
  const xHandle = formatXHandle(payload.twitterHandle)
  const wallet = formatWallet(payload.walletAddress)
  const reason = formatField(payload.interest)

  return `─────────────────────────
🟣 Early Access Request

X: ${xHandle}
Wallet: ${wallet}

Reason:
${reason}

— Kielswap
─────────────────────────`
}

export interface FeedbackPayload {
  message: string
  contact?: string
  walletAddress?: string
  page?: string
}

/**
 * Build Feedback message
 */
export function buildFeedbackMessage(payload: FeedbackPayload): string {
  const page = payload.page ? escapeHtml(payload.page) : '/swap'
  const wallet = formatWallet(payload.walletAddress)
  const telegram = formatXHandle(payload.contact)
  const feedback = formatField(payload.message)

  return `─────────────────────────
🟣 Feedback

Page: ${page}
Wallet: ${wallet}
Telegram: ${telegram}

Feedback:
${feedback}

— Kielswap
─────────────────────────`
}


