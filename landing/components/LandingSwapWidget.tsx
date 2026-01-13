'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpDown, ArrowDownUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getTokenInfo } from '@/lib/tokens'
import { useTokenPrices } from '@/hooks/useTokenPrices'

interface SwapWidgetProps {
  className?: string
  // Controlled mode props
  controlled?: boolean
  fromToken?: 'ETH' | 'USDT'
  toToken?: 'ETH' | 'USDT'
  fromAmount?: string
  onFromTokenChange?: (token: 'ETH' | 'USDT') => void
  onToTokenChange?: (token: 'ETH' | 'USDT') => void
  onFromAmountChange?: (amount: string) => void
  onToAmountChange?: (amount: string | null) => void
}

export function LandingSwapWidget({ 
  className,
  controlled = false,
  fromToken: controlledFromToken,
  toToken: controlledToToken,
  fromAmount: controlledFromAmount,
  onFromTokenChange,
  onToTokenChange,
  onFromAmountChange,
  onToAmountChange,
}: SwapWidgetProps) {
  const [internalFromToken, setInternalFromToken] = useState<'ETH' | 'USDT'>('ETH')
  const [internalToToken, setInternalToToken] = useState<'ETH' | 'USDT'>('USDT')
  const [internalFromAmount, setInternalFromAmount] = useState<string>('1')
  
  const fromToken = controlled ? (controlledFromToken ?? 'ETH') : internalFromToken
  const toToken = controlled ? (controlledToToken ?? 'USDT') : internalToToken
  const fromAmount = controlled ? (controlledFromAmount ?? '1') : internalFromAmount
  
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Use React Query for optimized caching
  const { data: priceData, isLoading: isLoadingPrices } = useTokenPrices(['eth', 'usdt'])
  const ethPrice = priceData?.prices?.eth ?? null
  const usdtPrice = priceData?.prices?.usdt ?? null

  // Calculate exchange rate - return null if prices not loaded yet
  const exchangeRate = useMemo(() => {
    // Guard against missing or zero prices to prevent division by zero
    if (!ethPrice || !usdtPrice || ethPrice <= 0 || usdtPrice <= 0) return null
    return ethPrice / usdtPrice
  }, [ethPrice, usdtPrice])

  // Calculate output amount
  const toAmount = useMemo(() => {
    // Don't show "..." placeholder - calculate based on current state
    // If prices are loading, show 0.00 (will update automatically when prices load)
    if (!exchangeRate || isLoadingPrices) {
      const amount = parseFloat(fromAmount)
      if (isNaN(amount) || amount <= 0) return '0.00'
      // Return placeholder calculation that will be replaced when prices load
      return '0.00'
    }
    const amount = parseFloat(fromAmount)
    if (isNaN(amount) || amount <= 0) return '0.00'
    
    if (fromToken === 'ETH' && toToken === 'USDT') {
      return (amount * exchangeRate).toFixed(2)
    } else if (fromToken === 'USDT' && toToken === 'ETH') {
      return (amount / exchangeRate).toFixed(6)
    }
    return '0.00'
  }, [fromAmount, fromToken, toToken, exchangeRate, isLoadingPrices])

  // Swap tokens
  const handleSwap = useCallback(() => {
    setIsAnimating(true)
    const temp = fromToken
    if (controlled) {
      onFromTokenChange?.(toToken)
      onToTokenChange?.(temp)
      onFromAmountChange?.(toAmount)
    } else {
      setInternalFromToken(toToken)
      setInternalToToken(temp)
      setInternalFromAmount(toAmount)
    }
    
    setTimeout(() => {
      setIsAnimating(false)
    }, 300)
  }, [fromToken, toToken, fromAmount, toAmount, controlled, onFromTokenChange, onToTokenChange, onFromAmountChange])

  // Handle amount input
  const handleAmountChange = useCallback((value: string) => {
    // Only allow numbers and decimal point
    const sanitized = value.replace(/[^\d.]/g, '')
    const parts = sanitized.split('.')
    if (parts.length > 2) {
      return
    }
    if (controlled) {
      onFromAmountChange?.(sanitized)
    } else {
      setInternalFromAmount(sanitized)
    }
  }, [controlled, onFromAmountChange])
  
  // Notify parent of toAmount changes
  useEffect(() => {
    if (controlled && onToAmountChange) {
      // Only notify when prices are loaded and amount is valid
      if (isLoadingPrices || !exchangeRate || parseFloat(toAmount) === 0) {
        onToAmountChange(null)
      } else {
        onToAmountChange(toAmount)
      }
    }
  }, [toAmount, controlled, onToAmountChange, isLoadingPrices, exchangeRate])

  const content = (
    <motion.div
      whileHover={{ scale: controlled ? 1 : 1.01 }}
      transition={{ duration: 0.2 }}
      className={`${controlled ? '' : 'glass-strong rounded-3xl border border-white/10'} ${controlled ? 'p-4' : 'p-6'} ${controlled ? 'space-y-2' : 'space-y-4'}`}
    >
        {/* Header */}
        {!controlled && (
          <div className="text-center mb-6">
            <h3 className="text-2xl font-light">Swap tokens</h3>
          </div>
        )}

        {/* Swap Container - horizontal for controlled mode */}
        <div className={controlled ? "flex flex-row items-center gap-3" : "flex flex-col gap-4"}>
          {/* From Token */}
          <div className={controlled ? "flex-1" : "space-y-2"}>
            {!controlled && <label className="text-xs text-gray-500 font-light">You pay</label>}
            <div className={`rounded-2xl ${controlled ? 'p-3' : 'p-4'}`} style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
              {controlled ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {(() => {
                      const tokenInfo = getTokenInfo(fromToken.toLowerCase())
                      return tokenInfo?.icon ? (
                        <img
                          src={tokenInfo.icon}
                          alt={fromToken}
                          className="w-5 h-5"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-500/20 via-accent/20 to-purple-500/20"></div>
                      )
                    })()}
                  </div>
                  <input
                    type="text"
                    value={fromAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.0"
                    className="bg-transparent border-0 text-lg font-light text-gray-300 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none flex-1 min-w-0 w-full appearance-none"
                    style={{ backgroundColor: 'transparent', outline: 'none' }}
                  />
                  <span className="text-sm font-light text-gray-400">{fromToken}</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
                        {(() => {
                          const tokenInfo = getTokenInfo(fromToken.toLowerCase())
                          return tokenInfo?.icon ? (
                            <img
                              src={tokenInfo.icon}
                              alt={fromToken}
                              className="w-6 h-6"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500/20 via-accent/20 to-purple-500/20"></div>
                          )
                        })()}
                      </div>
                      <span className="text-lg font-light">{fromToken}</span>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={fromAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.0"
                    className="bg-transparent border-0 text-2xl font-light p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none w-full appearance-none"
                    style={{ backgroundColor: 'transparent', outline: 'none' }}
                  />
                </>
              )}
            </div>
          </div>

          {/* Swap Button */}
          <div className={controlled ? "flex items-center justify-center" : "flex justify-center relative z-10 -my-2 mt-4"}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSwap}
              className={`${controlled ? 'w-7 h-7' : 'w-9 h-9'} rounded-full glass-strong border border-white/20 flex items-center justify-center hover:border-pink-400/50 transition-colors flex-shrink-0`}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={fromToken}
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 180, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ArrowUpDown className={`${controlled ? 'w-3 h-3' : 'w-4 h-4'} text-gray-300`} />
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>

          {/* To Token */}
          <div className={controlled ? "flex-1" : "space-y-2"}>
            {!controlled && <label className="text-xs text-gray-500 font-light">You receive</label>}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${fromToken}-${toToken}-${toAmount}`}
                initial={{ opacity: 0, y: controlled ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: controlled ? 0 : -10 }}
                transition={{ duration: 0.2 }}
                className={`rounded-2xl ${controlled ? 'p-3' : 'p-4'}`}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
              >
                {controlled ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {(() => {
                        const tokenInfo = getTokenInfo(toToken.toLowerCase())
                        return tokenInfo?.icon ? (
                          <img
                            src={tokenInfo.icon}
                            alt={toToken}
                            className="w-5 h-5"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-500/20 via-accent/20 to-purple-500/20"></div>
                        )
                      })()}
                    </div>
                    <div className={`text-lg font-light text-gray-300 flex-1 min-w-0 text-left ${isLoadingPrices || !exchangeRate ? 'blur-lg opacity-50' : ''}`}>
                      {toAmount}
                    </div>
                    <span className="text-sm font-light text-gray-400 flex-shrink-0">{toToken}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
                          {(() => {
                            const tokenInfo = getTokenInfo(toToken.toLowerCase())
                            return tokenInfo?.icon ? (
                              <img
                                src={tokenInfo.icon}
                                alt={toToken}
                                className="w-6 h-6"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500/20 via-accent/20 to-purple-500/20"></div>
                            )
                          })()}
                        </div>
                        <span className="text-lg font-light">{toToken}</span>
                      </div>
                    </div>
                    <div className={`text-2xl font-light text-gray-300 ${isLoadingPrices || !exchangeRate ? 'blur-lg opacity-50' : ''}`}>
                      {toAmount}
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Guaranteed minimum and estimated time - only for non-controlled mode */}
          {!controlled && !isLoadingPrices && exchangeRate && parseFloat(toAmount) > 0 && (
            <div className="space-y-1 pt-2">
              <div className="text-xs text-gray-500 font-light">
                Guaranteed minimum: <span className="text-gray-400">{(parseFloat(toAmount) * 0.99).toFixed(2)} {toToken}</span>
              </div>
              <div className="text-xs text-gray-500 font-light">
                Estimated time: <span className="text-gray-400">~10s</span>
              </div>
            </div>
          )}
        </div>
    </motion.div>
  )

  if (controlled) {
    return content
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={`w-full max-w-md mx-auto ${className || ''}`}
    >
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className="glass-strong rounded-3xl border border-white/10"
      >
        {content}
      </motion.div>
    </motion.div>
  )
}

