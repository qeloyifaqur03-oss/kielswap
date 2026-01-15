'use client'

// @ts-ignore
import { motion } from 'framer-motion'
// @ts-ignore
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Hero() {
  const [appUrl, setAppUrl] = useState<string>('#')
  const [isExternal, setIsExternal] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const hostname = window.location.hostname
    const port = window.location.port
    const protocol = window.location.protocol

    // If already on app.* subdomain, link to /swap on same host
    if (hostname.startsWith('app.')) {
      setAppUrl('/swap')
      setIsExternal(false)
      return
    }

    // Extract base hostname (remove any existing subdomain)
    // e.g., "kielswap.localhost" -> "kielswap.localhost"
    // e.g., "www.kielswap.com" -> "kielswap.com"
    let baseHost = hostname
    const parts = hostname.split('.')
    
    // Handle .localhost domains
    if (hostname.endsWith('.localhost')) {
      // Prepend "app." to the base hostname
      const appHostname = 'app.' + baseHost
      const portPart = port ? `:${port}` : ''
      setAppUrl(`${protocol}//${appHostname}${portPart}`)
      setIsExternal(false) // Same-window navigation for local dev
      return
    }

    // Handle localhost or 127.0.0.1 (without .localhost)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Link to /swap on same host
      setAppUrl('/swap')
      setIsExternal(false)
      return
    }

    // Production: extract base domain (remove www if present)
    if (parts.length > 2 && parts[0] === 'www') {
      baseHost = parts.slice(1).join('.')
    } else if (parts.length >= 2) {
      // Take the last two parts (e.g., "kielswap.com")
      baseHost = parts.slice(-2).join('.')
    }

    // Prepend "app." to base hostname
    const appHostname = 'app.' + baseHost
    // In production, typically no port, but preserve if present
    const portPart = port ? `:${port}` : ''
    setAppUrl(`${protocol}//${appHostname}${portPart}`)
    setIsExternal(true) // New tab for production cross-domain
  }, [])

  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center px-6 md:px-12 pt-32 pb-32">
      <div className="max-w-7xl mx-auto text-center">
        {/* Stable vertical stack */}
        <div className="flex flex-col items-center gap-10">
          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight"
          >
            Swap across{' '}
            <span className="text-6xl md:text-8xl font-normal drop-shadow-[0_0_20px_rgba(236,72,153,0.3)] bg-gradient-to-r from-pink-400 via-accent to-purple-400 bg-clip-text text-transparent">
              50+
            </span>{' '}
            networks with one flow.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto"
          >
            Outcome-first execution. Smooth cross-chain swaps, done right.
          </motion.p>

          {/* Launch App Button - perfectly centered */}
          <motion.a
            href={appUrl}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.4, 0, 0.2, 1] }}
            whileHover={{ y: -2 }}
            className="px-8 py-4 glass-strong rounded-full text-lg font-light transition-all duration-300 border border-pink-400/20 shadow-[0_0_20px_rgba(236,72,153,0.1)] hover:border-pink-400/40 hover:shadow-[0_0_30px_rgba(236,72,153,0.2)] hover:bg-white/15"
          >
            Launch App
          </motion.a>

          {/* Try Intent Swap Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            <Link href="/swap?mode=intent" className="block">
              <Button
                className="px-6 py-3 rounded-xl font-light bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 hover:border-pink-400/50 shadow-lg shadow-accent/20 hover:shadow-accent/30 text-white transition-all duration-300"
              >
                Try intent swap
              </Button>
            </Link>
          </motion.div>

          {/* Key Advantages */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-2 flex flex-col md:flex-row gap-8 md:gap-12 justify-center items-center"
          >
            {[
              'Outcome-first execution',
              'Minimal UX',
              'Transparent routing',
            ].map((advantage, index) => (
              <motion.div
                key={advantage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                className="text-gray-400 text-sm md:text-base"
              >
                {advantage}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

