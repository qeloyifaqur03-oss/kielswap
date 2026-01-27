/**
 * Token icon API endpoint
 * Fetches token icons from CoinGecko API (priority) or CoinMarketCap API (fallback)
 * Returns only PNG/JPEG URLs, filters out SVG
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

// Token ID to CoinGecko ID mapping (reuse from token-price route)
const TOKEN_TO_COINGECKO_ID: Record<string, string> = {
  eth: 'ethereum',
  bnb: 'binancecoin',
  matic: 'matic-network',
  pol: 'matic-network',
  avax: 'avalanche-2',
  op: 'optimism',
  arb: 'arbitrum',
  base: 'base',
  zksync: 'zksync',
  linea: 'linea',
  scroll: 'scroll',
  blast: 'blast',
  gnosis: 'gnosis',
  opbnb: 'opbnb',
  mantle: 'mantle',
  cronos: 'cronos',
  cro: 'crypto-com-chain',
  rootstock: 'rootstock',
  rbtc: 'rootstock',
  sonic: 'sonic',
  s: 'sonic',
  core: 'coredaoorg',
  ronin: 'ronin',
  ron: 'ronin',
  xdai: 'gnosis',
  kava: 'kava',
  plasma: 'plasma',
  xpl: 'plasma',
  plume: 'plume',
  pulsechain: 'pulsechain',
  pls: 'pulsechain',
  berachain: 'berachain',
  bera: 'berachain',
  mnt: 'mantle',
  celo: 'celo',
  'immutable x': 'immutable-x',
  'immutable-zkevm': 'immutable-x',
  'world (chain)': 'worldcoin-wld',
  'world-chain': 'worldcoin-wld',
  goat: 'goat',
  btc: 'bitcoin',
  merlin: 'merlin',
  katana: 'katana',
  ink: 'ink',
  bob: 'bob',
  abstract: 'abstract',
  mon: 'monad',
  usdc: 'usd-coin',
  usdt: 'tether',
  dai: 'dai',
  weth: 'weth',
  wbtc: 'wrapped-bitcoin',
  link: 'chainlink',
  uni: 'uniswap',
  aave: 'aave',
  crv: 'curve-dao-token',
  mkr: 'maker',
  snx: 'havven',
  comp: 'compound-governance-token',
  sushi: 'sushi',
  susd: 'nusd',
  '1inch': '1inch',
  frax: 'frax',
  fxs: 'frax-share',
  ldo: 'lido-dao',
  grt: 'the-graph',
  'matic-erc20': 'matic-network',
  gmx: 'gmx',
  velo: 'velodrome-finance',
  aero: 'aerodrome-finance',
  cake: 'pancakeswap-token',
  xvs: 'venus',
  joe: 'trader-joe',
  qi: 'qi-dao',
  quick: 'quickswap',
  'mnt-token': 'mantle',
  'usdt-ethereum': 'tether',
  'usdt-bnb': 'tether',
}

// Token ID to CoinMarketCap symbol mapping
const TOKEN_TO_CMC_SYMBOL: Record<string, string> = {
  eth: 'ETH',
  bnb: 'BNB',
  matic: 'MATIC',
  pol: 'POL',
  avax: 'AVAX',
  cro: 'CRO',
  celo: 'CELO',
  s: 'S',
  pls: 'PLS',
  ron: 'RON',
  mnt: 'MNT',
  bera: 'BERA',
  core: 'CORE',
  xdai: 'XDAI',
  rbtc: 'RBTC',
  xpl: 'XPL',
  plume: 'PLUME',
  kava: 'KAVA',
  btc: 'BTC',
  op: 'OP',
  arb: 'ARB',
  usdc: 'USDC',
  usdt: 'USDT',
  dai: 'DAI',
  weth: 'WETH',
  wbtc: 'WBTC',
  link: 'LINK',
  uni: 'UNI',
  aave: 'AAVE',
  crv: 'CRV',
  mkr: 'MKR',
  snx: 'SNX',
  comp: 'COMP',
  sushi: 'SUSHI',
  '1inch': '1INCH',
  frax: 'FRAX',
  fxs: 'FXS',
  ldo: 'LDO',
  grt: 'GRT',
  gmx: 'GMX',
  velo: 'VELO',
  aero: 'AERO',
  cake: 'CAKE',
  xvs: 'XVS',
  joe: 'JOE',
  qi: 'QI',
  quick: 'QUICK',
  'mnt-token': 'MNT',
  'usdt-ethereum': 'USDT',
  'usdt-bnb': 'USDT',
}

// Check if Content-Type indicates PNG/JPEG
function isValidImageContentType(contentType: string | null): boolean {
  if (!contentType) return false
  const lower = contentType.toLowerCase()
  return lower.startsWith('image/png') || lower.startsWith('image/jpeg') || lower.startsWith('image/jpg')
}

// Get token icon URL from CoinGecko API
async function getCoinGeckoIconUrl(coingeckoId: string): Promise<string | null> {
  try {
    // CoinGecko API: get coin data with image URL
    const url = `https://api.coingecko.com/api/v3/coins/${coingeckoId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`
    
    const response = await fetch(url, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json() as { image?: { large?: string } }
    const imageUrl = data.image?.large
    
    if (!imageUrl) {
      return null
    }
    
    // Don't filter by URL extension - check Content-Type when fetching
    return imageUrl
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  const tokenId = request.nextUrl.searchParams.get('id')
  
  if (!tokenId) {
    return new NextResponse(null, { status: 400 })
  }
  
  const normalizedId = tokenId.toLowerCase().trim()
  
  // Try CoinGecko first
  const coingeckoId = TOKEN_TO_COINGECKO_ID[normalizedId]
  if (coingeckoId) {
    const iconUrl = await getCoinGeckoIconUrl(coingeckoId)
    if (iconUrl) {
      // Proxy the image: fetch from CoinGecko and return as image
      try {
        const imageResponse = await fetch(iconUrl, {
          next: { revalidate: 86400 }, // Cache for 24 hours
        })
        
        if (imageResponse.ok) {
          const contentType = imageResponse.headers.get('content-type')
          
          // Check Content-Type instead of URL extension
          if (!isValidImageContentType(contentType)) {
            // Log in dev mode
            if (process.env.NODE_ENV === 'development') {
              console.log(`[icons] token=${normalizedId} status=${imageResponse.status} content-type=${contentType} - invalid format, skipping`)
            }
            return new NextResponse(null, { status: 404 })
          }
          
          const imageBuffer = await imageResponse.arrayBuffer()
          const finalContentType = contentType || 'image/png'
          
          // Log in dev mode for first request
          if (process.env.NODE_ENV === 'development') {
            console.log(`[icons] token=${normalizedId} status=${imageResponse.status} content-type=${finalContentType} bytes=${imageBuffer.byteLength}`)
          }
          
          return new NextResponse(imageBuffer, {
            headers: {
              'Content-Type': finalContentType,
              'Cache-Control': 'public, s-maxage=86400', // Cache for 24 hours
            },
          })
        }
      } catch (error) {
        // Fall through to 404
        if (process.env.NODE_ENV === 'development') {
          console.log(`[icons] token=${normalizedId} error fetching image:`, error)
        }
      }
    }
  }
  
  // Not found - return 404
  if (process.env.NODE_ENV === 'development') {
    console.log(`[icons] token=${normalizedId} status=404 - not found in mapping`)
  }
  return new NextResponse(null, { status: 404 })
}
