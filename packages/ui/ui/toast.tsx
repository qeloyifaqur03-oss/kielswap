'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

interface ToastProps {
  message: string
  open: boolean
  onClose: () => void
}

export function Toast({ message, open, onClose }: ToastProps) {
  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98, x: '-50%' }}
          animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
          exit={{ opacity: 0, y: 28, scale: 0.98, x: '-50%' }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="
            fixed left-1/2 bottom-8 -translate-x-1/2
            z-[9999]
            w-fit max-w-[min(560px,calc(100vw-32px))]
            px-5 py-3
            rounded-2xl
            border border-white/12
            bg-white/6
            backdrop-blur-2xl
            shadow-[0_20px_80px_rgba(0,0,0,0.45)]
          "
          style={{ transform: 'translateX(-50%)' }}
        >
          <div className="text-center text-white/90">{message}</div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
