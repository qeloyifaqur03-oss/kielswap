import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, style, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-lg border border-white/10 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 disabled:opacity-50 disabled:cursor-not-allowed font-light',
          // Explicit background for all states - prevents browser from changing it
          'bg-[rgba(255,255,255,0.05)] focus:bg-[rgba(255,255,255,0.05)] focus-visible:bg-[rgba(255,255,255,0.05)] active:bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)]',
          // Prevent autofill styling
          '[&:-webkit-autofill]:!bg-[rgba(255,255,255,0.05)] [&:-webkit-autofill]:!text-white [&:-webkit-autofill]:![-webkit-text-fill-color:#ffffff] [&:-webkit-autofill:hover]:!bg-[rgba(255,255,255,0.05)] [&:-webkit-autofill:focus]:!bg-[rgba(255,255,255,0.05)] [&:-webkit-autofill:active]:!bg-[rgba(255,255,255,0.05)]',
          className
        )}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          color: '#ffffff',
          ...style,
        }}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }






















