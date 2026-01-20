'use client'

import { useState, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Send, Check } from 'lucide-react'
import { useSafeAccount } from '@/lib/wagmi/safeHooks'

export default function FeedbackPage() {
  const { address, isConnected } = useSafeAccount()
  const [feedback, setFeedback] = useState('')
  const [contact, setContact] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!feedback.trim() || !contact.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: feedback.trim(),
          contact: contact.trim(),
        }),
      })

      if (response.ok) {
        // Увеличить счётчик feedback для текущего адреса кошелька
        if (isConnected && address) {
          const addressKey = address.toLowerCase()
          const currentCount = parseInt(localStorage.getItem(`feedback_count_${addressKey}`) || '0', 10)
          localStorage.setItem(`feedback_count_${addressKey}`, String(currentCount + 1))
          
          // Инициировать storage event для обновления других вкладок и компонентов
          window.dispatchEvent(new StorageEvent('storage', {
            key: `feedback_count_${addressKey}`,
            newValue: String(currentCount + 1),
            oldValue: String(currentCount),
            storageArea: localStorage,
            url: window.location.href,
          }))
        }
        
        setSubmitted(true)
        setFeedback('')
        setContact('')
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
    <section className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-12 py-16 sm:py-24 md:py-32">
      <div className="max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl p-6 sm:p-8 md:p-12"
        >
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light mb-2">Feedback</h1>
            <p className="text-xs sm:text-sm text-gray-400 font-light px-2">
              Contact us with your feedback
            </p>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/20 via-accent/25 to-purple-500/20 border border-pink-400/30 flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-400 via-accent to-purple-400 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-300 font-light">
                Thank you for your feedback!
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Contact - required field */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500 font-light">
                  Contact <span className="text-red-400">*</span>
                </label>
                <div className="relative w-full rounded-lg bg-gradient-to-br from-white/[0.04] to-white/[0.02] backdrop-blur-sm shadow-md shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-br before:from-pink-500/5 before:via-transparent before:to-purple-500/5 before:rounded-lg before:-z-10">
                  <Input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Telegram, email, etc..."
                    className="w-full bg-transparent border-white/10 text-white font-light placeholder:text-gray-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-500 font-light">
                  Your Feedback <span className="text-red-400">*</span>
                </label>
                <div className="relative w-full rounded-lg bg-gradient-to-br from-white/[0.04] to-white/[0.02] backdrop-blur-sm shadow-md shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-br before:from-pink-500/5 before:via-transparent before:to-purple-500/5 before:rounded-lg before:-z-10">
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Tell us what you think about kielswap..."
                    rows={6}
                    className="w-full bg-transparent border-white/10 text-white font-light placeholder:text-gray-500 resize-none"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={!feedback.trim() || !contact.trim() || isSubmitting}
                className="w-full h-12 bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 text-white rounded-xl hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 hover:border-pink-400/50 shadow-lg shadow-accent/20 hover:shadow-accent/30 disabled:opacity-50 disabled:cursor-not-allowed font-light transition-all duration-300"
              >
                {isSubmitting ? (
                  'Sending...'
                ) : (
                  'Submit feedback'
                )}
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  )
}
