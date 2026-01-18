'use client'

import { BadgeCard } from '@/components/badges/BadgeCard'
import { BADGE_DEFINITIONS, BADGE_ORDER, BADGE_IDS, Badge } from '@/lib/badges'
import { useSafeAccount, useSafeConnect } from '@/lib/wagmi/safeHooks'
import { useState, useEffect } from 'react'

export default function BadgesPage() {
  const { isConnected, address } = useSafeAccount()
  const { connect, connectors } = useSafeConnect()
  const [badges, setBadges] = useState<Badge[]>([])
  const [hasEligibleBadge, setHasEligibleBadge] = useState(false)

  // Initialize badges on mount
  useEffect(() => {
    const initBadges = () => {
      const loadedBadges = BADGE_ORDER.map((badgeId) => {
        const definition = BADGE_DEFINITIONS[badgeId]
        
        // Check eligibility for each badge
        const isUnlocked = checkBadgeEligibility(badgeId)
        const isClaimed = isClaimedBadge(badgeId)
        
        return {
          id: badgeId,
          title: definition?.title || '',
          description: definition?.description || '',
          progress: 0,
          isUnlocked,
          isClaimed,
        }
      })
      
      setBadges(loadedBadges)
      
      // Check if any badge is eligible
      const hasEligible = loadedBadges.some(b => b.isUnlocked && !b.isClaimed)
      setHasEligibleBadge(hasEligible)
    }

    initBadges()
  }, [address]) // Reload badges when wallet address changes

  // Check if a badge is claimed for current wallet address
  const isClaimedBadge = (badgeId: string): boolean => {
    if (!address) return false
    try {
      const claimed = localStorage.getItem('earned_badges')
      if (claimed) {
        const badgesByAddress = JSON.parse(claimed)
        // Support both old format (array) and new format (object with addresses)
        if (Array.isArray(badgesByAddress)) {
          // Old format - return false (migrate on next claim)
          return false
        }
        if (badgesByAddress && typeof badgesByAddress === 'object') {
          return Array.isArray(badgesByAddress[address.toLowerCase()]) && 
                 badgesByAddress[address.toLowerCase()].includes(badgeId)
        }
      }
    } catch (error) {
      console.error('[Badges] Failed to check claimed status:', error)
    }
    return false
  }

  // Check if a badge is eligible/unlocked
  const checkBadgeEligibility = (badgeId: string): boolean => {
    try {
      // Early Intent User - available immediately after access code (check cookie presence)
      if (badgeId === BADGE_IDS.BETA_PARTICIPANT) {
        // Access is granted when ks_access cookie is set by server
        // Since this is client-side, we check if user has access via app being accessible
        // The badge is unlocked as long as user accessed /swap which means access_granted
        const hasAccess = localStorage.getItem('access_granted') === 'true'
        return hasAccess
      }

      // Product Contributor - at least 1 feedback
      if (badgeId === BADGE_IDS.FEEDBACK_CONTRIBUTOR) {
        const feedbackCount = localStorage.getItem('feedback_count')
        return parseInt(feedbackCount || '0', 10) >= 1
      }

      // Explorer - 3 conditions (simplified check - in real app would be on-chain)
      if (badgeId === BADGE_IDS.EXPLORER) {
        const swapCount = localStorage.getItem('total_swaps') || '0'
        const bridgeCount = localStorage.getItem('bridge_count') || '0'
        const volume = parseFloat(localStorage.getItem('total_volume') || '0')
        
        const hasIntentSwap = parseInt(swapCount, 10) >= 1
        const hasBridge = parseInt(bridgeCount, 10) >= 1
        const hasVolume = volume >= 100
        
        return hasIntentSwap && hasBridge && hasVolume
      }

      // Connector - 1 referral + referral did 1 swap
      if (badgeId === BADGE_IDS.REFERRAL) {
        const referralsCount = localStorage.getItem('referrals_count') || '0'
        const referralSwaps = localStorage.getItem('referral_swaps') || '0'
        
        return parseInt(referralsCount, 10) >= 1 && parseInt(referralSwaps, 10) >= 1
      }
    } catch (error) {
      console.error('[Badges] Error checking eligibility:', error)
    }
    
    return false
  }

  const handleConnectWallet = async () => {
    if (connectors && connectors.length > 0) {
      try {
        await connect({ connector: connectors[0] })
      } catch (error) {
        // Silently handle connection errors
      }
    }
  }

  const handleClaimBadge = (badgeId: string) => {
    if (!address) return
    try {
      // Update localStorage with address-based structure
      const earned = localStorage.getItem('earned_badges') || '{}'
      let badgesByAddress: Record<string, string[]> = {}
      
      try {
        const parsed = JSON.parse(earned)
        // Migrate old format (array) to new format (object)
        if (Array.isArray(parsed)) {
          badgesByAddress = {}
        } else if (parsed && typeof parsed === 'object') {
          badgesByAddress = parsed
        }
      } catch {
        badgesByAddress = {}
      }
      
      const addressKey = address.toLowerCase()
      if (!badgesByAddress[addressKey]) {
        badgesByAddress[addressKey] = []
      }
      
      if (!badgesByAddress[addressKey].includes(badgeId)) {
        badgesByAddress[addressKey].push(badgeId)
        localStorage.setItem('earned_badges', JSON.stringify(badgesByAddress))
      }

      // Update React state IMMEDIATELY (no need to wait for storage event)
      setBadges((prevBadges) =>
        prevBadges.map((badge) =>
          badge.id === badgeId ? { ...badge, isClaimed: true } : badge
        )
      )
    } catch (error) {
      console.error('[Badges] Failed to claim badge:', error)
    }
  }

  return (
    <div className="min-h-screen px-6 lg:px-10 py-12 md:py-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-light text-white mb-3">Badges</h1>
          <p className="text-sm text-gray-400 font-light max-w-md mx-auto">
            Your on-chain activity is reflected here
          </p>
        </div>

        {/* Connect wallet button - only show if not connected */}
        {!isConnected && (
          <div className="flex justify-center mb-12">
            <button
              onClick={handleConnectWallet}
              className="px-6 py-3 rounded-xl font-light text-white text-sm transition-all duration-300 bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 hover:border-pink-400/50 hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 shadow-lg shadow-accent/20 hover:shadow-accent/30"
            >
              Connect wallet to continue
            </button>
          </div>
        )}

        {/* Badges Grid */}
        <div className="flex justify-center items-center gap-4 mt-16 relative">
          {badges.map((badge) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              onClaim={handleClaimBadge}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
