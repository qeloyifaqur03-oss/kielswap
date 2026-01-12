'use client'

import { useState, useEffect, FormEvent, ChangeEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

function AccessPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // Check if access cookie exists on mount and redirect if needed
  useEffect(() => {
    async function checkAccess() {
      try {
        const response = await fetch('/api/access/check')
        const data = await response.json()

        if (data.hasAccess) {
          // User already has access, redirect to next or default
          const next = searchParams.get('next')
          const defaultPath = '/swap?mode=intent'
          
          if (next) {
            try {
              const decodedNext = decodeURIComponent(next)
              if (decodedNext.startsWith('/')) {
                const url = new URL(decodedNext, window.location.origin)
                if (url.pathname.startsWith('/')) {
                  router.replace(url.pathname + url.search)
                  return
                }
              }
            } catch {
              // Invalid URL, fallback to default
            }
          }
          
          router.replace(defaultPath)
        } else {
          setIsChecking(false)
        }
      } catch {
        // On error, show form
        setIsChecking(false)
      }
    }

    checkAccess()
  }, [router, searchParams])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow A-Z0-9, convert to uppercase
    const filtered = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    setCode(filtered)
    // Clear error when user types
    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // Prevent double submit
    if (isSubmitting) {
      return
    }
    
    if (!code.trim()) {
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const t0 = Date.now()
      
      // Create AbortController for timeout (10 seconds)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch('/api/access/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const t1 = Date.now()
      const clientMs = t1 - t0

      // Log timing (only in dev)
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG_BOOT === '1') {
        console.log(`[access/client] verify_client_ms=${clientMs} status=${response.status}`)
      }

      const data = await response.json()

      if (response.ok && data.ok) {
        // Cookie is set by server, redirect to next or default
        // Use window.location for hard redirect to ensure cookie is available to middleware
        const next = searchParams.get('next')
        const defaultPath = '/swap?mode=intent'
        
        let targetPath = defaultPath
        if (next) {
          try {
            const decodedNext = decodeURIComponent(next)
            if (decodedNext.startsWith('/')) {
              const url = new URL(decodedNext, window.location.origin)
              if (url.pathname.startsWith('/') && url.pathname !== '/access') {
                targetPath = url.pathname + url.search
              }
            }
          } catch {
            // Invalid URL, fallback to default
          }
        }
        
        // Small delay to ensure cookie is set, then hard redirect
        setTimeout(() => {
          window.location.href = targetPath
        }, 50)
      } else {
        // Handle errors - API returns only { ok: false }
        if (response.status === 401) {
          setError("That code didn't match. Double-check and try again.")
        } else {
          setError("Something went wrong. Try again.")
        }
        setIsSubmitting(false)
      }
    } catch (err) {
      // Check if it's a timeout
      if (err instanceof Error && err.name === 'AbortError') {
        setError("Network issue. Try again.")
      } else {
        setError("Something went wrong. Try again.")
      }
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSubmitting && code.trim()) {
      handleSubmit(e as any)
    }
  }

  if (isChecking) {
    return (
      <section className="relative z-10 min-h-screen flex items-center justify-center px-6 md:px-12 py-32">
        <div className="max-w-md mx-auto w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl p-8 md:p-12 border border-white/10 text-center"
          >
            <p className="text-gray-400 font-light">Checking access...</p>
          </motion.div>
        </div>
      </section>
    )
  }

  const isDisabled = !code.trim() || isSubmitting

  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center px-6 md:px-12 py-32">
      <div className="max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl p-8 md:p-12 border border-white/10 shadow-xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-light mb-2">
              Access code
            </h1>
            <p className="text-sm text-gray-400 font-light">
              Enter your code to open the app.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="relative rounded-xl focus-within:shadow-[0_0_8px_rgba(196,37,88,0.12)] transition-all duration-200 ease-out group" style={{ borderRadius: '12px' }}>
                <div
                  className="absolute pointer-events-none z-0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 ease-out"
                  style={{
                    inset: '0',
                    background: 'linear-gradient(to right, rgba(236, 72, 153, 0.30), rgba(196, 37, 88, 0.32), rgba(168, 85, 247, 0.30))',
                    borderRadius: '12px',
                    WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    padding: '1px',
                  } as React.CSSProperties}
                />
                <div className="relative rounded-xl" style={{ borderRadius: '12px' }}>
                  <Input
                    type="text"
                    value={code}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="XXXXXX"
                    className="relative w-full text-center font-mono text-lg tracking-widest uppercase bg-white/5 border-0 outline-none ring-0 focus:ring-0 focus:outline-none px-4 py-3 z-10 transition-colors duration-200 ease-out"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                    }}
                    autoFocus
                    autoComplete="off"
                    autoCapitalize="characters"
                    maxLength={6}
                    pattern="[A-Z0-9]{0,6}"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-sm text-gray-400 font-light text-center"
                >
                  {error}
                </motion.p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isDisabled}
              className="w-full h-12 bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 text-white rounded-xl hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 hover:border-pink-400/50 shadow-lg shadow-accent/20 hover:shadow-accent/30 disabled:opacity-50 disabled:cursor-not-allowed font-light transition-all duration-300"
            >
              {isSubmitting ? 'Verifying...' : 'Continue'}
            </Button>

            <div className="mt-6 text-center">
              <span className="text-xs text-gray-500 font-light">
                Need a code?{' '}
                <Link 
                  href="/request"
                  className="text-gray-400 font-light underline decoration-gray-500/50 underline-offset-2 hover:text-gray-300 hover:decoration-gray-400/70 transition-colors duration-200"
                >
                  Request access
                </Link>
              </span>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  )
}

export default function AccessPage() {
  return (
    <Suspense fallback={
      <section className="relative z-10 min-h-screen flex items-center justify-center px-6 md:px-12 py-32">
        <div className="max-w-md mx-auto w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl p-8 md:p-12 border border-white/10 text-center"
          >
            <p className="text-gray-400 font-light">Loading...</p>
          </motion.div>
        </div>
      </section>
    }>
      <AccessPageContent />
    </Suspense>
  )
}
