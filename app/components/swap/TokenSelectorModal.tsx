'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Star } from 'lucide-react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { TokenIcon } from '@/components/TokenIcon'
import { Network, Token, SUPPORTED_NETWORKS } from '@/lib/supportedAssets'
import { getTokenIconUrl, getNetworkIconUrl } from '@/lib/iconUrls'
import { useTokenBalance } from '@/lib/wagmi/useTokenBalance'
import { useSafeAccount } from '@/lib/wagmi/safeHooks'

interface TokenSelectorModalProps {
  open: boolean
  onClose: () => void
  networks: Network[]
  tokens: Token[]
  selectedNetworkId?: string
  selectedTokenId?: string
  onNetworkSelect: (networkId: string) => void
  onTokenSelect: (tokenId: string, networkId?: string) => void
}

// Get starred tokens from localStorage
function getStarredTokens(): string[] {
  try {
    const stored = localStorage.getItem('starred_tokens')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    // Ignore errors
  }
  return []
}

// Get recent tokens from localStorage
function getRecentTokens(): string[] {
  try {
    const stored = localStorage.getItem('recent_tokens')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    // Ignore errors
  }
  return []
}

// Toggle starred token
function toggleStarredToken(tokenId: string) {
  try {
    const starred = getStarredTokens()
    const index = starred.indexOf(tokenId)
    if (index > -1) {
      starred.splice(index, 1)
    } else {
      starred.push(tokenId)
    }
    localStorage.setItem('starred_tokens', JSON.stringify(starred))
  } catch (error) {
    // Ignore errors
  }
}

// Add to recent tokens
function addToRecentTokens(tokenId: string) {
  try {
    const recent = getRecentTokens()
    const index = recent.indexOf(tokenId)
    if (index > -1) {
      recent.splice(index, 1)
    }
    recent.unshift(tokenId)
    // Keep only last 10
    const limited = recent.slice(0, 10)
    localStorage.setItem('recent_tokens', JSON.stringify(limited))
  } catch (error) {
    // Ignore errors
  }
}

