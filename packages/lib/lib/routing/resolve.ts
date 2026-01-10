/**
 * Token resolution across different network families
 */

import { getTokenInfo, getTokenAddress, getChainId } from '../tokens'
import { Family, ResolvedToken } from './types'

/**
 * Resolve token to network-specific address/identifier
 */
export function resolveToken(
  networkId: string,
  tokenId: string,
  family: Family
): ResolvedToken | null {
  const chainId = getChainId(networkId)
  const token = getTokenInfo(tokenId)

  if (!token) {
    return null
  }

  let address: string

  switch (family) {
    case 'EVM': {
      // EVM: contract address or '0x000...0000' for native
      const tokenAddr = getTokenAddress(tokenId, chainId || 0)
      address = tokenAddr || '0x0000000000000000000000000000000000000000'
      break
    }

    case 'SOLANA': {
      // Solana: mint address
      // For now, use token registry mapping (chainId 101 = Solana)
      const mint = getTokenAddress(tokenId, 101)
      if (!mint) {
        return null // Token not supported on Solana
      }
      address = mint
      break
    }

    case 'TON': {
      // TON: native TON or jetton master address
      if (tokenId.toLowerCase() === 'ton') {
        address = 'TON' // Native TON
      } else {
        // For jettons, we'd need a TON-specific registry
        // For now, return null if not native
        const jettonAddr = getTokenAddress(tokenId, 607) // TON chainId
        if (!jettonAddr) {
          return null
        }
        address = jettonAddr
      }
      break
    }

    case 'TRON': {
      // TRON: TRC20 contract address (base58)
      // Note: TRON chainId may be null, so we can't use getTokenAddress with chainId
      // For now, handle native TRX and check if token exists in registry
      if (tokenId.toLowerCase() === 'tron' || tokenId.toLowerCase() === 'trx') {
        address = 'TRX' // Native TRON
      } else {
        // Try to get TRC20 address - use a placeholder chainId or check token registry differently
        // For minimal implementation, return tokenId as address if not native
        const token = getTokenInfo(tokenId)
        if (token && token.addresses) {
          // Check if token has TRON address in registry
          const tronAddr = Object.values(token.addresses).find((addr) => addr !== null && addr.toLowerCase() !== 'trx')
          if (tronAddr) {
            address = tronAddr
          } else {
            return null // Token not supported on TRON
          }
        } else {
          return null
        }
      }
      break
    }

    default:
      return null
  }

  return {
    tokenId,
    symbol: token.symbol,
    decimals: token.decimals,
    address,
    family,
  }
}

/**
 * Get network family from network ID
 * This function is kept for consistency but reuses the same logic
 */
export function getNetworkFamily(networkId: string): Family {
  // Import and use the same logic from quote route
  // For now, duplicate the logic here to avoid circular dependencies
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
    return 'TRON'
  }

  if (networkId.toLowerCase() === 'ton') {
    return 'TON'
  }

  return 'UNSUPPORTED'
}

/**
 * Define bridge hub networks per family
 */
export function getFamilyHub(networkId: string): string {
  const family = getNetworkFamily(networkId)

  switch (family) {
    case 'EVM':
      // Prefer base (cheaper) over ethereum, but allow override
      return 'base' // Can be made configurable
    case 'SOLANA':
      return 'solana'
    case 'TON':
      return 'ton'
    case 'TRON':
      return 'tron'
    default:
      return networkId
  }
}

/**
 * Get canonical bridgeable tokens for a family
 * These are tokens that are commonly bridged across networks
 */
export function getCanonicalBridgeTokens(family: Family): string[] {
  switch (family) {
    case 'EVM':
      return ['usdc', 'usdt', 'eth', 'weth'] // USDC/USDT are most bridged
    case 'SOLANA':
      return ['usdc', 'usdt', 'sol'] // USDC/USDT have wrapped versions on Solana
    case 'TON':
      return ['ton', 'usdt'] // TON native and USDT
    case 'TRON':
      return ['trx', 'usdt', 'usdc'] // TRX native and stablecoins
    default:
      return []
  }
}

