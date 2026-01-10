'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const faqs = [
  {
    question: 'What is an intent-based swap?',
    answer:
      'An intent-based swap starts with the outcome you want to achieve. You define the minimum you want to receive, the destination network, and the execution window. Execution is coordinated around these terms to deliver the defined result.',
  },
  {
    question: 'Why do I sign instead of sending a transaction?',
    answer:
      'Signing an intent authorizes execution under clearly defined constraints. This enables flexible routing, coordinated cross-chain execution, and controlled settlement. A single signature defines the outcome while execution adapts within those terms.',
  },
  {
    question: 'When should I use intent mode instead of instant swap?',
    answer:
      'Intent mode works best when execution quality, total cost, and predictability matter. It suits cross-chain swaps, larger trades, and scenarios where defining a guaranteed minimum is important. Instant mode remains available for immediate execution workflows.',
  },
  {
    question: 'How long does execution usually take?',
    answer:
      'Execution time depends on network conditions, liquidity availability, and selected preferences. Most intent-based cross-chain executions complete within minutes. Progress remains visible throughout the execution window.',
  },
  {
    question: 'What fees do I pay?',
    answer:
      'All expected costs are shown before signing as a total execution estimate. This includes swap execution, bridging, and protocol-related fees. The displayed value reflects the full cost of delivering the defined outcome.',
  },
  {
    question: 'Can I track every step?',
    answer:
      'Each intent includes end-to-end tracking across execution stages. Progress is visible from source chain execution to final settlement. Relevant transaction references appear as execution advances.',
  },
  {
    question: 'What happens if execution reaches the time limit?',
    answer:
      'Each intent includes a predefined execution window. Execution follows the approved parameters and completes according to the signed terms.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="pt-32 pb-24 px-6 md:px-12 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-light mb-16"
          >
            FAQ
          </motion.h1>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="glass rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors duration-300"
                >
                  <span className="text-lg font-light pr-8">{faq.question}</span>
                  <motion.svg
                    className="w-5 h-5 flex-shrink-0 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </motion.svg>
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pt-4 pb-6 text-gray-400 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
  )
}


