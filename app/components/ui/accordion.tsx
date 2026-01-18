'use client'

import { useState, ReactNode, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TOGGLE_TRANSITION, HEIGHT_TRANSITION, ACCORDION_CONTENT_ANIMATION } from '@/lib/animations'

interface AccordionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export function Accordion({ title, children, defaultOpen = false }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const measureRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number>(0)

  // Measure content height using a hidden copy that's always rendered
  useEffect(() => {
    if (!measureRef.current) return

    const measure = () => {
      if (measureRef.current) {
        setHeight(measureRef.current.scrollHeight)
      }
    }
    
    // Initial measurement - use requestAnimationFrame to ensure DOM is ready
    let rafId: number | null = null
    rafId = requestAnimationFrame(() => {
      if (measureRef.current) {
        measure()
      }
    })
    
    const resizeObserver = new ResizeObserver(() => {
      if (measureRef.current) {
        measure()
      }
    })
    
    if (measureRef.current) {
      resizeObserver.observe(measureRef.current)
    }
    
    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      resizeObserver.disconnect()
    }
  }, [children])

  return (
    <div className="w-full relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 text-sm text-gray-400 font-light hover:text-white transition-colors duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>
      
      {/* Hidden copy for measurement - always rendered but invisible */}
      <div
        ref={measureRef}
        className="pt-2 pb-4 space-y-4"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          visibility: 'hidden',
          height: 'auto',
          pointerEvents: 'none',
        }}
      >
        {children}
      </div>

      {/* Animated content with proper enter/exit */}
      <AnimatePresence initial={false} mode="wait">
        {isOpen && (
          <motion.div
            key="accordion-content"
            initial={{
              height: 0,
              opacity: 0,
            }}
            animate={{
              height: height || 0,
              opacity: 1,
            }}
            exit={{
              height: 0,
              opacity: 0,
            }}
            transition={{
              height: HEIGHT_TRANSITION,
              opacity: TOGGLE_TRANSITION,
            }}
            className="overflow-hidden"
          >
            <motion.div
              key="accordion-inner"
              initial={ACCORDION_CONTENT_ANIMATION.initial}
              animate={ACCORDION_CONTENT_ANIMATION.animate}
              exit={ACCORDION_CONTENT_ANIMATION.exit}
              transition={ACCORDION_CONTENT_ANIMATION.transition}
            >
              <div className="pt-2 pb-4 space-y-4">
                {children}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

