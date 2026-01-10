'use client'

import { motion } from 'framer-motion'

export default function ProblemWeFix() {
  return (
    <section className="relative z-10 px-6 md:px-12 py-32">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left: Problem description */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-gray-400 space-y-4"
          >
            <p className="leading-relaxed">
              Cross-chain swaps are fragmented. Different interfaces, unclear routes,
              and constant noise make simple value movement feel complicated.
            </p>
            <p className="leading-relaxed">
              Users navigate multiple protocols, compare rates across platforms, and
              manage complexity that shouldn't exist.
            </p>
          </motion.div>

          {/* Right: Solution statement */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl md:text-2xl font-light leading-relaxed"
          >
            <p>
              Value movement should feel simple. One flow.
              <br />
              One interface. One outcome.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}


