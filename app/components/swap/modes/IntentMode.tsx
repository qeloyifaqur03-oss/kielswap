'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface Token {
  symbol: string
  chainId: number
  chainName: string
}

interface IntentModeProps {
  fromToken: Token
  toToken: Token
  fromAmount: string
  toAmount: string
}

export function IntentMode({ fromToken, toToken, fromAmount, toAmount }: IntentModeProps) {
  const [guaranteedMin, setGuaranteedMin] = useState('0')
  const [deadline, setDeadline] = useState('5m')
  const [priority, setPriority] = useState<'Fast' | 'Balanced' | 'Best price'>('Balanced')
  const [executionTime, setExecutionTime] = useState('5m')
  const [fillType, setFillType] = useState<'partial' | 'full'>('full')

  // Calculate guaranteed minimum (max 0.5% difference)
  useEffect(() => {
    if (toAmount && parseFloat(toAmount) > 0) {
      const minAmount = (parseFloat(toAmount) * 0.995).toFixed(6)
      setGuaranteedMin(minAmount)
    } else {
      setGuaranteedMin('0')
    }
  }, [toAmount])

  // Fetch quote
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      fetchQuote()
    }
  }, [fromToken, toToken, fromAmount])

  const fetchQuote = async () => {
    try {
      // Map chainId to networkId (simplified - adjust based on your chain registry)
      const getNetworkId = (chainId: number) => {
        const map: Record<number, string> = {
          1: 'ethereum',
          137: 'polygon',
          56: 'bsc',
        }
        return map[chainId] || 'ethereum'
      }

      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromTokenId: fromToken.symbol.toLowerCase(),
          toTokenId: toToken.symbol.toLowerCase(),
          fromNetworkId: getNetworkId(fromToken.chainId),
          toNetworkId: getNetworkId(toToken.chainId),
          amount: fromAmount,
        }),
      })

      const data = await response.json()
      if (data.ok && data.toAmount) {
        // Update guaranteed minimum will be handled by useEffect
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error)
    }
  }

  return (
    <div className="space-y-3 mt-4">
      {/* Execution Settings */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4">
        <h3 className="text-sm font-light text-gray-300">Execution settings</h3>

        {/* Minimum you receive */}
        <div>
          <label className="text-xs text-gray-400 font-light mb-2 block">
            Minimum you receive
          </label>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <span className="text-white">{guaranteedMin} {toToken.symbol}</span>
          </div>
        </div>

        {/* Max execution time */}
        <div>
          <label className="text-xs text-gray-400 font-light mb-2 block">Max execution time</label>
          <div className="flex gap-2">
            {['5m', '15m', '30m', 'custom'].map((time) => (
              <button
                key={time}
                onClick={() => {
                  if (time !== 'custom') {
                    setDeadline(time)
                    setExecutionTime(time)
                  }
                }}
                className={`px-3 py-2 rounded-lg text-xs font-light transition-colors ${
                  deadline === time
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/5'
                }`}
              >
                {time === 'custom' ? 'Custom' : time}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="text-xs text-gray-400 font-light mb-2 block">Priority</label>
          <div className="flex gap-2">
            {(['Fast', 'Balanced', 'Best price'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`px-3 py-2 rounded-lg text-xs font-light transition-colors ${
                  priority === p
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/5'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Fill Type */}
        <div>
          <label className="text-xs text-gray-400 font-light mb-2 block">Fill type</label>
          <div className="flex gap-2">
            {(['partial', 'full'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFillType(type)}
                className={`px-3 py-2 rounded-lg text-xs font-light transition-colors capitalize ${
                  fillType === type
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/5'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sign Button */}
      <Button
        className="w-full h-12 bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 hover:border-pink-400/50 text-white rounded-xl font-light transition-all duration-300 shadow-lg shadow-accent/20 hover:shadow-accent/30"
      >
        Sign
      </Button>
    </div>
  )
}
