/**
 * Socket Protocol (Bungee) quote adapter
 * Socket aggregates multiple bridge providers and provides a unified API
 * Endpoint: https://api.socket.tech/v2/quote
 */

import { SOCKET_ENDPOINTS } from '../endpoints/socket'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'
import type { QuoteInput, QuoteResult, ProviderError, FeeBreakdown, RouteStep } from '../types'

const isDev = process.env.NODE_ENV === 'development'
const SOCKET_DEBUG = process.env.DEBUG_SOCKET === '1'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const DEFAULT_TIMEOUT_MS = 10000

/**
 * Get Socket API key from environment
 * Socket may require API key for higher rate limits
 */
function getSocketApiKey(): string | undefined {
  return process.env.SOCKET_API_KEY
}

export async function quoteSocket(
  input: QuoteInput,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<{ result: QuoteResult | null; error?: ProviderError }> {
  const startTime = Date.now()

  try {
    // Socket API uses GET request with query parameters
    const params = new URLSearchParams({
      fromChainId: input.fromChainId.toString(),
      toChainId: input.toChainId.toString(),
      fromTokenAddress: input.fromTokenAddress,
      toTokenAddress: input.toTokenAddress,
      fromAmount: input.amountBase,
      recipient: input.userAddress, // Socket uses 'recipient' not 'userAddress'
    })

    if (input.slippageBps !== undefined) {
      params.append('slippageTolerance', (input.slippageBps / 10000).toString())
    }

    // Socket API requires API token for access
    // Get API token at: https://docs.socket.tech/
    const apiKey = getSocketApiKey()
    if (!apiKey) {
      return {
        result: null,
        error: {
          provider: 'bungee',
          error: 'Socket API requires API token. Set SOCKET_API_KEY environment variable. Get one at https://docs.socket.tech/',
          errorCode: 'API_KEY_REQUIRED',
          url: SOCKET_ENDPOINTS.quote,
        },
      }
    }

    const url = `${SOCKET_ENDPOINTS.quote}?${params.toString()}`

    if (SOCKET_DEBUG || isDev) {
      console.log('[socket] Request:', {
        fromChainId: input.fromChainId,
        toChainId: input.toChainId,
        fromToken: input.fromTokenAddress,
        toToken: input.toTokenAddress,
        amount: input.amountBase,
        hasApiKey: !!apiKey,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
      })
    }

    // Prepare headers with API token
    // Try different formats - Socket API may use Authorization: Bearer or X-API-Key
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    // Try Authorization Bearer first (common for API tokens)
    if (apiKey.startsWith('sktsec_')) {
      headers['Authorization'] = `Bearer ${apiKey}`
    } else {
      headers['X-API-Key'] = apiKey
    }

    const response = await fetchWithTimeout(
      url,
      {
        method: 'GET',
        headers,
      },
      timeoutMs
    )

    const latencyMs = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      const truncatedError = errorText.length > 500 ? errorText.substring(0, 500) + '...' : errorText
      
      if (SOCKET_DEBUG || isDev) {
        console.error(`[socket] API error: status=${response.status}, error=${truncatedError}`)
      }

      return {
        result: null,
        error: {
          provider: 'bungee',
          status: response.status,
          statusText: response.statusText,
          error: truncatedError || `HTTP ${response.status}`,
          errorCode: response.status === 400 ? 'INVALID_INPUT' : response.status === 404 ? 'NO_ROUTE' : 'API_ERROR',
          url,
          request: {
            fromChainId: input.fromChainId,
            toChainId: input.toChainId,
            fromTokenAddress: input.fromTokenAddress,
            toTokenAddress: input.toTokenAddress,
            amountBase: input.amountBase,
          },
        },
      }
    }

    const data = await response.json()

    if (SOCKET_DEBUG || isDev) {
      console.log('[socket] Response:', JSON.stringify(data).substring(0, 500))
    }

    // Parse Socket response
    // Socket returns routes array, we take the best one (first/largest output)
    const routes = data.routes || []
    if (routes.length === 0) {
      return {
        result: null,
        error: {
          provider: 'bungee',
          error: 'No routes available',
          errorCode: 'NO_ROUTE',
          url,
        },
      }
    }

    // Find best route (highest output amount)
    const bestRoute = routes.reduce((best: any, current: any) => {
      const bestOut = BigInt(best.toAmount || '0')
      const currentOut = BigInt(current.toAmount || '0')
      return currentOut > bestOut ? current : best
    }, routes[0])

    const toAmount = bestRoute.toAmount || bestRoute.outputAmount || bestRoute.destinationAmount || '0'
    const route = bestRoute.route || {}
    const bridgeName = route.bridgeName || route.bridge || 'socket'

    // Extract fee information
    const fees: FeeBreakdown[] = []
    
    if (bestRoute.feeAmount && bestRoute.feeAmount !== '0') {
      fees.push({
        type: 'bridge',
        amount: bestRoute.feeAmount.toString(),
        tokenAddress: input.fromTokenAddress,
        usdValue: bestRoute.feeUSD?.toString(),
      })
    }

    if (bestRoute.gasUSD) {
      fees.push({
        type: 'gas',
        amount: bestRoute.gasLimit?.toString() || '0',
        tokenAddress: ZERO_ADDRESS,
        usdValue: bestRoute.gasUSD.toString(),
      })
    }

    // Build route steps from Socket route
    const routeSteps: RouteStep[] = []
    if (route.steps && Array.isArray(route.steps)) {
      for (const step of route.steps) {
        routeSteps.push({
          provider: bridgeName.toLowerCase() as any,
          fromChainId: step.fromChainId || input.fromChainId,
          toChainId: step.toChainId || input.toChainId,
          fromTokenAddress: step.fromTokenAddress || input.fromTokenAddress,
          toTokenAddress: step.toTokenAddress || input.toTokenAddress,
          estimatedTime: step.estimatedTime || bestRoute.estimatedTime,
        })
      }
    } else {
      // Single step route
      routeSteps.push({
        provider: 'bungee',
        fromChainId: input.fromChainId,
        toChainId: input.toChainId,
        fromTokenAddress: input.fromTokenAddress,
        toTokenAddress: input.toTokenAddress,
        estimatedTime: bestRoute.estimatedTime || bestRoute.eta,
      })
    }

    if (!toAmount || toAmount === '0') {
      if (SOCKET_DEBUG || isDev) {
        console.warn('[socket] Invalid response: missing or zero output amount')
      }
      return {
        result: null,
        error: {
          provider: 'bungee',
          error: 'Invalid response format: missing or zero output amount',
          errorCode: 'INVALID_RESPONSE',
          url,
        },
      }
    }

    const result: QuoteResult = {
      provider: 'bungee',
      fromAmount: input.amountBase,
      toAmount: toAmount.toString(),
      fees,
      routeSteps,
      meta: {
        ...data,
        latencyMs,
        _provider: 'socket',
        routeCount: routes.length,
      },
      latencyMs,
      isIndicative: !input.userAddress || input.userAddress === '0x1111111111111111111111111111111111111111' || input.userAddress === ZERO_ADDRESS,
    }

    if (SOCKET_DEBUG || isDev) {
      console.log('[socket] Quote success:', {
        fromAmount: result.fromAmount,
        toAmount: result.toAmount,
        fees: result.fees.length,
        latencyMs: result.latencyMs,
        routeCount: routes.length,
      })
    }

    return { result }
  } catch (error) {
    const latencyMs = Date.now() - startTime
    
    if (SOCKET_DEBUG || isDev) {
      console.error('[socket] Error:', error instanceof Error ? error.message : String(error))
    }

    return {
      result: null,
      error: {
        provider: 'bungee',
        error: error instanceof Error ? error.message : String(error),
        errorCode: error instanceof Error && error.message.includes('timeout') ? 'TIMEOUT' : 'NETWORK_ERROR',
        url: SOCKET_ENDPOINTS.quote,
      },
    }
  }
}

