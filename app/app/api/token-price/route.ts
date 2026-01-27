/**
 * Token price API endpoint
 * Fetches token prices from CoinGecko API
 * 
 * API Contract:
 * - HTTP 200 → ok: true, source: 'coingecko' | 'cmc', prices: {...}
 * - HTTP 400 → ok: false, reason: 'missing_price_id' | 'invalid_request', missing: {...}
 * - HTTP 502/503 → ok: false, reason: 'upstream_error' | 'no_price_returned'
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenCoingeckoId, getTokenCmcId } from '@/lib/tokenPriceMapping'

// Force dynamic rendering to prevent static generation warnings
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Simple in-memory cache to reduce rate limiting
const priceCache = new Map<string, { prices: Record<string, number>; source: string; timestamp: number }>()
const CACHE_TTL = 15 * 1000 // 15 seconds

// CoinMarketCap API key (optional, fallback only)
const CMC_API_KEY = process.env.COINMARKETCAP_API_KEY || process.env.CMC_API_KEY || ''

// Legacy mappings removed - now using tokenPriceMapping.ts from supportedAssets

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // Build-time check - return 503 during build (not 200+ok:false)
  const isBuildTime = 
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.CI === 'true' ||
    process.env.DISABLE_BUILD_TIME_FETCH === '1'
  
  if (isBuildTime) {
    return NextResponse.json(
      { 
        ok: false, 
        reason: 'upstream_error',
        prices: {},
        source: 'empty'
      }, 
      { 
        status: 503,
        headers: {
          'Cache-Control': 'public, s-maxage=3',
          'Content-Type': 'application/json',
        },
      }
    )
  }

  const ids = request.nextUrl.searchParams.get('ids')
  if (!ids) {
    return NextResponse.json(
      { 
        ok: false, 
        reason: 'invalid_request',
        prices: {},
        missing: {}
      }, 
      { status: 400 }
    )
  }

  const tokenIds = ids.split(',').filter(Boolean).map(id => id.toLowerCase().trim())
  if (tokenIds.length === 0) {
    return NextResponse.json(
      { 
        ok: false, 
        reason: 'invalid_request',
        prices: {},
        missing: {}
      }, 
      { status: 400 }
    )
  }

  // Map token IDs to CoinGecko IDs using unified mapping
  const coingeckoIdsSet = new Set<string>()
  const tokenIdToCoingeckoMap: Record<string, string> = {}
  const missingTokenIds: string[] = []
  
  for (const id of tokenIds) {
    const coingeckoId = getTokenCoingeckoId(id)
    if (coingeckoId) {
      coingeckoIdsSet.add(coingeckoId)
      tokenIdToCoingeckoMap[id.toLowerCase()] = coingeckoId
    } else {
      missingTokenIds.push(id)
    }
  }
  
  // If any token is missing price ID, return 400 with details
  if (missingTokenIds.length > 0) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[price] Missing price ID for tokens: ${missingTokenIds.join(', ')}`)
    }
    return NextResponse.json(
      { 
        ok: false, 
        reason: 'missing_price_id',
        prices: {},
        missing: missingTokenIds.reduce((acc, id) => ({ ...acc, [id]: 'coingecko_id_not_found' }), {})
      }, 
      { status: 400 }
    )
  }
  
  // If no valid IDs found (shouldn't happen after above check, but safety)
  if (coingeckoIdsSet.size === 0) {
    return NextResponse.json(
      { 
        ok: false, 
        reason: 'missing_price_id',
        prices: {},
        missing: tokenIds.reduce((acc, id) => ({ ...acc, [id]: 'coingecko_id_not_found' }), {})
      }, 
      { status: 400 }
    )
  }

  // Check cache first
  const cacheKey = tokenIds.sort().join(',')
  const cached = priceCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(
      {
        ok: true,
        prices: cached.prices,
        source: cached.source,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=15',
        },
      }
    )
  }

  // Try CoinGecko first
  const idsParam = Array.from(coingeckoIdsSet).join(',')
  const cgUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd`

  let cgSuccess = false
  let cgPrices: Record<string, number> = {}
  let cgMissing: string[] = []

  try {
    const res = await fetch(cgUrl, {
      next: { revalidate: 15 }, // Next.js fetch cache - 15 seconds
    })

    if (!res.ok) {
      const responseText = await res.text().catch(() => '')
      const msgSnippet = responseText.substring(0, 300)
      
      // Detailed logging for upstream_error
      console.error(`[prices] upstream_error`, {
        provider: 'coingecko',
        url: cgUrl,
        status: res.status,
        statusText: res.statusText,
        tokenIds: tokenIds,
        chainIds: [], // CoinGecko doesn't use chainId for spot prices
        msgSnippet,
      })
    } else {
      const data = await res.json() as Record<string, { usd: number }>
      
      // Debug logging in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[prices] CoinGecko response keys:`, Object.keys(data))
        console.log(`[prices] Requested coingeckoIds:`, Array.from(coingeckoIdsSet))
        console.log(`[prices] Full CoinGecko response:`, JSON.stringify(data, null, 2))
      }
      
      // Map CoinGecko response back to original token IDs
      for (const [originalId, coingeckoId] of Object.entries(tokenIdToCoingeckoMap)) {
        const priceData = data[coingeckoId]
        // Check if priceData exists and has valid USD price
        // Empty object {} means CoinGecko doesn't have price for this token
        if (priceData && typeof priceData === 'object' && 'usd' in priceData && typeof priceData.usd === 'number' && priceData.usd > 0) {
          cgPrices[originalId] = priceData.usd
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[prices] Missing price for ${originalId} (coingeckoId: ${coingeckoId}), response:`, priceData || 'undefined')
          }
          cgMissing.push(originalId)
        }
      }

      if (cgMissing.length === 0) {
        cgSuccess = true
      }
    }
  } catch (error: any) {
    // Detailed logging for fetch error
    console.error(`[prices] upstream_error`, {
      provider: 'coingecko',
      url: cgUrl,
      status: 'fetch_error',
      tokenIds: tokenIds,
      chainIds: [],
      msgSnippet: error.message || String(error),
    })
  }

  // If CoinGecko succeeded, return immediately
  if (cgSuccess) {
    priceCache.set(cacheKey, { prices: cgPrices, source: 'coingecko', timestamp: Date.now() })
    return NextResponse.json(
      {
        ok: true,
        prices: cgPrices,
        source: 'coingecko',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=15',
        },
      }
    )
  }

  // Fallback to CoinMarketCap if CoinGecko failed or returned partial data
  const tokensToFetchFromCmc = cgMissing.length > 0 ? cgMissing : tokenIds
  const cmcSymbols: string[] = []
  const tokenIdToCmcMap: Record<string, string> = {}

  for (const id of tokensToFetchFromCmc) {
    const cmcSymbol = getTokenCmcId(id)
    if (cmcSymbol) {
      cmcSymbols.push(cmcSymbol)
      tokenIdToCmcMap[id.toLowerCase()] = cmcSymbol
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[prices] No CMC symbol for token ${id}, skipping CMC fallback`)
      }
    }
  }

  if (process.env.NODE_ENV === 'development' && tokensToFetchFromCmc.length > 0) {
    console.log(`[prices] Attempting CMC fallback for tokens:`, tokensToFetchFromCmc, `symbols:`, cmcSymbols, `has API key:`, !!CMC_API_KEY)
  }

  // Try CoinMarketCap if we have symbols and API key
  if (cmcSymbols.length > 0 && CMC_API_KEY) {
    try {
      const cmcUrl = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${cmcSymbols.join(',')}&CMC_PRO_API_KEY=${CMC_API_KEY}`
      
      const res = await fetch(cmcUrl, {
        next: { revalidate: 15 },
        headers: {
          'X-CMC_PRO_API_KEY': CMC_API_KEY,
        },
      })

      if (!res.ok) {
        const responseText = await res.text().catch(() => '')
        const msgSnippet = responseText.substring(0, 300)
        
        console.error(`[prices] upstream_error`, {
          provider: 'coinmarketcap',
          url: cmcUrl.replace(CMC_API_KEY, '***'),
          status: res.status,
          statusText: res.statusText,
          tokenIds: tokensToFetchFromCmc,
          symbols: cmcSymbols,
          chainIds: [],
          msgSnippet,
        })
      } else {
        const data = await res.json() as { data: Record<string, { quote: { USD: { price: number } } }> }
        
        // Debug logging in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[prices] CMC response data keys:`, Object.keys(data.data || {}))
          console.log(`[prices] Full CMC response:`, JSON.stringify(data, null, 2))
        }
        
        const cmcPrices: Record<string, number> = {}
        const cmcMissing: string[] = []

        // Map CMC response back to original token IDs
        // CoinMarketCap returns data as object, not array: data.data[symbol] = { quote: { USD: { price: ... } } }
        for (const [originalId, cmcSymbol] of Object.entries(tokenIdToCmcMap)) {
          const cmcData = data.data?.[cmcSymbol]
          if (process.env.NODE_ENV === 'development') {
            console.log(`[prices] CMC lookup for ${originalId} (symbol: ${cmcSymbol}):`, cmcData ? 'found' : 'not found', cmcData)
          }
          if (cmcData?.quote?.USD?.price && typeof cmcData.quote.USD.price === 'number' && cmcData.quote.USD.price > 0) {
            cmcPrices[originalId] = cmcData.quote.USD.price
          } else {
            cmcMissing.push(originalId)
          }
        }

        // Merge CoinGecko and CMC prices
        const mergedPrices = { ...cgPrices, ...cmcPrices }
        const allMissing = [...cgMissing.filter(id => !cmcPrices[id]), ...cmcMissing]

        if (process.env.NODE_ENV === 'development') {
          console.log(`[prices] CMC prices found:`, cmcPrices)
          console.log(`[prices] Merged prices:`, mergedPrices)
          console.log(`[prices] All missing:`, allMissing)
        }

        if (allMissing.length === 0) {
          priceCache.set(cacheKey, { prices: mergedPrices, source: 'coinmarketcap', timestamp: Date.now() })
          return NextResponse.json(
            {
              ok: true,
              prices: mergedPrices,
              source: 'coinmarketcap',
            },
            {
              headers: {
                'Cache-Control': 'public, s-maxage=15',
              },
            }
          )
        }

        // Partial success: return what we have with 200 status (not 502)
        if (Object.keys(mergedPrices).length > 0) {
          priceCache.set(cacheKey, { prices: mergedPrices, source: 'coinmarketcap', timestamp: Date.now() })
          return NextResponse.json(
            {
              ok: false,
              reason: 'no_price_returned',
              prices: mergedPrices,
              missing: allMissing.reduce((acc, id) => ({ ...acc, [id]: 'price_not_in_response' }), {}),
              source: 'coinmarketcap',
            },
            { status: 200 } // 200 even with partial data
          )
        }
      }
    } catch (error: any) {
      console.error(`[prices] upstream_error`, {
        provider: 'coinmarketcap',
        url: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
        status: 'fetch_error',
        tokenIds: tokensToFetchFromCmc,
        symbols: cmcSymbols,
        chainIds: [],
        msgSnippet: error.message || String(error),
      })
    }
  }

  // Both providers failed or CMC not available
  // If we have partial prices from CoinGecko, return them with source: 'coingecko'
  if (cgMissing.length > 0 && Object.keys(cgPrices).length > 0) {
    // Partial success: some prices available, some missing
    // Return 200 with ok: false, but source should be 'coingecko' (not 'empty')
    return NextResponse.json(
      { 
        ok: false, 
        reason: 'no_price_returned',
        prices: cgPrices,
        missing: cgMissing.reduce((acc, id) => ({ ...acc, [id]: 'price_not_in_response' }), {}),
        source: 'coingecko' // Use source from provider, not 'empty'
      }, 
      { status: 200 } // 200 even with partial data, so UI can show what's available
    )
  }
  
  // No prices at all from CoinGecko
  if (cgMissing.length > 0) {
    return NextResponse.json(
      { 
        ok: false, 
        reason: 'no_price_returned',
        prices: {},
        missing: cgMissing.reduce((acc, id) => ({ ...acc, [id]: 'price_not_in_response' }), {}),
        source: 'empty'
      }, 
      { status: 502 }
    )
  }

  // Final fallback: upstream_error
  return NextResponse.json(
    { 
      ok: false, 
      reason: 'upstream_error',
      prices: {},
      source: 'empty'
    }, 
    { status: 502 }
  )
}

