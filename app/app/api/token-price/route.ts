/**
 * Token price API endpoint
 * Fetches token prices from multiple sources:
 * 1. CoinGecko API (primary, free, no API key required)
 * 2. CoinMarketCap API (fallback, requires API key)
 * 3. CryptoCompare API (additional source)
 * Used as fallback for calculating exchange rates when providers don't work
 */

import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { checkRateLimit, getClientIP } from '@/lib/api/rateLimit'
import { validateQuery, routeSchemas } from '@/lib/api/validate'
import { randomUUID } from 'crypto'

// Token ID to CoinGecko ID mapping
const TOKEN_TO_COINGECKO_ID: Record<string, string> = {
  // Native tokens
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
  // Ecosystem tokens
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
  'matic-erc20': 'MATIC',
}

// Token ID to CryptoCompare symbol mapping (for CryptoCompare API)
const TOKEN_TO_CRYPTOCOMPARE_SYMBOL: Record<string, string> = {
  eth: 'ETH',
  bnb: 'BNB',
  matic: 'MATIC',
  avax: 'AVAX',
  op: 'OP',
  arb: 'ARB',
  base: 'BASE',
  celo: 'CELO',
  cro: 'CRO',
  kava: 'KAVA',
  btc: 'BTC',
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
  'matic-erc20': 'MATIC',
}

export const runtime = 'nodejs'

// In-memory cache as fallback (faster for frequent requests)
const memoryCache = new Map<string, { price: number; expiresAt: number }>()
const CACHE_TTL_MS = 60000 // 60 seconds
const REDIS_CACHE_TTL_SEC = 60 // Redis TTL in seconds

