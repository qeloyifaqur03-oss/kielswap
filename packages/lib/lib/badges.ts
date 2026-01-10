/**
 * Badge definitions and unlock conditions
 */

export interface Badge {
  id: string
  title: string
  description: string
  progress: number // 0 to 1
  isUnlocked: boolean
  isClaimed: boolean
}

export const BADGE_IDS = {
  BETA_PARTICIPANT: 'beta-participant',
  FEEDBACK_CONTRIBUTOR: 'feedback-contributor',
  EXPLORER: 'explorer',
  REFERRAL: 'referral',
} as const

// Badge order (must be in this exact order)
export const BADGE_ORDER = [
  BADGE_IDS.BETA_PARTICIPANT,
  BADGE_IDS.FEEDBACK_CONTRIBUTOR,
  BADGE_IDS.EXPLORER,
  BADGE_IDS.REFERRAL,
] as const

export const BADGE_DEFINITIONS: Record<string, { title: string; description: string }> = {
  [BADGE_IDS.BETA_PARTICIPANT]: {
    title: 'Early Intent User',
    description: 'Accessed kielswap before public release',
  },
  [BADGE_IDS.FEEDBACK_CONTRIBUTOR]: {
    title: 'Product Contributor',
    description: 'Shared feedback that influenced the product',
  },
  [BADGE_IDS.EXPLORER]: {
    title: 'Explorer',
    description: 'Completed key execution tasks',
  },
  [BADGE_IDS.REFERRAL]: {
    title: 'Connector',
    description: 'Enabled meaningful usage through referrals',
  },
}

// Explorer badge unlock conditions for popover
export const EXPLORER_UNLOCK_CONDITIONS = [
  'Place an intent-based order',
  'Complete an instant swap',
  'Complete an intent order within a custom deadline',
]

/**
 * Calculate badge progress based on current value and threshold
 */
export function calculateProgress(current: number, threshold: number): number {
  return Math.min(current / threshold, 1)
}

/**
 * Check if volume badge is unlocked
 */
export function isVolumeBadgeUnlocked(currentVolume: number, threshold: number): boolean {
  return currentVolume >= threshold
}

