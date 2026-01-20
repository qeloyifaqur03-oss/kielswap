'use client'

import { motion } from 'framer-motion'
import { MobileScaleCanvas } from './MobileScaleCanvas'

// Custom unique SVG icons
const OutcomeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M32 8L12 20V44L32 56L52 44V20L32 8Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M32 20L24 24V40L32 44L40 40V24L32 20Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <circle cx="32" cy="32" r="4" fill="currentColor" opacity="0.8" />
    <path
      d="M20 32L28 32M36 32L44 32"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

const PrivateIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M32 12C24 12 18 18 18 26V32C18 40 24 46 32 46C40 46 46 40 46 32V26C46 18 40 12 32 12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M28 32L30 34L36 28"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="32" cy="20" r="2" fill="currentColor" opacity="0.6" />
    <path
      d="M20 20C20 16 22 14 24 12M44 20C44 16 42 14 40 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.5"
    />
  </svg>
)

const CostIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M16 48L20 20L32 16L44 20L48 48L32 52L16 48Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M20 32L28 28L36 32L44 28"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="28" cy="30" r="1.5" fill="currentColor" />
    <circle cx="36" cy="30" r="1.5" fill="currentColor" />
    <path
      d="M24 40L32 36L40 40"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const TrackingIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="32" cy="32" r="12" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
    <circle cx="32" cy="32" r="4" fill="currentColor" />
    <path
      d="M32 12V20M32 44V52M12 32H20M44 32H52"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M22 22L28 28M42 22L36 28M42 42L36 36M22 42L28 36"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.5"
    />
  </svg>
)

const FallbackIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M32 16L20 24V40L32 48L44 40V24L32 16Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M26 28L32 32L38 28"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M26 36L32 40L38 36"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="32" cy="24" r="2" fill="currentColor" opacity="0.7" />
    <path
      d="M20 32L16 28M44 32L48 28M20 32L16 36M44 32L48 36"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.4"
    />
  </svg>
)

const NonCustodialIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="16" y="20" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
    <path
      d="M24 28L30 34L40 24"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="32" cy="36" r="2" fill="currentColor" opacity="0.6" />
    <path
      d="M20 16L24 20M44 16L40 20M20 48L24 44M44 48L40 44"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.4"
    />
    <path
      d="M28 12L32 8L36 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// Unified color palette - all icons use the same gradient background for consistency
const colorVariants = [
  { gradient: 'from-pink-500/20 via-accent/25 to-purple-500/20', icon: 'text-pink-400' },
  { gradient: 'from-pink-500/20 via-accent/25 to-purple-500/20', icon: 'text-pink-400' },
  { gradient: 'from-pink-500/20 via-accent/25 to-purple-500/20', icon: 'text-pink-400' },
  { gradient: 'from-pink-500/20 via-accent/25 to-purple-500/20', icon: 'text-pink-400' },
  { gradient: 'from-pink-500/20 via-accent/25 to-purple-500/20', icon: 'text-pink-400' },
  { gradient: 'from-pink-500/20 via-accent/25 to-purple-500/20', icon: 'text-pink-400' },
]

const features = [
  {
    icon: OutcomeIcon,
    title: 'Result-First Execution',
    description: 'Set a guaranteed minimum and a time limit. Execution optimizes to meet your terms, or doesn’t execute.',
    color: colorVariants[0].gradient,
    iconColor: colorVariants[0].icon,
  },
  {
    icon: PrivateIcon,
    title: 'Private by Default',
    description: 'Orders are routed privately to preserve execution quality.',
    color: colorVariants[1].gradient,
    iconColor: colorVariants[1].icon,
  },
  {
    icon: CostIcon,
    title: 'Best Total Cost',
    description: 'Estimates include network fees, bridge costs, and execution overhead, shown upfront.',
    color: colorVariants[2].gradient,
    iconColor: colorVariants[2].icon,
  },
  {
    icon: TrackingIcon,
    title: 'End-to-End Tracking',
    description: 'Follow each step from source to destination as it happens.',
    color: colorVariants[3].gradient,
    iconColor: colorVariants[3].icon,
  },
  {
    icon: FallbackIcon,
    title: 'Adaptive fallbacks',
    description: 'If conditions change, execution can switch paths to still meet your constraints, without restarting the flow.',
    color: colorVariants[4].gradient,
    iconColor: colorVariants[4].icon,
  },
  {
    icon: NonCustodialIcon,
    title: 'Non-Custodial',
    description: 'Funds move only according to your signed instruction. Control remains yours.',
    color: colorVariants[5].gradient,
    iconColor: colorVariants[5].icon,
  },
]

export default function KeyFeatures() {
  return (
    <section className="relative z-10 px-4 max-md:px-4 md:px-12 py-16 max-md:py-12 md:py-32">
      <MobileScaleCanvas designWidth={1200}>
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 max-md:mb-8 md:mb-16"
        >
          <h2 className="text-2xl max-md:text-2xl md:text-5xl font-light mb-3 max-md:mb-3 md:mb-4">
            Key Features
          </h2>
          <p className="text-gray-400 text-base max-md:text-base md:text-lg max-w-2xl mx-auto">
          Built for constraint-led cross-chain execution.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 max-md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-md:gap-4 md:gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="glass rounded-2xl p-6 hover:border-white/30 transition-all duration-300 group cursor-default"
              >
                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
                  className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 border border-white/10 group-hover:shadow-lg group-hover:shadow-accent/20`}
                  style={{
                    boxShadow: '0 10px 30px -10px rgba(196, 37, 88, 0.15)',
                  }}
                >
                  <Icon className={`w-9 h-9 ${feature.iconColor} transition-transform duration-300 group-hover:scale-105`} />
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-light mb-2 group-hover:text-white transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </div>
        </div>
      </MobileScaleCanvas>
    </section>
  )
}

