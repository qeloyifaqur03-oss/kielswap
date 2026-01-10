/**
 * Chain registry - sync version for server-side use
 * Loads chain data from chains.registry.json
 */

// Try to load from chains.registry.json, fallback gracefully if not available
let chainsData: any[] = []
try {
  // Try to load from local data directory first (packages/lib/lib/data/)
  chainsData = require('../data/chains.registry.json')
} catch {
  try {
    // Fallback to root data directory (for backward compatibility)
    chainsData = require('../../../../data/chains.registry.json')
  } catch {
    // Registry file not available, will use fallback in getChainId()
    chainsData = []
  }
}

interface ChainData {
  id: string
  chainId: number | null
  chainType: string
  name: string
}

/**
 * Get chainId for a network ID (sync version)
 * Returns null if network not found or not EVM
 * This is used as primary source, with fallback to CHAIN_IDS in lib/tokens.ts
 */
export function getChainIdSync(networkId: string): number | null {
  if (!chainsData || chainsData.length === 0) {
    return null // Will fallback to CHAIN_IDS
  }
  
  const chain = (chainsData as ChainData[]).find(
    (c) => c.id === networkId || c.id === networkId.toLowerCase()
  )
  
  if (!chain) {
    return null // Will fallback to CHAIN_IDS
  }
  
  // Only return chainId for EVM chains
  if (chain.chainType === 'EVM' && chain.chainId !== null) {
    return chain.chainId
  }
  
  return null
}

/**
 * Check if a network is EVM
 */
export function isEVM(networkId: string): boolean {
  const chain = (chainsData as ChainData[]).find(
    (c) => c.id === networkId || c.id === networkId.toLowerCase()
  )
  return chain?.chainType === 'EVM'
}

/**
 * Get chain info by network ID
 */
export function getChainInfo(networkId: string): { family: string; chainId: number | null } | null {
  const chain = (chainsData as ChainData[]).find(
    (c) => c.id === networkId || c.id === networkId.toLowerCase()
  )
  
  if (!chain) {
    return null
  }
  
  // Map chainType to family
  let family = 'UNSUPPORTED'
  if (chain.chainType === 'EVM') {
    family = 'EVM'
  } else if (chain.chainType === 'SOLANA') {
    family = 'SOLANA'
  } else if (chain.chainType === 'TON') {
    family = 'TON'
  } else if (chain.chainType === 'TRON') {
    family = 'TRON'
  }
  
  return {
    family,
    chainId: chain.chainId,
  }
}
