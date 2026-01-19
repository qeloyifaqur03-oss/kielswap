'use client'

import { Badge, BADGE_IDS, EXPLORER_UNLOCK_CONDITIONS } from '@/lib/badges'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { BadgeEmblem } from './BadgeEmblem'
import { useSafeAccount, useSafeConnect } from '@/lib/wagmi/safeHooks'
import { useState } from 'react'
import { isTrulyConnected } from '@/lib/wallet/isTrulyConnected'
import { useSignMessage } from 'wagmi'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface BadgeCardProps {
  badge: Badge
  onClaim: (badgeId: string) => void
}

export function BadgeCard({ badge, onClaim }: BadgeCardProps) {
  const accountResult = useSafeAccount()
  const { isConnected, address, connector, status: accountStatus, mounted } = accountResult
  const { connect, connectors } = useSafeConnect()
  const [isClaiming, setIsClaiming] = useState(false)
  
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

      // Step 3: After successful signature, call onClaim
      onClaim(badge.id)
    } catch (error) {
      console.error('[badges] Claim signature error:', error)
      // User cancelled or error - don't claim
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
      className="glass-strong rounded-2xl border p-6 relative overflow-hidden flex-shrink-0 w-64"
      style={{
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Icon */}
      <div className="flex items-center justify-center mb-4">
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-pink-500/20 via-accent/25 to-purple-500/20 flex items-center justify-center border border-white/10 shadow-lg shadow-accent/20">
          <BadgeEmblem
            badgeId={badge.id}
            isEarned={isClaimed}
            isUnlockedUnclaimed={isCompleted}
            isLocked={!isCompleted && !isClaimed}
          />
        </div>
      </div>

      {/* Title with optional help icon for Explorer */}
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <h3 className="text-lg font-light text-white text-center">
          {badge.title}
        </h3>
        {badge.id === BADGE_IDS.EXPLORER && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-gray-400 hover:border-pink-400/40 hover:text-gray-300 transition-colors p-0">
                <span className="flex items-center justify-center w-full h-full leading-[1] text-center">?</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4 glass-strong rounded-xl" align="center">
              <h4 className="text-sm font-light text-white mb-3">How to unlock</h4>
              <ul className="space-y-2">
                {EXPLORER_UNLOCK_CONDITIONS.map((condition, index) => (
                  <li key={index} className="text-xs text-gray-400 font-light flex items-start gap-2">
                    <span className="text-gray-500 mt-0.5">•</span>
                    <span>{condition}</span>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 font-light text-center mb-4 min-h-[40px]">
        {badge.description}
      </p>

      {/* Status line */}
      <div className="text-xs text-gray-500 font-light text-center mb-4">
        {statusText}
      </div>

      {/* Claim button - only shown if Completed */}
      {isCompleted && (
        <Button
          onClick={handleClaim}
          disabled={isClaiming || isClaimed}
          className="w-full h-10 rounded-xl font-light transition-all duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] bg-white/5 border border-white/15 text-gray-300 hover:bg-white/8 hover:border-white/20"
        >
          {isClaiming ? 'Signing...' : 'Claim badge'}
        </Button>
      )}

      {/* Show disabled button if claimed */}
      {isClaimed && (
        <Button
          disabled
          className="w-full h-10 rounded-xl font-light bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed"
        >
          Claim badge
        </Button>
      )}
    </motion.div>
  )
}
