'use client'

import { motion } from 'framer-motion'

export default function Security() {
  const reviewPoints = [
    'expected outcome and minimum receive amount',
    'estimated fees and total execution cost',
    'execution path and destination network',
    'expected time window',
  ]

  return (
    <div className="pt-32 pb-24 px-6 md:px-12 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-light mb-12"
          >
            Security
          </motion.h1>

          <div className="space-y-12">
            {/* Our approach */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h2 className="text-2xl md:text-3xl font-light mb-6">Our approach</h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  Security at Kielswap is shaped around execution transparency, user control, and clear system boundaries.
                </p>
                <p>
                  The platform is designed as an execution interface rather than a custody layer.
                  User intent defines what happens, and execution follows explicitly defined terms.
                </p>
              </div>
            </motion.div>

            {/* Non-custodial execution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl md:text-3xl font-light mb-6">Non-custodial execution</h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  Kielswap operates through direct user authorization.
                  Assets move according to signed intent parameters, with users maintaining control throughout the process.
                </p>
                <p>
                  There are no internal balances or pooled user funds.
                  Execution occurs directly through external protocols and networks.
                </p>
              </div>
            </motion.div>

            {/* Execution through established infrastructure */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="text-2xl md:text-3xl font-light mb-6">Execution through established infrastructure</h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  Swaps and cross-chain transfers are executed via established liquidity venues, bridges, and execution providers.
                </p>
                <p>
                  Each route is selected based on execution quality, cost, and reliability, with the full path visible to the user before confirmation.
                </p>
              </div>
            </motion.div>

            {/* Transparent execution flow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-2xl md:text-3xl font-light mb-6">Transparent execution flow</h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  Before signing an intent, users can review:
                </p>
                <ul className="list-none space-y-2 ml-4">
                  {reviewPoints.map((point, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                      className="flex items-start gap-4"
                    >
                      <span className="text-pink-400 mt-1">–</span>
                      <span>{point}</span>
                    </motion.li>
                  ))}
                </ul>
                <p className="pt-2">
                  During execution, progress is observable step by step, from source to settlement.
                </p>
              </div>
            </motion.div>

            {/* Continuous security evolution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h2 className="text-2xl md:text-3xl font-light mb-6">Continuous security evolution</h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  As the execution layer expands, additional safeguards, monitoring, and reviews are introduced.
                </p>
                <p>
                  Security practices evolve alongside the system, informed by real execution data and usage patterns.
                </p>
              </div>
            </motion.div>

            {/* Disclaimer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="glass rounded-2xl p-8 border-l-4 border-pink-400/30"
            >
              <h2 className="text-xl md:text-2xl font-light mb-4">Disclaimer</h2>
              <p className="text-gray-400 leading-relaxed">
                Cryptocurrency execution involves market and protocol risk.
                Users interact directly with decentralized infrastructure and remain responsible for reviewing execution details and understanding the mechanisms involved.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
  )
}

