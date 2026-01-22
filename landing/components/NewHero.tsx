'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { MobileScaleCanvas } from './MobileScaleCanvas'

export default function NewHero() {
  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center px-4 max-md:px-4 md:px-12 py-12 max-md:py-8 md:py-20">
      <MobileScaleCanvas designWidth={1200}>
        <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center text-center space-y-4 max-md:space-y-4 md:space-y-6">
          {/* Text Content - Centered */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-4 max-md:space-y-3 md:space-y-6"
          >
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.05 }}
              className="text-xs max-md:text-xs md:text-base text-gray-500 font-light"
            >
              Trading doesn't begin with transactions. It begins with a desired outcome.
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-3xl max-md:text-3xl md:text-6xl lg:text-7xl font-light leading-tight"
            >
              Cross-chain execution, guided by your constraints.
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-base max-md:text-base md:text-2xl text-gray-400 font-light leading-relaxed max-w-2xl mx-auto"
            >
              You define the result. Execution adapts to get you there.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-wrap gap-3 max-md:gap-2 md:gap-4 pt-2 max-md:pt-2 md:pt-4 justify-center"
            >
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-pink-400/80 via-accent/80 to-purple-400/80"></div>
                <span>Private orderflow</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-pink-400/80 via-accent/80 to-purple-400/80"></div>
                <span>Fees shown upfront</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-pink-400/80 via-accent/80 to-purple-400/80"></div>
                <span>Track execution end to end</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Try Intent Swap Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="pt-4 max-md:pt-4 md:pt-8"
          >
            <a href="https://www.kielswap.com/request" target="_blank" rel="noopener noreferrer" className="block">
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  className="px-6 max-md:px-6 md:px-8 py-3 max-md:py-3 md:py-4 rounded-xl font-light text-white transition-all duration-300 text-base max-md:text-base md:text-lg bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 hover:border-pink-400/50 hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 shadow-lg shadow-accent/20 hover:shadow-accent/30"
                >
                Join closed beta
                </Button>
              </motion.div>
            </a>
          </motion.div>
        </div>
        </div>
      </MobileScaleCanvas>
    </section>
  )
}

