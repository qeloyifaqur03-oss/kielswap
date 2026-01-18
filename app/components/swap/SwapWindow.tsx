'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { TokenFrame } from './TokenFrame'
import { ModeSelector } from './ModeSelector'
import { InlineSettingsMenu } from '@/components/InlineSettingsMenu'
import { ArrowUpDown, Settings, ChevronUp } from 'lucide-react'
import { useSafeAccount, useSafeConnect } from '@/lib/wagmi/safeHooks'
import { useTokenBalance } from '@/lib/wagmi/useTokenBalance'
import { IntentMode } from './modes/IntentMode'
import { InstantMode } from './modes/InstantMode'
import { LimitMode } from './modes/LimitMode'
import { SUPPORTED_TOKENS, SUPPORTED_NETWORKS } from '@/lib/supportedAssets'

export function SwapWindow() {
  const searchParams = useSearchParams()
  const mode = (searchParams.get('mode') || 'instant') as 'instant' | 'intent' | 'limit'
  const [fromToken, setFromToken] = useState({ symbol: 'ETH', chainId: 1, chainName: 'Ethereum' })
  const [toToken, setToToken] = useState({ symbol: 'USDT', chainId: 1, chainName: 'Ethereum' })
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [quotePhase, setQuotePhase] = useState<'idle' | 'fetching' | 'ready' | 'refreshing' | 'error'>('idle')
  const [remainingTime, setRemainingTime] = useState(0)
  const [hasValidQuote, setHasValidQuote] = useState(false)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [isRotated, setIsRotated] = useState(false)

  // Settings state - изолированные по режимам
  type ModeSettings = {
    enablePartialFills?: boolean
    amountOfParts?: string
    customRecipient?: boolean
    recipientAddress?: string
    deadline?: string
    expiration?: string
    slippage?: string
  }
  
  const [modeSettingsByMode, setModeSettingsByMode] = useState<{
    intent: ModeSettings
    instant: ModeSettings
    limit: ModeSettings
  }>({
    intent: { enablePartialFills: false, amountOfParts: '2', deadline: '5', customRecipient: false, recipientAddress: '' },
    instant: { slippage: '0.3', customRecipient: false, recipientAddress: '' },
    limit: { enablePartialFills: false, amountOfParts: '2', expiration: '1d', customRecipient: false, recipientAddress: '' }
  })
  
  // Текущие settings для активного режима
  const activeSettings = modeSettingsByMode[mode]
  
  const [targetPrice, setTargetPrice] = useState('0') // Limit mode target price (не settings, это UI state)

  // Get wallet connection status
  const { isConnected } = useSafeAccount()
  const { connect, connectors } = useSafeConnect()
  
  // Helper: Get token ID from token state (symbol + chainId)
  const getTokenId = (token: { symbol: string; chainId: number }): string => {
    // Find token in supportedAssets that matches symbol and chainId
    const matchingToken = SUPPORTED_TOKENS.find(t => 
      t.symbol === token.symbol && t.networkIds.includes(token.chainId.toString())
    ) || SUPPORTED_TOKENS.find(t => t.symbol === token.symbol)
    
    return matchingToken?.id || token.symbol.toLowerCase()
  }
  
  // Get balance for fromToken
  const fromTokenId = getTokenId(fromToken)
  const { formatted: fromTokenBalance } = useTokenBalance(fromTokenId, fromToken.chainId)
  
  // Check if user has sufficient balance
  // Returns true if: wallet not connected, no amount entered, or balance is sufficient
  const hasSufficientBalance = !isConnected || !fromAmount || parseFloat(fromAmount) === 0 || 
    (fromTokenBalance !== null && fromTokenBalance !== undefined && parseFloat(fromTokenBalance) >= parseFloat(fromAmount))

  // Load settings from localStorage для всех модов при монтировании
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('swapSettings')
      if (stored) {
        const settings = JSON.parse(stored)
        setModeSettingsByMode(prev => ({
          intent: settings.intent ? {
            enablePartialFills: settings.intent.enablePartialFills ?? false,
            amountOfParts: settings.intent.amountOfParts ?? '2',
            deadline: settings.intent.deadline ?? '5',
            customRecipient: settings.intent.customRecipient ?? false,
            recipientAddress: settings.intent.recipientAddress ?? ''
          } : prev.intent,
          instant: settings.instant ? {
            slippage: settings.instant.slippage ?? '0.3',
            customRecipient: settings.instant.customRecipient ?? false,
            recipientAddress: settings.instant.recipientAddress ?? ''
          } : prev.instant,
          limit: settings.limit ? {
            enablePartialFills: settings.limit.limitPartialFills ?? false,
            amountOfParts: settings.limit.limitAmountOfParts ?? '2',
            expiration: settings.limit.expiration ?? '1d',
            customRecipient: settings.limit.customRecipient ?? false,
            recipientAddress: settings.limit.recipientAddress ?? ''
          } : prev.limit
        }))
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }, [])

  // Очистка state при смене режима (изоляция модов)
  useEffect(() => {
    // Отменяем все активные запросы
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    // Очищаем таймер
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    // Очищаем все состояния
    setFromAmount('')
    setToAmount('')
    setQuotePhase('idle')
    setRemainingTime(0)
    setHasValidQuote(false)
    setIsSummaryOpen(false)
    setTargetPrice('0')
  }, [mode])

  // AbortController для отмены старых запросов
  const abortControllerRef = useRef<AbortController | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Единая функция fetch котировки (CoinGecko only)
  const fetchQuote = async (signal: AbortSignal) => {
    const startTime = Date.now()
    
    // Use proper token IDs from supportedAssets, not just symbol
    const fromTokenId = getTokenId(fromToken)
    const toTokenId = getTokenId(toToken)
    const tokenIds = [fromTokenId, toTokenId]
    const idsParam = tokenIds.join(',')
    
    // Log request
    if (process.env.NODE_ENV === 'development') {
      console.log(`[quote] request from=${fromToken.symbol}@${fromToken.chainId} (id=${fromTokenId}) to=${toToken.symbol}@${toToken.chainId} (id=${toTokenId}) amount=${fromAmount}`)
    }
    
    try {
      const response = await fetch(`/api/token-price?ids=${idsParam}`, { signal })
      
      // Handle HTTP errors (4xx/5xx)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { reason?: string; missing?: Record<string, string> }
        setQuotePhase('error')
        setToAmount('')
        setHasValidQuote(false)
        
        if (process.env.NODE_ENV === 'development') {
          console.error(`[quote] error HTTP ${response.status} reason=${errorData.reason || 'unknown'} missing=${JSON.stringify(errorData.missing || {})}`)
        }
        return
      }
      
      const data = await response.json() as { prices: Record<string, number>; ok: boolean; source?: string; reason?: string }
      
      // If ok: false even with 200, treat as error (shouldn't happen with new API contract)
      if (!data.ok) {
        setQuotePhase('error')
        setToAmount('')
        setHasValidQuote(false)
        
        if (process.env.NODE_ENV === 'development') {
          console.error(`[quote] error ok=false reason=${data.reason || 'unknown'}`)
        }
        return
      }
      
      const prices = data.prices || {}
      const fromPrice = prices[fromTokenId]
      const toPrice = prices[toTokenId]
      
      if (fromPrice && toPrice && fromPrice > 0 && toPrice > 0) {
        const calculatedAmount = (parseFloat(fromAmount) * fromPrice) / toPrice
        const toAmountStr = calculatedAmount.toFixed(6)
        setToAmount(toAmountStr)
        setHasValidQuote(true)
        setQuotePhase('ready')
        setRemainingTime(15)
        
        // Log success
        if (process.env.NODE_ENV === 'development') {
          const latency = Date.now() - startTime
          console.log(`[quote] success toAmount=${toAmountStr} source=${data.source || 'coingecko'} ms=${latency}`)
        }
      } else {
        setQuotePhase('error')
        setToAmount('')
        setHasValidQuote(false)
        
        // Log error - missing price
        if (process.env.NODE_ENV === 'development') {
          console.error(`[quote] error reason=missing price in response fromPrice=${fromPrice} toPrice=${toPrice}`)
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return // Игнорируем отмененные запросы
      }
      setQuotePhase('error')
      setToAmount('')
      setHasValidQuote(false)
      
      // Log error
      if (process.env.NODE_ENV === 'development') {
        console.error(`[quote] error reason=${error.message || 'unknown'}`)
      }
    }
  }

  // TRIGGER 1: fromAmount или токены/чейны меняются → один запрос котировки
  useEffect(() => {
    // Отменяем старый запрос если он ещё идёт
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    // Очищаем таймер при новом запросе
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setQuotePhase('idle')
      setToAmount('')
      setRemainingTime(0)
      setHasValidQuote(false)
      return
    }

    // СРАЗУ: fetching, очищаем toAmount, скрываем ring
    setQuotePhase('fetching')
    setToAmount('')
    setRemainingTime(0)
    setHasValidQuote(false)

    // Выполняем ровно 1 сетевой запрос
    fetchQuote(signal)
  }, [fromAmount, fromToken.symbol, toToken.symbol, fromToken.chainId, toToken.chainId])

  // TRIGGER 2: Timer expires (remainingTime → 0) → refresh quote
  useEffect(() => {
    if (quotePhase !== 'refreshing' || !fromAmount || parseFloat(fromAmount) <= 0) return

    // Отменяем старый запрос
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    setQuotePhase('fetching')
    setToAmount('')
    setRemainingTime(0)

    // Выполняем ровно 1 refresh-запрос
    fetchQuote(signal)
  }, [quotePhase, fromAmount, fromToken.symbol, toToken.symbol, fromToken.chainId, toToken.chainId])

  // 15-second countdown timer - ТОЛЬКО когда quotePhase === 'ready' && remainingTime > 0
  useEffect(() => {
    // Очищаем предыдущий таймер
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (quotePhase !== 'ready' || remainingTime <= 0) {
      return
    }

    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          setQuotePhase('refreshing')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [quotePhase, remainingTime])

  const handleSwapTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    const tempAmount = fromAmount
    setFromAmount(toAmount)
    setToAmount(tempAmount)
    setIsRotated(!isRotated)
  }

  const handleConnectWallet = () => {
    if (connectors && connectors.length > 0) {
      connect({ connector: connectors[0] })
    }
  }

  return (
    <div className="w-full max-w-[538px] mx-auto space-y-4 px-4 sm:px-6 md:px-0">
      <div>
        {/* Main Swap Window */}
        <div className="glass rounded-3xl p-4 sm:p-6 border border-white/10 shadow-2xl backdrop-blur-xl bg-[rgba(255,255,255,0.05)]">
        {/* Mode Selector and Settings */}
        <div className="mb-4 flex items-center justify-between">
          <ModeSelector currentMode={mode} />
          <div className="flex items-center gap-3">
            {/* Progress ring - visible ТОЛЬКО когда: fromAmount > 0 AND quotePhase === 'ready' AND remainingTime > 0 */}
            {fromAmount && parseFloat(fromAmount) > 0 && quotePhase === 'ready' && remainingTime > 0 && (
              <div className="relative w-4 h-4 z-50">
                <svg className="w-4 h-4 absolute inset-0" viewBox="0 0 24 24" style={{ transform: `rotate(-90deg)` }}>
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="url(#ringGrad)"
                    strokeWidth="2"
                    strokeDasharray={`${(remainingTime / 15) * 62.83} 62.83`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1s linear', opacity: 0.9 }}
                  />
                  <defs>
                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity="1" />
                      <stop offset="50%" stopColor="rgb(196, 37, 88)" stopOpacity="1" />
                      <stop offset="100%" stopColor="rgb(236, 72, 153)" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            )}
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        <InlineSettingsMenu 
          open={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          mode={mode}
          onSettingsChange={(settings) => {
            // Apply settings changes immediately только для текущего режима
            setModeSettingsByMode(prev => ({
              ...prev,
              [mode]: {
                ...prev[mode],
                ...(settings.enablePartialFills !== undefined && { enablePartialFills: settings.enablePartialFills }),
                ...(settings.amountOfParts !== undefined && { amountOfParts: settings.amountOfParts }),
                ...(settings.limitPartialFills !== undefined && { enablePartialFills: settings.limitPartialFills }),
                ...(settings.limitAmountOfParts !== undefined && { amountOfParts: settings.limitAmountOfParts }),
                ...(settings.deadline !== undefined && { deadline: settings.deadline }),
                ...(settings.expiration !== undefined && { expiration: settings.expiration }),
                ...(settings.slippage !== undefined && { slippage: settings.slippage }),
                ...(settings.customRecipient !== undefined && { customRecipient: settings.customRecipient }),
                ...(settings.recipientAddress !== undefined && { recipientAddress: settings.recipientAddress })
              }
            }))
          }}
        />

        {/* Token Frames - Vertical Layout */}
        <div className="space-y-3">
          {/* From Token */}
          <TokenFrame
            label="You pay"
            amount={fromAmount}
            onAmountChange={setFromAmount}
            token={fromToken}
            onTokenChange={setFromToken}
          />

          {/* Swap Button */}
          <div className="flex items-center justify-center relative -my-2 z-10">
            <button
              onClick={handleSwapTokens}
              className="w-8 h-8 rounded-full bg-white/10 border border-white/20 hover:bg-white/15 hover:border-pink-400/50 transition-colors flex items-center justify-center shadow-lg"
            >
              <ArrowUpDown className={`w-4 h-4 text-white transition-transform duration-300 ${isRotated ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* To Token */}
          <TokenFrame
            label="You receive"
            amount={toAmount}
            onAmountChange={setToAmount}
            token={toToken}
            onTokenChange={setToToken}
            isBlurred={quotePhase === 'fetching' || quotePhase === 'refreshing'}
          />
        </div>

        {/* Mode-specific content */}
        {mode === 'intent' && (
          <IntentMode
            fromToken={fromToken}
            toToken={toToken}
            fromAmount={fromAmount}
            toAmount={toAmount}
            isRefreshing={quotePhase === 'fetching' || quotePhase === 'refreshing'}
            remainingTime={remainingTime}
            enablePartialFills={activeSettings.enablePartialFills ?? false}
            amountOfParts={activeSettings.amountOfParts ?? '2'}
          />
        )}
        {mode === 'instant' && (
          <InstantMode
            fromToken={fromToken}
            toToken={toToken}
            fromAmount={fromAmount}
            toAmount={toAmount}
          />
        )}
        {mode === 'limit' && (
          <LimitMode
            fromToken={fromToken}
            toToken={toToken}
            fromAmount={fromAmount}
            toAmount={toAmount}
            enablePartialFills={activeSettings.enablePartialFills ?? false}
            amountOfParts={activeSettings.amountOfParts ?? '2'}
            targetPrice={targetPrice}
            onTargetPriceChange={setTargetPrice}
          />
        )}
      </div>
      </div>

      <div className="space-y-4">

      {/* Show Summary button only when: wallet connected, amount entered, and sufficient balance */}
      {isConnected && fromAmount && parseFloat(fromAmount) > 0 && fromTokenBalance !== null && fromTokenBalance !== undefined && parseFloat(fromTokenBalance) >= parseFloat(fromAmount) && (
        <div className="mt-4 relative">
          <button
            onClick={() => setIsSummaryOpen(!isSummaryOpen)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-400 font-light hover:text-gray-300 transition-colors"
          >
            <ChevronUp className={`w-4 h-4 transition-transform duration-300 ${isSummaryOpen ? '' : 'rotate-180'}`} />
            <span>Summary</span>
          </button>
          
          {isSummaryOpen && (
          <div className="mt-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs text-gray-400 font-light">
            <div className="flex justify-between">
              <span>You pay:</span>
              <span className="text-white">{fromAmount} {fromToken.symbol} on {fromToken.chainName}</span>
            </div>
            <div className="flex justify-between">
              <span>You receive:</span>
              <span className="text-white">
                {(() => {
                  if (mode === 'limit' && targetPrice && parseFloat(targetPrice) > 0 && fromAmount && parseFloat(fromAmount) > 0) {
                    return `${(parseFloat(fromAmount) * parseFloat(targetPrice)).toFixed(6)} ${toToken.symbol} on ${toToken.chainName}`
                  }
                  return `${toAmount} ${toToken.symbol} on ${toToken.chainName}`
                })()}
              </span>
            </div>
            
            {/* Intent mode specific */}
            {mode === 'intent' && (
              <>
                {toAmount && parseFloat(toAmount) > 0 && (
                  <div className="flex justify-between">
                    <span>Minimum receive:</span>
                    <span className="text-white">{(parseFloat(toAmount) * 0.995).toFixed(4)} {toToken.symbol}</span>
                  </div>
                )}
                {activeSettings.deadline && (
                  <div className="flex justify-between">
                    <span>Deadline:</span>
                    <span className="text-white">{activeSettings.deadline}m</span>
                  </div>
                )}
              </>
            )}
            
            {/* Instant mode specific */}
            {mode === 'instant' && activeSettings.slippage && (
              <div className="flex justify-between">
                <span>Slippage:</span>
                <span className="text-white">{activeSettings.slippage}%</span>
              </div>
            )}
            
            {/* Limit mode specific */}
            {mode === 'limit' && (
              <>
                {activeSettings.expiration && (
                  <div className="flex justify-between">
                    <span>Expiration:</span>
                    <span className="text-white">{activeSettings.expiration}</span>
                  </div>
                )}
              </>
            )}
            
            {/* Recipient - показываем для всех модов */}
            <div className="flex justify-between">
              <span>Recipient:</span>
              <span className="text-white">
                {activeSettings.customRecipient && activeSettings.recipientAddress 
                  ? `${activeSettings.recipientAddress.slice(0, 6)}…${activeSettings.recipientAddress.slice(-4)}`
                  : 'Default'}
              </span>
            </div>
            
            {/* Partial fills - показываем только для Intent и Limit, НЕ для Instant */}
            {activeSettings.enablePartialFills && mode !== 'instant' && (
              <>
                <div className="flex justify-between">
                  <span>Partial fills:</span>
                  <span className="text-white">Enabled ({activeSettings.amountOfParts || '2'} parts)</span>
                </div>
                {fromAmount && parseFloat(fromAmount) > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span>Sell per part (1/{activeSettings.amountOfParts || '2'}):</span>
                      <span className="text-white">{(parseFloat(fromAmount) / parseInt(activeSettings.amountOfParts || '2')).toFixed(4)} {fromToken.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Buy per part (1/{activeSettings.amountOfParts || '2'}):</span>
                      <span className="text-white">
                        {(() => {
                          const parts = parseInt(activeSettings.amountOfParts || '2')
                          if (mode === 'limit' && targetPrice && parseFloat(targetPrice) > 0 && fromAmount && parseFloat(fromAmount) > 0) {
                            return `${((parseFloat(fromAmount) * parseFloat(targetPrice)) / parts).toFixed(4)} ${toToken.symbol}`
                          }
                          if (toAmount && parseFloat(toAmount) > 0) {
                            return `${(parseFloat(toAmount) / parts).toFixed(4)} ${toToken.symbol}`
                          }
                          return `0 ${toToken.symbol}`
                        })()}
                      </span>
                    </div>
                  </>
                )}
              </>
            )}
            
            <div className="flex justify-between">
              <span>Fees:</span>
              <span className="text-white">Zero fees as beta tester</span>
            </div>
          </div>
          )}
        </div>
      )}

      <button
        onClick={isConnected ? () => {
          console.log('Swap clicked')
        } : handleConnectWallet}
        disabled={isConnected && (!fromAmount || parseFloat(fromAmount) === 0 || !hasSufficientBalance)}
        className="mt-4 w-full h-12 bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 hover:border-pink-400/50 text-white rounded-xl font-light transition-all duration-300 shadow-lg shadow-accent/20 hover:shadow-accent/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnected ? 'Swap' : 'Connect wallet'}
      </button>
      </div>
    </div>
  )
}