export function TokenSelectorModal({
  open,
  onClose,
  networks,
  tokens,
  selectedNetworkId,
  selectedTokenId,
  onNetworkSelect,
  onTokenSelect,
}: TokenSelectorModalProps) {
  const [search, setSearch] = useState('')
  const [localSelectedNetworkId, setLocalSelectedNetworkId] = useState<string | undefined>(selectedNetworkId)
  const [starredTokens, setStarredTokens] = useState<string[]>([])
  
  // Load starred tokens when modal opens
  useEffect(() => {
    if (open) {
      setStarredTokens(getStarredTokens())
    }
  }, [open])
  
  // Reset search and network selection when modal opens
  useEffect(() => {
    if (open) {
      setSearch('')
      setLocalSelectedNetworkId(selectedNetworkId)
    }
  }, [open, selectedNetworkId])
  
  // Filter networks by search - only when searching
  const filteredNetworks = useMemo(() => {
    if (!search) return []
    const lowerSearch = search.toLowerCase().trim()
    if (!lowerSearch) return []
    return networks.filter(network =>
      network.name.toLowerCase().includes(lowerSearch) ||
      network.id.toLowerCase().includes(lowerSearch)
    )
  }, [networks, search])

  // Filter tokens by network and search
  const filteredTokens = useMemo(() => {
    let filtered = tokens
    
    // If search is active, show only tokens that match the search query
    if (search) {
      const lowerSearch = search.toLowerCase().trim()
      if (!lowerSearch) return []
      
      // When searching, show only tokens that contain the search text in symbol (not name or id)
      filtered = filtered.filter(token => {
        const tokenSymbol = token.symbol.toLowerCase()
        
        return tokenSymbol.includes(lowerSearch)
      })
    } else {
      // When not searching, filter by selected network
      if (localSelectedNetworkId) {
        filtered = filtered.filter(token => 
          token.networkIds.includes(localSelectedNetworkId)
        )
      }
    }
    
    return filtered
  }, [tokens, localSelectedNetworkId, search])
  
  // Expand tokens for search results - show one entry per network
  const expandedTokensForSearch = useMemo(() => {
    if (!search) return []
    
    const expanded: Array<{ token: Token; displayNetworkId: string }> = []
    filteredTokens.forEach(token => {
      token.networkIds.forEach(networkId => {
        expanded.push({ token, displayNetworkId: networkId })
      })
    })
    return expanded
  }, [filteredTokens, search])
  
  // Get starred tokens from filtered list
  const starredFiltered = useMemo(() => {
    return filteredTokens.filter(token => starredTokens.includes(token.id))
  }, [filteredTokens, starredTokens])
  
  // Get recent tokens from filtered list
  const recentFiltered = useMemo(() => {
    const recent = getRecentTokens()
    return filteredTokens
      .filter(token => recent.includes(token.id))
      .sort((a, b) => {
        const aIndex = recent.indexOf(a.id)
        const bIndex = recent.indexOf(b.id)
        return aIndex - bIndex
      })
  }, [filteredTokens])
  
  // Get full list (excluding starred and recent)
  const fullList = useMemo(() => {
    const starredIds = new Set(starredFiltered.map(t => t.id))
    const recentIds = new Set(recentFiltered.map(t => t.id))
    return filteredTokens.filter(token => 
      !starredIds.has(token.id) && !recentIds.has(token.id)
    )
  }, [filteredTokens, starredFiltered, recentFiltered])
  
  const handleNetworkSelect = (networkId: string) => {
    setLocalSelectedNetworkId(networkId)
    onNetworkSelect(networkId)
  }
  
  const handleTokenSelect = (tokenId: string, networkId?: string) => {
    addToRecentTokens(tokenId)
    onTokenSelect(tokenId, networkId)
    onClose()
  }
  
  const handleToggleStar = (tokenId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    toggleStarredToken(tokenId)
    setStarredTokens(getStarredTokens())
  }
  
  const selectedNetwork = networks.find(n => n.id === localSelectedNetworkId)
  
  // Network row component for search results
  const NetworkRow = ({ network }: { network: Network }) => {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleNetworkSelect(network.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleNetworkSelect(network.id)
          }
        }}
        className="relative w-full flex items-center gap-3 px-3 py-2.5 max-md:px-4 max-md:py-4 rounded-lg text-left transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 bg-gradient-to-br from-white/[0.04] to-white/[0.02] backdrop-blur-sm shadow-md shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-br before:from-pink-500/5 before:via-transparent before:to-purple-500/5 before:rounded-lg before:-z-10 hover:before:from-pink-500/6 hover:before:to-purple-500/6"
      >
        {(() => {
          const networkIcon = getNetworkIconUrl(network.id)
          return networkIcon ? (
            <TokenIcon
              src={networkIcon}
              alt={network.name}
              width={20}
              height={20}
              className="w-5 h-5"
            />
          ) : null
        })()}
        <div className="flex-1">
          <div className="text-sm font-light text-white">{network.name}</div>
          <div className="text-xs text-gray-500 font-light">Network</div>
        </div>
      </div>
    )
  }
  
  // Token row component - using div role="button" to avoid nested buttons
  const TokenRow = ({ token, displayNetworkId, showNetwork = true }: { token: Token; displayNetworkId?: string; showNetwork?: boolean }) => {
    const isStarred = starredTokens.includes(token.id)
    const { isConnected } = useSafeAccount()
    
    // Get the network to display for this token
    const networkId = displayNetworkId || 
      (localSelectedNetworkId && token.networkIds.includes(localSelectedNetworkId)
        ? localSelectedNetworkId
        : token.networkIds[0])
    const tokenNetwork = networks.find(n => n.id === networkId)
    const networkDefinition = SUPPORTED_NETWORKS.find(n => n.id === networkId)
    const chainId = networkDefinition?.chainId || 1
    
    // Get wallet balance if connected
    const { formatted: balance, isLoading: isLoadingBalance } = useTokenBalance(token.id, chainId)
    
    const handleTokenClick = () => {
      // If we're in search mode and have a specific network, use that network
      if (search && displayNetworkId) {
        handleTokenSelect(token.id, displayNetworkId)
      } else {
        handleTokenSelect(token.id)
      }
    }
    
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleTokenClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleTokenClick()
          }
        }}
        className="relative w-full flex items-center gap-3 px-3 py-2.5 max-md:px-4 max-md:py-4 rounded-lg text-left transition-colors group cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 bg-gradient-to-br from-white/[0.04] to-white/[0.02] backdrop-blur-sm shadow-md shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-br before:from-pink-500/5 before:via-transparent before:to-purple-500/5 before:rounded-lg before:-z-10 hover:before:from-pink-500/6 hover:before:to-purple-500/6"
      >
        {(() => {
          const tokenIcon = getTokenIconUrl(token.id)
          return tokenIcon ? (
            <TokenIcon
              src={tokenIcon}
              alt={token.symbol}
              width={20}
              height={20}
              className="w-5 h-5"
            />
          ) : null
        })()}
        <div className="flex-1">
          <div className="text-sm font-light text-white">{token.symbol}</div>
          {showNetwork && tokenNetwork && (
            <div className="text-xs text-gray-600 font-light mt-0.5">{tokenNetwork.name}</div>
          )}
        </div>
        {isConnected && !isLoadingBalance && balance && (
          <div className="text-xs text-gray-500 font-light">
            {parseFloat(balance) > 0.0001 ? parseFloat(balance).toFixed(4) : parseFloat(balance).toFixed(8)}
          </div>
        )}
        <button
          type="button"
          onClick={(e) => handleToggleStar(token.id, e)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Star className={`w-4 h-4 ${isStarred ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`} />
        </button>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[80vw] max-w-6xl h-[90vh] sm:h-[85vh] md:h-[80vh] max-h-[800px] max-md:w-full max-md:h-full max-md:max-h-none max-md:max-w-none max-md:rounded-none p-0 overflow-hidden bg-transparent border-0">
        <div className="relative w-full h-full p-4 sm:p-6 flex flex-col bg-gradient-to-br from-white/[0.04] to-white/[0.02] backdrop-blur-sm shadow-md shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-br before:from-pink-500/5 before:via-transparent before:to-purple-500/5 before:rounded-3xl before:-z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-light text-white">Select Token</h2>
          </div>
          
          {/* Search */}
          <div className="mb-4">
            <div className="relative w-full rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] backdrop-blur-sm shadow-md shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-br before:from-pink-500/5 before:via-transparent before:to-purple-500/5 before:rounded-xl before:-z-10 border border-white/10">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search token or network"
                className="w-full bg-transparent border-0 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-500 focus:outline-none transition-colors"
                autoFocus
              />
            </div>
          </div>
          
          {/* Selected Network Pill - only show when not searching */}
          {selectedNetwork && !search && (
            <div className="mb-4">
              <div className="relative inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-lg bg-gradient-to-br from-white/[0.04] to-white/[0.02] backdrop-blur-sm shadow-md shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-br before:from-pink-500/5 before:via-transparent before:to-purple-500/5 before:rounded-lg before:-z-10">
                {(() => {
                  const networkIcon = getNetworkIconUrl(selectedNetwork.id)
                  return networkIcon ? (
                    <TokenIcon
                      src={networkIcon}
                      alt={selectedNetwork.name}
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                  ) : null
                })()}
                <span className="text-xs text-gray-400 font-light">{selectedNetwork.name}</span>
              </div>
            </div>
          )}
          
          {/* Search Results Mode - Single Column */}
          {search ? (
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/30 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]">
              <div className="space-y-4">
                {/* Networks Section */}
                {filteredNetworks.length > 0 && (
                  <div>
                    <h3 className="text-xs text-gray-500 font-light mb-2 px-2">Networks</h3>
                    <div className="space-y-1">
                      {filteredNetworks.map((network) => (
                        <NetworkRow key={network.id} network={network} />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Tokens Section */}
                {expandedTokensForSearch.length > 0 && (
                  <div>
                    <h3 className="text-xs text-gray-500 font-light mb-2 px-2">Tokens</h3>
                    <div className="space-y-1">
                      {expandedTokensForSearch.map(({ token, displayNetworkId }, index) => (
                        <TokenRow 
                          key={`${token.id}-${displayNetworkId}-${index}`} 
                          token={token} 
                          displayNetworkId={displayNetworkId}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Empty State */}
                {filteredNetworks.length === 0 && expandedTokensForSearch.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-500 font-light">No results found</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Normal Mode - Two Columns: Networks (left) and Tokens (right) */
            <div className="flex-1 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 overflow-hidden">
              {/* Networks Column */}
              <div className="overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/30 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]">
                <div className="space-y-1">
                  {networks.map((network) => (
                    <button
                      key={network.id}
                      type="button"
                      onClick={() => handleNetworkSelect(network.id)}
                      className={`relative w-full flex items-center gap-3 px-3 py-2.5 max-md:px-4 max-md:py-4 rounded-lg text-left transition-colors ${
                        localSelectedNetworkId === network.id
                          ? 'text-white bg-gradient-to-br from-white/[0.06] to-white/[0.03] backdrop-blur-sm shadow-md shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-br before:from-pink-500/6 before:via-transparent before:to-purple-500/6 before:rounded-lg before:-z-10'
                          : 'text-gray-400 hover:text-gray-300 bg-gradient-to-br from-white/[0.04] to-white/[0.02] backdrop-blur-sm shadow-md shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-br before:from-pink-500/5 before:via-transparent before:to-purple-500/5 before:rounded-lg before:-z-10 hover:before:from-pink-500/6 hover:before:to-purple-500/6'
                      }`}
                    >
                      {(() => {
                        const networkIcon = getNetworkIconUrl(network.id)
                        return networkIcon ? (
                          <TokenIcon
                            src={networkIcon}
                            alt={network.name}
                            width={20}
                            height={20}
                            className="w-5 h-5"
                          />
                        ) : null
                      })()}
                      <span className="text-sm font-light">{network.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Tokens Column */}
              <div className="overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/30 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]">
                {/* Starred Section */}
                {starredFiltered.length > 0 && (
                  <div className={starredFiltered.length > 0 && recentFiltered.length === 0 && fullList.length === 0 ? '' : 'mb-4'}>
                    <h3 className="text-xs text-gray-500 font-light mb-2 px-2">Starred</h3>
                    <div className="space-y-1">
                      {starredFiltered.map((token) => (
                        <TokenRow key={token.id} token={token} />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Recents Section */}
                {recentFiltered.length > 0 && (
                  <div className={recentFiltered.length > 0 && fullList.length === 0 && starredFiltered.length === 0 ? '' : 'mb-4'}>
                    <h3 className="text-xs text-gray-500 font-light mb-2 px-2">Recents</h3>
                    <div className="space-y-1">
                      {recentFiltered.map((token) => (
                        <TokenRow key={token.id} token={token} />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Full List Section */}
                {fullList.length > 0 && (
                  <div className="space-y-1">
                    {fullList.map((token) => (
                      <TokenRow key={token.id} token={token} />
                    ))}
                  </div>
                )}
                
                {/* Empty State */}
                {filteredTokens.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-500 font-light">No tokens found</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
