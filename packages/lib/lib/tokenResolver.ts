/**
 * Family-aware token resolver
 * Handles token identifiers correctly for each blockchain family
 */

import { getTokenInfo, getTokenAddress, TOKEN_REGISTRY } from './tokens'
import { getChainInfo, NetworkFamily, TokenIdKind } from './chainRegistry'

export interface ResolvedToken {
  tokenId: string
  symbol: string
  decimals: number
  address: string // Family-specific address format
  family: NetworkFamily
  isNative: boolean
}

/**
 * Resolve token identifier for a specific network family
 * NEVER returns 0x000... for non-EVM networks
 */
export function resolveTokenForFamily(
  tokenId: string,
  networkId: string
): ResolvedToken | null {
  const chainInfo = getChainInfo(networkId)
  if (!chainInfo) {
    return null
  }

  const token = getTokenInfo(tokenId)
  if (!token) {
    return null
  }

  const isNative = tokenId.toLowerCase() === chainInfo.nativeTokenSymbol.toLowerCase()

  // Get address based on family
  let address: string

  switch (chainInfo.family) {
    case 'EVM': {
      // EVM: use contract address, or 0x000... for native
      if (isNative) {
        address = '0x0000000000000000000000000000000000000000'
      } else {
        const chainId = chainInfo.chainId
        if (!chainId) return null
        const contractAddress = getTokenAddress(tokenId, chainId)
        if (!contractAddress) return null
        address = contractAddress
      }
      break
    }

    case 'SOLANA': {
      // Solana: use mint address
      const mintAddress = getTokenAddress(tokenId, 101) // Solana mainnet
      if (!mintAddress && !isNative) return null
      // Native SOL doesn't have a mint address in the same way
      address = isNative ? 'So11111111111111111111111111111111111111112' : mintAddress!
      break
    }

    case 'TON': {
      // TON: use Jetton master address (EQ... format)
      // For native TON, use special identifier
      if (isNative) {
        address = 'TON' // Native TON identifier
      } else {
        // TON Jetton master address - this would come from a TON-specific registry
        // For now, return null if not in registry
        // In production, you'd have TON-specific token registry
        return null
      }
      break
    }

    case 'TRON': {
      // TRON: use TRC20 contract address (base58 TR... format)
      if (isNative) {
        address = 'TRX' // Native TRON identifier
      } else {
        // TRC20 contract address - would come from TRON-specific registry
        // For now, return null if not in registry
        return null
      }
      break
    }

    default: {
      // Unknown or unsupported family
      return null
    }
  }

  return {
    tokenId,
    symbol: token.symbol,
    decimals: token.decimals,
    address,
    family: chainInfo.family,
    isNative,
  }
}

/**
 * Get token address for provider calls
 * Only returns 0x000... for EVM native tokens
 */
export function getTokenAddressForProvider(
  tokenId: string,
  networkId: string,
  provider: 'relay' | 'lifi' | '0x' | 'jupiter'
): string | null {
  const resolved = resolveTokenForFamily(tokenId, networkId)
  if (!resolved) return null

  // Providers only work with EVM or Solana
  if (resolved.family === 'EVM' && (provider === 'relay' || provider === 'lifi' || provider === '0x')) {
    return resolved.address
  }

  if (resolved.family === 'SOLANA' && provider === 'jupiter') {
    return resolved.address
  }

  return null
}


