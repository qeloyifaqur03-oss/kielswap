'use client'

import { motion } from 'framer-motion'
import FlowScale from './FlowScale'

export default function SmallAndLarge() {
  return (
    <section className="relative z-10 px-6 md:px-12 py-32">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center space-y-12"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-light">
              Designed for small and large swaps
            </h2>
            
            {/* Supporting line */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-base md:text-lg text-gray-400 mt-4"
            >
              The UX doesn't change as size grows.
            </motion.p>
          </div>
          
          {/* FlowScale component */}
          <div className="flex justify-center pt-12 pb-8">
            <FlowScale />
          </div>

          {/* Supporting text */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.9, ease: [0.4, 0, 0.2, 1] }}
            className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed"
          >
            Same flow. Same UX.
            <br />
            From the smallest to the largest swap, without mode switching and different flows.
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}

