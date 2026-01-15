'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { TokenFrame } from './TokenFrame'
import { ModeSelector } from './ModeSelector'
import { ArrowUpDown, Settings } from 'lucide-react'

export function SwapWindow() {
  const searchParams = useSearchParams()
  const mode = (searchParams.get('mode') || 'instant') as 'instant' | 'intent' | 'limit'
  const [fromToken, setFromToken] = useState({ symbol: 'ETH', chainId: 1, chainName: 'Ethereum' })
  const [toToken, setToToken] = useState({ symbol: 'USDT', chainId: 1, chainName: 'Ethereum' })
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleSwapTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    const tempAmount = fromAmount
    setFromAmount(toAmount)
    setToAmount(tempAmount)
  }

  return (
    <div className="w-full max-w-[538px] mx-auto">
      {/* Main Swap Window */}
      <div className="glass rounded-3xl p-6 border border-white/10 shadow-2xl backdrop-blur-xl bg-[rgba(255,255,255,0.05)]">
        {/* Mode Selector and Settings */}
        <div className="mb-4 flex items-center justify-between">
          <ModeSelector currentMode={mode} />
          {mode === 'intent' && (
            <div className="relative">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-400" />
              </button>
              {isSettingsOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsSettingsOpen(false)}
                  />
                  {/* Settings Panel */}
                  <div className="absolute right-0 top-full mt-2 w-40 backdrop-blur-xl bg-[rgba(255,255,255,0.05)] rounded-2xl p-4 border border-white/10 z-50">
                    {/* Empty for now */}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

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
              <ArrowUpDown className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* To Token */}
          <TokenFrame
            label="You receive"
            amount={toAmount}
            onAmountChange={setToAmount}
            token={toToken}
            onTokenChange={setToToken}
          />
        </div>
      </div>
    </div>
  )
}
