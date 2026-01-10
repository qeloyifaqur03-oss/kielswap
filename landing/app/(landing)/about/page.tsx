'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

// Custom SVG icons for Principles
const NonCustodialIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M12 4L6 8V16L12 20L18 16V8L12 4Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.7"
    />
    <path
      d="M12 8L10 9V15L12 16L14 15V9L12 8Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.7"
    />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.7" />
  </svg>
)

const PredictabilityIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.7" />
    <path
      d="M12 4V8M12 16V20M4 12H8M16 12H20"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.5"
    />
  </svg>
)

const ExecutionQualityIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M4 8L8 4L12 8L16 4L20 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.7"
    />
    <path
      d="M4 16L8 12L12 16L16 12L20 16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.7"
    />
    <path
      d="M8 8V12M12 8V12M16 8V12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.5"
    />
  </svg>
)

const LessNoiseIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M4 6L20 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.3"
    />
    <path
      d="M4 12L16 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.5"
    />
    <path
      d="M4 18L12 18"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.7"
    />
    <circle cx="18" cy="12" r="2" fill="currentColor" opacity="0.7" />
  </svg>
)

const principles = [
  {
    icon: NonCustodialIcon,
    title: 'Non-custodial by design',
    description: 'Funds move strictly according to explicit user intent.',
  },
  {
    icon: PredictabilityIcon,
    title: 'Predictability over promises',
    description: 'Execution terms are clear, measurable, and set in advance.',
  },
  {
    icon: ExecutionQualityIcon,
    title: 'Execution quality matters',
    description: 'Private routing and adaptive paths preserve outcome quality.',
  },
  {
    icon: LessNoiseIcon,
    title: 'Less noise, more signal',
    description: 'The interface highlights only information that affects the result.',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
}

export default function About() {
  return (
    <div className="pt-20 pb-20 px-4 md:px-6 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* BLOCK 1 — Intro */}
          <motion.div
            variants={cardVariants}
            className="glass rounded-3xl p-8 md:p-10"
          >
            <h1 className="text-4xl md:text-5xl font-light mb-6">
              About Kielswap
            </h1>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                Kielswap started from a simple observation:
                modern DeFi trading expects users to think like execution engines.
              </p>
              <p>
                Routes, pools, bridges, gas, slippage, failures —
                the responsibility of coordination often falls on the user, even when the goal is straightforward.
              </p>
              <p>
                We see an opportunity to approach trading differently.
              </p>
            </div>
          </motion.div>

          {/* BLOCK 2 — Trading as intent */}
          <motion.div
            variants={cardVariants}
            className="glass rounded-3xl p-8 md:p-10"
          >
            <h2 className="text-2xl md:text-3xl font-light mb-6">
              Trading as intent, instructions as execution
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                Most swap interfaces focus on describing execution paths.
                Kielswap focuses on defining the desired result.
              </p>
              <p>
                You specify the outcome that matters —
                the minimum you want to receive, the destination network, and the time window.
              </p>
              <p>
                Execution adapts around that intent.
              </p>
            </div>
            <p className="mt-6 text-sm text-gray-500 font-light italic">
              From composing transactions to placing an order.
            </p>
          </motion.div>

          {/* BLOCK 3 — Why outcome-first matters */}
          <motion.div
            variants={cardVariants}
            className="glass rounded-3xl p-8 md:p-10"
          >
            <h2 className="text-2xl md:text-3xl font-light mb-6">
              Why outcome-first matters
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                Outcome-first execution centers trading around clarity and predictability.
              </p>
              <p>
                When execution is coordinated around a signed intent:
              </p>
              <ul className="list-none space-y-2 ml-4">
                <li className="flex items-start">
                  <span className="text-pink-400 mr-3">–</span>
                  <span>costs are visible upfront</span>
                </li>
                <li className="flex items-start">
                  <span className="text-pink-400 mr-3">–</span>
                  <span>execution paths adapt to conditions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-pink-400 mr-3">–</span>
                  <span>progress is observable from start to settlement</span>
                </li>
              </ul>
              <p className="pt-2">
                Attention stays on the result, while execution follows in the background.
              </p>
            </div>
          </motion.div>

          {/* BLOCK 4 — Principles */}
          <motion.div
            variants={cardVariants}
            className="glass rounded-3xl p-8 md:p-10"
          >
            <h2 className="text-2xl md:text-3xl font-light mb-8">
              A deliberate product philosophy
            </h2>
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {principles.map((principle, index) => {
                const Icon = principle.icon
                return (
                  <motion.div
                    key={principle.title}
                    variants={itemVariants}
                    className="space-y-3"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 flex-shrink-0 mt-0.5 text-gray-400">
                        <Icon className="w-full h-full" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-light mb-2">
                          {principle.title}
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          {principle.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </motion.div>

          {/* BLOCK 5 — Who it's for */}
          <motion.div
            variants={cardVariants}
            className="glass rounded-3xl p-8 md:p-10"
          >
            <h2 className="text-2xl md:text-3xl font-light mb-6">
              Who Kielswap is for
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                Kielswap is built for users who:
              </p>
              <ul className="list-none space-y-2 ml-4">
                <li className="flex items-start">
                  <span className="text-pink-400 mr-3">–</span>
                  <span>trade across multiple chains</span>
                </li>
                <li className="flex items-start">
                  <span className="text-pink-400 mr-3">–</span>
                  <span>value execution quality and total cost visibility</span>
                </li>
                <li className="flex items-start">
                  <span className="text-pink-400 mr-3">–</span>
                  <span>prioritize clarity over speed alone</span>
                </li>
                <li className="flex items-start">
                  <span className="text-pink-400 mr-3">–</span>
                  <span>prefer systems that behave consistently under real conditions</span>
                </li>
              </ul>
              <p className="pt-2 text-gray-500 text-sm font-light">
                The product is shaped around these expectations.
              </p>
            </div>
          </motion.div>

          {/* BLOCK 6 — Where this is going */}
          <motion.div
            variants={cardVariants}
            className="glass rounded-3xl p-8 md:p-10"
          >
            <h2 className="text-2xl md:text-3xl font-light mb-6">
              Where this is going
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                Intent-based execution enables more adaptive and resilient trading flows —
                across chains, liquidity sources, and execution environments.
              </p>
              <p>
                Kielswap represents an early step in that direction.
                The system evolves iteratively, guided by real usage and user feedback.
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-4 text-sm">
              <Link
                href="/request"
                className="bg-gradient-to-r from-pink-400 via-accent to-purple-400 bg-clip-text text-transparent hover:from-pink-300 hover:via-accent/90 hover:to-purple-300 transition-all duration-300 font-light"
              >
                Request early access
              </Link>
              <Link
                href="https://docs.kielswap.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-pink-400 via-accent to-purple-400 bg-clip-text text-transparent hover:from-pink-300 hover:via-accent/90 hover:to-purple-300 transition-all duration-300 font-light"
              >
                Read the docs
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
