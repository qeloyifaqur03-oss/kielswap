'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function EarlyAccessSection() {
  return (
    <section className="relative z-10 px-4 max-md:px-4 md:px-12 py-16 max-md:py-12 md:py-32">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="space-y-4 max-md:space-y-4 md:space-y-6"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl max-md:text-2xl md:text-4xl lg:text-5xl font-light"
          >
            Ready to try intent-based execution?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-base max-md:text-base md:text-xl max-w-2xl mx-auto"
          >
            Request access to the early program and help shape how cross-chain swaps should work.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="pt-2 max-md:pt-2 md:pt-4"
          >
            <Link href="/request" className="block">
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  className="px-6 max-md:px-6 md:px-8 py-3 max-md:py-3 md:py-4 rounded-xl font-light text-white transition-all duration-300 text-base max-md:text-base md:text-lg bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 hover:border-pink-400/50 hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 shadow-lg shadow-accent/20 hover:shadow-accent/30"
                >
                  Request access
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
