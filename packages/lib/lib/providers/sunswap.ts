/**
 * SunSwap API provider for TRON swaps
 * Endpoints:
 * - https://api.sunswap.com/v2/pairs
 * - https://api.sunswap.com/v2/quote
 */

import { getEnvWithDefault } from '../env'

const isDev = process.env.NODE_ENV === 'development'

const API_BASE = process.env.SUNSWAP_BASE_URL || 'https://api.sunswap.com'
const REQUEST_TIMEOUT = 10000 // 10 seconds

export interface SunSwapQuote {
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
 * Get quote from SunSwap
 * @param fromToken - TRC20 contract address or 'TRX' for native
 * @param toToken - TRC20 contract address or 'TRX' for native
 * @param amountBase - Amount in base units (respects token decimals)
 */
export async function getSunSwapQuote(
  fromToken: string,
  toToken: string,
  amountBase: string
): Promise<{ quote: SunSwapQuote | null; error?: string }> {
  try {
    // SunSwap expects token addresses or 'TRX' for native
    const fromTokenAddress = fromToken === 'TRX' || fromToken.toLowerCase() === 'native' ? 'TRX' : fromToken
    const toTokenAddress = toToken === 'TRX' || toToken.toLowerCase() === 'native' ? 'TRX' : toToken

    const url = `${API_BASE}/v2/quote?tokenIn=${encodeURIComponent(fromTokenAddress)}&tokenOut=${encodeURIComponent(toTokenAddress)}&amountIn=${amountBase}`

    if (isDev) {
      console.log('[sunswap] Quote request:', { fromToken: fromTokenAddress, toToken: toTokenAddress, amountBase })
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
        console.error('[sunswap] Quote failed:', response.status, errorText)
      }
      return {
        quote: null,
        error: `SunSwap API error (${response.status}): ${errorText.substring(0, 200)}`,
      }
    }

    const data = await response.json()

    // Normalize response
    const quote: SunSwapQuote = {
      amountOut: data.amountOut || data.outputAmount || data.amount || '0',
      priceImpact: data.priceImpact,
      fee: data.fee,
      route: data.route || data.path,
    }

    if (isDev) {
      console.log('[sunswap] Quote response:', quote)
    }

    return { quote }
  } catch (error) {
    if (isDev) {
      console.error('[sunswap] Error:', error)
    }
    return {
      quote: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get pairs from SunSwap (helper for route resolution)
 */
export async function getSunSwapPairs(): Promise<{ pairs: any[] | null; error?: string }> {
  try {
    const url = `${API_BASE}/v2/pairs`

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return { pairs: null, error: `SunSwap pairs API error (${response.status})` }
    }

    const data = await response.json()
    return { pairs: Array.isArray(data) ? data : data.pairs || [] }
  } catch (error) {
    return {
      pairs: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}



















