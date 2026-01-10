/**
 * Badge status helper functions
 * Computes eligibility and claimable status WITHOUT touching claimed state
 */

import { BADGE_IDS } from '../badges'

export interface BadgeStatusParams {
  hasAccess: boolean
  feedbackSubmitted: boolean
  totalVolumeUSD: number
  claimedIds: string[]
}

/**
 * Check if there are any claimable badges
 * A badge is claimable if:
 * - It's eligible (based on conditions)
 * - It's NOT already claimed
 */
export function hasClaimableBadges(params: BadgeStatusParams): boolean {
  const { hasAccess, feedbackSubmitted, totalVolumeUSD, claimedIds } = params

  // Beta Participant: claimable if hasAccess && not claimed
  if (hasAccess && !claimedIds.includes(BADGE_IDS.BETA_PARTICIPANT)) {
    return true
  }

  // Feedback Contributor: claimable if feedbackSubmitted && not claimed
  if (feedbackSubmitted && !claimedIds.includes(BADGE_IDS.FEEDBACK_CONTRIBUTOR)) {
    return true
  }

  // Volume badges: claimable if volume reached && not claimed
  if (totalVolumeUSD >= 10000 && !claimedIds.includes(BADGE_IDS.VOLUME_10K)) {
    return true
  }
  if (totalVolumeUSD >= 100000 && !claimedIds.includes(BADGE_IDS.VOLUME_100K)) {
    return true
  }
  if (totalVolumeUSD >= 1000000 && !claimedIds.includes(BADGE_IDS.VOLUME_1M)) {
    return true
  }
  if (totalVolumeUSD >= 10000000 && !claimedIds.includes(BADGE_IDS.VOLUME_10M)) {
    return true
  }

  return false
}

