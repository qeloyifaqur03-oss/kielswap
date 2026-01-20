'use client'

import { motion } from 'framer-motion'

export default function VisionSection() {
  return (
    <section className="relative z-10 px-4 max-md:px-4 md:px-12 py-16 max-md:py-12 md:py-32">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-6 max-md:space-y-6 md:space-y-8"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            className="inline-block"
          >
            <motion.div
              whileHover={{ borderColor: 'rgba(251, 146, 183, 0.5)' }}
              className="px-4 py-1.5 rounded-full bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 text-white text-sm font-light backdrop-blur-sm transition-colors duration-300 shadow-lg shadow-accent/20"
            >
              Vision
            </motion.div>
          </motion.div>

          {/* Main Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-2xl max-md:text-2xl md:text-5xl lg:text-6xl font-light leading-tight"
          >
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Define the outcome.
            </motion.span>
            <br />
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-gradient"
            >
              Execution follows your terms.
            </motion.span>
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-base max-md:text-base md:text-xl text-gray-400 font-light leading-relaxed max-w-3xl mx-auto"
          >
            Kielswap turns cross-chain complexity into a single flow across 30+ networks, with predictable outcomes and end-to-end tracking.
          </motion.p>

          {/* Decorative Elements */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex justify-center gap-8 pt-8"
          >
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.7 + i * 0.1, type: 'spring' }}
                className="w-2 h-2 rounded-full bg-gradient-to-br from-pink-400/80 via-accent/80 to-purple-400/80"
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

