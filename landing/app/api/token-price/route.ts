/**
 * Token price API endpoint with optimized caching
 * - Fresh cache: 3 seconds (fast response <200ms)
 * - Stale cache: 10 minutes (fallback if CoinGecko fails)
 * - Stale-while-revalidate pattern: returns stale cache immediately, refreshes in background
 */

import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { checkRateLimit, getClientIP } from '@/lib/api/rateLimit'
import { validateQuery, routeSchemas } from '@/lib/api/validate'
import { randomUUID } from 'crypto'

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
const FRESH_CACHE_TTL_MS = 3_000 // 3 seconds - fresh cache
const STALE_CACHE_TTL_MS = 600_000 // 10 minutes - stale cache
const FRESH_CACHE_TTL_SEC = 3
const STALE_CACHE_TTL_SEC = 600
const COINGECKO_TIMEOUT_MS = 2000 // 2 seconds max wait for CoinGecko

interface CacheEntry {
  price: number
  timestamp: number
}

// In-flight refresh deduplication (module-scope Map)
const inFlightRefresh = new Map<string, Promise<void>>()

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
  const requestId = randomUUID()
  
  try {
    // Rate limiting
    const ip = getClientIP(request)
    const rateLimitResult = await checkRateLimit('token-price', ip)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { prices: {}, ok: false, error: 'RATE_LIMITED', retryAfter: rateLimitResult.retryAfter, requestId },
        { 
          status: 429,
          headers: {
            'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=60',
          },
        }
      )
    }

    // Validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryObj: Record<string, string> = {}
    for (const [key, value] of searchParams.entries()) {
      queryObj[key] = value
    }
    
    const validation = validateQuery(routeSchemas['token-price'], queryObj, requestId)
    if (!validation.success) {
      console.error(`[token-price] [${requestId}] Validation failed:`, validation.details)
      return NextResponse.json(
        { prices: {}, ok: false, error: validation.error, details: validation.details, requestId },
        { 
          status: 400,
          headers: {
            'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=60',
          },
        }
      )
    }

    const tokenIds = validation.data.ids.split(',').filter(Boolean)

    // Build-time check - EARLY RETURN (only during actual build, not runtime)
    const isBuildTime = 
      process.env.NEXT_PHASE === 'phase-production-build' ||
      process.env.CI === 'true' ||
      process.env.DISABLE_BUILD_TIME_FETCH === '1'
    
    if (isBuildTime) {
      return NextResponse.json({ prices: {}, ok: false, source: 'empty' }, {
        headers: {
          'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=60',
          'Content-Type': 'application/json',
        },
      })
    }

    const now = Date.now()
    const normalizedIds = tokenIds.map(id => id.toLowerCase()).sort()
    const idsKey = normalizedIds.join(',')
    const cacheKeys = normalizedIds.map(id => `token-price:v1:${id}`)
    
    let prices: Record<string, number> = {}
    let source: 'cache_fresh' | 'cache_stale' | 'coingecko' | 'empty' = 'empty'
    let hasFreshCache = false
    let hasStaleCache = false
    let needsBackgroundRefresh = false
    
    // Try Redis cache
    if (process.env.UPSTASH_REDIS_REST_URL) {
      try {
        const cacheEntries = await Promise.allSettled(
          cacheKeys.map(key => redis.get(key))
        )
        
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
                // Stale cache - return immediately, refresh in background
                prices[normalizedIds[i]] = entry.price
                hasStaleCache = true
                needsBackgroundRefresh = true
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
        // Redis unavailable, will try CoinGecko synchronously
        if (process.env.NODE_ENV === 'development') {
          console.warn('[token-price] Redis unavailable:', error)
        }
      }
    }
    
    // Stale-while-revalidate: if we have cache (even stale), return immediately and refresh in background
    if (Object.keys(prices).length === normalizedIds.length) {
      // Trigger background refresh if cache is stale
      if (needsBackgroundRefresh && !inFlightRefresh.has(idsKey)) {
        const refreshPromise = (async () => {
          try {
            const refreshPrices = await fetchFromCoinGecko(normalizedIds)
            if (Object.keys(refreshPrices).length > 0 && process.env.UPSTASH_REDIS_REST_URL) {
              const updatePromises = Object.entries(refreshPrices).map(([id, price]) => {
                const key = `token-price:v1:${id}`
                const entry: CacheEntry = { price, timestamp: Date.now() }
                return redis.setex(key, STALE_CACHE_TTL_SEC, JSON.stringify(entry)).catch(() => {})
              })
              await Promise.all(updatePromises)
            }
          } catch (error) {
            // Silent fail - background refresh shouldn't block
          } finally {
            inFlightRefresh.delete(idsKey)
          }
        })()
        inFlightRefresh.set(idsKey, refreshPromise)
      }
      
      return NextResponse.json({ prices, ok: true, source }, {
        headers: {
          'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=60',
          'Content-Type': 'application/json',
        },
      })
    }
    
    // No cache available - fetch from CoinGecko synchronously
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
      
      return NextResponse.json({ prices, ok: Object.keys(prices).length > 0, source }, {
        headers: {
          'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=60',
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      // CoinGecko failed - return stale cache if available, otherwise empty
      if (hasStaleCache && Object.keys(prices).length > 0) {
        source = 'cache_stale'
        return NextResponse.json({ prices, ok: true, source }, {
          headers: {
            'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=60',
            'Content-Type': 'application/json',
          },
        })
      }
      
      // No cache available - return empty
      return NextResponse.json({ prices: {}, ok: false, source: 'empty' }, {
        headers: {
          'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=60',
          'Content-Type': 'application/json',
        },
      })
    }
  } catch (error) {
    // Build-time or other error
    console.error(`[token-price] [${requestId}] Error:`, error)
    
    return NextResponse.json({ prices: {}, ok: false, source: 'empty' }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=60',
        'Content-Type': 'application/json',
      },
    })
  }
}
