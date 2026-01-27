/**
 * STON.fi API provider for TON swaps
 * Endpoints:
 * - https://api.ston.fi/v1/tokens
 * - https://api.ston.fi/v1/swap/routes
 * - https://api.ston.fi/v1/swap/quote
 */

const isDev = process.env.NODE_ENV === 'development'

const API_BASE = process.env.STONFI_BASE_URL || 'https://api.ston.fi'
const REQUEST_TIMEOUT = 10000 // 10 seconds

export interface STONFiQuote {
  amountOut: string
  priceImpact?: string
  fee?: string
  route?: any
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout')
    }
    throw error
  }
}

/**
 * Get tokens from STON.fi (helper for jetton resolution)
 */
export async function getSTONFiTokens(): Promise<{ tokens: any[] | null; error?: string }> {
  try {
    const url = `${API_BASE}/v1/tokens`

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return { tokens: null, error: `STON.fi tokens API error (${response.status})` }
    }

    const data = await response.json()
    return { tokens: Array.isArray(data) ? data : data.tokens || [] }
  } catch (error) {
    return {
      tokens: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get swap routes from STON.fi
 */
export async function getSTONFiRoutes(
  fromToken: string,
  toToken: string
): Promise<{ routes: any[] | null; error?: string }> {
  try {
    const url = `${API_BASE}/v1/swap/routes?offer=${encodeURIComponent(fromToken)}&ask=${encodeURIComponent(toToken)}`

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      if (isDev) {
        console.error('[stonfi] Routes failed:', response.status, errorText)
      }
      return {
        routes: null,
        error: `STON.fi routes API error (${response.status}): ${errorText.substring(0, 200)}`,
      }
    }

    const data = await response.json()
    return { routes: Array.isArray(data) ? data : data.routes || [] }
  } catch (error) {
    return {
      routes: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get quote from STON.fi
 * @param fromToken - Jetton master address (EQ...) or 'TON' for native
 * @param toToken - Jetton master address (EQ...) or 'TON' for native
 * @param amountBase - Amount in base units (9 decimals for TON, jetton decimals vary)
 */
export async function getSTONFiQuote(
  fromToken: string,
  toToken: string,
  amountBase: string
): Promise<{ quote: STONFiQuote | null; error?: string }> {
  try {
    // STON.fi expects jetton addresses or 'TON' for native
    // Native TON address is typically represented as 'TON' or zero address
    const fromTokenAddress = fromToken === 'TON' || fromToken.toLowerCase() === 'native' ? 'TON' : fromToken
    const toTokenAddress = toToken === 'TON' || toToken.toLowerCase() === 'native' ? 'TON' : toToken

    // First get routes
    const routesResult = await getSTONFiRoutes(fromTokenAddress, toTokenAddress)
    if (!routesResult.routes || routesResult.routes.length === 0) {
      return {
        quote: null,
        error: 'No routes found',
      }
    }

    // Use best route (first one)
    const bestRoute = routesResult.routes[0]

    // Get quote for the route
    const url = `${API_BASE}/v1/swap/quote?offer=${encodeURIComponent(fromTokenAddress)}&ask=${encodeURIComponent(toTokenAddress)}&amount=${amountBase}&route=${encodeURIComponent(JSON.stringify(bestRoute))}`

    if (isDev) {
      console.log('[stonfi] Quote request:', { fromToken: fromTokenAddress, toToken: toTokenAddress, amountBase })
    }

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      if (isDev) {
        console.error('[stonfi] Quote failed:', response.status, errorText)
      }
      return {
        quote: null,
        error: `STON.fi API error (${response.status}): ${errorText.substring(0, 200)}`,
      }
    }

    const data = await response.json()

    // Normalize response
    const quote: STONFiQuote = {
      amountOut: data.askAmount || data.amountOut || data.amount || '0',
      priceImpact: data.priceImpact,
      fee: data.fee,
      route: bestRoute,
    }

    if (isDev) {
      console.log('[stonfi] Quote response:', quote)
    }

    return { quote }
  } catch (error) {
    if (isDev) {
      console.error('[stonfi] Error:', error)
    }
    return {
      quote: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}



















