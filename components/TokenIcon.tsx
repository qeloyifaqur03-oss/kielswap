'use client'

import Image from 'next/image'

interface TokenIconProps {
  src?: string
  alt: string
  width?: number
  height?: number
  className?: string
}

export function TokenIcon({ src, alt, width = 18, height = 18, className = '' }: TokenIconProps) {
  if (!src) return null

  // Use unoptimized for external URLs to avoid 403 errors
  const isExternal = src.startsWith('http://') || src.startsWith('https://')
  
  if (isExternal) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={{ pointerEvents: 'none' }}
        onError={(e) => {
          // Try alternative URL formats if CoinGecko fails
          const src = e.currentTarget.src
          if (src.includes('coingecko.com')) {
            // Try different formats
            if (src.includes('/large/')) {
              // Try without query params first
              const cleanUrl = src.split('?')[0]
              e.currentTarget.src = cleanUrl
              return
            }
            if (src.includes('/thumb/')) {
              // Try large version
              const largeUrl = src.replace('/thumb/', '/large/')
              e.currentTarget.src = largeUrl
              return
            }
          }
          // Try using token symbol as fallback
          const symbol = alt.toUpperCase()
          if (symbol === 'AAVE' || symbol.includes('AAVE')) {
            e.currentTarget.src = 'https://cryptologos.cc/logos/aave-aave-logo.png'
            return
          }
          if (symbol === 'SUSHI' || symbol.includes('SUSHI')) {
            e.currentTarget.src = 'https://cryptologos.cc/logos/sushiswap-sushi-logo.png'
            return
          }
          // Hide broken image if all attempts fail
          e.currentTarget.style.display = 'none'
        }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized={isExternal}
    />
  )
}

