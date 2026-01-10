'use client'

import { useState, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useSafeAccount, useSafeConnect } from '@/lib/wagmi/safeHooks'
import { Send, Check } from 'lucide-react'

export default function FeedbackPage() {
  const { address, isConnected } = useSafeAccount()
  const { connect, connectors } = useSafeConnect()
  const [feedback, setFeedback] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleConnectWallet = () => {
    const availableConnector = connectors[0]
    if (availableConnector) {
      connect({ connector: availableConnector })
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!feedback.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: feedback.trim(),
          email: email.trim() || undefined,
          address: address || undefined,
        }),
      })

      if (response.ok) {
        setSubmitted(true)
        setFeedback('')
        setEmail('')
        setTimeout(() => setSubmitted(false), 3000)
      } else {
        console.error('Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center px-6 md:px-12 py-32">
      <div className="max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl p-8 md:p-12 border border-white/10 shadow-xl"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-light mb-2">Feedback</h1>
            <p className="text-sm text-gray-400 font-light">
              Share your thoughts and help us improve
            </p>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 rounded-full bg-green-400/20 border border-green-400/30 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-sm text-gray-300 font-light">
                Thank you for your feedback!
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-gray-500 font-light">
                  Your Feedback
                </label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us what you think about kielswap..."
                  rows={6}
                  className="w-full bg-white/5 border-white/10 text-white font-light placeholder:text-gray-500 resize-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-500 font-light">
                  Email (optional)
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-white/5 border-white/10 text-white font-light placeholder:text-gray-500"
                />
              </div>

              {!isConnected && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-gray-400 font-light mb-2">
                    Connect your wallet to link feedback to your account (optional)
                  </p>
                  <Button
                    type="button"
                    onClick={handleConnectWallet}
                    className="w-full h-10 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-light rounded-xl transition-all duration-200"
                  >
                    Connect Wallet
                  </Button>
                </div>
              )}

              <Button
                type="submit"
                disabled={!feedback.trim() || isSubmitting}
                className="w-full h-12 bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 text-white rounded-xl hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 hover:border-pink-400/50 shadow-lg shadow-accent/20 hover:shadow-accent/30 disabled:opacity-50 disabled:cursor-not-allowed font-light transition-all duration-300"
              >
                {isSubmitting ? (
                  'Sending...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Feedback
                  </>
                )}
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  )
}
