/**
 * Badge Claims Store - SINGLE SOURCE OF TRUTH
 * 
 * This is the ONLY module that can write claimed badges to storage.
 * NO other file may call localStorage.setItem for "kielswap_badges_claimed_v1"
 * 
 * Rules:
 * - readClaimedIds(): read-only access
 * - claimByClick(id): THE ONLY public write function
 * - writeClaimedIds(): INTERNAL ONLY, never called from outside this file
 */

import { BADGE_IDS } from '../badges'

const CLAIMED_STORAGE_KEY = 'kielswap_badges_claimed_v1'

interface ClaimedState {
  claimedIds: string[]
}

/**
 * Read all claimed badge IDs from localStorage
 * SSR-safe, returns empty array on server or if none claimed
 */
export function readClaimedIds(): string[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(CLAIMED_STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    // Support both old format (array) and new format (object with claimedIds)
    if (Array.isArray(parsed)) {
      return parsed
    }
    if (parsed && typeof parsed === 'object' && 'claimedIds' in parsed) {
      return parsed.claimedIds || []
    }
    return []
  } catch {
    return []
  }
}

/**
 * Check if a badge is claimed
 */
export function isClaimed(id: string): boolean {
  return readClaimedIds().includes(id)
}

/**
 * INTERNAL: Write claimed IDs to localStorage
 * This function is ONLY called by claimByClick()
 * NO other code may call this function
 */
function writeClaimedIds(next: string[]): void {
  if (typeof window === 'undefined') return
  
  // TEMPORARY TRAP: Log stack trace to catch ANY accidental writes
  // This MUST only happen on user click of Claim button
  console.error('[CLAIMED_WRITE_TRAP] This MUST only happen on click', {
    claimedIds: next,
    stack: new Error().stack
  })
  
  const state: ClaimedState = { claimedIds: next }
  localStorage.setItem(CLAIMED_STORAGE_KEY, JSON.stringify(state))
}

/**
 * Compute badge eligibility (client-side)
 * This mirrors the logic in BadgeContext for consistency
 * 
 * NOTE: This function must match the eligibility logic in BadgeContext exactly
 */
function computeBadgeEligibility(badgeId: string): boolean {
  if (typeof window === 'undefined') return false
  
  const FEEDBACK_STORAGE_KEY = 'kielswap_feedback_submitted'
  const ACCESS_STORAGE_KEY = 'kielswap_access_granted'
  const SWAP_STORAGE_KEY = 'kielswap_swaps_completed'
  const BRIDGE_STORAGE_KEY = 'kielswap_bridges_completed'
  const CROSS_CHAIN_STORAGE_KEY = 'kielswap_cross_chain_routes_completed'
  const REFERRAL_STORAGE_KEY = 'kielswap_referrals_completed'
  
  const hasAccess = sessionStorage.getItem(ACCESS_STORAGE_KEY) === '1'
  const hasFeedback = localStorage.getItem(FEEDBACK_STORAGE_KEY) === 'true'
  const hasSwap = localStorage.getItem(SWAP_STORAGE_KEY) === 'true'
  const hasBridge = localStorage.getItem(BRIDGE_STORAGE_KEY) === 'true'
  const hasCrossChain = localStorage.getItem(CROSS_CHAIN_STORAGE_KEY) === 'true'
  const hasReferral = localStorage.getItem(REFERRAL_STORAGE_KEY) === 'true'
  
  if (badgeId === BADGE_IDS.BETA_PARTICIPANT) {
    return hasAccess
  } else if (badgeId === BADGE_IDS.FEEDBACK_CONTRIBUTOR) {
    return hasFeedback
  } else if (badgeId === BADGE_IDS.EXPLORER) {
    // Explorer: requires swap AND bridge AND cross-chain route
    return hasSwap && hasBridge && hasCrossChain
  } else if (badgeId === BADGE_IDS.REFERRAL) {
    // Referral: requires at least one referred wallet to perform swap
    return hasReferral
  }
  
  return false
}

/**
 * Claim a badge by user click
 * 
 * THIS IS THE ONLY PUBLIC FUNCTION THAT WRITES CLAIMED STATE
 * MUST ONLY be called from onClick handlers (Claim button)
 * 
 * HARD REQUIREMENT: Wallet address must be provided
 * 
 * NOW INCLUDES ELIGIBILITY CHECK - will not claim if not eligible
 * 
 * Returns the updated array of claimed IDs, or current array if not eligible
 */
export function claimByClick(id: string, address: string): string[] {
  if (typeof window === 'undefined') return []
  
  // HARD REQUIREMENT: Address must be provided
  if (!address) {
    console.error('[badges] claimByClick called without address')
    return readClaimedIds()
  }
  
  const current = readClaimedIds()
  
  // Don't claim if already claimed (dedupe)
  if (current.includes(id)) {
    return current
  }
  
  // CRITICAL: Check eligibility before claiming
  if (!computeBadgeEligibility(id)) {
    console.warn('[badges] Attempted to claim ineligible badge:', id)
    return current
  }
  
  // Add to claimed list
  const next = [...current, id]
  
  // Write to storage (internal function)
  writeClaimedIds(next)
  
  return next
}

