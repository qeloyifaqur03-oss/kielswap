'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useMemo } from 'react'
import { LandingSwapWidget } from './LandingSwapWidget'
import { useTokenPrices } from '@/hooks/useTokenPrices'
import { Check } from 'lucide-react'

// Helper: Toggle component (moved outside to prevent re-creation)
const Toggle = ({ isEnabled, onChange }: { isEnabled: boolean; onChange: (value: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!isEnabled)}
    className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
      isEnabled
        ? 'bg-gradient-to-r from-pink-500/40 via-accent/40 to-purple-500/40 shadow-lg shadow-pink-500/20'
        : 'bg-white/5 border border-white/10 hover:border-white/20'
    }`}
  >
    <div
      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
        isEnabled ? 'right-0.5' : 'left-0.5'
      }`}
    />
  </button>
)

// Helper: SettingsRow component (moved outside to prevent re-creation)
const SettingsRow = ({ label, children, control, className = '' }: { label: string; children?: React.ReactNode; control?: React.ReactNode; className?: string }) => (
  <div className={`space-y-2 ${className}`}>
    {control ? (
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-300 font-light">{label}</label>
        {control}
      </div>
    ) : (
      <label className="text-xs text-gray-300 font-light">{label}</label>
    )}
    {children}
  </div>
)

// Intent Settings component for step 2 - compact version for landing
function IntentSettingsSection() {
  const [deadline, setDeadline] = useState('5')
  const [enablePartialFills, setEnablePartialFills] = useState(false)
  const [amountOfParts, setAmountOfParts] = useState('2')
  const [customRecipient, setCustomRecipient] = useState(false)
  const [recipientAddress, setRecipientAddress] = useState('')

  return (
    <div className="relative glass rounded-3xl p-5 sm:p-6 w-full max-w-lg scale-[0.88] origin-center 
                    bg-gradient-to-br from-white/[0.03] to-white/[0.01] 
                    shadow-2xl shadow-black/50
                    backdrop-blur-xl mx-auto">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      <div className="relative z-10">
        <h3 className="text-xl sm:text-2xl font-light mb-5 text-white/90 tracking-tight">Settings</h3>
        
        <div className="space-y-5">
          {/* Deadline */}
          <SettingsRow label="Deadline" className="mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={deadline}
                  onChange={(e) => {
                    const value = e.target.value
                    // Only allow whole numbers
                    if (value === '' || /^\d+$/.test(value)) {
                      setDeadline(value)
                    }
                  }}
                  placeholder="5"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-500 
                             focus:outline-none focus:border-pink-500/40 focus:bg-white/8 
                             focus:ring-2 focus:ring-pink-500/20 
                             transition-all duration-200
                             hover:border-white/20"
                  autoFocus={false}
                />
                <span className="text-xs text-gray-400 font-light">minutes</span>
              </div>
            </div>
          </SettingsRow>

          {/* Enable Partial Fills Toggle */}
          <SettingsRow 
            label="Enable partial fills"
            className="mb-4"
            control={
              <Toggle
                isEnabled={enablePartialFills}
                onChange={setEnablePartialFills}
              />
            }
          >
            {/* Amount of Parts - only visible if partial fills enabled */}
            {enablePartialFills && (
              <div className="mt-3 space-y-2">
                <label className="text-xs text-gray-300 font-light">Amount of parts</label>
                <input
                  type="number"
                  value={amountOfParts}
                  onChange={(e) => {
                    const value = e.target.value
                    // Only allow whole numbers, minimum 2
                    if (value === '' || /^\d+$/.test(value)) {
                      const num = parseInt(value, 10)
                      // If value is empty or valid number >= 2, allow it
                      if (value === '' || (num >= 2)) {
                        setAmountOfParts(value)
                      }
                      // If user tries to enter 1, just ignore it (don't update state)
                    }
                  }}
                  placeholder="2"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-500 
                             focus:outline-none focus:border-pink-500/40 focus:bg-white/8 
                             focus:ring-2 focus:ring-pink-500/20 
                             transition-all duration-200
                             hover:border-white/20"
                  autoFocus={false}
                />
              </div>
            )}
          </SettingsRow>

          {/* Custom Recipient Toggle */}
          <SettingsRow 
            label="Custom recipient"
            className="mb-4"
            control={
              <Toggle
                isEnabled={customRecipient}
                onChange={setCustomRecipient}
              />
            }
          >
            {/* Recipient Address - only visible if custom recipient enabled */}
            {customRecipient && (
              <div className="mt-3 space-y-2">
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="Wallet address"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-500 
                             focus:outline-none focus:border-pink-500/40 focus:bg-white/8 
                             focus:ring-2 focus:ring-pink-500/20 
                             transition-all duration-200
                             hover:border-white/20"
                  autoFocus={false}
                />
              </div>
            )}
          </SettingsRow>
        </div>
      </div>
    </div>
  )
}

