'use client'

import { Badge, BADGE_IDS, EXPLORER_UNLOCK_CONDITIONS } from '@/lib/badges'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { BadgeEmblem } from './BadgeEmblem'
import { useSafeAccount, useSafeConnect } from '@/lib/wagmi/safeHooks'
import { useState, useRef, useEffect } from 'react'
import { isTrulyConnected } from '@/lib/wallet/isTrulyConnected'
import { useSignMessage } from 'wagmi'
import { createPortal } from 'react-dom'

interface BadgeCardProps {
  badge: Badge
  onClaim: (badgeId: string) => void
}

export function BadgeCard({ badge, onClaim }: BadgeCardProps) {
  const accountResult = useSafeAccount()
  const { isConnected, address, connector, status: accountStatus, mounted } = accountResult
  const { connect, connectors } = useSafeConnect()
  const [isClaiming, setIsClaiming] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null)
  const tooltipButtonRef = useRef<HTMLButtonElement>(null)
  const [mounted2, setMounted2] = useState(false)
  
  // Safe signMessage - wrapped in try-catch
  let signMessageAsync: ((params: { message: string }) => Promise<string>) | null = null
  try {
    const signHook = useSignMessage()
    signMessageAsync = signHook.signMessageAsync
  } catch (error) {
    console.warn('[BadgeCard] Failed to access signMessage:', error)
  }

  // Determine badge status
  const isClaimed = badge.isClaimed
  const isCompleted = badge.isUnlocked && !badge.isClaimed

  // Check wallet connection
  const connectionResult = isTrulyConnected({
    mounted,
    isConnected,
    status: accountStatus,
    address: address || null,
    connectorId: connector?.id || null,
  })
  const walletConnected = connectionResult.ok

  // Handle claim button click
  const handleClaim = async () => {
    // Step 1: Connect wallet if not connected
    if (!walletConnected || !address) {
      const availableConnector = connectors[0]
      if (availableConnector) {
        connect({ connector: availableConnector })
      }
      return
    }

    // Step 2: Require signature
    if (!isCompleted || isClaimed) {
      return
    }

    if (!signMessageAsync) {
      console.error('[badges] Sign message not available')
      return
    }

    try {
      setIsClaiming(true)

      // Sign message to claim badge
      const message = `Claim badge: ${badge.id}\nAddress: ${address}\nTimestamp: ${Date.now()}`
      
      const signature = await signMessageAsync({
        message,
      })

      // Step 3: After successful signature, call onClaim callback
      // The parent component will update React state IMMEDIATELY
      onClaim(badge.id)

      // Also update localStorage for persistence with address-based structure
      if (!address) return
      const currentEarned = localStorage.getItem('earned_badges') || '{}'
      let badgesByAddress: Record<string, string[]> = {}
      
      try {
        const parsed = JSON.parse(currentEarned)
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
      
      if (!badgesByAddress[addressKey].includes(badge.id)) {
        badgesByAddress[addressKey].push(badge.id)
        localStorage.setItem('earned_badges', JSON.stringify(badgesByAddress))
      }
    } catch (error) {
      console.error('[badges] Claim signature error:', error)
    } finally {
      setIsClaiming(false)
    }
  }

  // Status text
  const getStatusText = (): string => {
    if (isClaimed) return 'Claimed'
    if (isCompleted) return 'Completed'
    return 'Not completed'
  }

  const statusText = getStatusText()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="glass-strong rounded-2xl border p-6 relative flex-shrink-0 w-64"
      style={{
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Icon */}
      <div className="flex items-center justify-center mb-4 relative z-10">
        <BadgeEmblem
          badgeId={badge.id}
          isEarned={isClaimed}
          isUnlockedUnclaimed={isCompleted}
          isLocked={!isCompleted && !isClaimed}
        />
      </div>

      {/* Title with optional help icon for Explorer */}
      <div className="flex items-center justify-center gap-1.5 mb-2 relative z-10">
        <h3 className="text-lg font-light text-white text-center">
          {badge.title}
        </h3>
        {badge.id === BADGE_IDS.EXPLORER && (
          <div className="relative">
            <button
              ref={tooltipButtonRef}
              onMouseEnter={() => {
                setMounted2(true)
                setShowTooltip(true)
                if (tooltipButtonRef.current) {
                  const rect = tooltipButtonRef.current.getBoundingClientRect()
                  setTooltipPos({
                    top: rect.bottom + 8,
                    left: rect.left + rect.width / 2,
                  })
                }
              }}
              onMouseLeave={() => setShowTooltip(false)}
              className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-gray-400 hover:border-pink-400/40 hover:text-gray-300 transition-colors p-0"
            >
              <span className="flex items-center justify-center w-full h-full leading-[1] text-center">?</span>
            </button>
            
            {/* Tooltip - rendered in portal */}
            {mounted2 && showTooltip && tooltipPos && createPortal(
              <div 
                className="fixed w-64 p-4 border border-white/10 rounded-xl shadow-xl z-[9999] pointer-events-auto"
                style={{ 
                  top: `${tooltipPos.top}px`,
                  left: `${tooltipPos.left}px`,
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(10, 10, 12, 0.92)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <h4 className="text-sm font-light text-white mb-3">How to unlock</h4>
                <ul className="space-y-2">
                  {EXPLORER_UNLOCK_CONDITIONS.map((condition, index) => (
                    <li key={index} className="text-xs text-gray-400 font-light flex items-start gap-2">
                      <span className="text-gray-500 mt-0.5">•</span>
                      <span>{condition}</span>
                    </li>
                  ))}
                </ul>
              </div>,
              document.body
            )}
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 font-light text-center mb-4 min-h-[40px] relative z-10">
        {badge.description}
      </p>

      {/* Claim button - only shown if Completed/Unlocked or Already Claimed */}
      {(isCompleted || isClaimed) && (
        <Button
          onClick={handleClaim}
          disabled={isClaiming || isClaimed || !walletConnected}
          className={`w-full h-10 rounded-xl font-light transition-all duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isClaimed || !walletConnected
              ? 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 hover:border-pink-400/50 text-white shadow-lg shadow-accent/20 hover:shadow-accent/30'
          }`}
        >
          {isClaiming ? 'Signing...' : (isClaimed ? 'Claimed' : 'Claim')}
        </Button>
      )}

      {/* Not completed text - shown if locked */}
      {!isCompleted && !isClaimed && (
        <div className="w-full h-10 flex items-center justify-center rounded-xl text-xs text-gray-500 font-light">
          Not completed
        </div>
      )}
    </motion.div>
  )
}
