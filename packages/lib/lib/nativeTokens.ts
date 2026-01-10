/**
 * Native gas tokens for each EVM network
 * Maps network ID to native token information
 */

export interface NativeToken {
  id: string
  symbol: string
  name: string
  icon: string
}

// Native token mapping for each network
// Using chain logos as token icons where appropriate
export const NATIVE_TOKENS: Record<string, NativeToken> = {
  'ethereum': { id: 'eth', symbol: 'ETH', name: 'Ether', icon: '/chain-logos/ethereum-eth-logo.png' },
  'bnb': { id: 'bnb', symbol: 'BNB', name: 'BNB', icon: '/chain-logos/bnb-bnb-logo.png' },
  'avalanche': { id: 'avax', symbol: 'AVAX', name: 'Avalanche', icon: '/chain-logos/avalanche-avax-logo.png' },
  'polygon': { id: 'matic', symbol: 'MATIC', name: 'Matic', icon: '/chain-logos/polygon-matic-logo.png' },
  'optimism': { id: 'eth', symbol: 'ETH', name: 'Ether', icon: '/chain-logos/ethereum-eth-logo.png' },
  'ronin': { id: 'ron', symbol: 'RON', name: 'Ronin', icon: '/chain-logos/ronin-ron-logo.png' },
  'cronos': { id: 'cro', symbol: 'CRO', name: 'Cronos', icon: '/chain-logos/cronos.png' },
  'gnosis': { id: 'xdai', symbol: 'xDAI', name: 'xDAI', icon: '/chain-logos/gnosis-gno-gno-logo.png' },
  'zksync': { id: 'eth', symbol: 'ETH', name: 'Ether', icon: '/chain-logos/ethereum-eth-logo.png' },
  'base': { id: 'eth', symbol: 'ETH', name: 'Ether', icon: '/chain-logos/ethereum-eth-logo.png' },
  'linea': { id: 'eth', symbol: 'ETH', name: 'Ether', icon: '/chain-logos/ethereum-eth-logo.png' },
  'scroll': { id: 'eth', symbol: 'ETH', name: 'Ether', icon: '/chain-logos/ethereum-eth-logo.png' },
  'blast': { id: 'eth', symbol: 'ETH', name: 'Ether', icon: '/chain-logos/ethereum-eth-logo.png' },
  'katana': { id: 'eth', symbol: 'ETH', name: 'Ether', icon: '/chain-logos/ethereum-eth-logo.png' },
  'arbitrum': { id: 'eth', symbol: 'ETH', name: 'Ether', icon: '/chain-logos/ethereum-eth-logo.png' },
  'plasma': { id: 'xpl', symbol: 'XPL', name: 'XPL', icon: '/chain-logos/plasma.png' },
  'monad': { id: 'mon', symbol: 'MON', name: 'Monad', icon: '/chain-logos/monad.jpg' },
  'kava': { id: 'kava', symbol: 'KAVA', name: 'Kava', icon: '/chain-logos/kava-kava-logo.png' },
  'immutable x': { id: 'eth', symbol: 'ETH', name: 'Ether', icon: '/chain-logos/ethereum-eth-logo.png' },
  'immutable-zkevm': { id: 'eth', symbol: 'ETH', name: 'Ether', icon: '/chain-logos/ethereum-eth-logo.png' },
  'opbnb': { id: 'bnb', symbol: 'BNB', name: 'BNB', icon: '/chain-logos/bnb-bnb-logo.png' },
  'mantle': { id: 'mnt', symbol: 'MNT', name: 'Mantle', icon: '/chain-logos/mantle.png' },
  'ink': { id: 'eth', symbol: 'ETH', name: 'Ether', icon: '/chain-logos/ethereum-eth-logo.png' },
  'bera': { id: 'bera', symbol: 'BERA', name: 'Bera', icon: '/chain-logos/bera.png' },
  'rootstock': { id: 'rbtc', symbol: 'RBTC', name: 'RBTC', icon: '/chain-logos/rootstock.png' },
  'plume': { id: 'plume', symbol: 'PLUME', name: 'Plume', icon: '/chain-logos/plume.png' },
  'pulsechain': { id: 'pls', symbol: 'PLS', name: 'Pulse', icon: '/chain-logos/pulsechain.png' },
  'BOB': { id: 'eth', symbol: 'ETH', name: 'Ether', icon: '/chain-logos/ethereum-eth-logo.png' },
  'bob': { id: 'eth', symbol: 'ETH', name: 'Ether', icon: '/chain-logos/ethereum-eth-logo.png' },
  'sonic': { id: 's', symbol: 'S', name: 'Sonic', icon: '/chain-logos/sonic.png' },
  'core': { id: 'core', symbol: 'CORE', name: 'Core', icon: '/chain-logos/core.png' },
  'world (chain)': { id: 'eth', symbol: 'ETH', name: 'Ether', icon: '/chain-logos/ethereum-eth-logo.png' },
  'world-chain': { id: 'eth', symbol: 'ETH', name: 'Ether', icon: '/chain-logos/ethereum-eth-logo.png' },
  'goat': { id: 'btc', symbol: 'BTC', name: 'Bitcoin', icon: '/chain-logos/goat.png' },
  'abstract': { id: 'eth', symbol: 'ETH', name: 'Ether', icon: '/chain-logos/abstract.png' },
  'katana': { id: 'eth', symbol: 'ETH', name: 'Ether', icon: '/chain-logos/katana.jpg' },
}

/**
 * Get native token for a network
 */
export function getNativeToken(networkId: string): NativeToken | undefined {
  return NATIVE_TOKENS[networkId]
}

/**
 * Get chain ID for a network
 */
function getChainIdForNetwork(networkId: string): number | null {
  try {
    const { getChainId } = require('@/lib/tokens')
    return getChainId(networkId)
  } catch {
    return null
  }
}

/**
 * Get tokens for a specific network (native token + all ERC20 tokens available on that chain)
 */
export function getTokensForNetwork(networkId: string): Array<{ id: string; symbol: string; name: string; icon?: string }> {
  const chainId = getChainIdForNetwork(networkId)
  if (!chainId) return []
  
  const tokens: Array<{ id: string; symbol: string; name: string; icon?: string }> = []
  
  // Add native token first
  const nativeToken = getNativeToken(networkId)
  if (nativeToken) {
    tokens.push(nativeToken)
  }
  
  // Add all ERC20 tokens available on this chain
  try {
    const { TOKEN_REGISTRY, isTokenSupportedOnChain } = require('@/lib/tokens')
    
    for (const token of TOKEN_REGISTRY) {
      // Skip native tokens (they're already added)
      if (token.id === nativeToken?.id) continue
      
      // Check if token is supported on this chain
      if (isTokenSupportedOnChain(token.id, chainId)) {
        tokens.push({
          id: token.id,
          symbol: token.symbol,
          name: token.name,
          icon: token.icon,
        })
      }
    }
  } catch (error) {
    // If registry not available, just return native token
    console.warn('[nativeTokens] Failed to load token registry:', error)
  }
  
  return tokens
}