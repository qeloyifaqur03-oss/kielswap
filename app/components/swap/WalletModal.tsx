'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface WalletModalProps {
  open: boolean
  onClose: () => void
}

export function WalletModal({ open, onClose }: WalletModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  return (
    <AnimatePresence mode="wait">
      {open && (
        <div key="wallet-modal" className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.22,
              ease: [0.4, 0, 0.2, 1], // easeIn for closing
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
            onClick={onClose}
          />
          {/* Modal content */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{
              duration: 0.26, // 260ms open
              ease: [0.16, 1, 0.3, 1], // easeOut for opening
            }}
            className="relative z-50 glass-strong rounded-2xl p-8 max-w-md w-full mx-4 pointer-events-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light text-white">Connect Wallet</h2>
              <Button
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-white/10 bg-transparent border-0 transition-all duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-gray-400 font-light">
              Wallet connection not implemented in this build.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

