'use client'

import { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Token {
  symbol: string
  chainId: number
  chainName: string
}

interface InstantModeProps {
  fromToken: Token
  toToken: Token
  fromAmount: string
  toAmount: string
  onQuoteUpdate?: (toAmount: string) => void
}

export function InstantMode({ fromToken, toToken, fromAmount, toAmount, onQuoteUpdate }: InstantModeProps) {
  const [estimatedReceive, setEstimatedReceive] = useState<string>('0')
  const [slippage, setSlippage] = useState('0.5')
  const [fees, setFees] = useState<{ amount: string; covered: boolean }>({
    amount: '0.00',
    covered: true,
  })

  // Fetch quote from API
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      fetchQuote()
    } else {
      setEstimatedReceive('0')
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
        setEstimatedReceive(data.toAmount)
        onQuoteUpdate?.(data.toAmount)
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error)
    }
  }

  return (
    <div className="space-y-4 mt-6">
      {/* Estimated Receive */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400 font-light">Estimated receive</span>
          <span className="text-lg text-white font-light">{estimatedReceive} {toToken.symbol}</span>
        </div>
      </div>

      {/* Slippage Tolerance */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 font-light">Slippage tolerance</span>
            <Settings className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-300 transition-colors" />
          </div>
          <span className="text-sm text-white">{slippage}%</span>
        </div>
      </div>

      {/* Fees */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-400 font-light">Fees</span>
          <span className={`text-sm ${fees.covered ? 'line-through text-gray-500' : 'text-white'}`}>
            ~${fees.amount}
          </span>
        </div>
        {fees.covered && (
          <p className="text-xs text-gray-500 mt-1">
            Fee-free execution tokens covers this amount
          </p>
        )}
      </div>

      {/* Swap Button */}
      <Button
        className="w-full h-12 bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 hover:border-pink-400/50 text-white rounded-xl font-light transition-all duration-300 shadow-lg shadow-accent/20 hover:shadow-accent/30"
      >
        Swap
      </Button>
    </div>
  )
}
