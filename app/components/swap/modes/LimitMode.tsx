'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSafeAccount } from '@/lib/wagmi/safeHooks'

interface Token {
  symbol: string
  chainId: number
  chainName: string
}

interface LimitModeProps {
  fromToken: Token
  toToken: Token
  fromAmount: string
  toAmount: string
  enablePartialFills?: boolean
  amountOfParts?: string
  targetPrice?: string
  onTargetPriceChange?: (price: string) => void
}

export function LimitMode({ fromToken, toToken, fromAmount, toAmount, enablePartialFills = false, amountOfParts = '2', targetPrice: externalTargetPrice, onTargetPriceChange }: LimitModeProps) {
  const router = useRouter()
  const { isConnected } = useSafeAccount()
  const [targetPrice, setTargetPrice] = useState(externalTargetPrice || '0')
  const [expiry, setExpiry] = useState('1d')
  const [youReceive, setYouReceive] = useState('0')
  
  // Sync external targetPrice if provided
  useEffect(() => {
    if (externalTargetPrice !== undefined && externalTargetPrice !== targetPrice) {
      setTargetPrice(externalTargetPrice)
    }
  }, [externalTargetPrice])

  // Calculate you receive based on target price
  useEffect(() => {
    if (fromAmount && targetPrice && parseFloat(fromAmount) > 0 && parseFloat(targetPrice) > 0) {
      const receive = (parseFloat(fromAmount) * parseFloat(targetPrice)).toFixed(6)
      setYouReceive(receive)
    } else {
      setYouReceive('0')
    }
  }, [fromAmount, targetPrice])

  // Legacy: fetchQuote - NOT USED (limit mode price suggestion could be added later)
  // Keeping commented for reference
  const _unused_fetchQuote = async () => {
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
      if (data.ok && data.toAmount && fromAmount) {
        // Calculate price from quote
        const price = (parseFloat(data.toAmount) / parseFloat(fromAmount)).toFixed(6)
        setTargetPrice(price)
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error)
    }
  }

  return (
    <div className="space-y-3 mt-4">
      {/* Target price — ABOVE */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <label className="text-xs text-gray-400 font-light mb-2 block">
            Target price
          </label>
          <input
            type="text"
            value={targetPrice}
            onChange={(e) => {
              const value = e.target.value
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setTargetPrice(value)
                onTargetPriceChange?.(value)
              }
            }}
            placeholder="0.0"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
          />
      </div>


      {/* Partial Fills Summary - Compact 2-card layout */}
      {enablePartialFills && parseInt(amountOfParts) > 1 && fromAmount && parseFloat(fromAmount) > 0 && youReceive && parseFloat(youReceive) > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs text-gray-400 font-light mb-1">Sell per part (1/{amountOfParts})</div>
            <div className="text-sm text-white font-light">{(parseFloat(fromAmount) / parseInt(amountOfParts)).toFixed(6)} {fromToken.symbol}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs text-gray-400 font-light mb-1">Buy per part (1/{amountOfParts})</div>
            <div className="text-sm text-white font-light">{(parseFloat(youReceive) / parseInt(amountOfParts)).toFixed(6)} {toToken.symbol}</div>
          </div>
        </div>
      )}
    </div>
  )
}
