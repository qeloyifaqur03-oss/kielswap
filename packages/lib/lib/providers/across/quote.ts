/**
 * Across Protocol quote adapter
 * Endpoint: https://api.across.to/v1/quote
 */

import { ACROSS_ENDPOINTS } from '../endpoints/across'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'
import type { QuoteInput, QuoteResult, ProviderError, FeeBreakdown, RouteStep } from '../types'

const isDev = process.env.NODE_ENV === 'development'
const ACROSS_DEBUG = process.env.DEBUG_ACROSS === '1'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const DEFAULT_TIMEOUT_MS = 10000

export async function quoteAcross(
  input: QuoteInput,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<{ result: QuoteResult | null; error?: ProviderError }> {
  const startTime = Date.now()

  try {
    // Build query parameters for GET request (common pattern)
    const params = new URLSearchParams({
      originChainId: input.fromChainId.toString(),
      destinationChainId: input.toChainId.toString(),
      originToken: input.fromTokenAddress,
      destinationToken: input.toTokenAddress,
      amount: input.amountBase,
      recipient: input.userAddress,
    })

    // Add optional slippage if provided
    if (input.slippageBps !== undefined) {
      params.append('slippage', (input.slippageBps / 10000).toString())
    }

    const url = `${ACROSS_ENDPOINTS.quote}?${params.toString()}`

    if (ACROSS_DEBUG || isDev) {
      console.log('[across] Request:', {
        fromChainId: input.fromChainId,
        toChainId: input.toChainId,
        fromToken: input.fromTokenAddress,
        toToken: input.toTokenAddress,
        amount: input.amountBase,
      })
    }

    const response = await fetchWithTimeout(
      url,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      timeoutMs
    )

    const latencyMs = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      const truncatedError = errorText.length > 500 ? errorText.substring(0, 500) + '...' : errorText
      
      if (ACROSS_DEBUG || isDev) {
        console.error(`[across] API error: status=${response.status}, error=${truncatedError}`)
      }

      return {
        result: null,
        error: {
          provider: 'across',
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

    if (ACROSS_DEBUG || isDev) {
      console.log('[across] Response:', JSON.stringify(data).substring(0, 500))
    }

    // Parse Across response - try common field names
    const minAmountOut = data.minAmountOut || data.amountOut || data.outputAmount || data.destinationAmount || data.toAmount || data.receiveAmount
    const feeAmount = data.feeAmount || data.fee || data.relayFee || data.bridgeFee || data.protocolFee || '0'
    const estimatedGas = data.estimatedGas || data.gasEstimate || data.gasLimit
    const feeUsd = data.feeUSD || data.feeUsd || data.totalFeeUsd || undefined
    const gasUsd = data.gasUSD || data.gasUsd || undefined
    const estimatedTime = data.estimatedTime || data.eta || data.estimatedDuration

    // Validate output amount
    if (!minAmountOut || minAmountOut === '0' || minAmountOut === 0) {
      if (ACROSS_DEBUG || isDev) {
        console.warn('[across] Invalid response: missing or zero output amount')
      }
      return {
        result: null,
        error: {
          provider: 'across',
          error: 'Invalid response format: missing or zero output amount',
          errorCode: 'INVALID_RESPONSE',
          url,
        },
      }
    }

    // Build fee breakdown
    const fees: FeeBreakdown[] = []
    
    if (feeAmount && feeAmount !== '0') {
      fees.push({
        type: 'bridge',
        amount: feeAmount.toString(),
        tokenAddress: input.fromTokenAddress,
        usdValue: feeUsd?.toString(),
      })
    }

    if (gasUsd) {
      fees.push({
        type: 'gas',
        amount: estimatedGas?.toString() || '0',
        tokenAddress: ZERO_ADDRESS,
        usdValue: gasUsd.toString(),
      })
    }

    const routeSteps: RouteStep[] = [
      {
        provider: 'across',
        fromChainId: input.fromChainId,
        toChainId: input.toChainId,
        fromTokenAddress: input.fromTokenAddress,
        toTokenAddress: input.toTokenAddress,
        estimatedTime: estimatedTime ? Number(estimatedTime) : undefined,
      },
    ]

    const result: QuoteResult = {
      provider: 'across',
      fromAmount: input.amountBase,
      toAmount: minAmountOut.toString(),
      fees,
      routeSteps,
      meta: {
        ...data,
        latencyMs,
        _provider: 'across',
      },
      latencyMs,
      isIndicative: !input.userAddress || input.userAddress === '0x1111111111111111111111111111111111111111' || input.userAddress === ZERO_ADDRESS,
    }

    if (ACROSS_DEBUG || isDev) {
      console.log('[across] Quote success:', {
        fromAmount: result.fromAmount,
        toAmount: result.toAmount,
        fees: result.fees.length,
        latencyMs: result.latencyMs,
      })
    }

    return { result }
  } catch (error) {
    const latencyMs = Date.now() - startTime
    
    if (ACROSS_DEBUG || isDev) {
      console.error('[across] Error:', error instanceof Error ? error.message : String(error))
    }

    return {
      result: null,
      error: {
        provider: 'across',
        error: error instanceof Error ? error.message : String(error),
        errorCode: error instanceof Error && error.message.includes('timeout') ? 'TIMEOUT' : 'NETWORK_ERROR',
        url: ACROSS_ENDPOINTS.quote,
      },
    }
  }
}
