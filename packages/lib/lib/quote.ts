/**
 * Quote fetching service for swap quotes
 * Calls server-side API route which proxies to multiple providers
 */

export interface QuoteResult {
  ok: boolean
  amountOut: string | null // Human-readable amount
  amountOutBase: string | null // Base units
  errorCode?: string // Error code (NO_ROUTE, HTTP_ERROR, etc.)
  errorMessage?: string // User-friendly error message
  httpStatus?: number // HTTP status code if applicable
  raw?: any // Raw response data for debugging
  fee?: string // Legacy field for backward compatibility
  estimatedTime?: string
  provider?: string // Which provider returned the quote
  isIndicative?: boolean // true if placeholder address was used (wallet not connected)
  // Fee breakdown fields (EVM-only)
  estimatedGasUSD?: string | null // Estimated network gas cost in USD
  providerFeeUSD?: string | null // Provider fee in USD
  bridgeFeeUSD?: string | null // Bridge fee in USD
  totalFeeUSD?: string | null // Total fees in USD (sum of above, if available)
  warnings?: string[] // Warnings about the quote
}

/**
 * Fetch quote from server-side API route
 * The API route handles provider fallback (Relay -> LiFi -> 0x -> Jupiter)
 */
export async function fetchQuote(
  amount: string, // Human-readable amount
  fromTokenId: string,
  toTokenId: string,
  fromNetworkId: string,
  toNetworkId: string,
  userAddress?: string, // Optional wallet address (if wallet connected)
  requestId?: string, // Optional request ID for race condition prevention
  signal?: AbortSignal // Optional AbortSignal for cancelling requests
): Promise<QuoteResult & { requestId?: string }> {
  const isDev = typeof window !== 'undefined' && process.env.NODE_ENV === 'development'

  // Validation
  if (!amount || parseFloat(amount) <= 0) {
    return {
      ok: false,
      amountOut: null,
      amountOutBase: null,
      errorCode: 'INVALID_AMOUNT',
      errorMessage: 'Invalid amount',
    }
  }

  try {
    // Call our server-side API route
    const response = await fetch('/api/quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        fromTokenId,
        toTokenId,
        fromNetworkId,
        toNetworkId,
        userAddress, // Optional: will use placeholder if not provided
        requestId, // Include requestId for race condition handling
      }),
      signal, // Pass AbortSignal to support request cancellation
    })
    
    // Check if request was aborted
    if (signal?.aborted) {
      throw new Error('AbortError')
    }

    if (!response.ok) {
      let errorBody: string | any
      try {
        errorBody = await response.json()
      } catch {
        errorBody = await response.text()
      }

      // Handle 404 specifically
      if (response.status === 404) {
        if (isDev) {
          console.error('[quote] API route not found: /api/quote returned 404')
        }
        return {
          ok: false,
          amountOut: null,
          amountOutBase: null,
          errorCode: 'API_404',
          errorMessage: 'API 404: missing /api/quote route',
          httpStatus: 404,
          raw: errorBody,
        }
      }

      // Handle other HTTP errors
      if (isDev) {
        console.error('[quote] HTTP error:', {
          status: response.status,
          statusText: response.statusText,
          url: '/api/quote',
          body: errorBody,
        })
      }

      return {
        ok: false,
        amountOut: null,
        amountOutBase: null,
        errorCode: 'HTTP_ERROR',
        errorMessage: `API error (${response.status})`,
        httpStatus: response.status,
        raw: errorBody,
      }
    }

    const data = await response.json()

    if (isDev) {
      console.log('[quote] API response:', {
        ok: data.ok,
        provider: data.provider,
        outAmount: data.outAmount,
      })
    }

    if (!data.ok) {
      // API returned an error - log debug info if available
      if (isDev && data.debug) {
        console.error('[quote] API error with debug info:', {
          errorCode: data.errorCode,
          error: data.error,
          debug: data.debug,
        })
      }
      
      // Special handling for cross-family swaps
      if (data.errorCode === 'CROSS_FAMILY_REQUIRES_ROUTE_PLAN') {
        return {
          ok: false,
          amountOut: null,
          amountOutBase: null,
          errorCode: 'CROSS_FAMILY_REQUIRES_ROUTE_PLAN',
          errorMessage: data.error || 'Cross-family swap requires route planning',
          httpStatus: data.httpStatus,
          raw: data.debug || data,
        }
      }
      
      // API returned an error
      return {
        ok: false,
        amountOut: null,
        amountOutBase: null,
        errorCode: data.errorCode || 'UNKNOWN_ERROR',
        errorMessage: data.error || 'Quote failed',
        httpStatus: data.httpStatus,
        raw: data.debug || data, // Include debug info in raw
      }
    }

    // Success - extract the quote data
    return {
      ok: true,
      amountOut: data.outAmount || null,
      amountOutBase: data.outAmountBase || null,
      fee: data.fee, // Legacy field
      estimatedTime: data.estimatedTime,
      provider: data.provider,
      isIndicative: data.isIndicative, // Flag indicating placeholder address was used
      raw: data.route,
      requestId: data.requestId || requestId, // Return requestId for validation
      // Fee breakdown fields
      estimatedGasUSD: data.estimatedGasUSD ?? null,
      providerFeeUSD: data.providerFeeUSD ?? null,
      bridgeFeeUSD: data.bridgeFeeUSD ?? null,
      totalFeeUSD: data.totalFeeUSD ?? null,
      warnings: data.warnings ?? undefined,
    }
  } catch (error) {
    // Check if request was aborted (don't treat as error)
    if (error instanceof Error && (error.name === 'AbortError' || error.message === 'AbortError')) {
      return {
        ok: false,
        amountOut: null,
        amountOutBase: null,
        errorCode: 'ABORTED',
        errorMessage: 'Request cancelled',
      }
    }
    
    if (isDev) {
      console.error('[quote] Fetch error:', {
        error: error instanceof Error ? error.message : error,
        url: '/api/quote',
      })
    }
    return {
      ok: false,
      amountOut: null,
      amountOutBase: null,
      errorCode: 'FETCH_ERROR',
      errorMessage: 'Network error',
      raw: error instanceof Error ? { message: error.message, name: error.name } : error,
    }
  }
}

