'use client'

import { motion } from 'framer-motion'
import { BadgeEmblem } from './BadgeEmblem'
import { BADGE_DEFINITIONS } from '@/lib/badges'

interface BadgeCardPreviewProps {
  badgeId: string
}

export function BadgeCardPreview({ badgeId }: BadgeCardPreviewProps) {
  const badge = BADGE_DEFINITIONS[badgeId]
  if (!badge) return null

  const accentColor = '#c42558'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="glass-strong rounded-2xl border p-6 relative overflow-hidden transition-all duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] opacity-50 flex-shrink-0 w-64"
      style={{
        borderColor: 'rgba(255, 255, 255, 0.05)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.01) 0%, rgba(0, 0, 0, 0.05) 100%)',
      }}
    >
      {/* Badge visual - muted */}
      <div className="flex items-center justify-center mb-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center relative"
          style={{
            background: 'rgba(196, 37, 88, 0.04)',
          }}
        >
          <BadgeEmblem
            badgeId={badgeId}
            isEarned={false}
            isUnlockedUnclaimed={false}
            isLocked={true}
          />
        </div>
      </div>

      {/* Title - muted */}
      <h3 className="text-lg font-light text-gray-400 mb-2 text-center">
        {badge.title}
      </h3>

      {/* Description - muted */}
      <p className="text-sm text-gray-500 font-light text-center mb-4 min-h-[40px]">
        {badge.description}
      </p>

      {/* No progress bar, no action button - just visual preview */}
    </motion.div>
  )
}

