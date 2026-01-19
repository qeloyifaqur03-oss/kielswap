'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { TokenSelectorModal } from './TokenSelectorModal'
import { SUPPORTED_NETWORKS, SUPPORTED_TOKENS } from '@/lib/supportedAssets'
import { TokenIcon } from '@/components/TokenIcon'
import { getTokenIconUrl, getNetworkIconUrl } from '@/lib/iconUrls'
import { useTokenBalance } from '@/lib/wagmi/useTokenBalance'
import { useSafeAccount } from '@/lib/wagmi/safeHooks'

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
  isBlurred?: boolean
}

export function TokenFrame({
  label,
  amount,
  onAmountChange,
  token,
  onTokenChange,
  disabled = false,
  isBlurred = false,
}: TokenFrameProps) {
  const [isTokenSelectOpen, setIsTokenSelectOpen] = useState(false)

  // Find token and network from supported assets
  // Try to find token that matches both symbol and network
  const currentNetworkDefinition = SUPPORTED_NETWORKS.find(n => n.chainId === token.chainId)
  const currentNetworkId = currentNetworkDefinition?.id
  
  const matchingToken = SUPPORTED_TOKENS.find(t => 
    t.symbol === token.symbol && (currentNetworkId ? t.networkIds.includes(currentNetworkId) : true)
  ) || SUPPORTED_TOKENS.find(t => t.symbol === token.symbol)
  
  const tokenId = matchingToken?.id || token.symbol.toLowerCase()
  const networkId = currentNetworkId || token.chainId.toString()
  
  const tokenIcon = getTokenIconUrl(tokenId)
  const chainIcon = getNetworkIconUrl(networkId)
  
  // Get wallet balance if connected
  const { isConnected } = useSafeAccount()
  const { formatted: balance, isLoading: isLoadingBalance } = useTokenBalance(tokenId, token.chainId)

  return (
    <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/10">
      {/* Label and Balance */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-gray-500 font-light">{label}</span>
        {isConnected && !isLoadingBalance && balance && (
          <span className="text-xs text-gray-500 font-light">
            Balance: {parseFloat(balance) > 0.0001 ? parseFloat(balance).toFixed(4) : parseFloat(balance).toFixed(8)}
          </span>
        )}
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
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  onAmountChange(value)
                }
              }
            }}
            placeholder="0"
            disabled={disabled}
            style={{
              WebkitTapHighlightColor: 'transparent',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
            }}
            className={`w-full bg-transparent border-0 text-xl sm:text-2xl font-light text-white placeholder:text-gray-600 focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:shadow-none focus:border-none active:outline-none active:ring-0 active:shadow-none p-0 h-auto disabled:opacity-70 transition-[filter,opacity] duration-200 ${isBlurred ? 'blur-sm opacity-60' : ''}`}
          />
        </div>

        {/* Token Selector */}
        <div className="relative">
          <button
            onClick={() => setIsTokenSelectOpen(!isTokenSelectOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            {/* Token and Chain Icons */}
            <div className="relative flex items-center justify-center flex-shrink-0">
              <div className="relative w-4 h-4">
                <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                  <TokenIcon
                    src={tokenIcon}
                    alt={token.symbol}
                    width={12}
                    height={12}
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
                {chainIcon && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-white/5 border border-white/20 flex items-center justify-center overflow-hidden">
                    <TokenIcon
                      src={chainIcon}
                      alt={token.chainName}
                      width={8}
                      height={8}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Token Symbol */}
            <span className="text-white font-medium text-xs sm:text-sm">{token.symbol}</span>

            {/* Chain Name */}
            <span className="text-gray-400 text-[10px] sm:text-xs hidden sm:inline">{token.chainName}</span>

            {/* Dropdown Arrow */}
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {/* Token Select Dropdown - TODO: Implement full dropdown */}
          {isTokenSelectOpen && (
            <div className="absolute right-0 mt-2 w-64 glass rounded-2xl p-2 z-50">
              <div className="text-xs text-gray-500 p-2">Token selector coming soon</div>
            </div>
          )}
        </div>
      </div>

      {/* Token Selector Modal */}
      <TokenSelectorModal
        open={isTokenSelectOpen}
        onClose={() => setIsTokenSelectOpen(false)}
        networks={SUPPORTED_NETWORKS}
        tokens={SUPPORTED_TOKENS}
        selectedNetworkId={token.chainId.toString()}
        selectedTokenId={tokenId}
        onNetworkSelect={(networkId) => {
          // When network is selected, update the token's chain
          const selectedNetwork = SUPPORTED_NETWORKS.find(n => n.id === networkId)
          if (selectedNetwork) {
            // Find token that supports this network
            const currentToken = SUPPORTED_TOKENS.find(t => t.id === tokenId)
            if (currentToken && currentToken.networkIds.includes(networkId)) {
              onTokenChange({
                symbol: currentToken.symbol,
                chainId: selectedNetwork.chainId,
                chainName: selectedNetwork.name,
              })
            }
          }
        }}
        onTokenSelect={(selectedTokenId, selectedNetworkId) => {
          const selectedToken = SUPPORTED_TOKENS.find(t => t.id === selectedTokenId)
          if (selectedToken) {
            // Use selected network if provided, otherwise prefer current network if token supports it, otherwise first network
            const currentNetwork = SUPPORTED_NETWORKS.find(n => n.chainId === token.chainId)
            const currentNetworkId = currentNetwork?.id
            const targetNetworkId = selectedNetworkId || 
              (currentNetworkId && selectedToken.networkIds.includes(currentNetworkId) 
                ? currentNetworkId 
                : selectedToken.networkIds[0])
            
            const targetNetwork = SUPPORTED_NETWORKS.find(n => n.id === targetNetworkId)
            
            if (targetNetwork) {
              // Atomically update both token and chain
              onTokenChange({
                symbol: selectedToken.symbol,
                chainId: targetNetwork.chainId,
                chainName: targetNetwork.name,
              })
              setIsTokenSelectOpen(false)
            }
          }
        }}
      />
    </div>
  )
}
