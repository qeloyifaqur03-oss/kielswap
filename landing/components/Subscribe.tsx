'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

export default function Subscribe() {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Placeholder for newsletter subscription
    console.log('Subscribe:', email)
    setEmail('')
  }

  return (
    <section className="relative z-10 px-6 md:px-12 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto glass-strong rounded-3xl p-12 md:p-16"
      >
        <h2 className="text-3xl md:text-4xl font-light mb-4 text-center">
          Stay connected
        </h2>
        <p className="text-gray-400 text-center mb-8">
          Subscribe to our newsletter
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 px-6 py-4 glass rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all duration-300"
          />
          <motion.button
            type="submit"
            whileHover={{ y: -2 }}
            className="px-8 py-4 bg-accent/20 hover:bg-accent/30 border border-accent/30 rounded-full font-light transition-all duration-300"
          >
            Subscribe
          </motion.button>
        </form>
      </motion.div>
    </section>
  )
}



























