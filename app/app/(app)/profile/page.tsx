'use client'

import { useState, useEffect } from 'react'
import { useSafeAccount } from '@/lib/wagmi/safeHooks'
import { BadgeEmblem } from '@/components/badges/BadgeEmblem'
import { BADGE_DEFINITIONS } from '@/lib/badges'
import { motion } from 'framer-motion'
import { Edit2 } from 'lucide-react'

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

// Generate deterministic avatar (simple gradient based on address)
function generateAvatar(address: string): string {
  // Simple hash function for deterministic colors
  let hash = 0
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 70%, 50%)`
}

// Format address
function formatAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function ProfilePage() {
  const { address, isConnected } = useSafeAccount()
  const [displayName, setDisplayName] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [earnedBadges, setEarnedBadges] = useState<string[]>([])
  
  // Load display name from localStorage
  useEffect(() => {
    if (isConnected && address) {
      const stored = localStorage.getItem(`display_name_${address}`)
      if (stored) {
        setDisplayName(stored)
      } else {
        setDisplayName(formatAddress(address))
      }
    }
  }, [isConnected, address])
  
  // Load earned badges
  useEffect(() => {
    if (isConnected && address) {
      setEarnedBadges(getEarnedBadges(address))
    } else {
      setEarnedBadges([])
    }
  }, [isConnected, address]) // Reload when address changes
  
  const handleSaveName = () => {
    if (address && displayName.trim()) {
      localStorage.setItem(`display_name_${address}`, displayName.trim())
      setIsEditingName(false)
    }
  }
  
  if (!isConnected || !address) {
    return (
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8">
        <div className="glass rounded-3xl p-8 max-w-md w-full text-center">
          <p className="text-sm text-gray-400 font-light">Please connect your wallet to view your profile</p>
        </div>
      </section>
    )
  }
  
  const avatarColor = generateAvatar(address)
  
  return (
    <section className="relative z-10 min-h-screen px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Identity Section */}
        <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 sm:gap-6">
            {/* Avatar with Early user aura */}
            <div className="relative">
              <div 
                className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-white text-lg sm:text-xl md:text-2xl font-light"
                style={{ backgroundColor: avatarColor }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
              {/* Early user aura - enhanced */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/40 via-accent/45 to-purple-500/40 blur-2xl -z-10 animate-pulse" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500/30 via-pink-500/30 to-accent/30 blur-xl -z-10" style={{ animation: 'pulse 4s ease-in-out infinite' }} />
              <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-pink-500/20 via-accent/25 to-purple-500/20 blur-3xl -z-10" />
            </div>
            
            {/* Display Name - Editable */}
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveName()
                      } else if (e.key === 'Escape') {
                        setIsEditingName(false)
                        setDisplayName(localStorage.getItem(`display_name_${address}`) || formatAddress(address))
                      }
                    }}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-lg font-light focus:outline-none focus:border-white/20"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-light text-white">{displayName}</h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-sm text-gray-400 font-light mt-1">{formatAddress(address)}</p>
            </div>
          </div>
          </div>
        </div>
        
        {/* Credits Section */}
        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-light text-white mb-4">Credits</h2>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-sm text-gray-400 font-light mb-1">Beta credits</p>
            <p className="text-2xl font-light text-white bg-gradient-to-r from-pink-400 via-accent to-purple-400 bg-clip-text text-transparent">$100</p>
          </div>
        </div>
        
        {/* Activity Section */}
        <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-light text-white mb-3 sm:mb-4">Activity</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-gray-500 font-light mb-1">Swaps count</p>
              <p className="text-xl font-light text-white">0</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-gray-500 font-light mb-1">Total volume</p>
              <p className="text-xl font-light text-white">$0</p>
            </div>
          </div>
        </div>
        
        {/* Badges Section */}
        <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-light text-white mb-3 sm:mb-4">Badges</h2>
          {earnedBadges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-3 sm:gap-4">
              {earnedBadges.map((badgeId) => {
                const badge = BADGE_DEFINITIONS[badgeId]
                if (!badge) return null
                return (
                  <div
                    key={badgeId}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 text-center"
                  >
                    <div className="flex items-center justify-center mb-3">
                      <BadgeEmblem
                        badgeId={badgeId}
                        isEarned={true}
                        isUnlockedUnclaimed={false}
                        isLocked={false}
                      />
                    </div>
                    <p className="text-sm font-light text-white">{badge.title}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 font-light text-center py-8">No badges earned yet</p>
          )}
        </div>
      </div>
    </section>
  )
}
