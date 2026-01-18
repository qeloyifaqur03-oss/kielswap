/**
 * Token price ID mapping utilities
 * Provides unified mapping from token IDs to price service identifiers
 */

import { SUPPORTED_TOKENS } from './supportedAssets'

// Fallback mapping for tokens that don't have coingeckoId in supportedAssets
// This should be removed once all tokens have coingeckoId
const FALLBACK_TOKEN_TO_COINGECKO_ID: Record<string, string> = {
  // Native tokens
  eth: 'ethereum',
  bnb: 'binancecoin',
  matic: 'polygon-ecosystem-token', // CoinGecko ID for Polygon POL token (MATIC migrated to POL in Sep 2024)
  avax: 'avalanche-2',
  cro: 'crypto-com-chain',
  mnt: 'mantle',
  plume: 'plume',
  pls: 'pulsechain',
  bera: 'berachain',
  rbtc: 'rootstock',
  kava: 'kava',
  xpl: 'plasma',
  s: 'sonic',
  core: 'coredaoorg',
  xdai: 'gnosis',
  ron: 'ronin',
  btc: 'bitcoin',
  // Stablecoins
  usdc: 'usd-coin',
  'usdt-ethereum': 'tether',
  'usdt-bnb': 'tether',
  dai: 'dai',
  // Wrapped tokens
  weth: 'weth',
  wbtc: 'wrapped-bitcoin',
  // DeFi tokens
  link: 'chainlink',
  uni: 'uniswap',
  aave: 'aave',
  crv: 'curve-dao-token',
  mkr: 'maker',
  snx: 'havven',
  comp: 'compound-governance-token',
  sushi: 'sushi',
  '1inch': '1inch',
  frax: 'frax',
  fxs: 'frax-share',
  ldo: 'lido-dao',
  grt: 'the-graph',
  // Ecosystem tokens
  arb: 'arbitrum',
  op: 'optimism',
  'matic-erc20': 'polygon-ecosystem-token', // ERC20 version of POL (MATIC migrated to POL)
  // DEX tokens
  velo: 'velodrome-finance',
  aero: 'aerodrome-finance',
  cake: 'pancakeswap-token',
  xvs: 'venus',
  quick: 'quickswap',
  // Other DeFi tokens
  gmx: 'gmx',
  joe: 'trader-joe',
  qi: 'qi-dao',
  'mnt-token': 'mantle',
}

/**
 * Get CoinGecko ID for a token by its ID
 * Priority: 1) token.coingeckoId, 2) fallback mapping, 3) null
 */
export function getTokenCoingeckoId(tokenId: string): string | null {
  const normalizedId = tokenId.toLowerCase().trim()
  
  // First, try to find in supportedAssets
  const token = SUPPORTED_TOKENS.find(t => t.id.toLowerCase() === normalizedId)
  if (token?.coingeckoId) {
    return token.coingeckoId
  }
  
  // Fallback to legacy mapping
  const fallbackId = FALLBACK_TOKEN_TO_COINGECKO_ID[normalizedId]
  if (fallbackId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[price] Using fallback mapping for token ${tokenId} -> ${fallbackId}`)
    }
    return fallbackId
  }
  
  return null
}

/**
 * Get CoinMarketCap symbol for a token by its ID
 * Priority: 1) token.cmcId, 2) special mappings, 3) token.symbol, 4) null
 */
export function getTokenCmcId(tokenId: string): string | null {
  const normalizedId = tokenId.toLowerCase().trim()
  
  const token = SUPPORTED_TOKENS.find(t => t.id.toLowerCase() === normalizedId)
  if (token?.cmcId) {
    return token.cmcId
  }
  
  // Special mappings for tokens that changed symbols
  if (normalizedId === 'matic' || normalizedId === 'matic-erc20') {
    return 'POL' // MATIC migrated to POL in Sep 2024
  }
  
  // Fallback to symbol (uppercase)
  if (token?.symbol) {
    return token.symbol
  }
  
  return null
}

/**
 * Check if a token has a valid price identifier (CoinGecko or CMC)
 */
export function hasPriceId(tokenId: string): boolean {
  return getTokenCoingeckoId(tokenId) !== null || getTokenCmcId(tokenId) !== null
}
