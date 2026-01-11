'use client'

import { motion } from 'framer-motion'

export default function SingleFlow() {
  return (
    <section className="relative z-10 px-6 md:px-12 py-32">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="space-y-6"
        >
          <h2 className="text-3xl md:text-4xl font-light mb-8">
            Cross-chain swaps, structured as a single flow
          </h2>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
            Kielswap aggregates execution across multiple networks into one consistent process.
            The interface is built around the result the user wants to receive, while routing and intermediate steps remain internal.
          </p>
        </motion.div>
      </div>
    </section>
  )
}





























