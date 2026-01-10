'use client'

interface BadgeEmblemProps {
  badgeId: string
  isEarned: boolean
  isUnlockedUnclaimed: boolean
  isLocked: boolean
}

// Gradient color palette
const pinkColor = '#ec4899' // pink-400
const accentColor = '#c42558'
const purpleColor = '#9333ea' // purple-500

export function BadgeEmblem({ badgeId, isEarned, isUnlockedUnclaimed, isLocked }: BadgeEmblemProps) {
  const isVisible = isEarned || isUnlockedUnclaimed
  const opacity = isLocked ? 0.4 : isEarned ? 1 : 0.7
  const glowIntensity = isEarned ? 1 : isUnlockedUnclaimed ? 0.6 : 0

  // Helper function to create gradient ID - using badgeId for uniqueness
  const gradientId = `gradient-${badgeId}`

  // Early Intent User - Crystalline diamond with inner prism and orbital rings
  if (badgeId === 'beta-participant') {
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" className="relative z-10">
        <defs>
          <linearGradient id={`${gradientId}-main`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={pinkColor} stopOpacity={isVisible ? 0.9 : 0.5} />
            <stop offset="50%" stopColor={accentColor} stopOpacity={isVisible ? 1 : 0.6} />
            <stop offset="100%" stopColor={purpleColor} stopOpacity={isVisible ? 0.9 : 0.5} />
          </linearGradient>
          <linearGradient id={`${gradientId}-inner`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={purpleColor} stopOpacity={isVisible ? 0.7 : 0.3} />
            <stop offset="100%" stopColor={pinkColor} stopOpacity={isVisible ? 0.7 : 0.3} />
          </linearGradient>
          <filter id={`glow-${badgeId}`}>
            <feGaussianBlur stdDeviation={isEarned ? 4 : 3} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Outer orbital ring */}
        <ellipse
          cx="40"
          cy="40"
          rx="35"
          ry="18"
          fill="none"
          stroke={`url(#${gradientId}-main)`}
          strokeWidth="1"
          opacity={isVisible ? opacity * 0.5 : opacity * 0.3}
          transform="rotate(-30 40 40)"
        />
        <ellipse
          cx="40"
          cy="40"
          rx="35"
          ry="18"
          fill="none"
          stroke={`url(#${gradientId}-main)`}
          strokeWidth="1"
          opacity={isVisible ? opacity * 0.5 : opacity * 0.3}
          transform="rotate(30 40 40)"
        />
        {/* Main diamond shape */}
        <polygon
          points="40,12 58,40 40,68 22,40"
          fill="none"
          stroke={`url(#${gradientId}-main)`}
          strokeWidth="1.8"
          opacity={opacity}
          strokeLinejoin="round"
          filter={glowIntensity > 0 ? `url(#glow-${badgeId})` : undefined}
        />
        {/* Inner prism facets */}
        <line x1="40" y1="12" x2="40" y2="68" stroke={`url(#${gradientId}-inner)`} strokeWidth="1" opacity={isVisible ? opacity * 0.6 : opacity * 0.3} />
        <line x1="22" y1="40" x2="58" y2="40" stroke={`url(#${gradientId}-inner)`} strokeWidth="1" opacity={isVisible ? opacity * 0.6 : opacity * 0.3} />
        <line x1="31" y1="26" x2="49" y2="54" stroke={`url(#${gradientId}-inner)`} strokeWidth="0.8" opacity={isVisible ? opacity * 0.4 : opacity * 0.2} />
        <line x1="49" y1="26" x2="31" y2="54" stroke={`url(#${gradientId}-inner)`} strokeWidth="0.8" opacity={isVisible ? opacity * 0.4 : opacity * 0.2} />
        {/* Center core */}
        <circle
          cx="40"
          cy="40"
          r="5"
          fill={`url(#${gradientId}-main)`}
          opacity={isVisible ? opacity * 0.8 : opacity * 0.4}
        />
        {/* Corner accents */}
        <circle cx="40" cy="12" r="2" fill={`url(#${gradientId}-main)`} opacity={isVisible ? opacity * 0.7 : opacity * 0.4} />
        <circle cx="40" cy="68" r="2" fill={`url(#${gradientId}-main)`} opacity={isVisible ? opacity * 0.7 : opacity * 0.4} />
        {/* Checkmark - only when claimed */}
        {isEarned && (
          <path
            d="M 30 40 L 37 47 L 50 34"
            fill="none"
            stroke={pinkColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
          />
        )}
      </svg>
    )
  }

  // Product Contributor - Layered feedback waves with central voice symbol
  if (badgeId === 'feedback-contributor') {
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" className="relative z-10">
        <defs>
          <linearGradient id={`${gradientId}-main`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={pinkColor} stopOpacity={isVisible ? 0.9 : 0.5} />
            <stop offset="50%" stopColor={accentColor} stopOpacity={isVisible ? 1 : 0.6} />
            <stop offset="100%" stopColor={purpleColor} stopOpacity={isVisible ? 0.9 : 0.5} />
          </linearGradient>
          <linearGradient id={`${gradientId}-wave`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={purpleColor} stopOpacity={isVisible ? 0.6 : 0.3} />
            <stop offset="50%" stopColor={accentColor} stopOpacity={isVisible ? 0.8 : 0.4} />
            <stop offset="100%" stopColor={pinkColor} stopOpacity={isVisible ? 0.6 : 0.3} />
          </linearGradient>
          <filter id={`glow-${badgeId}`}>
            <feGaussianBlur stdDeviation={isEarned ? 4 : 3} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Radiating wave arcs - voice/feedback emanating */}
        <path
          d="M 58 24 Q 68 34 68 40 Q 68 46 58 56"
          fill="none"
          stroke={`url(#${gradientId}-wave)`}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity={isVisible ? opacity * 0.4 : opacity * 0.2}
        />
        <path
          d="M 52 28 Q 60 34 60 40 Q 60 46 52 52"
          fill="none"
          stroke={`url(#${gradientId}-wave)`}
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity={isVisible ? opacity * 0.6 : opacity * 0.3}
        />
        {/* Central hexagonal voice chamber */}
        <polygon
          points="40,14 54,24 54,56 40,66 26,56 26,24"
          fill="none"
          stroke={`url(#${gradientId}-main)`}
          strokeWidth="1.6"
          opacity={opacity}
          strokeLinejoin="round"
          filter={glowIntensity > 0 ? `url(#glow-${badgeId})` : undefined}
        />
        {/* Inner voice symbol - stylized speech marks */}
        <g opacity={isVisible ? opacity * 0.8 : opacity * 0.4}>
          {/* Left quote mark */}
          <path
            d="M 32 34 Q 28 38 32 42 L 36 38 Q 34 36 32 34"
            fill={`url(#${gradientId}-main)`}
            strokeWidth="0"
          />
          {/* Right quote mark */}
          <path
            d="M 44 34 Q 40 38 44 42 L 48 38 Q 46 36 44 34"
            fill={`url(#${gradientId}-main)`}
            strokeWidth="0"
          />
          {/* Sound wave lines below */}
          <line x1="30" y1="48" x2="50" y2="48" stroke={`url(#${gradientId}-main)`} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="34" y1="52" x2="46" y2="52" stroke={`url(#${gradientId}-main)`} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
        </g>
        {/* Corner nodes */}
        <circle cx="40" cy="14" r="2" fill={`url(#${gradientId}-main)`} opacity={isVisible ? opacity * 0.6 : opacity * 0.3} />
        <circle cx="40" cy="66" r="2" fill={`url(#${gradientId}-main)`} opacity={isVisible ? opacity * 0.6 : opacity * 0.3} />
        {/* Checkmark - only when claimed */}
        {isEarned && (
          <path
            d="M 30 40 L 37 47 L 50 34"
            fill="none"
            stroke={pinkColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
          />
        )}
      </svg>
    )
  }

  // Explorer - Compass rose with layered navigation paths
  if (badgeId === 'explorer') {
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" className="relative z-10">
        <defs>
          <linearGradient id={`${gradientId}-main`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={pinkColor} stopOpacity={isVisible ? 0.9 : 0.5} />
            <stop offset="50%" stopColor={accentColor} stopOpacity={isVisible ? 1 : 0.6} />
            <stop offset="100%" stopColor={purpleColor} stopOpacity={isVisible ? 0.9 : 0.5} />
          </linearGradient>
          <linearGradient id={`${gradientId}-path`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={pinkColor} stopOpacity={isVisible ? 0.5 : 0.25} />
            <stop offset="100%" stopColor={purpleColor} stopOpacity={isVisible ? 0.5 : 0.25} />
          </linearGradient>
          <filter id={`glow-${badgeId}`}>
            <feGaussianBlur stdDeviation={isEarned ? 4 : 3} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Outer compass ring */}
        <circle
          cx="40"
          cy="40"
          r="35"
          fill="none"
          stroke={`url(#${gradientId}-main)`}
          strokeWidth="1.2"
          opacity={opacity}
          filter={glowIntensity > 0 ? `url(#glow-${badgeId})` : undefined}
        />
        {/* Cardinal direction markers */}
        <line x1="40" y1="5" x2="40" y2="12" stroke={`url(#${gradientId}-main)`} strokeWidth="2" strokeLinecap="round" opacity={isVisible ? opacity : opacity * 0.5} />
        <line x1="40" y1="68" x2="40" y2="75" stroke={`url(#${gradientId}-main)`} strokeWidth="1.5" strokeLinecap="round" opacity={isVisible ? opacity * 0.7 : opacity * 0.4} />
        <line x1="5" y1="40" x2="12" y2="40" stroke={`url(#${gradientId}-main)`} strokeWidth="1.5" strokeLinecap="round" opacity={isVisible ? opacity * 0.7 : opacity * 0.4} />
        <line x1="68" y1="40" x2="75" y2="40" stroke={`url(#${gradientId}-main)`} strokeWidth="1.5" strokeLinecap="round" opacity={isVisible ? opacity * 0.7 : opacity * 0.4} />
        {/* Compass rose - 8-pointed star */}
        <g opacity={isVisible ? opacity * 0.85 : opacity * 0.5}>
          {/* Main 4 points */}
          <polygon
            points="40,18 44,36 40,40 36,36"
            fill={`url(#${gradientId}-main)`}
          />
          <polygon
            points="40,62 44,44 40,40 36,44"
            fill={`url(#${gradientId}-path)`}
          />
          <polygon
            points="18,40 36,36 40,40 36,44"
            fill={`url(#${gradientId}-path)`}
          />
          <polygon
            points="62,40 44,36 40,40 44,44"
            fill={`url(#${gradientId}-path)`}
          />
          {/* Diagonal points */}
          <polygon
            points="24,24 36,36 40,40 36,40 32,32"
            fill={`url(#${gradientId}-main)`}
            opacity="0.6"
          />
          <polygon
            points="56,24 44,36 40,40 44,40 48,32"
            fill={`url(#${gradientId}-main)`}
            opacity="0.6"
          />
          <polygon
            points="24,56 36,44 40,40 36,40 32,48"
            fill={`url(#${gradientId}-main)`}
            opacity="0.6"
          />
          <polygon
            points="56,56 44,44 40,40 44,40 48,48"
            fill={`url(#${gradientId}-main)`}
            opacity="0.6"
          />
        </g>
        {/* Inner circle */}
        <circle
          cx="40"
          cy="40"
          r="6"
          fill="none"
          stroke={`url(#${gradientId}-main)`}
          strokeWidth="1.5"
          opacity={isVisible ? opacity : opacity * 0.5}
        />
        {/* Center dot */}
        <circle
          cx="40"
          cy="40"
          r="3"
          fill={`url(#${gradientId}-main)`}
          opacity={isVisible ? opacity : opacity * 0.5}
        />
        {/* Checkmark - only when claimed */}
        {isEarned && (
          <path
            d="M 30 40 L 37 47 L 50 34"
            fill="none"
            stroke={pinkColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
          />
        )}
      </svg>
    )
  }

  // Connector - Interlocking links + routing nodes (referrals/connection)
  if (badgeId === 'referral') {
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" className="relative z-10">
        <defs>
          <linearGradient id={`${gradientId}-main`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={pinkColor} stopOpacity={isVisible ? 0.9 : 0.5} />
            <stop offset="50%" stopColor={accentColor} stopOpacity={isVisible ? 1 : 0.6} />
            <stop offset="100%" stopColor={purpleColor} stopOpacity={isVisible ? 0.9 : 0.5} />
          </linearGradient>
          <linearGradient id={`${gradientId}-sub`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={purpleColor} stopOpacity={isVisible ? 0.55 : 0.25} />
            <stop offset="50%" stopColor={accentColor} stopOpacity={isVisible ? 0.75 : 0.35} />
            <stop offset="100%" stopColor={pinkColor} stopOpacity={isVisible ? 0.55 : 0.25} />
          </linearGradient>
          <filter id={`glow-${badgeId}`}>
            <feGaussianBlur stdDeviation={isEarned ? 4 : 3} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Outer circle */}
        <circle
          cx="40"
          cy="40"
          r="35"
          fill="none"
          stroke={`url(#${gradientId}-main)`}
          strokeWidth="1.3"
          opacity={opacity}
          filter={glowIntensity > 0 ? `url(#glow-${badgeId})` : undefined}
        />
        {/* Interlocking links */}
        <g opacity={isVisible ? opacity * 0.85 : opacity * 0.55}>
          <rect
            x="18"
            y="33"
            width="30"
            height="18"
            rx="9"
            fill="none"
            stroke={`url(#${gradientId}-main)`}
            strokeWidth="2"
            transform="rotate(-18 33 42)"
          />
          <rect
            x="32"
            y="29"
            width="30"
            height="18"
            rx="9"
            fill="none"
            stroke={`url(#${gradientId}-sub)`}
            strokeWidth="2"
            transform="rotate(18 47 38)"
          />
          {/* Inner chain bars */}
          <line x1="30" y1="38" x2="42" y2="42" stroke={`url(#${gradientId}-sub)`} strokeWidth="1.4" strokeLinecap="round" opacity={isVisible ? 0.65 : 0.4} />
          <line x1="38" y1="34" x2="50" y2="38" stroke={`url(#${gradientId}-sub)`} strokeWidth="1.4" strokeLinecap="round" opacity={isVisible ? 0.65 : 0.4} />
        </g>

        {/* Routing nodes (referral propagation) */}
        <g opacity={isVisible ? opacity * 0.75 : opacity * 0.5}>
          <circle cx="24" cy="56" r="3.2" fill={`url(#${gradientId}-main)`} />
          <circle cx="56" cy="56" r="3.2" fill={`url(#${gradientId}-main)`} />
          <circle cx="40" cy="62" r="2.6" fill={`url(#${gradientId}-sub)`} />
          <path
            d="M 24 56 C 30 58, 34 60, 40 62 C 46 60, 50 58, 56 56"
            fill="none"
            stroke={`url(#${gradientId}-sub)`}
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity={isVisible ? 0.7 : 0.45}
          />
          {/* Tiny arrow hints */}
          <path d="M 36.5 60.6 L 40 62 L 37.6 65" fill="none" stroke={`url(#${gradientId}-sub)`} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity={isVisible ? 0.6 : 0.35} />
          <path d="M 43.5 60.6 L 40 62 L 42.4 65" fill="none" stroke={`url(#${gradientId}-sub)`} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity={isVisible ? 0.6 : 0.35} />
        </g>
        {/* Checkmark - only when claimed */}
        {isEarned && (
          <path
            d="M 30 40 L 37 47 L 50 34"
            fill="none"
            stroke={pinkColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
          />
        )}
      </svg>
    )
  }

  // Family 3 — Volume (milestone-based)
  // Volume $10K: single ring
  if (badgeId === 'volume-10k') {
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" className="relative z-10">
        <defs>
          <linearGradient id={`${gradientId}-main`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={pinkColor} stopOpacity={isVisible ? 0.9 : 0.5} />
            <stop offset="50%" stopColor={accentColor} stopOpacity={isVisible ? 1 : 0.6} />
            <stop offset="100%" stopColor={purpleColor} stopOpacity={isVisible ? 0.9 : 0.5} />
          </linearGradient>
          <filter id={`glow-${badgeId}`}>
            <feGaussianBlur stdDeviation={isEarned ? 3.5 : 2.5} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke={`url(#${gradientId}-main)`}
          strokeWidth="2"
          opacity={opacity}
          filter={glowIntensity > 0 ? `url(#glow-${badgeId})` : undefined}
        />
        {/* Checkmark centered - only when claimed */}
        {isEarned && (
          <path
            d="M 28 40 L 36 48 L 52 32"
            fill="none"
            stroke={pinkColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
          />
        )}
      </svg>
    )
  }

  // Volume $100K: ring + inner ring
  if (badgeId === 'volume-100k') {
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" className="relative z-10">
        <defs>
          <linearGradient id={`${gradientId}-main`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={pinkColor} stopOpacity={isVisible ? 0.9 : 0.5} />
            <stop offset="50%" stopColor={accentColor} stopOpacity={isVisible ? 1 : 0.6} />
            <stop offset="100%" stopColor={purpleColor} stopOpacity={isVisible ? 0.9 : 0.5} />
          </linearGradient>
          <filter id={`glow-${badgeId}`}>
            <feGaussianBlur stdDeviation={isEarned ? 4.5 : 3.5} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Outer ring */}
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke={`url(#${gradientId}-main)`}
          strokeWidth="2.5"
          opacity={opacity}
          filter={glowIntensity > 0 ? `url(#glow-${badgeId})` : undefined}
        />
        {/* Inner ring */}
        {isVisible && (
          <circle
            cx="40"
            cy="40"
            r="28"
            fill="none"
            stroke={`url(#${gradientId}-main)`}
            strokeWidth="1.5"
            opacity={opacity * 0.7}
          />
        )}
        {/* Checkmark centered - only when claimed */}
        {isEarned && (
          <path
            d="M 28 40 L 36 48 L 52 32"
            fill="none"
            stroke={pinkColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
          />
        )}
      </svg>
    )
  }

  // Volume $1M: double ring + subtle glow
  if (badgeId === 'volume-1m') {
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" className="relative z-10">
        <defs>
          <linearGradient id={`${gradientId}-main`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={pinkColor} stopOpacity={isVisible ? 0.9 : 0.5} />
            <stop offset="50%" stopColor={accentColor} stopOpacity={isVisible ? 1 : 0.6} />
            <stop offset="100%" stopColor={purpleColor} stopOpacity={isVisible ? 0.9 : 0.5} />
          </linearGradient>
          <filter id={`glow-${badgeId}`}>
            <feGaussianBlur stdDeviation={isEarned ? 6 : 5} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Outer ring */}
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke={`url(#${gradientId}-main)`}
          strokeWidth="3"
          opacity={opacity}
          filter={glowIntensity > 0 ? `url(#glow-${badgeId})` : undefined}
        />
        {/* Inner ring */}
        {isVisible && (
          <circle
            cx="40"
            cy="40"
            r="28"
            fill="none"
            stroke={`url(#${gradientId}-main)`}
            strokeWidth="1.5"
            opacity={opacity * 0.7}
          />
        )}
        {/* Checkmark centered - only when claimed */}
        {isEarned && (
          <path
            d="M 28 40 L 36 48 L 52 32"
            fill="none"
            stroke={pinkColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
          />
        )}
      </svg>
    )
  }

  // Volume $10M: double ring + stronger glow
  if (badgeId === 'volume-10m') {
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" className="relative z-10">
        <defs>
          <linearGradient id={`${gradientId}-main`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={pinkColor} stopOpacity={isVisible ? 0.9 : 0.5} />
            <stop offset="50%" stopColor={accentColor} stopOpacity={isVisible ? 1 : 0.6} />
            <stop offset="100%" stopColor={purpleColor} stopOpacity={isVisible ? 0.9 : 0.5} />
          </linearGradient>
          <filter id={`glow-${badgeId}`}>
            <feGaussianBlur stdDeviation={isEarned ? 7 : 6} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Outer ring */}
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke={`url(#${gradientId}-main)`}
          strokeWidth="3.5"
          opacity={opacity}
          filter={glowIntensity > 0 ? `url(#glow-${badgeId})` : undefined}
        />
        {/* Inner ring */}
        {isVisible && (
          <circle
            cx="40"
            cy="40"
            r="28"
            fill="none"
            stroke={`url(#${gradientId}-main)`}
            strokeWidth="1.5"
            opacity={opacity * 0.8}
          />
        )}
        {/* Checkmark centered - only when claimed */}
        {isEarned && (
          <path
            d="M 28 40 L 36 48 L 52 32"
            fill="none"
            stroke={pinkColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
          />
        )}
      </svg>
    )
  }

  // Fallback
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="relative z-10">
      <defs>
        <linearGradient id={`${gradientId}-main`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={pinkColor} stopOpacity={isVisible ? 0.9 : 0.5} />
          <stop offset="50%" stopColor={accentColor} stopOpacity={isVisible ? 1 : 0.6} />
          <stop offset="100%" stopColor={purpleColor} stopOpacity={isVisible ? 0.9 : 0.5} />
        </linearGradient>
      </defs>
      <circle
        cx="40"
        cy="40"
        r="36"
        fill="none"
        stroke={`url(#${gradientId}-main)`}
        strokeWidth="2"
        opacity={opacity}
      />
    </svg>
  )
}
