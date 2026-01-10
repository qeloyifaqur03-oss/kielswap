'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedRevealProps {
  isVisible: boolean
  children: ReactNode
  className?: string
  maxHeight?: string
}

export function AnimatedReveal({ 
  isVisible, 
  children, 
  className,
  maxHeight = '800px'
}: AnimatedRevealProps) {
  return (
    <div
      className={cn(
        'overflow-hidden transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-1 pointer-events-none',
        className
      )}
      style={{
        maxHeight: isVisible ? maxHeight : '0',
        transitionProperty: 'max-height, opacity, transform',
      }}
    >
      {children}
    </div>
  )
}

