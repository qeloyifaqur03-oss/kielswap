'use client'

import { useState, useEffect } from 'react'

interface TokenIconProps {
  src?: string
  alt: string
  width?: number
  height?: number
  className?: string
}

// Generate deterministic placeholder based on symbol/name
function getPlaceholder(symbol: string, width: number, height: number): string {
  const text = symbol.slice(0, 2).toUpperCase()
  const size = Math.max(width, height)
  const fontSize = Math.floor(size * 0.5)
  
  // Create SVG data URL with circle and text
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${width / 2}" cy="${height / 2}" r="${size / 2 - 1}" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
      <text x="${width / 2}" y="${height / 2}" font-family="system-ui, -apple-system" font-size="${fontSize}" font-weight="500" fill="rgba(255,255,255,0.6)" text-anchor="middle" dominant-baseline="central">${text}</text>
    </svg>
  `.trim()
  
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

export function TokenIcon({ src, alt, width = 18, height = 18, className = '' }: TokenIconProps) {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src)
  const [hasError, setHasError] = useState(false)
  
  // Extract symbol from alt text for fallback
  const symbol = alt.split(' ')[0] || alt.slice(0, 2).toUpperCase()
  const placeholderSrc = getPlaceholder(symbol, width, height)
  
  // Update src when prop changes
  useEffect(() => {
    if (src !== currentSrc) {
      setCurrentSrc(src)
      setHasError(false)
    }
  }, [src, currentSrc])
  
  // Log icon URL for debugging
  if (process.env.NODE_ENV === 'development' && src) {
    console.log(`[TokenIcon] Loading icon for ${alt}:`, src)
  }
  
  // If no src or error occurred, show placeholder
  const displaySrc = (hasError || !currentSrc) ? placeholderSrc : currentSrc
  
  // Use regular img (not next/image) for all URLs to avoid Next.js validation
  return (
    <img
      src={displaySrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{ pointerEvents: 'none' }}
      onError={(e) => {
        // Prevent infinite retries - set error flag once and use placeholder
        if (!hasError && displaySrc !== placeholderSrc) {
          setHasError(true)
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[TokenIcon] Failed to load image: ${displaySrc}, using placeholder for ${alt}`)
          }
          // Immediately switch to placeholder to prevent retry
          const target = e.currentTarget as HTMLImageElement
          target.onerror = null // Prevent infinite loop
          target.src = placeholderSrc
        }
      }}
      onLoad={() => {
        // Image loaded successfully
        if (hasError) {
          setHasError(false)
        }
        if (process.env.NODE_ENV === 'development' && displaySrc !== placeholderSrc) {
          console.log(`[TokenIcon] Successfully loaded icon for ${alt}`)
        }
      }}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
    />
  )
}

