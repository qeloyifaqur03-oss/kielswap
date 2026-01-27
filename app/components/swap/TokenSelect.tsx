'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion } from 'framer-motion'
import { TokenIcon } from '@/components/TokenIcon'
import { DROPDOWN_ANIMATION } from '@/lib/animations'

function filterTokens(tokens: Token[], search: string) {
  if (!search) return tokens
  const lowerSearch = search.toLowerCase()
  return tokens.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerSearch) ||
      t.symbol.toLowerCase().includes(lowerSearch) ||
      t.id.toLowerCase().includes(lowerSearch)
  )
}

export interface Token {
  id: string
  symbol: string
  name: string
  icon?: string
}

interface TokenSelectProps {
  tokens: Token[]
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

export function TokenSelect({
  tokens,
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select token',
}: TokenSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const selectedToken = tokens.find((t) => t.id === value)
  const filteredTokens = filterTokens(tokens, search)


  const handleSelect = (tokenId: string) => {
    onValueChange(tokenId)
    setOpen(false)
    setSearch('')
  }

  const handleOpenChange = (nextOpen: boolean) => {
    // Completely ignore Radix's onOpenChange - we handle all state ourselves
    // This prevents Radix from interfering with our manual toggle
  }

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen((prev) => !prev)
  }

  const handlePointerDownOutside = (e: Event) => {
    // Don't close if clicking the trigger button
    const target = e.target as Node
    if (triggerRef.current && triggerRef.current.contains(target)) {
      e.preventDefault()
      return
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onPointerDown={(e) => {
            // Completely prevent Radix from handling pointer events
            e.preventDefault()
            e.stopPropagation()
          }}
          onClick={handleTriggerClick}
          className="w-full h-12 px-5 justify-between bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-light rounded-2xl transition-all duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="flex items-center gap-3">
            {selectedToken?.icon && (
              <TokenIcon
                src={selectedToken.icon}
                alt={selectedToken.symbol}
                width={18}
                height={18}
                className="w-[18px] h-[18px]"
              />
            )}
            <span>{selectedToken?.symbol || placeholder}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      {open && (
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 overflow-hidden rounded-2xl"
          align="start"
          onOpenAutoFocus={(e) => {
            e.preventDefault()
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault()
          }}
          onPointerDownOutside={handlePointerDownOutside}
          onEscapeKeyDown={(e) => {
            e.preventDefault()
            setOpen(false)
          }}
          asChild
        >
          <motion.div
            initial={DROPDOWN_ANIMATION.initial}
            animate={DROPDOWN_ANIMATION.animate}
            exit={DROPDOWN_ANIMATION.exit}
            transition={DROPDOWN_ANIMATION.transition}
          >
              <Command>
                <CommandInput
                  placeholder="Search tokens..."
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandList>
                  <ScrollArea className="h-[200px]">
                    <CommandEmpty>No token found.</CommandEmpty>
                    <CommandGroup>
                      {filteredTokens.map((token) => (
                        <div
                          key={token.id}
                          className="relative flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white outline-none hover:bg-white/10 focus:bg-white/10 transition-colors duration-[150ms] ease-out"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleSelect(token.id)
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                        >
                          <div className="flex items-center gap-3 w-full">
                            {token.icon && (
                              <TokenIcon
                                src={token.icon}
                                alt={token.symbol}
                                width={18}
                                height={18}
                                className="w-[18px] h-[18px]"
                              />
                            )}
                            <span className="flex-1">{token.name}</span>
                            <span className="text-gray-400 text-sm">{token.symbol}</span>
                          </div>
                        </div>
                      ))}
                    </CommandGroup>
                  </ScrollArea>
                </CommandList>
              </Command>
            </motion.div>
          </PopoverContent>
      )}
    </Popover>
  )
}
