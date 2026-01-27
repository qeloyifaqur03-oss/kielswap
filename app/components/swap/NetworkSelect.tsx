'use client'

import { useState, useRef } from 'react'
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

interface Network {
  id: string
  name: string
  icon?: string
}

function filterNetworks(networks: Network[], search: string) {
  if (!search) return networks
  const lowerSearch = search.toLowerCase()
  return networks.filter(
    (n) =>
      n.name.toLowerCase().includes(lowerSearch) ||
      n.id.toLowerCase().includes(lowerSearch)
  )
}

interface NetworkSelectProps {
  networks: Network[]
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

export function NetworkSelect({
  networks,
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select network',
}: NetworkSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const selectedNetwork = networks.find((n) => n.id === value)
  const filteredNetworks = filterNetworks(networks, search)

  const handleSelect = (networkId: string) => {
    onValueChange(networkId)
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
            {selectedNetwork?.icon && (
              <TokenIcon
                src={selectedNetwork.icon}
                alt={selectedNetwork.name}
                width={20}
                height={20}
                className="w-5 h-5"
              />
            )}
            <span>{selectedNetwork?.name || placeholder}</span>
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
                  placeholder="Search networks..."
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandList>
                  <ScrollArea className="h-[200px]">
                    <CommandEmpty>No network found.</CommandEmpty>
                    <CommandGroup>
                      {filteredNetworks.map((network) => (
                        <CommandItem
                          key={network.id}
                          value={`${network.name} ${network.id}`}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                          onSelect={() => handleSelect(network.id)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-3 w-full">
                            {network.icon && (
                              <TokenIcon
                                src={network.icon}
                                alt={network.name}
                                width={20}
                                height={20}
                                className="w-5 h-5"
                              />
                            )}
                            <span className="flex-1">{network.name}</span>
                          </div>
                        </CommandItem>
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