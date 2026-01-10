'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { isValidAccessCode } from '@/lib/accessCodes'

const STORAGE_KEY = 'kielswap_access_granted'

export function AccessGate({ onAccessGranted }: { onAccessGranted: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow alphanumeric characters
    const sanitized = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    setCode(sanitized)
    // Clear error when user types
    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!code.trim()) {
      return
    }

    setIsSubmitting(true)
    setError('')

    // Small delay to prevent instant validation feel
    await new Promise(resolve => setTimeout(resolve, 100))

    if (isValidAccessCode(code)) {
      // Grant access - use sessionStorage instead of localStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY, '1')
      }
      onAccessGranted()
    } else {
      setError('Invalid access code.')
      setIsSubmitting(false)
    }
  }

  const isDisabled = !code.trim() || isSubmitting

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[100] flex items-center justify-center min-h-screen"
    >
      {/* Full-screen dark/glass background */}
      <div className="absolute inset-0 bg-background/95 backdrop-blur-sm" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="glass-strong rounded-2xl border border-white/10 shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-light text-white mb-2">
              Enter access code
            </h1>
            <p className="text-sm text-gray-400 font-light">
              Access to the app is limited.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                value={code}
                onChange={handleInputChange}
                placeholder="ENTER CODE"
                className="text-center font-mono text-lg tracking-wider uppercase rounded-2xl border-pink-400/30 focus:border-pink-400/50 focus:bg-white/8"
                autoFocus
                autoComplete="off"
                maxLength={10}
              />
              
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-gray-400 font-light text-center"
                >
                  {error}
                </motion.p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isDisabled}
              className="w-full h-12 bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 text-white rounded-2xl hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 hover:border-pink-400/50 shadow-lg shadow-accent/20 hover:shadow-accent/30 disabled:opacity-50 disabled:cursor-not-allowed font-light transition-all duration-300"
            >
              Continue
            </Button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  )
}

/**
 * Checks if access is granted in sessionStorage
 */
export function hasAccess(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return sessionStorage.getItem(STORAGE_KEY) === '1'
}

