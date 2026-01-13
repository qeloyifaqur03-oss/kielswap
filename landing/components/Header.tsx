'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

export default function Header() {
  const pathname = usePathname()
  const isAccessPage = pathname === '/access'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16">
      {/* Full-width glassmorphic bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass w-full h-full border-b border-white/10 shadow-lg"
      >
        {/* Inner container - full width with minimal padding */}
        <div className="w-full h-full flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8">
          {/* Logo - у левого края */}
          <Link href="/" className="flex items-center h-full">
            <Image
              src="/kielswaplogo.png"
              alt="Kielswap"
              width={120}
              height={40}
              className="h-6 w-auto object-contain"
              priority
            />
          </Link>

          {/* Right side: Social links + Launch App button - hidden on /access - у правого края */}
          {!isAccessPage && (
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
            {/* Twitter */}
            <motion.a
              href="https://twitter.com/kielswap"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </motion.a>

            {/* Telegram */}
            <motion.a
              href="https://t.me/kielswap"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.97 9.272c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.12l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
              </svg>
            </motion.a>

            {/* Launch App Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <a
                href="https://app.kielswap.com/swap"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl font-light text-white text-sm transition-all duration-300 bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 hover:border-pink-400/50 hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 shadow-lg shadow-accent/20 hover:shadow-accent/30"
              >
                Launch app
              </a>
            </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </header>
  )
}

