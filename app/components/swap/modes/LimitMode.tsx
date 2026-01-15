'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
}

export function LimitMode({ fromToken, toToken, fromAmount, toAmount }: LimitModeProps) {
  const router = useRouter()
  const { isConnected } = useSafeAccount()
  const [targetPrice, setTargetPrice] = useState('0')
  const [expiry, setExpiry] = useState('1d')
  const [youReceive, setYouReceive] = useState('0')

  // Calculate you receive based on target price
  useEffect(() => {
    if (fromAmount && targetPrice && parseFloat(fromAmount) > 0 && parseFloat(targetPrice) > 0) {
      const receive = (parseFloat(fromAmount) * parseFloat(targetPrice)).toFixed(6)
      setYouReceive(receive)
    } else {
      setYouReceive('0')
    }
  }, [fromAmount, targetPrice])

  // Fetch quote for initial price suggestion
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
    <div className="space-y-4 mt-6">
      {/* You Receive */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400 font-light">You receive (target)</span>
          <span className="text-lg text-white font-light">{youReceive} {toToken.symbol}</span>
        </div>
      </div>

      {/* Expires In */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400 font-light">Expires in</span>
          <div className="flex gap-2">
            {['1h', '6h', '1d', '7d'].map((time) => (
              <button
                key={time}
                onClick={() => setExpiry(time)}
                className={`px-3 py-1.5 rounded-lg text-xs font-light transition-colors ${
                  expiry === time
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/5'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Price Selection */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <label className="text-xs text-gray-400 font-light mb-2 block">
          Target price ({toToken.symbol}/{fromToken.symbol})
        </label>
        <Input
          type="text"
          value={targetPrice}
          onChange={(e) => {
            const value = e.target.value
            if (value === '' || /^\d*\.?\d*$/.test(value)) {
              setTargetPrice(value)
            }
          }}
          placeholder="0.0"
          className="bg-white/5 border-white/10 text-white font-light"
        />
        <p className="text-xs text-gray-500 mt-2">
          Price automatically adjusts "You receive" above
        </p>
      </div>

      {/* Place Limit Order Button */}
      <Button
        className="w-full h-12 bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 hover:border-pink-400/50 text-white rounded-xl font-light transition-all duration-300 shadow-lg shadow-accent/20 hover:shadow-accent/30"
      >
        Place limit order
      </Button>

      {/* My Orders Button */}
      {isConnected && (
        <Button
          onClick={() => router.push('/swap?mode=limit&tab=orders')}
          className="w-full h-10 bg-transparent border border-white/10 text-gray-300 hover:bg-white/5 rounded-xl font-light"
        >
          My orders
        </Button>
      )}
    </div>
  )
}
