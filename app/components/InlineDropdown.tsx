'use client'

import { useEffect, useRef, cloneElement, isValidElement } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface InlineDropdownProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'start' | 'end'
  className?: string
}

// Hook for outside click detection
function useOutsideClick(
  ref: React.RefObject<HTMLElement>,
  handler: () => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler()
      }
    }

    // Use capture phase to catch events before they bubble
    document.addEventListener('mousedown', handleClickOutside, true)
    document.addEventListener('touchstart', handleClickOutside, true)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true)
      document.removeEventListener('touchstart', handleClickOutside, true)
    }
  }, [ref, handler, enabled])
}

export function InlineDropdown({
  open,
  onOpenChange,
  trigger,
  children,
  align = 'end',
  className = '',
}: InlineDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useOutsideClick(containerRef, () => onOpenChange(false), open)

  // Close on Esc key
  useEffect(() => {
    if (!open) return

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onOpenChange])

  // Clone trigger and add onClick handler
  const triggerWithHandler = isValidElement(trigger)
    ? cloneElement(trigger, {
        onClick: (e: React.MouseEvent) => {
          // Call original onClick if exists
          if (trigger.props.onClick) {
            trigger.props.onClick(e)
          }
          // Toggle dropdown
          onOpenChange(!open)
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          // Call original onKeyDown if exists
          if (trigger.props.onKeyDown) {
            trigger.props.onKeyDown(e)
          }
          // Handle Enter/Space
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpenChange(!open)
          }
        },
      } as any)
    : trigger

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      {triggerWithHandler}

      {/* Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{
              duration: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`absolute ${align === 'end' ? 'right-0' : 'left-0'} top-[calc(100%+8px)] z-[100] w-48 p-2 rounded-2xl border border-white/10 shadow-lg backdrop-blur-xl bg-[rgba(10,10,12,0.92)] ${className}`}
            onClick={(e) => {
              // Stop propagation to prevent outside click handler from firing
              e.stopPropagation()
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
