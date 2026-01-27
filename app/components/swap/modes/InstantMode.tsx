'use client'

import { useState, useEffect } from 'react'

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
}

export function InstantMode({ fromToken, toToken, fromAmount, toAmount }: InstantModeProps) {
  const hasAmount = !!(fromAmount && parseFloat(fromAmount) > 0 && toAmount && parseFloat(toAmount) > 0)

  // Instant mode: show ONLY fees after price is received, no separate frames
  return (
    <div className="space-y-3 mt-4">
      {/* Fees - show ONLY after price is received */}
      {hasAmount && (
        <div className="pt-2">
          <span className="text-xs text-gray-400 font-light"></span>
        </div>
      )}
    </div>
  )
}
