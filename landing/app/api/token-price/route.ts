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

// Cache TTL constants
const FRESH_CACHE_TTL_MS = 3_000 // 3 seconds - fresh cache
const STALE_CACHE_TTL_MS = 600_000 // 10 minutes - stale cache
const FRESH_CACHE_TTL_SEC = 3
const STALE_CACHE_TTL_SEC = 600
const COINGECKO_TIMEOUT_MS = 2000 // 2 seconds max wait for CoinGecko
const MEMORY_TTL_MS = 3000 // 3 seconds - in-memory cache TTL

interface CacheEntry {
  price: number
  timestamp: number
}

interface MemoryCacheEntry {
  prices: Record<string, number>
  ts: number
}

// Single-flight deduplication for CoinGecko requests
const inFlight = new Map<string, Promise<Record<string, number>>>()

// In-memory cache for fast responses
const memoryCache = new Map<string, MemoryCacheEntry>()

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
  
  const idsParam = Array.from(coingeckoIdsSet).sort().join(',')
  
  // Check single-flight: if request already in progress, await it
  const existingPromise = inFlight.get(idsParam)
  if (existingPromise) {
    return existingPromise
  }
  
  // Create new request
  const fetchPromise = (async (): Promise<Record<string, number>> => {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), COINGECKO_TIMEOUT_MS)
    
    try {
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      
      // Throw error instead of returning empty object
      if (response.status === 429 || !response.ok) {
        throw new Error(`COINGECKO_HTTP_${response.status}`)
      }
      
      const data = await response.json() as Record<string, { usd: number }>
      const prices: Record<string, number> = {}
      
      for (const [originalId, coingeckoId] of Object.entries(tokenIdToCoingeckoMap)) {
        if (data[coingeckoId]?.usd && typeof data[coingeckoId].usd === 'number' && data[coingeckoId].usd > 0) {
          prices[originalId] = data[coingeckoId].usd
        }
      }
      
      // Update memory cache
      memoryCache.set(idsParam, { prices, ts: Date.now() })
      
      return prices
    } catch (error) {
      clearTimeout(timeoutId)
      // Transform AbortError to timeout error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('COINGECKO_TIMEOUT')
      }
      throw error
    } finally {
      // Remove from in-flight after completion
      inFlight.delete(idsParam)
    }
  })()
  
  inFlight.set(idsParam, fetchPromise)
  return fetchPromise
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
    
    // Step 1: Check memory cache first (fastest)
    const memoryEntry = memoryCache.get(idsKey)
    if (memoryEntry && (now - memoryEntry.ts) < MEMORY_TTL_MS) {
      // Memory cache is fresh
      prices = { ...memoryEntry.prices }
      source = 'cache_fresh'
      hasFreshCache = true
    }
    
    // Step 2: Try Redis cache if memory cache didn't have all prices
    if (Object.keys(prices).length < normalizedIds.length) {
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
    }
    
    // Step 3: If we have all prices from cache (memory or Redis), return immediately
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
      
      // Verify we have all required prices before returning ok:true
      const hasAllPrices = normalizedIds.every(id => prices[id] && prices[id] > 0)
      
      return NextResponse.json({ 
        prices, 
        ok: hasAllPrices, 
        source: hasAllPrices ? source : 'empty' 
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=60',
          'Content-Type': 'application/json',
        },
      })
    }
    
    // Step 4: No cache available - fetch from CoinGecko synchronously
    const missingIds = normalizedIds.filter(id => !prices[id])
    let coingeckoPrices: Record<string, number> = {}
    let stalePrices: Record<string, number> = {}
    
    // Save stale prices before attempting CoinGecko
    if (hasStaleCache) {
      stalePrices = { ...prices }
    }
    
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
      
      // Verify we have all required prices
      const hasAllPrices = normalizedIds.every(id => prices[id] && prices[id] > 0)
      
      return NextResponse.json({ 
        prices, 
        ok: hasAllPrices, 
        source: hasAllPrices ? source : 'empty' 
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=60',
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      // CoinGecko failed - return stale cache if available, otherwise 503
      if (hasStaleCache && Object.keys(stalePrices).length > 0) {
        const hasAllStalePrices = normalizedIds.every(id => stalePrices[id] && stalePrices[id] > 0)
        source = 'cache_stale'
        return NextResponse.json({ 
          prices: stalePrices, 
          ok: hasAllStalePrices, 
          source: hasAllStalePrices ? 'cache_stale' : 'empty' 
        }, {
          headers: {
            'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=60',
            'Content-Type': 'application/json',
          },
        })
      }
      
      // No cache available - return 503 Service Unavailable
      return NextResponse.json({ 
        prices: {}, 
        ok: false, 
        error: 'UPSTREAM_UNAVAILABLE',
        source: 'empty' 
      }, {
        status: 503,
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
