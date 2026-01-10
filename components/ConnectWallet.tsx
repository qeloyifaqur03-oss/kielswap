'use client'

import { useSafeAccount, useSafeDisconnect, useSafeConnect, useSafeChainId, useSafeChains } from '@/lib/wagmi/safeHooks'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut } from 'lucide-react'
import { useState } from 'react'

/**
 * Wallet connect button component
 * Shows connected badge with short address and chain name, or connect button
 * Uses only injected() connector (MetaMask, Rabby, Brave, etc.)
 */
export function ConnectWallet() {
  const { address, isConnected } = useSafeAccount()
  const { disconnect } = useSafeDisconnect()
  const { connect, connectors } = useSafeConnect()
  const chainId = useSafeChainId()
  const chains = useSafeChains()
  const [showDropdown, setShowDropdown] = useState(false)

  // Format address to short format (0x1234...abcd)
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Get chain name from chainId
  const chainName = chains.find((chain) => chain.id === chainId)?.name || 'Unknown'

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-colors text-sm font-medium text-white"
        >
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="font-mono">{formatAddress(address)}</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-400">{chainName}</span>
        </button>
        {showDropdown && (
          <div className="absolute top-full right-0 mt-2 bg-gray-900 border border-white/20 rounded-lg shadow-lg z-50 min-w-[200px]">
            <button
              onClick={() => {
                disconnect()
                setShowDropdown(false)
              }}
              className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2 text-sm text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        )}
      </div>
    )
  }

  // Show connect button - use first available connector (injected())
  const availableConnector = connectors[0]

  return (
    <Button
      onClick={() => {
        if (availableConnector) {
          connect({ connector: availableConnector })
        }
      }}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-colors text-sm font-medium text-white"
    >
      <Wallet className="w-4 h-4" />
      Connect wallet
    </Button>
  )
}

