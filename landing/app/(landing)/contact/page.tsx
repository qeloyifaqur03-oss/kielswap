'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

export default function Contact() {
  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center px-6 md:px-12 py-32">
      <div className="max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl p-8 md:p-12 text-center space-y-8"
        >
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-light">Get in touch</h1>
            <p className="text-gray-400 text-lg">
              Questions, partnerships, or support — reach out directly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="https://x.com/lucasflux_"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-light glass hover:border-pink-400/30 text-white transition-all duration-300"
              >
                Message on X
              </Button>
            </motion.a>
            <motion.a
              href="https://t.me/lucas_swap"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-light glass hover:border-pink-400/30 text-white transition-all duration-300"
              >
                Message on Telegram
              </Button>
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

