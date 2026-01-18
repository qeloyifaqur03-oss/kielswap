'use client'

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
  isRefreshing?: boolean
  remainingTime?: number
  enablePartialFills?: boolean
  amountOfParts?: string
}

export function IntentMode({ fromToken, toToken, fromAmount, toAmount, isRefreshing = false, remainingTime = 0, enablePartialFills = false, amountOfParts = '2' }: IntentModeProps) {

  // Legacy: fetchQuote - NOT USED (quote is handled by SwapWindow)
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
      if (data.ok && data.toAmount) {
        // Update guaranteed minimum will be handled by useEffect
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error)
    }
  }

  return (
    <div className="space-y-3 mt-4">
      {/* Per-part block - Only show when partial fills are enabled */}
      {enablePartialFills && parseInt(amountOfParts) >= 1 && parseFloat(fromAmount) > 0 && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="text-xs text-gray-500 font-light space-y-1">
            <div>Sell per part (1/{amountOfParts}): {(parseFloat(fromAmount) / parseInt(amountOfParts)).toFixed(4)} {fromToken.symbol}</div>
            <div>Buy per part (1/{amountOfParts}): {(parseFloat(toAmount) / parseInt(amountOfParts)).toFixed(4)} {toToken.symbol}</div>
          </div>
        </div>
      )}
    </div>
  )
}
