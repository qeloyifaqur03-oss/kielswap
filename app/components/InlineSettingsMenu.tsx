'use client'

import { useState, useEffect, useRef, cloneElement, isValidElement } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface InlineSettingsMenuProps {
  open: boolean
  onClose: () => void
  mode: 'intent' | 'instant' | 'limit'
  triggerRef?: React.RefObject<HTMLButtonElement>
  children?: React.ReactNode
  onSettingsChange?: (settings: {
    enablePartialFills?: boolean
    amountOfParts?: string
    limitPartialFills?: boolean
    limitAmountOfParts?: string
    deadline?: string
    expiration?: string
    slippage?: string
    customRecipient?: boolean
    recipientAddress?: string
  }) => void
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

    // Use bubble phase instead of capture to avoid blocking clicks
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [ref, handler, enabled])
}

export function InlineSettingsMenu({
  open,
  onClose,
  mode,
  triggerRef,
  children,
  onSettingsChange,
}: InlineSettingsMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [panelPosition, setPanelPosition] = useState<{ top: number; right: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Set mounted on client side and detect mobile
  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('swapSettings')
      if (stored) {
        const settings = JSON.parse(stored)
        // Load Intent mode settings
        if (settings.intent) {
          if (settings.intent.deadline) setDeadline(settings.intent.deadline)
          if (settings.intent.enablePartialFills !== undefined) setEnablePartialFills(settings.intent.enablePartialFills)
          if (settings.intent.amountOfParts) setAmountOfParts(settings.intent.amountOfParts)
          if (settings.intent.customRecipient !== undefined) setCustomRecipient(settings.intent.customRecipient)
          if (settings.intent.recipientAddress) setRecipientAddress(settings.intent.recipientAddress)
        }
        // Load Instant mode settings
        if (settings.instant) {
          if (settings.instant.slippage) setSlippage(settings.instant.slippage)
          if (settings.instant.customSlippage) setCustomSlippage(settings.instant.customSlippage)
          if (settings.instant.useCustomSlippage !== undefined) setUseCustomSlippage(settings.instant.useCustomSlippage)
          if (settings.instant.customRecipient !== undefined) setCustomRecipient(settings.instant.customRecipient)
          if (settings.instant.recipientAddress) setRecipientAddress(settings.instant.recipientAddress)
        }
        // Load Limit mode settings
        if (settings.limit) {
          if (settings.limit.expiration) setExpiration(settings.limit.expiration)
          if (settings.limit.customExpiration) setCustomExpiration(settings.limit.customExpiration)
          if (settings.limit.useCustomExpiration !== undefined) setUseCustomExpiration(settings.limit.useCustomExpiration)
          if (settings.limit.limitPartialFills !== undefined) setLimitPartialFills(settings.limit.limitPartialFills)
          if (settings.limit.limitAmountOfParts) setLimitAmountOfParts(settings.limit.limitAmountOfParts)
        }
      }
    } catch (error) {
      // Ignore parse errors
    }
  }, [])

  // Intent mode state
  const [deadline, setDeadline] = useState('5')
  const [enablePartialFills, setEnablePartialFills] = useState(false)
  const [amountOfParts, setAmountOfParts] = useState('2')
  const [customRecipient, setCustomRecipient] = useState(false)
  const [recipientAddress, setRecipientAddress] = useState('')

  // Instant mode state
  const [slippage, setSlippage] = useState('0.3')
  const [customSlippage, setCustomSlippage] = useState('')
  const [useCustomSlippage, setUseCustomSlippage] = useState(false)

  // Limit mode state
  const [expiration, setExpiration] = useState('1d')
  const [customExpiration, setCustomExpiration] = useState('')
  const [useCustomExpiration, setUseCustomExpiration] = useState(false)
  const [limitPartialFills, setLimitPartialFills] = useState(false)
  const [limitAmountOfParts, setLimitAmountOfParts] = useState('2')

  // Local state for form (before applying)
  const [localDeadline, setLocalDeadline] = useState(deadline)
  const [localEnablePartialFills, setLocalEnablePartialFills] = useState(enablePartialFills)
  const [localAmountOfParts, setLocalAmountOfParts] = useState('') // Empty by default, no autofill
  const [localCustomRecipient, setLocalCustomRecipient] = useState(customRecipient)
  const [localRecipientAddress, setLocalRecipientAddress] = useState(recipientAddress)
  const [localSlippage, setLocalSlippage] = useState(slippage)
  const [localCustomSlippage, setLocalCustomSlippage] = useState(customSlippage)
  const [localUseCustomSlippage, setLocalUseCustomSlippage] = useState(useCustomSlippage)
  const [localExpiration, setLocalExpiration] = useState(expiration)
  const [localCustomExpiration, setLocalCustomExpiration] = useState(customExpiration)
  const [localUseCustomExpiration, setLocalUseCustomExpiration] = useState(useCustomExpiration)
  const [localLimitPartialFills, setLocalLimitPartialFills] = useState(limitPartialFills)
  const [localLimitAmountOfParts, setLocalLimitAmountOfParts] = useState('') // Empty by default, no autofill

  // Validation errors
  const [errors, setErrors] = useState<{
    deadline?: string
    recipientAddress?: string
    amountOfParts?: string
    limitAmountOfParts?: string
    slippage?: string
    expiration?: string
  }>({})

  // Helper functions for localStorage
  const loadSettingsFromStorage = () => {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem('swapSettings')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      // Ignore parse errors
    }
    return null
  }

  const saveSettingsToStorage = (settings: any) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('swapSettings', JSON.stringify(settings))
    } catch (error) {
      // Ignore storage errors
    }
  }

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = loadSettingsFromStorage()
    if (stored) {
      // Load Intent mode settings
      if (stored.intent) {
        if (stored.intent.deadline) setDeadline(stored.intent.deadline)
        if (stored.intent.enablePartialFills !== undefined) setEnablePartialFills(stored.intent.enablePartialFills)
        if (stored.intent.amountOfParts) setAmountOfParts(stored.intent.amountOfParts)
        if (stored.intent.customRecipient !== undefined) setCustomRecipient(stored.intent.customRecipient)
        if (stored.intent.recipientAddress) setRecipientAddress(stored.intent.recipientAddress)
      }
      // Load Instant mode settings
      if (stored.instant) {
        if (stored.instant.slippage) setSlippage(stored.instant.slippage)
        if (stored.instant.customSlippage) setCustomSlippage(stored.instant.customSlippage)
        if (stored.instant.useCustomSlippage !== undefined) setUseCustomSlippage(stored.instant.useCustomSlippage)
        if (stored.instant.customRecipient !== undefined) setCustomRecipient(stored.instant.customRecipient)
        if (stored.instant.recipientAddress) setRecipientAddress(stored.instant.recipientAddress)
      }
      // Load Limit mode settings
      if (stored.limit) {
        if (stored.limit.expiration) setExpiration(stored.limit.expiration)
        if (stored.limit.customExpiration) setCustomExpiration(stored.limit.customExpiration)
        if (stored.limit.useCustomExpiration !== undefined) setUseCustomExpiration(stored.limit.useCustomExpiration)
        if (stored.limit.limitPartialFills !== undefined) setLimitPartialFills(stored.limit.limitPartialFills)
        if (stored.limit.limitAmountOfParts) setLimitAmountOfParts(stored.limit.limitAmountOfParts)
      }
    }
  }, [])

  // Reset local state when menu opens
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('swapSettings')
      if (stored) {
        const settings = JSON.parse(stored)
        // Load Intent mode settings
        if (settings.intent) {
          if (settings.intent.deadline) setDeadline(settings.intent.deadline)
          if (settings.intent.enablePartialFills !== undefined) setEnablePartialFills(settings.intent.enablePartialFills)
          if (settings.intent.amountOfParts) setAmountOfParts(settings.intent.amountOfParts)
          if (settings.intent.customRecipient !== undefined) setCustomRecipient(settings.intent.customRecipient)
          if (settings.intent.recipientAddress) setRecipientAddress(settings.intent.recipientAddress)
        }
        // Load Instant mode settings
        if (settings.instant) {
          if (settings.instant.slippage) setSlippage(settings.instant.slippage)
          if (settings.instant.customSlippage) setCustomSlippage(settings.instant.customSlippage)
          if (settings.instant.useCustomSlippage !== undefined) setUseCustomSlippage(settings.instant.useCustomSlippage)
          if (settings.instant.customRecipient !== undefined) setCustomRecipient(settings.instant.customRecipient)
          if (settings.instant.recipientAddress) setRecipientAddress(settings.instant.recipientAddress)
        }
        // Load Limit mode settings
        if (settings.limit) {
          if (settings.limit.expiration) setExpiration(settings.limit.expiration)
          if (settings.limit.customExpiration) setCustomExpiration(settings.limit.customExpiration)
          if (settings.limit.useCustomExpiration !== undefined) setUseCustomExpiration(settings.limit.useCustomExpiration)
          if (settings.limit.limitPartialFills !== undefined) setLimitPartialFills(settings.limit.limitPartialFills)
          if (settings.limit.limitAmountOfParts) setLimitAmountOfParts(settings.limit.limitAmountOfParts)
        }
      }
    } catch (error) {
      // Ignore parse errors
    }
  }, [])

  // Reset local state when menu opens
  useEffect(() => {
    if (open) {
      setLocalDeadline(deadline)
      setLocalEnablePartialFills(enablePartialFills)
      setLocalAmountOfParts(enablePartialFills ? amountOfParts : '') // Load saved value if partial fills enabled
      setLocalCustomRecipient(customRecipient)
      setLocalRecipientAddress(recipientAddress)
      setLocalSlippage(slippage)
      setLocalCustomSlippage(customSlippage)
      setLocalUseCustomSlippage(useCustomSlippage)
      setLocalExpiration(expiration)
      setLocalCustomExpiration(customExpiration)
      setLocalUseCustomExpiration(useCustomExpiration)
      setLocalLimitPartialFills(limitPartialFills)
      setLocalLimitAmountOfParts(limitPartialFills ? limitAmountOfParts : '') // Load saved value if partial fills enabled
      setErrors({}) // Reset errors
    }
  }, [open, deadline, enablePartialFills, amountOfParts, customRecipient, recipientAddress, slippage, customSlippage, useCustomSlippage, expiration, customExpiration, useCustomExpiration, limitPartialFills, limitAmountOfParts])

  // Validation functions
  const validateDeadline = (value: string): string | undefined => {
    if (!value || value.trim() === '') {
      return 'Enter deadline.'
    }
    const num = parseInt(value, 10)
    if (isNaN(num)) {
      return 'Whole numbers only.'
    }
    if (num < 1) {
      return 'Minimum is 1.'
    }
    // Check if it's a whole number (no decimals)
    if (parseFloat(value) !== num) {
      return 'Whole numbers only.'
    }
    return undefined
  }

  const validateRecipientAddress = (address: string): string | undefined => {
    if (!address || address.trim() === '') {
      return 'Enter recipient address.'
    }
    // Basic address validation (Ethereum address format: 0x followed by 40 hex characters)
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
    if (!ethAddressRegex.test(address.trim())) {
      return 'Please enter valid address.'
    }
    return undefined
  }

  const validateAmountOfParts = (value: string): string | undefined => {
    if (!value || value.trim() === '') {
      return 'Enter parts count.'
    }
    const num = parseInt(value, 10)
    if (isNaN(num)) {
      return 'Whole numbers only.'
    }
    if (num <= 1) {
      return 'Must be greater than 1.'
    }
    // Check if it's a whole number (no decimals)
    if (parseFloat(value) !== num) {
      return 'Whole numbers only.'
    }
    return undefined
  }

  // Validate all fields
  const validateAll = (): boolean => {
    const newErrors: typeof errors = {}

    // Intent mode validations
    if (mode === 'intent') {
      // Deadline is always required in intent mode
      const deadlineError = validateDeadline(localDeadline)
      if (deadlineError) {
        newErrors.deadline = deadlineError
      }
      if (localCustomRecipient) {
        const recipientError = validateRecipientAddress(localRecipientAddress)
        if (recipientError) {
          newErrors.recipientAddress = recipientError
        }
      }
      if (localEnablePartialFills) {
        const partsError = validateAmountOfParts(localAmountOfParts)
        if (partsError) {
          newErrors.amountOfParts = partsError
        }
      }
    }

    // Instant mode validations
    if (mode === 'instant') {
      // Slippage validation: if custom is selected but empty, show error
      if (localUseCustomSlippage && (!localCustomSlippage || localCustomSlippage.trim() === '')) {
        newErrors.slippage = 'Select slippage.'
      }
      if (localCustomRecipient) {
        const recipientError = validateRecipientAddress(localRecipientAddress)
        if (recipientError) {
          newErrors.recipientAddress = recipientError
        }
      }
    }

    // Limit mode validations
    if (mode === 'limit') {
      // Expiration validation: if custom mode is active, custom value must be entered
      if (localUseCustomExpiration && (!localCustomExpiration || localCustomExpiration.trim() === '')) {
        newErrors.expiration = 'Select expiration.'
      }
      if (localLimitPartialFills) {
        const partsError = validateAmountOfParts(localLimitAmountOfParts)
        if (partsError) {
          newErrors.limitAmountOfParts = partsError
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Close on outside click is handled by overlay onClick - no need for useOutsideClick since panel is in portal

  // Calculate panel position when opening
  useEffect(() => {
    if (!open) {
      setPanelPosition(null)
      return
    }

    const calculatePosition = () => {
      if (!containerRef.current) return

      // On mobile (≤768px), use bottom sheet - no position calculation needed
      if (isMobile) {
        setPanelPosition({ top: 0, right: 0 }) // Dummy position, will be overridden by CSS
        return
      }

      // Desktop: calculate position relative to trigger
      const rect = containerRef.current.getBoundingClientRect()
      const panelWidth = 288 // w-72 = 18rem = 288px
      const spacing = 8 // gap between trigger and panel

      setPanelPosition({
        top: rect.bottom + spacing,
        right: window.innerWidth - rect.right,
      })
    }

    calculatePosition()
    
    // Recalculate on resize/scroll
      window.addEventListener('resize', calculatePosition)
      window.addEventListener('scroll', calculatePosition, true)

    return () => {
      window.removeEventListener('resize', calculatePosition)
      window.removeEventListener('scroll', calculatePosition, true)
    }
  }, [open, isMobile])

  // Close on Esc key
  useEffect(() => {
    if (!open) return

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  const handleApply = () => {
    // Validate all fields before applying
    if (!validateAll()) {
      return // Don't apply if validation fails
    }

    // Apply Intent mode changes
    if (mode === 'intent') {
      const appliedAmountOfParts = localEnablePartialFills ? localAmountOfParts : amountOfParts
      setDeadline(localDeadline)
      setEnablePartialFills(localEnablePartialFills)
      setAmountOfParts(appliedAmountOfParts)
      setCustomRecipient(localCustomRecipient)
      setRecipientAddress(localRecipientAddress)
      
      // Save to localStorage
      const currentSettings = loadSettingsFromStorage() || {}
      saveSettingsToStorage({
        ...currentSettings,
        intent: {
          deadline: localDeadline,
          enablePartialFills: localEnablePartialFills,
          amountOfParts: appliedAmountOfParts,
          customRecipient: localCustomRecipient,
          recipientAddress: localRecipientAddress,
        }
      })
      
      onSettingsChange?.({
        enablePartialFills: localEnablePartialFills,
        amountOfParts: appliedAmountOfParts,
      })
    }
    // Apply Instant mode changes
    else if (mode === 'instant') {
      const appliedSlippage = localUseCustomSlippage ? localCustomSlippage : localSlippage
      setSlippage(appliedSlippage)
      setCustomSlippage(localCustomSlippage)
      setUseCustomSlippage(localUseCustomSlippage)
      setCustomRecipient(localCustomRecipient)
      setRecipientAddress(localRecipientAddress)
      
      // Save to localStorage
      const currentSettings = loadSettingsFromStorage() || {}
      saveSettingsToStorage({
        ...currentSettings,
        instant: {
          slippage: appliedSlippage,
          customSlippage: localCustomSlippage,
          useCustomSlippage: localUseCustomSlippage,
          customRecipient: localCustomRecipient,
          recipientAddress: localRecipientAddress,
        }
      })
      
      onSettingsChange?.({
        slippage: appliedSlippage,
        customRecipient: localCustomRecipient,
        recipientAddress: localRecipientAddress,
      })
    }
    // Apply Limit mode changes
    else if (mode === 'limit') {
      const appliedExpiration = localUseCustomExpiration ? localCustomExpiration : localExpiration
      const appliedLimitAmountOfParts = localLimitPartialFills ? localLimitAmountOfParts : limitAmountOfParts
      setExpiration(appliedExpiration)
      setCustomExpiration(localCustomExpiration)
      setUseCustomExpiration(localUseCustomExpiration)
      setLimitPartialFills(localLimitPartialFills)
      setLimitAmountOfParts(appliedLimitAmountOfParts)
      setCustomRecipient(localCustomRecipient)
      setRecipientAddress(localRecipientAddress)
      
      // Save to localStorage
      const currentSettings = loadSettingsFromStorage() || {}
      saveSettingsToStorage({
        ...currentSettings,
        limit: {
          expiration: appliedExpiration,
          customExpiration: localCustomExpiration,
          useCustomExpiration: localUseCustomExpiration,
          limitPartialFills: localLimitPartialFills,
          limitAmountOfParts: appliedLimitAmountOfParts,
          customRecipient: localCustomRecipient,
          recipientAddress: localRecipientAddress,
        }
      })
      
      onSettingsChange?.({
        limitPartialFills: localLimitPartialFills,
        limitAmountOfParts: appliedLimitAmountOfParts,
        expiration: appliedExpiration,
        customRecipient: localCustomRecipient,
        recipientAddress: localRecipientAddress,
      })
    }
    onClose()
  }

  // Clone trigger and add onClick handler to toggle menu
  const triggerWithHandler = isValidElement(children)
    ? cloneElement(children, {
        onClick: (e: React.MouseEvent) => {
          // Call original onClick if exists
          if (children.props.onClick) {
            children.props.onClick(e)
          }
          // Toggle is handled by parent via isOpen/onClose
        },
      } as any)
    : children

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      {triggerWithHandler}

      {/* Menu - render in portal for proper stacking context */}
      {mounted && typeof window !== 'undefined' && document.body && (
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                {/* Backdrop overlay - full screen blur and darkening */}
                <motion.div
                  key="backdrop-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 0.2,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="fixed inset-0 z-[10000]"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.70)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    pointerEvents: 'auto',
                  }}
                  onClick={onClose}
                />
                {/* Settings panel */}
                {panelPosition && (
                  <motion.div
                    key="settings-panel"
                    ref={menuRef}
                    initial={isMobile ? { y: '100%', opacity: 0 } : { y: -8, scale: 0.95, opacity: 0 }}
                    animate={isMobile ? { y: 0, opacity: 1 } : { y: 0, scale: 1, opacity: 1 }}
                    exit={isMobile ? { y: '100%', opacity: 0 } : { opacity: 0 }}
                    transition={{
                      duration: 0.3,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    layout={false}
                    className={`fixed z-[10001] settings-menu-fixed-bg ${
                      isMobile 
                        ? 'w-full max-w-none left-0 right-0 bottom-0 rounded-t-3xl rounded-b-none p-6 max-h-[90vh] overflow-y-auto' 
                        : 'w-72 rounded-3xl p-6'
                    }`}
                    data-settings-menu="true"
                    style={{ 
                      backgroundColor: 'rgba(10, 10, 12, 1)',
                      background: 'rgba(10, 10, 12, 1)',
                      backgroundClip: 'border-box',
                      opacity: 1,
                      pointerEvents: 'auto',
                      ...(!isMobile ? {
                        top: `${panelPosition.top}px`,
                        right: `${panelPosition.right}px`,
                      } : {}),
                    } as React.CSSProperties}
                    onClick={(e) => {
                      // Stop propagation to prevent click from reaching overlay
                      e.stopPropagation()
                      
                      // Clear errors when clicking anywhere in the panel, except interactive elements
                      const target = e.target as HTMLElement
                      if (
                        target.tagName !== 'INPUT' &&
                        target.tagName !== 'BUTTON' &&
                        target.tagName !== 'LABEL' &&
                        !target.closest('input') &&
                        !target.closest('button') &&
                        !target.closest('label')
                      ) {
                        setErrors({})
                      }
                    }}
            >
            {mode === 'intent' && (
              <>
                {/* Deadline */}
                <SettingsRow label="Deadline" className="mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 rounded-lg bg-gradient-to-br from-white/[0.04] to-white/[0.02] backdrop-blur-sm shadow-md shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-br before:from-pink-500/5 before:via-transparent before:to-purple-500/5 before:rounded-lg before:-z-10">
                        <input
                          type="number"
                          value={localDeadline}
                          onChange={(e) => {
                            const value = e.target.value
                            // Only allow whole numbers
                            if (value === '' || /^\d+$/.test(value)) {
                              setLocalDeadline(value)
                              // Clear error on input
                              if (errors.deadline) {
                                const error = validateDeadline(value)
                                setErrors(prev => ({ ...prev, deadline: error }))
                              }
                            }
                          }}
                          placeholder="5"
                          className={`w-full bg-transparent border rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none transition-colors ${
                            errors.deadline 
                              ? 'border-red-500/50 focus:border-red-500' 
                              : 'border-white/10 focus:border-white/20'
                          }`}
                        />
                      </div>
                      <span className="text-xs text-gray-500 font-light">minutes</span>
                    </div>
                    {errors.deadline && (
                      <p className="text-xs text-red-400 font-light">{errors.deadline}</p>
                    )}
                  </div>
                </SettingsRow>

                {/* Enable Partial Fills Toggle */}
                <SettingsRow 
                  label="Enable partial fills"
                  className="mb-4"
                  control={
                    <ToggleRow
                      label="Enable partial fills"
                      isEnabled={localEnablePartialFills}
                      onChange={setLocalEnablePartialFills}
                    />
                  }
                >
                  {/* Amount of Parts - only visible if partial fills enabled */}
                  {localEnablePartialFills && (
                    <div className="mt-3 space-y-2">
                      <label className="text-xs text-gray-400 font-light">Amount of parts</label>
                      <div className="relative w-full rounded-lg bg-gradient-to-br from-white/[0.04] to-white/[0.02] backdrop-blur-sm shadow-md shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-br before:from-pink-500/5 before:via-transparent before:to-purple-500/5 before:rounded-lg before:-z-10">
                        <input
                          type="number"
                          value={localAmountOfParts}
                          onChange={(e) => {
                            const value = e.target.value
                            // Only allow whole numbers (positive integers) - block decimals, negative signs, etc.
                            if (value === '' || /^\d+$/.test(value)) {
                              setLocalAmountOfParts(value)
                              // Validate on input to show errors immediately
                              const error = validateAmountOfParts(value)
                              setErrors(prev => ({ ...prev, amountOfParts: error }))
                            }
                          }}
                          placeholder="2"
                          className={`w-full bg-transparent border rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none transition-colors ${
                            errors.amountOfParts 
                              ? 'border-red-500/50 focus:border-red-500' 
                              : 'border-white/10 focus:border-white/20'
                          }`}
                        />
                      </div>
                      {errors.amountOfParts && (
                        <p className="text-xs text-red-400 font-light">{errors.amountOfParts}</p>
                      )}
                    </div>
                  )}
                </SettingsRow>

                {/* Custom Recipient Toggle */}
                <SettingsRow 
                  label="Custom recipient"
                  className="mb-4"
                  control={
                    <ToggleRow
                      label="Custom recipient"
                      isEnabled={localCustomRecipient}
                      onChange={(enabled) => {
                        setLocalCustomRecipient(enabled)
                        // Validate when toggle is enabled and field is empty
                        if (enabled) {
                          const error = validateRecipientAddress(localRecipientAddress)
                          setErrors(prev => ({ ...prev, recipientAddress: error }))
                        } else {
                          // Clear error when toggle is disabled
                          setErrors(prev => ({ ...prev, recipientAddress: undefined }))
                        }
                      }}
                    />
                  }
                >
                  {/* Recipient Address - only visible if custom recipient enabled */}
                  {localCustomRecipient && (
                    <div className="mt-3 space-y-2">
                      <div className="relative w-full rounded-lg bg-gradient-to-br from-white/[0.04] to-white/[0.02] backdrop-blur-sm shadow-md shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-br before:from-pink-500/5 before:via-transparent before:to-purple-500/5 before:rounded-lg before:-z-10">
                        <input
                          type="text"
                          value={localRecipientAddress}
                          onChange={(e) => {
                            const value = e.target.value
                            setLocalRecipientAddress(value)
                            // Validate on input to show errors immediately
                            const error = validateRecipientAddress(value)
                            setErrors(prev => ({ ...prev, recipientAddress: error }))
                          }}
                          placeholder="Wallet address"
                          className={`w-full bg-transparent border rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none transition-colors ${
                            errors.recipientAddress
                              ? 'border-red-500/50 focus:border-red-500'
                              : 'border-white/10 focus:border-white/20'
                          }`}
                        />
                      </div>
                      {errors.recipientAddress && (
                        <p className="text-xs text-red-400 font-light">{errors.recipientAddress}</p>
                      )}
                    </div>
                  )}
                </SettingsRow>
              </>
            )}

            {mode === 'instant' && (
              <>
                {/* Slippage */}
                <SettingsRow label="Slippage" className="mb-4">
                  <div className="flex gap-2 flex-wrap">
                    {['0.1', '0.3', '0.5', '1', '2'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setLocalSlippage(preset)
                          setLocalUseCustomSlippage(false)
                          // Clear slippage error when selecting preset
                          if (errors.slippage) {
                            setErrors(prev => ({ ...prev, slippage: undefined }))
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-light transition-colors ${
                          !localUseCustomSlippage && localSlippage === preset
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/5'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                  <div className="mt-2">
                    <div className="relative w-full rounded-lg bg-gradient-to-br from-white/[0.04] to-white/[0.02] backdrop-blur-sm shadow-md shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-br before:from-pink-500/5 before:via-transparent before:to-purple-500/5 before:rounded-lg before:-z-10">
                      <input
                        type="text"
                        value={localUseCustomSlippage ? localCustomSlippage : ''}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            setLocalCustomSlippage(value)
                            setLocalUseCustomSlippage(true)
                            if (value) setLocalSlippage(value)
                            // Clear error on input if value is entered
                            if (errors.slippage && value.trim() !== '') {
                              setErrors(prev => ({ ...prev, slippage: undefined }))
                            }
                          }
                        }}
                        placeholder="Custom, %"
                        className={`w-full bg-transparent border rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none transition-colors ${
                          errors.slippage
                            ? 'border-red-500/50 focus:border-red-500'
                            : 'border-white/10 focus:border-white/20'
                        }`}
                      />
                    </div>
                    {errors.slippage && (
                      <p className="text-xs text-red-400 font-light mt-1">{errors.slippage}</p>
                    )}
                  </div>
                </SettingsRow>

                {/* Custom Recipient Toggle */}
                <SettingsRow 
                  label="Custom recipient"
                  className="mb-4"
                  control={
                    <ToggleRow
                      label="Custom recipient"
                      isEnabled={localCustomRecipient}
                      onChange={(enabled) => {
                        setLocalCustomRecipient(enabled)
                        // Validate when toggle is enabled and field is empty
                        if (enabled) {
                          const error = validateRecipientAddress(localRecipientAddress)
                          setErrors(prev => ({ ...prev, recipientAddress: error }))
                        } else {
                          // Clear error when toggle is disabled
                          setErrors(prev => ({ ...prev, recipientAddress: undefined }))
                        }
                      }}
                    />
                  }
                >
                  {/* Recipient Address - only visible if custom recipient enabled */}
                  {localCustomRecipient && (
                    <div className="mt-3 space-y-2">
                      <div className="relative w-full rounded-lg bg-gradient-to-br from-white/[0.04] to-white/[0.02] backdrop-blur-sm shadow-md shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-br before:from-pink-500/5 before:via-transparent before:to-purple-500/5 before:rounded-lg before:-z-10">
                        <input
                          type="text"
                          value={localRecipientAddress}
                          onChange={(e) => {
                            const value = e.target.value
                            setLocalRecipientAddress(value)
                            // Validate on input to show errors immediately
                            const error = validateRecipientAddress(value)
                            setErrors(prev => ({ ...prev, recipientAddress: error }))
                          }}
                          placeholder="Wallet address"
                          className={`w-full bg-transparent border rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none transition-colors ${
                            errors.recipientAddress 
                              ? 'border-red-500/50 focus:border-red-500' 
                              : 'border-white/10 focus:border-white/20'
                          }`}
                        />
                      </div>
                      {errors.recipientAddress && (
                        <p className="text-xs text-red-400 font-light">{errors.recipientAddress}</p>
                      )}
                    </div>
                  )}
                </SettingsRow>
              </>
            )}

            {mode === 'limit' && (
              <>
                {/* Expiration */}
                <SettingsRow label="Expiration" className="mb-4">
                  <div className="flex gap-2 flex-wrap">
                    {['1h', '3h', '6h', '12h', '1d'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setLocalExpiration(preset)
                          setLocalUseCustomExpiration(false)
                          // Clear expiration error when selecting preset
                          if (errors.expiration) {
                            setErrors(prev => ({ ...prev, expiration: undefined }))
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-light transition-colors ${
                          !localUseCustomExpiration && localExpiration === preset
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/5'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2">
                    <div className="relative w-full rounded-lg bg-gradient-to-br from-white/[0.04] to-white/[0.02] backdrop-blur-sm shadow-md shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-br before:from-pink-500/5 before:via-transparent before:to-purple-500/5 before:rounded-lg before:-z-10">
                      <input
                        type="number"
                        value={localUseCustomExpiration ? localCustomExpiration : ''}
                        onFocus={() => {
                          // Clear preset selection when focusing on custom input
                          setLocalUseCustomExpiration(true)
                          if (errors.expiration) {
                            setErrors(prev => ({ ...prev, expiration: undefined }))
                          }
                        }}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || /^\d*$/.test(value)) {
                            setLocalCustomExpiration(value)
                            setLocalUseCustomExpiration(true)
                            if (value) setLocalExpiration(value + 'h')
                            // Clear error on input if value is entered
                            if (errors.expiration && value.trim() !== '') {
                              setErrors(prev => ({ ...prev, expiration: undefined }))
                            }
                          }
                        }}
                        placeholder="Custom (hours)"
                        className={`w-full bg-transparent border rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none transition-colors ${
                          errors.expiration
                            ? 'border-red-500/50 focus:border-red-500'
                            : 'border-white/10 focus:border-white/20'
                        }`}
                      />
                    </div>
                    {errors.expiration && (
                      <p className="text-xs text-red-400 font-light mt-1">{errors.expiration}</p>
                    )}
                  </div>
                </SettingsRow>

                {/* Partial Fills Toggle */}
                <SettingsRow 
                  label="Partial fills"
                  className="mb-4"
                  control={
                    <ToggleRow
                      label="Partial fills"
                      isEnabled={localLimitPartialFills}
                      onChange={setLocalLimitPartialFills}
                    />
                  }
                >
                  {/* Number of Parts - only visible if partial fills enabled */}
                  {localLimitPartialFills && (
                    <div className="mt-3 space-y-2">
                      <label className="text-xs text-gray-400 font-light">Number of parts</label>
                      <div className="relative w-full rounded-lg bg-gradient-to-br from-white/[0.04] to-white/[0.02] backdrop-blur-sm shadow-md shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-br before:from-pink-500/5 before:via-transparent before:to-purple-500/5 before:rounded-lg before:-z-10">
                        <input
                          type="number"
                          value={localLimitAmountOfParts}
                          onChange={(e) => {
                            const value = e.target.value
                            // Only allow whole numbers (positive integers) - block decimals, negative signs, etc.
                            if (value === '' || /^\d+$/.test(value)) {
                              setLocalLimitAmountOfParts(value)
                              // Validate on input to show errors immediately
                              const error = validateAmountOfParts(value)
                              setErrors(prev => ({ ...prev, limitAmountOfParts: error }))
                            }
                          }}
                          placeholder="2"
                          className={`w-full bg-transparent border rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none transition-colors ${
                            errors.limitAmountOfParts 
                              ? 'border-red-500/50 focus:border-red-500' 
                              : 'border-white/10 focus:border-white/20'
                          }`}
                        />
                      </div>
                      {errors.limitAmountOfParts && (
                        <p className="text-xs text-red-400 font-light">{errors.limitAmountOfParts}</p>
                      )}
                    </div>
                  )}
                </SettingsRow>

                {/* Custom Recipient Toggle */}
                <SettingsRow 
                  label="Custom recipient"
                  className="mb-4"
                  control={
                    <ToggleRow
                      label="Custom recipient"
                      isEnabled={localCustomRecipient}
                      onChange={(enabled) => {
                        setLocalCustomRecipient(enabled)
                        // Validate when toggle is enabled and field is empty
                        if (enabled) {
                          const error = validateRecipientAddress(localRecipientAddress)
                          setErrors(prev => ({ ...prev, recipientAddress: error }))
                        } else {
                          // Clear error when toggle is disabled
                          setErrors(prev => ({ ...prev, recipientAddress: undefined }))
                        }
                      }}
                    />
                  }
                >
                  {/* Recipient Address - only visible if custom recipient enabled */}
                  {localCustomRecipient && (
                    <div className="mt-3 space-y-2">
                      <div className="relative w-full rounded-lg bg-gradient-to-br from-white/[0.04] to-white/[0.02] backdrop-blur-sm shadow-md shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-br before:from-pink-500/5 before:via-transparent before:to-purple-500/5 before:rounded-lg before:-z-10">
                        <input
                          type="text"
                          value={localRecipientAddress}
                          onChange={(e) => {
                            const value = e.target.value
                            setLocalRecipientAddress(value)
                            // Validate on input to show errors immediately
                            const error = validateRecipientAddress(value)
                            setErrors(prev => ({ ...prev, recipientAddress: error }))
                          }}
                          placeholder="Wallet address"
                          className={`w-full bg-transparent border rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none transition-colors ${
                            errors.recipientAddress
                              ? 'border-red-500/50 focus:border-red-500'
                              : 'border-white/10 focus:border-white/20'
                          }`}
                        />
                      </div>
                      {errors.recipientAddress && (
                        <p className="text-xs text-red-400 font-light">{errors.recipientAddress}</p>
                      )}
                    </div>
                  )}
                </SettingsRow>
              </>
            )}

            {/* Apply Button */}
            <button
              type="button"
              onClick={handleApply}
              className="relative z-10 w-full mt-4 h-8 bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 hover:border-pink-400/50 text-white rounded-xl font-light transition-all duration-300 shadow-lg shadow-accent/20 hover:shadow-accent/30 text-sm"
            >
              Apply changes
            </button>
            
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>,
          document.body
        )
      )}
    </div>
  )
}

interface SettingsRowProps {
  label: string
  children?: React.ReactNode
  control?: React.ReactNode
  className?: string
}

function SettingsRow({ label, children, control, className = '' }: SettingsRowProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {control ? (
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-400 font-light">{label}</label>
          {control}
        </div>
      ) : (
        <label className="text-xs text-gray-400 font-light">{label}</label>
      )}
      {children}
    </div>
  )
}

interface ToggleRowProps {
  label: string
  isEnabled: boolean
  onChange: (value: boolean) => void
}

function ToggleRow({ label, isEnabled, onChange }: ToggleRowProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!isEnabled)}
      className={`relative w-10 h-6 rounded-full transition-all duration-200 ${
        isEnabled
          ? 'bg-gradient-to-r from-pink-500/30 via-accent/30 to-purple-500/30'
          : 'bg-white/5 border border-white/10'
      }`}
    >
      {/* Slider */}
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${
          isEnabled ? 'right-1' : 'left-1'
        }`}
      />
    </button>
  )
}
