'use client'

import { motion } from 'framer-motion'

export default function OutcomeFirst() {
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
            Outcome-first philosophy
          </h2>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
            Users think in <span className="text-accent font-normal">outcomes</span>.
            Systems handle <span className="text-accent font-normal">routes</span>.
            You see the <span className="text-accent font-normal">result</span>.
          </p>
          <p className="text-gray-400 leading-relaxed max-w-2xl mx-auto mt-8">
            We optimize for what you want, not how we get there. The complexity
            stays hidden. The clarity stays visible.
          </p>
        </motion.div>
      </div>
    </section>
  )
}



























