/**
 * ChangeNOW API asset mapping
 * Maps our network/token identifiers to ChangeNOW ticker + network codes
 */

export interface ChangeNowAsset {
  ticker: string
  network: string
}

/**
 * Map network/token to ChangeNOW asset codes
 * Returns null if not supported
 */
export function resolveChangeNowAsset(
  networkId: string,
  tokenSymbol: string
): ChangeNowAsset | null {
  const network = networkId.toLowerCase()
  const symbol = tokenSymbol.toUpperCase()

  // EVM networks
  if (network === 'ethereum' || network === 'eth') {
    if (symbol === 'ETH') {
      return { ticker: 'eth', network: 'eth' }
    }
    if (symbol === 'USDT') {
      return { ticker: 'usdt', network: 'eth' }
    }
    if (symbol === 'USDC') {
      return { ticker: 'usdc', network: 'eth' }
    }
  }

  if (network === 'base') {
    // ChangeNOW may not support Base directly - check API or route via Ethereum
    // For now, return null to indicate unsupported
    if (symbol === 'ETH') {
      // Try Ethereum as fallback
      return { ticker: 'eth', network: 'eth' }
    }
    if (symbol === 'USDT') {
      // Try Ethereum USDT as fallback
      return { ticker: 'usdt', network: 'eth' }
    }
    return null
  }

  // TON
  if (network === 'ton') {
    if (symbol === 'TON') {
      return { ticker: 'ton', network: 'ton' }
    }
    if (symbol === 'USDT') {
      return { ticker: 'usdt', network: 'ton' }
    }
  }

  // TRON
  if (network === 'tron' || network === 'trx') {
    if (symbol === 'TRX') {
      return { ticker: 'trx', network: 'trx' }
    }
    if (symbol === 'USDT') {
      // ChangeNOW uses "trx" for TRON network
      return { ticker: 'usdt', network: 'trx' }
    }
  }

  return null
}

/**
 * Get all supported ChangeNOW assets for a network
 */
export function getSupportedAssets(networkId: string): string[] {
  const network = networkId.toLowerCase()
  const assets: string[] = []

  if (network === 'ethereum' || network === 'eth') {
    assets.push('ETH', 'USDT', 'USDC')
  } else if (network === 'ton') {
    assets.push('TON', 'USDT')
  } else if (network === 'tron' || network === 'trx') {
    assets.push('TRX', 'USDT')
  }

  return assets
}

