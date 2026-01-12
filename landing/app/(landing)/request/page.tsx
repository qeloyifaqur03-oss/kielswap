'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export default function RequestPage() {
  const [twitterHandle, setTwitterHandle] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [interest, setInterest] = useState('')
  const [consent, setConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [walletError, setWalletError] = useState<string | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setWalletError(null)
    
    if (!twitterHandle.trim() || !interest.trim() || !consent) {
      return
    }

    // Client-side validation for wallet
    if (!walletAddress.trim() || walletAddress.trim().length < 10) {
      setWalletError('Wallet is required.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/early-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          twitterHandle: twitterHandle.trim(),
          walletAddress: walletAddress.trim(),
          interest: interest.trim(),
          consent: true,
        }),
      })

      const data = await response.json()

      if (!response.ok || response.status !== 200) {
        if (response.status === 429) {
          // Rate limit - show user-friendly message
          setWalletError('Please try again in a moment.')
        } else if (data.error === 'WALLET_REQUIRED') {
          setWalletError('Wallet is required.')
        } else if (data.error === 'TELEGRAM_FAILED') {
          setWalletError('Failed to send notification. Please try again or contact support.')
        } else if (data.error === 'ENV_MISSING') {
          setWalletError('Service configuration error. Please contact support.')
        } else {
          setWalletError('Failed to submit request. Please try again.')
        }
        return
      }

      // Success - show success state immediately
      setIsSubmitted(true)
      setRequestId(data.requestId || null)
      
      // Debug mode: log Telegram response details to console (if debug info is present)
      if (data.debug) {
        console.warn('[Early Access] Telegram debug info:', data.debug)
      }
      
      setTwitterHandle('')
      setWalletAddress('')
      setInterest('')
      setConsent(false)
      setWalletError(null)
    } catch (error) {
      console.error('Error submitting request:', error)
      setWalletError('Failed to submit request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center px-6 md:px-12 py-32">
      <div className="max-w-2xl mx-auto w-full">
        {isSubmitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-8 md:p-12 border border-white/10 text-center space-y-4"
          >
            <h2 className="text-3xl md:text-4xl font-light mb-2">Request received</h2>
            <p className="text-gray-400 text-lg">
              We review requests and reach out on X when access opens.
            </p>
            {requestId && (
              <p className="text-gray-500 text-xs mt-2">
                Request ID: {requestId}
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass rounded-2xl p-8 md:p-12 border border-white/10"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl md:text-4xl font-light mb-6"
            >
              Early Access Request
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-5"
            >
              <p className="text-white text-base leading-relaxed">
                Early access includes up to $100 in fee-free execution during beta,
                along with early participation in shaping how execution evolves.
              </p>
              <p className="text-sm mt-3">
                <a 
                  href="https://x.com/kielswap/status/2010103289166131588"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-pink-400/70 via-accent/70 to-purple-400/70 bg-clip-text text-transparent font-light hover:from-pink-400 hover:via-accent hover:to-purple-400 hover:underline hover:decoration-pink-400/50 transition-all duration-200 cursor-pointer"
                >
                  Read more
                </a>
              </p>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-gray-500 text-xs mb-10"
            >
              We're opening access gradually for users exploring outcome-first execution.
            </motion.p>

            <form onSubmit={handleSubmit} className="space-y-7">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="space-y-2 mt-2"
              >
                <label htmlFor="twitterHandle" className="text-sm text-gray-400 font-light">
                  X (Twitter) handle
                </label>
                <div className="relative rounded-xl focus-within:shadow-[0_0_16px_rgba(196,37,88,0.3)] transition-all duration-300 group" style={{ borderRadius: '12px' }}>
                  <div
                    className="absolute pointer-events-none z-0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
                    style={{
                      inset: '-2px',
                      background: 'linear-gradient(to right, rgba(236, 72, 153, 0.4), rgba(196, 37, 88, 0.45), rgba(168, 85, 247, 0.4))',
                      borderRadius: 'inherit',
                      padding: '2px',
                      WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude',
                    } as React.CSSProperties}
                  />
                  <div className="relative rounded-xl overflow-hidden" style={{ borderRadius: '12px' }}>
                    <Input
                      id="twitterHandle"
                      type="text"
                      value={twitterHandle}
                      onChange={(e) => setTwitterHandle(e.target.value)}
                      placeholder="@username"
                      required
                      className="relative w-full border-0 outline-none ring-0 focus:ring-0 focus:outline-none px-4 py-3 text-base font-light z-10"
                      style={{ 
                        borderRadius: '12px',
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-light">
                  We'll contact you here as access is approved.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
                className="space-y-2"
              >
                <label htmlFor="walletAddress" className="text-sm text-gray-400 font-light">
                  Wallet address
                </label>
                <div className="relative rounded-xl focus-within:shadow-[0_0_16px_rgba(196,37,88,0.3)] transition-all duration-300 group" style={{ borderRadius: '12px' }}>
                  <div
                    className="absolute pointer-events-none z-0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
                    style={{
                      inset: '-2px',
                      background: 'linear-gradient(to right, rgba(236, 72, 153, 0.4), rgba(196, 37, 88, 0.45), rgba(168, 85, 247, 0.4))',
                      borderRadius: 'inherit',
                      padding: '2px',
                      WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude',
                    } as React.CSSProperties}
                  />
                  <div className="relative rounded-xl overflow-hidden" style={{ borderRadius: '12px' }}>
                    <Input
                      id="walletAddress"
                      type="text"
                      value={walletAddress}
                      onChange={(e) => {
                        setWalletAddress(e.target.value)
                        setWalletError(null) // Clear error on type
                      }}
                      placeholder="0x..."
                      required
                      className="relative w-full border-0 outline-none ring-0 focus:ring-0 focus:outline-none px-4 py-3 text-base font-light z-10"
                      style={{ 
                        borderRadius: '12px',
                      }}
                    />
                  </div>
                </div>
                {walletError ? (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-gray-400 font-light"
                  >
                    {walletError}
                  </motion.p>
                ) : (
                  <p className="text-xs text-gray-500 font-light">
                    Used only to enable access.
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="space-y-2"
              >
                <label htmlFor="interest" className="text-sm text-gray-400 font-light">
                  What are you most interested in using intent-based swaps for?
                </label>
                <div className="relative rounded-xl focus-within:shadow-[0_0_16px_rgba(196,37,88,0.3)] transition-all duration-300 group" style={{ borderRadius: '12px' }}>
                  <div
                    className="absolute pointer-events-none z-0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
                    style={{
                      inset: '-2px',
                      background: 'linear-gradient(to right, rgba(236, 72, 153, 0.4), rgba(196, 37, 88, 0.45), rgba(168, 85, 247, 0.4))',
                      borderRadius: 'inherit',
                      padding: '2px',
                      WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude',
                    } as React.CSSProperties}
                  />
                  <div className="relative rounded-xl overflow-hidden" style={{ borderRadius: '12px' }}>
                    <Textarea
                      id="interest"
                      value={interest}
                      onChange={(e) => setInterest(e.target.value)}
                      placeholder="Cross-chain execution, large trades, MEV-resistant routing, automation…"
                      required
                      className="relative w-full border-0 outline-none ring-0 focus:ring-0 focus:outline-none px-4 py-3 text-base font-light min-h-[100px] resize-none z-10"
                      style={{ 
                        borderRadius: '12px',
                      }}
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.45 }}
                className="mt-8 space-y-6"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    required
                    className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-pink-400 focus:ring-pink-400/50 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="consent" className="text-sm text-gray-400 font-light cursor-pointer">
                    I agree to receive a message from Kielswap on X regarding Early Access.
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !twitterHandle.trim() || !walletAddress.trim() || !interest.trim() || !consent}
                  className="w-full h-14 mt-6 rounded-xl font-light bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 hover:border-pink-400/50 shadow-lg shadow-accent/20 hover:shadow-accent/30 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {isSubmitting ? 'Submitting...' : 'Request access'}
                </Button>
              </motion.div>
            </form>
          </motion.div>
        )}
      </div>
    </section>
  )
}

