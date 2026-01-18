/**
 * Network icon API endpoint
 * Fetches network icons from CoinGecko API
 * Returns only PNG/JPEG URLs, filters out SVG
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

// Network ID to CoinGecko platform ID mapping
const NETWORK_TO_COINGECKO_PLATFORM: Record<string, string> = {
  ethereum: 'ethereum',
  bnb: 'binance-smart-chain',
  polygon: 'polygon-pos',
  avalanche: 'avalanche',
  arbitrum: 'arbitrum-one',
  optimism: 'optimistic-ethereum',
  base: 'base',
  zksync: 'zksync',
  linea: 'linea',
  scroll: 'scroll',
  blast: 'blast',
  gnosis: 'xdai',
  opbnb: 'opbnb',
  mantle: 'mantle',
  ronin: 'ronin',
  cronos: 'cronos',
  rootstock: 'rootstock',
  sonic: 'sonic',
  core: 'coredaoorg',
  kava: 'kava',
  plasma: 'plasma',
  pulsechain: 'pulsechain',
  berachain: 'berachain',
  'immutable-x': 'immutable-x',
  'world-chain': 'worldcoin-wld',
  goat: 'goat',
  merlin: 'merlin',
  katana: 'katana',
  abstract: 'abstract',
}

// Check if Content-Type indicates PNG/JPEG
function isValidImageContentType(contentType: string | null): boolean {
  if (!contentType) return false
  const lower = contentType.toLowerCase()
  return lower.startsWith('image/png') || lower.startsWith('image/jpeg') || lower.startsWith('image/jpg')
}

// Get network icon URL from CoinGecko API
async function getCoinGeckoNetworkIconUrl(platformId: string): Promise<string | null> {
  try {
    // CoinGecko API: get asset platform data
    const url = `https://api.coingecko.com/api/v3/asset_platforms/${platformId}`
    
    const response = await fetch(url, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json() as { 
      id?: string
      name?: string
      native_coin_id?: string
    }
    
    // Try to get icon from native coin
    if (data.native_coin_id) {
      const coinUrl = `https://api.coingecko.com/api/v3/coins/${data.native_coin_id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`
      const coinResponse = await fetch(coinUrl, {
        next: { revalidate: 86400 },
      })
      
      if (coinResponse.ok) {
        const coinData = await coinResponse.json() as { image?: { large?: string } }
        const imageUrl = coinData.image?.large
        
        // Don't filter by URL extension - check Content-Type when fetching
        if (imageUrl) {
          return imageUrl
        }
      }
    }
    
    return null
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  const networkId = request.nextUrl.searchParams.get('id')
  
  if (!networkId) {
    return new NextResponse(null, { status: 400 })
  }
  
  const normalizedId = networkId.toLowerCase().trim()
  
  // Try CoinGecko
  const platformId = NETWORK_TO_COINGECKO_PLATFORM[normalizedId]
  if (platformId) {
    const iconUrl = await getCoinGeckoNetworkIconUrl(platformId)
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
              console.log(`[icons] network=${normalizedId} status=${imageResponse.status} content-type=${contentType} - invalid format, skipping`)
            }
            return new NextResponse(null, { status: 404 })
          }
          
          const imageBuffer = await imageResponse.arrayBuffer()
          const finalContentType = contentType || 'image/png'
          
          // Log in dev mode for first request
          if (process.env.NODE_ENV === 'development') {
            console.log(`[icons] network=${normalizedId} status=${imageResponse.status} content-type=${finalContentType} bytes=${imageBuffer.byteLength}`)
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
          console.log(`[icons] network=${normalizedId} error fetching image:`, error)
        }
      }
    }
  }
  
  // Not found - return 404
  if (process.env.NODE_ENV === 'development') {
    console.log(`[icons] network=${normalizedId} status=404 - not found in mapping`)
  }
  return new NextResponse(null, { status: 404 })
}
