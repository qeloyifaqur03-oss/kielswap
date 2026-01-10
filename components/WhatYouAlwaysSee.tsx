'use client'

import { motion } from 'framer-motion'

export default function WhatYouAlwaysSee() {
  const items = [
    'Final amount before execution',
    'Estimated time',
    'Execution status',
    'Clear completion state',
  ]

  return (
    <section className="relative z-10 px-6 md:px-12 py-32">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-light mb-16 text-center"
        >
          What you always see
        </motion.h2>

        <div className="space-y-4">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ x: 4 }}
              className="glass rounded-xl p-6 flex items-center gap-4 transition-all duration-300 cursor-default"
            >
              <div className="w-2 h-2 rounded-full bg-gradient-to-br from-pink-400/80 via-accent/80 to-purple-400/80 flex-shrink-0" />
              <span className="text-lg font-light">{item}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}


