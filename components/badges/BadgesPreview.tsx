'use client'

import { useSafeConnect } from '@/lib/wagmi/safeHooks'
import { BadgeCardPreview } from './BadgeCardPreview'
import { BADGE_ORDER } from '@/lib/badges'

interface BadgesPreviewProps {
  onHardReset?: () => void
}

export function BadgesPreview({ onHardReset }: BadgesPreviewProps) {
  const { connect, connectors } = useSafeConnect()
  const DEBUG_WALLET = process.env.NEXT_PUBLIC_DEBUG_WALLET === '1'

  const handleConnectWallet = () => {
    const availableConnector = connectors[0]
    if (availableConnector) {
      connect({ connector: availableConnector })
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

        {/* Connect wallet CTA */}
        <div className="flex justify-center mb-12">
          <button
            onClick={handleConnectWallet}
            className="px-8 py-3 text-base font-light bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 text-white rounded-xl hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 hover:border-pink-400/50 shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          >
            Connect wallet to continue
          </button>
          {DEBUG_WALLET && onHardReset && (
            <button
              onClick={onHardReset}
              className="ml-4 px-8 py-3 text-base font-light bg-red-600/20 border border-red-500/40 text-red-300 rounded-xl hover:bg-red-600/30 hover:border-red-500/50 transition-all duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            >
              HARD RESET WALLET STATE
            </button>
          )}
        </div>

        {/* Badges row - single horizontal line */}
        <div className="flex flex-row justify-center gap-6 overflow-x-auto pb-4">
          {BADGE_ORDER.map((badgeId) => (
            <BadgeCardPreview
              key={badgeId}
              badgeId={badgeId}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

