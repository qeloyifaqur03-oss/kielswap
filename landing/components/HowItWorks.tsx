'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { LandingSwapWidget } from './LandingSwapWidget'
import { useTokenPrices } from '@/hooks/useTokenPrices'
import { Input } from '@/components/ui/input'
import { Check } from 'lucide-react'
import { calculateGuaranteedMinimum } from '@/lib/quoteFairness'

// Outcome component for step 2
function OutcomeSection({ 
  toAmount, 
  toToken, 
  deadline, 
  setDeadline 
}: { 
  toAmount: string | null
  toToken: 'ETH' | 'USDT'
  deadline: '5m' | '15m' | '30m' | 'custom'
  setDeadline: (deadline: '5m' | '15m' | '30m' | 'custom') => void
}) {
  const guaranteedMinimum = useMemo(() => {
    if (!toAmount || toAmount === '...' || parseFloat(toAmount) <= 0) return '0.00'
    const safetyBps = 100 // Fixed at 1% maximum
    return calculateGuaranteedMinimum(toAmount, safetyBps)
  }, [toAmount])

  return (
    <div className="glass rounded-2xl p-6 border border-white/10 w-full max-w-none scale-90 origin-center">
      <h3 className="text-2xl font-light mb-2">Outcome</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Guaranteed minimum */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 font-light">Guaranteed minimum</label>
          </div>
          <div className="relative pointer-events-auto">
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm min-h-[2.5rem] flex items-center">
              <div className="flex-1">
                {guaranteedMinimum}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500 font-light">
            Minimum received after fees.
          </div>
        </div>

        {/* Deadline */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400 font-light">Deadline</label>
          <div className="flex gap-2 flex-wrap">
            {['5m', '15m', '30m', 'custom'].map((option) => (
              <button
                key={option}
                onClick={() => setDeadline(option as any)}
                className={`px-3 py-2 rounded-xl text-xs font-light transition-colors ${
                  deadline === option
                    ? 'bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 text-white shadow-lg shadow-accent/20'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                {option === 'custom' ? 'Custom' : option}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-500 font-light">
            Order expires after this time.
          </div>
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
    <div className="glass rounded-2xl p-6 border border-white/10 w-full max-w-none scale-90 origin-center">
      <h3 className="text-2xl font-light mb-4">Summary</h3>
      <div className="w-full h-full bg-white/5 rounded-lg flex flex-col items-center justify-center text-gray-400 p-4 space-y-3">
        <div className="text-sm text-gray-500 mb-2">Tracking timeline</div>
        <div className="w-full space-y-2">
          {timelineSteps.map((step, index) => {
            const isCompleted = completedSteps.includes(index)
            const isLoading = activeStep === index && !isCompleted
            const isPending = !isCompleted && !isLoading

            return (
              <div key={step.id} className="flex items-center gap-3 text-sm">
                <div className="relative w-5 h-5 flex items-center justify-center">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-500/40 via-accent/40 to-purple-500/40 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  ) : isLoading ? (
                    <div className="w-3 h-3 rounded-full bg-gray-400 animate-pulse"></div>
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  )}
                </div>
                <span className={isCompleted ? 'text-white' : isLoading ? 'text-gray-300' : 'text-gray-500'}>
                  {step.label}
                </span>
              </div>
            )
          })}
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
  const [deadline, setDeadline] = useState<'5m' | '15m' | '30m' | 'custom'>('15m')

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
        <div className="scale-90 origin-center w-full">
          <div className="glass rounded-2xl p-4 border border-white/10 w-full max-w-none">
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
      ),
    },
    {
      number: '2',
      title: 'Define your outcome',
      description: 'Set the minimum you want to receive and the time window for execution.',
      component: (
        <OutcomeSection 
          toAmount={toAmount}
          toToken={toToken}
          deadline={deadline}
          setDeadline={setDeadline}
        />
      ),
    },
    {
      number: '3',
      title: 'Sign once. Track execution end to end.',
      description: 'Place an intent with a single signature and follow execution across chains.',
      component: <TrackingSection />,
    },
  ]

  return (
    <section className="relative z-10 px-6 md:px-12 py-32">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-light mb-20 text-center"
        >
          How it works
        </motion.h2>

        {/* 3 Vertical Rows - Each step with its interactive component */}
        <div className="space-y-24 w-full">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, delay: index * 0.1 }}
              className="flex flex-col md:flex-row gap-8 md:gap-12 items-center"
            >
              {/* Left: Step Number */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0 w-20 h-20 rounded-full bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 flex items-center justify-center text-white text-3xl font-light border border-pink-400/30 shadow-lg shadow-accent/20"
              >
                {step.number}
              </motion.div>

              {/* Center: Step Title + Description */}
              <div className="flex-1 max-w-lg">
                <h3 className="text-3xl md:text-4xl font-light mb-4">{step.title}</h3>
                <p className="text-gray-400 text-lg">{step.description}</p>
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