export async function GET(request: NextRequest) {
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
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
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
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          },
        }
      )
    }

    const tokenIds = validation.data.ids.split(',').filter(Boolean)

    // Check if we're in build phase - EARLY RETURN before any fetch/redis operations
    // Multiple checks for reliability: NEXT_PHASE, VERCEL, CI, and explicit flag
    const isBuildTime = 
      process.env.NEXT_PHASE === 'phase-production-build' ||
      process.env.VERCEL === '1' ||
      process.env.CI === 'true' ||
      process.env.DISABLE_BUILD_TIME_FETCH === '1'
    
    // Early return during build - skip all network/cache operations
    if (isBuildTime) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[token-price] Build-time: returning empty prices (network unavailable)')
      }
      return NextResponse.json({ prices: {} }, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      })
    }

    const now = Date.now()
    const cachedPrices: Record<string, number> = {}
    const uncachedIds: string[] = []
    
    // Check in-memory cache first (fastest)
    for (const id of tokenIds) {
      const cacheKey = id.toLowerCase()
      const cached = memoryCache.get(cacheKey)
      if (cached && cached.expiresAt > now) {
        cachedPrices[cacheKey] = cached.price
      } else {
        uncachedIds.push(cacheKey)
      }
    }
    
    // Check Redis cache for uncached items (if Redis is available)
    if (uncachedIds.length > 0 && process.env.UPSTASH_REDIS_REST_URL) {
      try {
        const redisKeys = uncachedIds.map(id => `price:${id}`)
        const redisValues = await Promise.allSettled(
          redisKeys.map(key => redis.get(key))
        )
        
        for (let i = 0; i < uncachedIds.length; i++) {
          const result = redisValues[i]
          if (result.status === 'fulfilled' && result.value) {
            try {
              const value = typeof result.value === 'string' ? result.value : String(result.value)
              const parsed = JSON.parse(value) as { price: number; timestamp: number }
              // Use if cached within last 60 seconds
              if (parsed.price > 0 && (now - parsed.timestamp) < CACHE_TTL_MS) {
                const id = uncachedIds[i]
                cachedPrices[id] = parsed.price
                // Update in-memory cache
                memoryCache.set(id, {
                  price: parsed.price,
                  expiresAt: now + CACHE_TTL_MS,
                })
              }
            } catch {
              // Invalid cache entry, ignore
            }
          }
        }
      } catch (error) {
        // Redis unavailable, continue with API fetch
        // During build, skip Redis silently
        if (!isBuildTime && process.env.NODE_ENV === 'development') {
          console.warn('[token-price] Redis unavailable, using in-memory cache only')
        }
      }
      
      // Filter out cached items
      const remainingUncached = uncachedIds.filter(id => !cachedPrices[id])
      uncachedIds.length = 0
      uncachedIds.push(...remainingUncached)
    }

    let fetchedPrices: Record<string, number> = {}
    if (uncachedIds.length > 0) {
      // Prepare mappings for all providers
      const uncachedCoingeckoIdsSet = new Set<string>()
      const tokenIdToCoingeckoMap: Record<string, string> = {}
      
      for (const id of uncachedIds) {
        const coingeckoId = TOKEN_TO_COINGECKO_ID[id] || TOKEN_TO_COINGECKO_ID[id.toLowerCase()]
        if (coingeckoId) {
          uncachedCoingeckoIdsSet.add(coingeckoId)
          tokenIdToCoingeckoMap[id] = coingeckoId
        }
      }
      
      const uncachedCoingeckoIds = Array.from(uncachedCoingeckoIdsSet)
      
      // Parallel fetching from all sources for maximum speed
      const pricePromises: Promise<void>[] = []
      
      // 1. CoinGecko (fastest, free)
      // Skip network calls during build
      if (uncachedCoingeckoIds.length > 0 && !isBuildTime) {
        const idsParam = uncachedCoingeckoIds.join(',')
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd`
        
        pricePromises.push(
          fetch(url, { signal: AbortSignal.timeout(1000) })
            .then(async (response) => {
              if (response.ok) {
                const data = await response.json()
                
                // Map CoinGecko IDs back to original token IDs
                for (const [originalId, coingeckoId] of Object.entries(tokenIdToCoingeckoMap)) {
                  if (data[coingeckoId] && typeof data[coingeckoId] === 'object' && 'usd' in data[coingeckoId]) {
                    const price = (data[coingeckoId] as any).usd
                    if (typeof price === 'number' && price > 0) {
                      const originalIdLower = originalId.toLowerCase()
                      if (!fetchedPrices[originalIdLower]) {
                        fetchedPrices[originalIdLower] = price
                        const cacheKey = originalId.toLowerCase()
                        // Update in-memory cache
                        memoryCache.set(cacheKey, {
                          price,
                          expiresAt: now + CACHE_TTL_MS,
                        })
                        // Update Redis cache (async, don't wait) - only if Redis is configured
                        if (process.env.UPSTASH_REDIS_REST_URL) {
                          redis.setex(`price:${cacheKey}`, REDIS_CACHE_TTL_SEC, JSON.stringify({ price, timestamp: now })).catch(() => {})
                        }
                      }
                    }
                  }
                }
                
                // Map all variations for backward compatibility
                for (const [tokenId, coingeckoId] of Object.entries(TOKEN_TO_COINGECKO_ID)) {
                  if (uncachedCoingeckoIdsSet.has(coingeckoId) && data[coingeckoId] && typeof data[coingeckoId] === 'object' && 'usd' in data[coingeckoId]) {
                    const price = (data[coingeckoId] as any).usd
                    if (typeof price === 'number' && price > 0) {
                      const tokenIdLower = tokenId.toLowerCase()
                      if (!fetchedPrices[tokenIdLower]) {
                        fetchedPrices[tokenIdLower] = price
                        // Update in-memory cache
                        memoryCache.set(tokenIdLower, {
                          price,
                          expiresAt: now + CACHE_TTL_MS,
                        })
                        // Update Redis cache (async, don't wait) - only if Redis is configured
                        if (process.env.UPSTASH_REDIS_REST_URL) {
                          redis.setex(`price:${tokenIdLower}`, REDIS_CACHE_TTL_SEC, JSON.stringify({ price, timestamp: now })).catch(() => {})
                        }
                      }
                    }
                  }
                }
              }
            })
            .catch(() => {
              // Silently fail - will use other sources
            })
        )
      }
      
      // 2. CoinMarketCap (parallel, if API key available)
      // Skip network calls during build
      const cmcApiKey = process.env.COINMARKETCAP_API_KEY
      if (cmcApiKey && uncachedIds.length > 0 && !isBuildTime) {
        const cmcSymbols = uncachedIds
          .map(id => TOKEN_TO_CMC_SYMBOL[id] || id.toUpperCase())
          .filter(Boolean)
          .join(',')
        
        if (cmcSymbols) {
          pricePromises.push(
            fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${cmcSymbols}&convert=USD`, {
              headers: { 'X-CMC_PRO_API_KEY': cmcApiKey },
              signal: AbortSignal.timeout(1000),
            })
              .then(async (response) => {
                if (response.ok) {
                  const cmcData = await response.json() as any
                  
                  if (cmcData.data) {
                    for (const [symbol, coins] of Object.entries(cmcData.data)) {
                      if (coins && Array.isArray(coins) && coins.length > 0 && coins[0].quote?.USD?.price) {
                        const price = coins[0].quote.USD.price
                        const symbolLower = symbol.toLowerCase()
                        
                        for (const tokenId of uncachedIds) {
                          const cmcSymbol = TOKEN_TO_CMC_SYMBOL[tokenId] || tokenId.toUpperCase()
                          if ((cmcSymbol === symbol || symbolLower === tokenId) && !fetchedPrices[tokenId]) {
                            fetchedPrices[tokenId] = price
                            // Update in-memory cache
                            memoryCache.set(tokenId, {
                              price,
                              expiresAt: now + CACHE_TTL_MS,
                            })
                            // Update Redis cache (async, don't wait) - only if Redis is configured
                            if (process.env.UPSTASH_REDIS_REST_URL) {
                              redis.setex(`price:${tokenId}`, REDIS_CACHE_TTL_SEC, JSON.stringify({ price, timestamp: now })).catch(() => {})
                            }
                            break
                          }
                        }
                      }
                    }
                  }
                }
              })
              .catch(() => {
                // Silently fail
              })
          )
        }
      }
      
      // 3. CryptoCompare (parallel, free)
      // Skip network calls during build
      if (uncachedIds.length > 0 && !isBuildTime) {
        const ccSymbols = uncachedIds
          .map(id => TOKEN_TO_CRYPTOCOMPARE_SYMBOL[id] || id.toUpperCase())
          .filter(Boolean)
          .join(',')
        
        if (ccSymbols) {
          pricePromises.push(
            fetch(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${ccSymbols}&tsyms=USD`, {
              signal: AbortSignal.timeout(1000),
            })
              .then(async (response) => {
                if (response.ok) {
                  const ccData = await response.json() as Record<string, { USD?: number }>
                  
                  for (const [symbol, priceData] of Object.entries(ccData)) {
                    if (priceData?.USD && typeof priceData.USD === 'number' && priceData.USD > 0) {
                      const symbolLower = symbol.toLowerCase()
                      
                      for (const tokenId of uncachedIds) {
                        const ccSymbol = TOKEN_TO_CRYPTOCOMPARE_SYMBOL[tokenId] || tokenId.toUpperCase()
                        if ((ccSymbol === symbol || symbolLower === tokenId) && !fetchedPrices[tokenId]) {
                          fetchedPrices[tokenId] = priceData.USD
                          // Update in-memory cache
                          memoryCache.set(tokenId, {
                            price: priceData.USD,
                            expiresAt: now + CACHE_TTL_MS,
                          })
                          // Update Redis cache (async, don't wait) - only if Redis is configured
                          if (process.env.UPSTASH_REDIS_REST_URL) {
                            redis.setex(`price:${tokenId}`, REDIS_CACHE_TTL_SEC, JSON.stringify({ price: priceData.USD, timestamp: now })).catch(() => {})
                          }
                          break
                        }
                      }
                    }
                  }
                }
              })
              .catch(() => {
                // Silently fail
              })
          )
        }
      }
      
      // Wait for all requests with a race condition - return as soon as we have all requested prices
      // This optimizes response time
      const settledResults = await Promise.allSettled(pricePromises)
      
      // Check if we have all prices we need
      const hasAllPrices = uncachedIds.every(id => fetchedPrices[id.toLowerCase()])
      
      // Logging only in development
      if (process.env.NODE_ENV === 'development') {
        if (hasAllPrices) {
          console.log('[token-price] All prices found, returning early for speed')
        } else {
          const missing = uncachedIds.filter(id => !fetchedPrices[id.toLowerCase()])
          if (missing.length > 0) {
            console.log('[token-price] Still missing prices:', missing)
          }
        }
      }
    }

    const prices = { ...cachedPrices, ...fetchedPrices }
    
    // Logging only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[token-price] Final prices response:', {
        requestedIds: tokenIds,
        foundPrices: Object.keys(prices),
      })
    }

    // Return response with cache headers
    // Cache for 30 seconds - prices update frequently but not too fast
    return NextResponse.json({ prices }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    // During build, return empty prices instead of error to prevent build failures
    // Use same build-time detection as early return
    const isBuildTime = 
      process.env.NEXT_PHASE === 'phase-production-build' ||
      process.env.VERCEL === '1' ||
      process.env.CI === 'true' ||
      process.env.DISABLE_BUILD_TIME_FETCH === '1'
    
    if (isBuildTime) {
      // Build-time: return empty prices gracefully, log warning only
      if (process.env.NODE_ENV === 'development') {
        console.warn('[token-price] Build-time: returning empty prices (network unavailable)')
      }
      return NextResponse.json({ prices: {} }, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      })
    }
    
    // Runtime: log errors, but sanitize in production
    if (process.env.NODE_ENV === 'development') {
      console.error('[token-price] Error:', error)
    } else {
      console.error('[token-price] Error fetching prices')
    }
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    )
  }
}

