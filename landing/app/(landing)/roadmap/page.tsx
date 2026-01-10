'use client'

import { motion } from 'framer-motion'

export default function Roadmap() {
  const milestones = [
    {
      phase: 'Early Access Program — Q1 2026',
      status: 'current',
      description: 'Gradual access for early users exploring intent-based cross-chain execution. Focus on real-world usage, execution feedback, and intent UX refinement. This phase prioritizes clarity, predictability, and end-to-end tracking over rapid expansion.',
    },
    {
      phase: 'Public Intent Execution — Q2 2026',
      status: 'upcoming',
      description: 'Wider access to outcome-first execution with clearly defined constraints. Improved execution coordination, clearer execution states, and more consistent completion behavior across supported networks. This phase establishes intent execution as the default interaction model.',
    },
    {
      phase: 'Adaptive Execution Intelligence — Q3 2026',
      status: 'upcoming',
      description: 'Smarter execution decisions informed by real execution data. Improved estimation accuracy, adaptive routing strategies, and more resilient execution behavior under changing conditions. Execution begins to optimize for reliability and timing alongside total cost.',
    },
    {
      phase: 'Execution Infrastructure Expansion — Q4 2026',
      status: 'upcoming',
      description: 'Broader network and asset coverage built on top of a stable execution core. Selective expansion guided by execution quality, liquidity depth, and operational reliability. Cross-chain execution behaves consistently across environments.',
    },
    {
      phase: 'Long-Term Execution Layer — Beyond',
      status: 'upcoming',
      description: 'Kielswap evolves into a generalized execution layer for outcome-driven interactions. Intents act as a primitive for coordinating execution across chains, liquidity sources, and settlement environments. This phase focuses on durability, composability, and long-term integration.',
    },
  ]

  return (
    <div className="pt-32 pb-24 px-6 md:px-12 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-light mb-16"
          >
            Roadmap
          </motion.h1>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10" />

            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative flex gap-8"
                >
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 relative z-10">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        milestone.status === 'completed'
                          ? 'bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border-2 border-pink-400/30'
                          : milestone.status === 'current'
                          ? 'bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border-2 border-pink-400/30 shadow-lg shadow-accent/20'
                          : 'bg-white/5 border-2 border-white/10'
                      }`}
                    >
                      {milestone.status === 'completed' && (
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <h3 className="text-2xl font-light mb-2">{milestone.phase}</h3>
                    <p className="text-gray-400">{milestone.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
  )
}

