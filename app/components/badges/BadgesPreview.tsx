'use client'

import { useState, useEffect } from 'react'
import { useSafeAccount } from '@/lib/wagmi/safeHooks'
import { BadgeEmblem } from './BadgeEmblem'
import { BADGE_ORDER, BADGE_DEFINITIONS, Badge } from '@/lib/badges'
import { motion } from 'framer-motion'

interface BadgesPreviewProps {
  onHardReset?: () => void
}

// Get earned badges for a specific address
function getEarnedBadges(address?: string): string[] {
  if (!address) return []
  try {
    const stored = localStorage.getItem('earned_badges')
    if (stored) {
      const badgesByAddress = JSON.parse(stored)
      // Support both old format (array) and new format (object with addresses)
      if (Array.isArray(badgesByAddress)) {
        return badgesByAddress // Old format - return all
      }
      if (badgesByAddress && typeof badgesByAddress === 'object') {
        return badgesByAddress[address.toLowerCase()] || []
      }
    }
  } catch (error) {
    // Ignore errors
  }
  return []
}

// Badge card - shows all badges, earned or not
function EarnedBadgeCard({ badgeId, isEarned }: { badgeId: string; isEarned: boolean }) {
  const badge = BADGE_DEFINITIONS[badgeId]
  if (!badge) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={`glass-strong rounded-2xl border p-6 relative flex-shrink-0 w-64 ${
        isEarned 
          ? 'bg-white/5 border-white/10 shadow-lg shadow-pink-500/10' 
          : 'bg-white/3 border-white/10 opacity-60'
      }`}
    >
      {/* Icon */}
      <div className="flex items-center justify-center mb-4 relative z-10">
        <BadgeEmblem
          badgeId={badgeId}
          isEarned={isEarned}
          isUnlockedUnclaimed={false}
          isLocked={!isEarned}
        />
      </div>

      {/* Title */}
      <h3 className={`text-lg font-light text-center mb-2 relative z-10 ${isEarned ? 'text-white' : 'text-gray-500'}`}>
        {badge.title}
      </h3>

      {/* Description */}
      <p className={`text-sm font-light text-center relative z-10 ${isEarned ? 'text-gray-400' : 'text-gray-600'}`}>
        {badge.description}
      </p>
    </motion.div>
  )
}

export function BadgesPreview({ onHardReset }: BadgesPreviewProps) {
  const { isConnected, address } = useSafeAccount()
  const [earnedBadges, setEarnedBadges] = useState<string[]>([])

  // Load earned badges - reactive to localStorage changes
  useEffect(() => {
    const loadBadges = () => {
      setEarnedBadges(getEarnedBadges(address || undefined))
    }
    
    // Initial load
    loadBadges()
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'earned_badges') {
        loadBadges()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also check on focus (for same-tab updates)
    const handleFocus = () => loadBadges()
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [address]) // Reload when address changes

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

        {/* Show all badges from BADGE_ORDER */}
        <div className="flex flex-row justify-center gap-6 overflow-x-auto pb-4 flex-wrap">
          {BADGE_ORDER.map((badgeId) => {
            const isEarned = earnedBadges.includes(badgeId)
            return (
              <EarnedBadgeCard key={badgeId} badgeId={badgeId} isEarned={isEarned} />
            )
          })}
        </div>
      </div>
    </div>
  )
}

