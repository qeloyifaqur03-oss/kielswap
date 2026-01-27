/**
 * Referral state store
 * Manages referral link generation and state
 */

const REFERRAL_STORAGE_KEY = 'kielswap_referral_state_v1'
const APPLIED_CODE_STORAGE_KEY = 'kielswap_referral_applied_code_v1'

export interface ReferralState {
  linkGenerated: boolean
  referralCode: string | null
  unlocked: boolean // Derived from volume >= 10000
}

/**
 * Generate a random referral code
 * Format: 8-10 chars, uppercase letters + digits (no ambiguous chars: 0, O, I, L)
 */
function generateReferralCodeInternal(): string {
  // Exclude ambiguous chars: 0, O, I, L
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const length = 8 + Math.floor(Math.random() * 3) // 8-10 chars
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Get referral state
 * SSR-safe, returns default state on server
 */
export function getReferralState(totalVolumeUSD: number): ReferralState {
  if (typeof window === 'undefined') {
    return {
      linkGenerated: false,
      referralCode: null,
      unlocked: false,
    }
  }
  
  try {
    const stored = localStorage.getItem(REFERRAL_STORAGE_KEY)
    if (!stored) {
      return {
        linkGenerated: false,
        referralCode: null,
        unlocked: totalVolumeUSD >= 10000,
      }
    }
    
    const parsed = JSON.parse(stored)
    return {
      linkGenerated: parsed.linkGenerated || false,
      referralCode: parsed.referralCode || null,
      unlocked: totalVolumeUSD >= 10000, // Always compute from current volume
    }
  } catch {
    return {
      linkGenerated: false,
      referralCode: null,
      unlocked: totalVolumeUSD >= 10000,
    }
  }
}

/**
 * Generate referral code
 * MUST ONLY be called on user button click
 * Returns the new state
 */
export function generateReferralCode(totalVolumeUSD: number): ReferralState {
  if (typeof window === 'undefined') {
    return {
      linkGenerated: false,
      referralCode: null,
      unlocked: false,
    }
  }
  
  // Check if already generated
  const current = getReferralState(totalVolumeUSD)
  if (current.linkGenerated && current.referralCode) {
    return current
  }
  
  // Generate new code
  const newCode = generateReferralCodeInternal()
  const newState: ReferralState = {
    linkGenerated: true,
    referralCode: newCode,
    unlocked: totalVolumeUSD >= 10000,
  }
  
  localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(newState))
  
  return newState
}

/**
 * Get applied referral code from URL
 */
export function getAppliedReferralCode(): string | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(APPLIED_CODE_STORAGE_KEY)
    return stored || null
  } catch {
    return null
  }
}

/**
 * Store applied referral code
 */
export function setAppliedReferralCode(code: string): void {
  if (typeof window === 'undefined') return
  
  localStorage.setItem(APPLIED_CODE_STORAGE_KEY, code)
}

/**
 * Reset referral state (dev only, no UI)
 */
export function resetReferralState(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(REFERRAL_STORAGE_KEY)
}






















