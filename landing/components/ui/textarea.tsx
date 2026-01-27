import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, style, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[120px] w-full rounded-lg border border-white/10 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 disabled:opacity-50 disabled:cursor-not-allowed font-light resize-none',
          // Explicit background for all states - prevents browser from changing it
          'bg-[rgba(255,255,255,0.05)] focus:bg-[rgba(255,255,255,0.05)] focus-visible:bg-[rgba(255,255,255,0.05)] active:bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)]',
          className
        )}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          ...style,
        }}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }



















