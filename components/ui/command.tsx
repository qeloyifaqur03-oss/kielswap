'use client'

import * as React from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandProps {
  children: React.ReactNode
  className?: string
}

const Command = React.forwardRef<HTMLDivElement, CommandProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex h-full w-full flex-col overflow-hidden', className)}
      {...props}
    />
  )
)
Command.displayName = 'Command'

const CommandInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    onValueChange?: (value: string) => void
  }
>(({ className, onValueChange, onChange, ...props }, ref) => (
  <div className="flex items-center border-b border-white/10 px-3 focus-within:border-white/20 transition-colors duration-[150ms] ease-out">
    <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
    <input
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-md bg-transparent py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-[150ms] ease-out',
        className
      )}
      onChange={(e) => {
        onChange?.(e)
        onValueChange?.(e.target.value)
      }}
      {...props}
    />
  </div>
))
CommandInput.displayName = 'CommandInput'

const CommandList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)}
    {...props}
  />
))
CommandList.displayName = 'CommandList'

const CommandEmpty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('py-6 text-center text-sm text-gray-400', className)}
    {...props}
  />
))
CommandEmpty.displayName = 'CommandEmpty'

const CommandGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('overflow-hidden p-1 text-foreground', className)}
    {...props}
  />
))
CommandGroup.displayName = 'CommandGroup'

const CommandItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onSelect?: (e?: React.MouseEvent) => void
    value?: string
  }
>(({ className, onSelect, value, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white outline-none hover:bg-white/10 focus:bg-white/10 transition-colors duration-[150ms] ease-out data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    onClick={(e) => {
      e.preventDefault()
      e.stopPropagation()
      onSelect?.(e)
    }}
    data-value={value}
    {...props}
  />
))
CommandItem.displayName = 'CommandItem'

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
}

