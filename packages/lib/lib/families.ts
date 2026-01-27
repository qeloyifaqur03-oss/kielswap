/**
 * Network family classification and utilities
 */

import { getChainId } from './tokens'

export type Family = 'EVM' | 'SOLANA' | 'TRON' | 'TON' | 'UNSUPPORTED'

/**
 * Get network family from network ID
 * Handles TRON gracefully (chainId may be null)
 */
export function getFamily(networkId: string, chainId: number | null): Family {
  const evmNetworks = [
    'ethereum', 'base', 'bnb', 'polygon', 'arbitrum', 'optimism', 'linea', 'scroll',
    'blast', 'celo', 'avalanche', 'zksync', 'gnosis', 'ronin', 'opbnb', 'mantle',
    'cronos', 'rootstock', 'plasma', 'monad', 'flow', 'kava', 'immutablex',
    'pulsechain', 'bob', 'core', 'world', 'abstract', 'hydration', 'eni', 'mixin',
    'starknet', 'aptos',
  ]

  if (evmNetworks.includes(networkId.toLowerCase())) {
    return 'EVM'
  }

  if (networkId.toLowerCase() === 'solana') {
    return 'SOLANA'
  }

  if (networkId.toLowerCase() === 'tron') {
    return 'TRON' // TRON is valid even if chainId is null
  }

  if (networkId.toLowerCase() === 'ton') {
    return 'TON'
  }

  return 'UNSUPPORTED'
}

/**
 * Check if a family requires wallet connection for execution
 */
export function requiresWalletForFamily(f: Family): boolean {
  return f !== 'UNSUPPORTED'
}

/**
 * Get family from networkId (convenience wrapper)
 */
export function getFamilyFromNetworkId(networkId: string): Family {
  const chainId = getChainId(networkId)
  return getFamily(networkId, chainId)
}



















