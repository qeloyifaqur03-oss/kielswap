/**
 * Token price API endpoint with optimized caching
 * - Fresh cache: 60 seconds (fast response <200ms)
 * - Stale cache: 10 minutes (fallback if CoinGecko fails)
 * - Stale-while-revalidate pattern
 */

import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

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

// Cache TTL constants
const FRESH_CACHE_TTL_MS = 60_000 // 60 seconds - fresh cache
const STALE_CACHE_TTL_MS = 600_000 // 10 minutes - stale cache
const FRESH_CACHE_TTL_SEC = 60
const STALE_CACHE_TTL_SEC = 600
const COINGECKO_TIMEOUT_MS = 2000 // 2 seconds max wait for CoinGecko

interface CacheEntry {
  price: number
  timestamp: number
}

async function fetchFromCoinGecko(tokenIds: string[]): Promise<Record<string, number>> {
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
    return {}
  }
  
  const idsParam = Array.from(coingeckoIdsSet).join(',')
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd`
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), COINGECKO_TIMEOUT_MS)
  
  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      return {}
    }
    
    const data = await response.json() as Record<string, { usd: number }>
    const prices: Record<string, number> = {}
    
    for (const [originalId, coingeckoId] of Object.entries(tokenIdToCoingeckoMap)) {
      if (data[coingeckoId]?.usd && typeof data[coingeckoId].usd === 'number' && data[coingeckoId].usd > 0) {
        prices[originalId] = data[coingeckoId].usd
      }
    }
    
    return prices
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const searchParams = request.nextUrl.searchParams
    const tokenIds = searchParams.get('ids')?.split(',').filter(Boolean) || []
    
    if (tokenIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing ids parameter' },
        { status: 400 }
      )
    }

    // Build-time check - EARLY RETURN
    const isBuildTime = 
      process.env.NEXT_PHASE === 'phase-production-build' ||
      process.env.VERCEL === '1' ||
      process.env.CI === 'true' ||
      process.env.DISABLE_BUILD_TIME_FETCH === '1'
    
    if (isBuildTime) {
      return NextResponse.json({ prices: {}, ok: false, source: 'empty' }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'Content-Type': 'application/json',
        },
      })
    }

    const now = Date.now()
    const normalizedIds = tokenIds.map(id => id.toLowerCase())
    const cacheKeys = normalizedIds.map(id => `token-price:v1:${id}`)
    
    let prices: Record<string, number> = {}
    let source: 'cache_fresh' | 'cache_stale' | 'coingecko' | 'empty' = 'empty'
    let hasFreshCache = false
    let hasStaleCache = false
    
    // Try Redis cache
    if (process.env.UPSTASH_REDIS_REST_URL) {
      try {
        const cacheEntries = await Promise.allSettled(
          cacheKeys.map(key => redis.get(key))
        )
        
        const staleEntries: Array<{ key: string; value: CacheEntry }> = []
        
        for (let i = 0; i < normalizedIds.length; i++) {
          const result = cacheEntries[i]
          if (result.status === 'fulfilled' && result.value) {
            try {
              const value = typeof result.value === 'string' ? result.value : String(result.value)
              const entry = JSON.parse(value) as CacheEntry
              const age = now - entry.timestamp
              
              if (entry.price > 0 && age < FRESH_CACHE_TTL_MS) {
                // Fresh cache
                prices[normalizedIds[i]] = entry.price
                hasFreshCache = true
              } else if (entry.price > 0 && age < STALE_CACHE_TTL_MS) {
                // Stale cache
                staleEntries.push({ key: cacheKeys[i], value: entry })
                prices[normalizedIds[i]] = entry.price
                hasStaleCache = true
              }
            } catch {
              // Invalid cache entry, ignore
            }
          }
        }
        
        // Determine source
        if (hasFreshCache && Object.keys(prices).length === normalizedIds.length) {
          source = 'cache_fresh'
        } else if (hasStaleCache && Object.keys(prices).length === normalizedIds.length) {
          source = 'cache_stale'
        }
      } catch (error) {
        // Redis unavailable, continue to CoinGecko
        if (process.env.NODE_ENV === 'development') {
          console.warn('[token-price] Redis unavailable:', error)
        }
      }
    }
    
    // If we have all prices from cache, return immediately
    if (Object.keys(prices).length === normalizedIds.length) {
      const latencyMs = Date.now() - startTime
      if (process.env.NODE_ENV === 'development') {
        console.log(`[token-price] ${source} latency: ${latencyMs}ms`)
      }
      
      return NextResponse.json({ prices, ok: true, source }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'Content-Type': 'application/json',
        },
      })
    }
    
    // Missing prices - try CoinGecko
    const missingIds = normalizedIds.filter(id => !prices[id])
    let coingeckoPrices: Record<string, number> = {}
    
    try {
      coingeckoPrices = await fetchFromCoinGecko(missingIds)
      source = Object.keys(prices).length > 0 ? 'cache_stale' : 'coingecko'
      
      // Update Redis cache (async, don't wait)
      if (process.env.UPSTASH_REDIS_REST_URL && Object.keys(coingeckoPrices).length > 0) {
        const updatePromises = Object.entries(coingeckoPrices).map(([id, price]) => {
          const key = `token-price:v1:${id}`
          const entry: CacheEntry = { price, timestamp: now }
          return redis.setex(key, STALE_CACHE_TTL_SEC, JSON.stringify(entry)).catch(() => {})
        })
        Promise.all(updatePromises).catch(() => {})
      }
      
      // Merge prices
      prices = { ...prices, ...coingeckoPrices }
      
      const latencyMs = Date.now() - startTime
      if (process.env.NODE_ENV === 'development') {
        console.log(`[token-price] ${source} latency: ${latencyMs}ms`)
      }
      
      return NextResponse.json({ prices, ok: Object.keys(prices).length > 0, source }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      // CoinGecko failed - return stale cache if available, otherwise empty
      if (hasStaleCache && Object.keys(prices).length > 0) {
        source = 'cache_stale'
        const latencyMs = Date.now() - startTime
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[token-price] CoinGecko failed, using stale cache. latency: ${latencyMs}ms`, error)
        }
        
        return NextResponse.json({ prices, ok: true, source }, {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            'Content-Type': 'application/json',
          },
        })
      }
      
      // No cache available - return empty
      const latencyMs = Date.now() - startTime
      if (process.env.NODE_ENV === 'development') {
        console.error(`[token-price] CoinGecko failed, no cache. latency: ${latencyMs}ms`, error)
      }
      
      return NextResponse.json({ prices: {}, ok: false, source: 'empty' }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'Content-Type': 'application/json',
        },
      })
    }
  } catch (error) {
    // Build-time or other error
    const latencyMs = Date.now() - startTime
    if (process.env.NODE_ENV === 'development') {
      console.error(`[token-price] Error. latency: ${latencyMs}ms`, error)
    }
    
    return NextResponse.json({ prices: {}, ok: false, source: 'empty' }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'Content-Type': 'application/json',
      },
    })
  }
}
