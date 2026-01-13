/**
 * Token price API endpoint - simplified with Next.js fetch cache
 * Uses Next.js built-in fetch cache with 3-second revalidation
 */

import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering to prevent static generation warnings
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Token ID to CoinGecko ID mapping
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
}

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // Build-time check - return empty during build
  const isBuildTime = 
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.CI === 'true' ||
    process.env.DISABLE_BUILD_TIME_FETCH === '1'
  
  if (isBuildTime) {
    return NextResponse.json({ prices: {}, ok: false, source: 'empty' }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3',
        'Content-Type': 'application/json',
      },
    })
  }

  const ids = request.nextUrl.searchParams.get('ids')
  if (!ids) {
    return NextResponse.json({ prices: {}, ok: false }, { status: 400 })
  }

  const tokenIds = ids.split(',').filter(Boolean).map(id => id.toLowerCase().trim())
  if (tokenIds.length === 0) {
    return NextResponse.json({ prices: {}, ok: false }, { status: 400 })
  }

  // Map token IDs to CoinGecko IDs
  const coingeckoIdsSet = new Set<string>()
  const tokenIdToCoingeckoMap: Record<string, string> = {}
  
  for (const id of tokenIds) {
    const coingeckoId = TOKEN_TO_COINGECKO_ID[id] || TOKEN_TO_COINGECKO_ID[id.toLowerCase()]
    if (coingeckoId) {
      coingeckoIdsSet.add(coingeckoId)
      tokenIdToCoingeckoMap[id.toLowerCase()] = coingeckoId
    }
  }
  
  if (coingeckoIdsSet.size === 0) {
    return NextResponse.json({ prices: {}, ok: false }, { status: 400 })
  }

  const idsParam = Array.from(coingeckoIdsSet).join(',')
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd`

  try {
    const res = await fetch(url, {
      next: { revalidate: 3 }, // Next.js fetch cache - 3 seconds
    })

    if (!res.ok) {
      return NextResponse.json({ prices: {}, ok: false }, { status: 502 })
    }

    const data = await res.json() as Record<string, { usd: number }>
    const prices: Record<string, number> = {}

    // Map CoinGecko response back to original token IDs
    for (const [originalId, coingeckoId] of Object.entries(tokenIdToCoingeckoMap)) {
      if (data[coingeckoId]?.usd && typeof data[coingeckoId].usd === 'number' && data[coingeckoId].usd > 0) {
        prices[originalId] = data[coingeckoId].usd
      }
    }

    // Verify we have all requested prices
    const hasAllPrices = tokenIds.every(id => prices[id] && prices[id] > 0)

    return NextResponse.json(
      {
        ok: hasAllPrices,
        prices,
        source: hasAllPrices ? 'coingecko' : 'empty',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3',
        },
      }
    )
  } catch (error) {
    return NextResponse.json({ prices: {}, ok: false }, { status: 502 })
  }
}