// Tracking component for step 3
function TrackingSection() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const timelineSteps = [
    { id: 'signed', label: 'Intent signed for swap' },
    { id: 'searching', label: 'Searching for the best route' },
    { id: 'executing', label: 'Processing on source chain' },
    { id: 'completed', label: 'Execution completed' },
  ]

  const [activeStep, setActiveStep] = useState<number | null>(0)

  useEffect(() => {
    // Reset state
    setCompletedSteps([])
    setActiveStep(0)

    const timeouts: NodeJS.Timeout[] = []
    let isMounted = true

    const processStep = (stepIndex: number) => {
      if (!isMounted) return

      if (stepIndex >= timelineSteps.length) {
        // All steps completed, restart cycle after delay
        const restartTimeout = setTimeout(() => {
          if (!isMounted) return
          setCompletedSteps([])
          setActiveStep(0)
          processStep(0)
        }, 2000)
        timeouts.push(restartTimeout)
        return
      }

      // Show loading for current step (strictly in order)
      setActiveStep(stepIndex)

      // After 2 seconds, mark as completed
      const completeTimeout = setTimeout(() => {
        if (!isMounted) return
        setCompletedSteps((completed) => {
          // Ensure we only add if not already completed (prevent duplicates)
          if (!completed.includes(stepIndex)) {
            return [...completed, stepIndex].sort((a, b) => a - b) // Ensure sorted order
          }
          return completed
        })
        setActiveStep(null)
        
        // Move to next step after a brief pause (strictly sequential)
        const nextStepTimeout = setTimeout(() => {
          if (isMounted) {
            processStep(stepIndex + 1)
          }
        }, 500) // Brief pause between steps
        timeouts.push(nextStepTimeout)
      }, 2000) // Loading duration
      timeouts.push(completeTimeout)
    }

    // Start with first step (index 0)
    processStep(0)

    return () => {
      isMounted = false
      // Cleanup all timeouts
      timeouts.forEach(clearTimeout)
    }
  }, [])

  return (
    <div className="relative glass rounded-3xl p-5 sm:p-6 w-full max-w-lg scale-[0.88] origin-center
                    bg-gradient-to-br from-white/[0.03] to-white/[0.01] 
                    shadow-2xl shadow-black/50
                    backdrop-blur-xl mx-auto">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      <div className="relative z-10">
        <h3 className="text-xl sm:text-2xl font-light mb-5 text-white/90 tracking-tight">Summary</h3>
        <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 
                        flex flex-col items-start justify-center p-5 sm:p-6 space-y-4
                        backdrop-blur-sm">
          <div className="text-xs sm:text-sm text-gray-400 font-light mb-1 tracking-wide">Tracking timeline</div>
          <div className="w-full space-y-3.5">
            {timelineSteps.map((step, index) => {
              const isCompleted = completedSteps.includes(index)
              const isLoading = activeStep === index && !isCompleted
              const isPending = !isCompleted && !isLoading

              return (
                <div key={step.id} className="flex items-center gap-4 text-sm group">
                  <div className="relative w-6 h-6 flex items-center justify-center flex-shrink-0">
                    {isCompleted ? (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500/50 via-accent/50 to-purple-500/50 
                                   flex items-center justify-center shadow-lg shadow-pink-500/30
                                   ring-2 ring-pink-500/20">
                        <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                      </div>
                    ) : isLoading ? (
                      <div className="relative w-5 h-5">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/40 via-accent/40 to-purple-500/40 
                                      animate-pulse shadow-md shadow-pink-500/20"></div>
                        <div className="absolute inset-1 rounded-full bg-white/20 animate-ping"></div>
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-white/10 
                                    group-hover:bg-white/15 transition-colors duration-200"></div>
                    )}
                  </div>
                  <span className={`font-light transition-all duration-300 ${
                    isCompleted 
                      ? 'text-white' 
                      : isLoading 
                        ? 'text-gray-200' 
                        : 'text-gray-500 group-hover:text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HowItWorks() {
  // Shared state for synchronization
  const [fromToken, setFromToken] = useState<'ETH' | 'USDT'>('ETH')
  const [toToken, setToToken] = useState<'ETH' | 'USDT'>('USDT')
  const [fromAmount, setFromAmount] = useState<string>('1')

  // Use React Query for optimized caching
  const { data: priceData } = useTokenPrices(['eth', 'usdt'])
  const ethPrice = priceData?.prices?.eth ?? null
  const usdtPrice = priceData?.prices?.usdt ?? null

  // Calculate exchange rate
  const exchangeRate = useMemo(() => {
    // Guard against missing or zero prices to prevent division by zero
    if (!ethPrice || !usdtPrice || ethPrice <= 0 || usdtPrice <= 0) return null
    return ethPrice / usdtPrice
  }, [ethPrice, usdtPrice])

  // Calculate output amount
  const toAmount = useMemo(() => {
    if (!exchangeRate) return null
    const amount = parseFloat(fromAmount)
    if (isNaN(amount) || amount <= 0) return '0'
    
    if (fromToken === 'ETH' && toToken === 'USDT') {
      return (amount * exchangeRate).toFixed(2)
    } else if (fromToken === 'USDT' && toToken === 'ETH') {
      return (amount / exchangeRate).toFixed(6)
    }
    return '0'
  }, [fromAmount, fromToken, toToken, exchangeRate])

  const steps = [
    {
      number: '1',
      title: 'Choose what you pay',
      description: "Select the asset and network you're starting from.",
      component: (
        <div className="scale-[0.88] origin-center w-full flex justify-center">
          <div className="relative glass rounded-3xl p-5 sm:p-6 w-full max-w-lg
                          bg-gradient-to-br from-white/[0.03] to-white/[0.01] 
                          shadow-2xl shadow-black/50
                          backdrop-blur-xl">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-500/5 via-transparent to-purple-500/5 pointer-events-none" />
            
            <div className="relative z-10">
              <LandingSwapWidget 
                controlled={true}
                fromToken={fromToken}
                toToken={toToken}
                fromAmount={fromAmount}
                onFromTokenChange={setFromToken}
                onToTokenChange={setToToken}
                onFromAmountChange={setFromAmount}
                onToAmountChange={(amount) => {
                  // State is already updated via useMemo
                }}
                className="w-full"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      number: '2',
      title: 'Set your constraints',
      description: 'Configure execution parameters like deadline, partial fills, and recipient settings.',
      component: <IntentSettingsSection />,
    },
    {
      number: '3',
      title: 'Sign once, then track',
      description: 'One signature creates the instruction. You can follow the timeline across chains until settlement.',
      component: <TrackingSection />,
    },
  ]

  return (
    <section className="relative z-10 px-4 max-md:px-4 md:px-12 py-16 max-md:py-12 md:py-32">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-2xl max-md:text-2xl md:text-5xl font-light mb-12 max-md:mb-12 md:mb-20 text-center"
        >
          How it works
        </motion.h2>

        {/* 3 Vertical Rows - Each step with its interactive component */}
        <div className="space-y-12 max-md:space-y-12 md:space-y-24 w-full">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, delay: index * 0.1 }}
              className="flex flex-col max-md:flex-col md:flex-row gap-6 max-md:gap-6 md:gap-12 items-center"
            >
              {/* Left: Step Number */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0 w-16 max-md:w-16 md:w-20 h-16 max-md:h-16 md:h-20 rounded-full bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 flex items-center justify-center text-white text-2xl max-md:text-2xl md:text-3xl font-light border border-pink-400/30 shadow-lg shadow-accent/20"
              >
                {step.number}
              </motion.div>

              {/* Center: Step Title + Description */}
              <div className="flex-1 max-w-lg text-center max-md:text-center md:text-left">
                <h3 className="text-xl max-md:text-xl md:text-4xl font-light mb-3 max-md:mb-3 md:mb-4">{step.title}</h3>
                <p className="text-gray-400 text-base max-md:text-base md:text-lg">{step.description}</p>
              </div>

              {/* Right: Interactive Component - unified width container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.7, delay: index * 0.15 }}
                className="flex-shrink-0 flex items-center justify-center w-full max-w-lg"
              >
                {step.component}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
