'use client'

import { motion } from 'framer-motion'

export default function FlowScale() {
  return (
    <div className="relative w-full max-w-[720px] mx-auto h-40">
      {/* Thin horizontal line with left-to-right gradient progression */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
        className="absolute top-[30%] left-0 right-0 h-[1px] -translate-y-1/2 z-0"
        style={{
          background: 'linear-gradient(to right, rgba(107, 114, 128, 0.4), rgba(236, 72, 153, 0.5), rgba(196, 37, 88, 0.6), rgba(147, 51, 234, 0.5))'
        }}
      />

      {/* Anchors and labels container - dots centered on line */}
      <div className="absolute top-[30%] left-0 right-0 flex items-center justify-between -translate-y-1/2">
        
        {/* Small anchor - minimal emphasis */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="relative flex flex-col items-center"
        >
          {/* Dot - same size, neutral color */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-3 h-3 rounded-full bg-gray-500/60" />
          </div>
          {/* Label below - clear spacing from line */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
            <span className="text-xs text-gray-500/80 font-light">Small</span>
            <span className="text-[10px] text-gray-600/70">$100</span>
          </div>
        </motion.div>

        {/* Medium anchor - moderate emphasis */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.45, ease: [0.4, 0, 0.2, 1] }}
          className="relative flex flex-col items-center"
        >
          {/* Dot - same size, accent with reduced opacity */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-pink-400/70 via-accent/70 to-purple-400/70" />
          </div>
          {/* Label below - clear spacing from line */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
            <span className="text-xs text-gray-500/80 font-light">Medium</span>
            <span className="text-[10px] text-gray-600/70">$1,000</span>
          </div>
        </motion.div>

        {/* Large anchor - strongest emphasis */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="relative flex flex-col items-center"
        >
          {/* Dot - same size, full accent color */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-pink-400/80 via-accent/80 to-purple-400/80" />
          </div>
          {/* Label below - clear spacing from line */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
            <span className="text-xs text-gray-500/80 font-light">Large</span>
            <span className="text-[10px] text-gray-600/70">$10,000+</span>
          </div>
        </motion.div>

      </div>
    </div>
  )
}

