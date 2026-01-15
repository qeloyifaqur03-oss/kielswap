'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'

interface Token {
  symbol: string
  chainId: number
  chainName: string
}

interface TokenFrameProps {
  label: string
  amount: string
  onAmountChange: (amount: string) => void
  token: Token
  onTokenChange: (token: Token) => void
  disabled?: boolean
}

const CHAIN_ICONS: Record<number, string> = {
  1: '/icons/ethereum.png', // Ethereum
  137: '/icons/polygon.png', // Polygon
  56: '/icons/base.png', // BSC
  // Add more chain icons as needed
}

const TOKEN_ICONS: Record<string, string> = {
  ETH: '/icons/eth.png',
  USDT: '/icons/usdt.png',
  USDC: '/icons/usdc.png',
  // Add more token icons as needed
}

export function TokenFrame({
  label,
  amount,
  onAmountChange,
  token,
  onTokenChange,
  disabled = false,
}: TokenFrameProps) {
  const [isTokenSelectOpen, setIsTokenSelectOpen] = useState(false)

  const tokenIcon = TOKEN_ICONS[token.symbol] || '/icons/eth.png'
  const chainIcon = CHAIN_ICONS[token.chainId] || '/icons/ethereum.png'

  return (
    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
      {/* Label */}
      <div className="mb-3">
        <span className="text-xs text-gray-500 font-light">{label}</span>
      </div>

      {/* Amount and Token Selector */}
      <div className="flex items-center gap-3">
        {/* Amount Input */}
        <div className="flex-1 flex items-center h-[42px] bg-white/3 border border-white/10 rounded-xl px-4">
          <input
            type="text"
            value={amount}
            onChange={(e) => {
              if (!disabled) {
                const value = e.target.value
                // Allow numbers and decimal point
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  onAmountChange(value)
                }
              }
            }}
            placeholder="0"
            disabled={disabled}
            className="w-full bg-transparent border-0 text-2xl font-light text-white placeholder:text-gray-600 focus:outline-none focus-visible:outline-none p-0 h-auto disabled:opacity-70"
          />
        </div>

        {/* Token Selector */}
        <div className="relative">
          <button
            onClick={() => setIsTokenSelectOpen(!isTokenSelectOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            {/* Token and Chain Icons */}
            <div className="relative flex items-center flex-shrink-0">
              <div className="relative w-5 h-5">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                  <Image
                    src={tokenIcon}
                    alt={token.symbol}
                    width={16}
                    height={16}
                    className="w-full h-full object-contain rounded-full"
                    unoptimized
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] rounded-full bg-white/5 border border-white/20 flex items-center justify-center overflow-hidden">
                  <Image
                    src={chainIcon}
                    alt={token.chainName}
                    width={10}
                    height={10}
                    className="w-full h-full object-cover rounded-full"
                    unoptimized
                  />
                </div>
              </div>
            </div>

            {/* Token Symbol */}
            <span className="text-white font-medium text-sm">{token.symbol}</span>

            {/* Chain Name */}
            <span className="text-gray-400 text-xs">{token.chainName}</span>

            {/* Dropdown Arrow */}
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {/* Token Select Dropdown - TODO: Implement full dropdown */}
          {isTokenSelectOpen && (
            <div className="absolute right-0 mt-2 w-64 glass rounded-2xl p-2 border border-white/10 shadow-xl z-50">
              <div className="text-xs text-gray-500 p-2">Token selector coming soon</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
