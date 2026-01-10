/**
 * Celer cBridge quote adapter
 * Endpoint: https://api.cbridge.celer.network/v1/quote
 */

import { CBRIDGE_ENDPOINTS } from '../endpoints/cbridge'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'
import type { QuoteInput, QuoteResult, ProviderError, FeeBreakdown, RouteStep } from '../types'

const isDev = process.env.NODE_ENV === 'development'
const CBRIDGE_DEBUG = process.env.DEBUG_CBRIDGE === '1'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const DEFAULT_TIMEOUT_MS = 10000

export async function quoteCBridge(
  input: QuoteInput,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<{ result: QuoteResult | null; error?: ProviderError }> {
  const startTime = Date.now()

  try {
    // Build query parameters for GET request
    const params = new URLSearchParams({
      srcChainId: input.fromChainId.toString(),
      dstChainId: input.toChainId.toString(),
      srcToken: input.fromTokenAddress,
      dstToken: input.toTokenAddress,
      amount: input.amountBase,
      sender: input.userAddress,
    })

    if (input.slippageBps !== undefined) {
      params.append('slippage', (input.slippageBps / 10000).toString())
    }

    const url = `${CBRIDGE_ENDPOINTS.quote}?${params.toString()}`

    if (CBRIDGE_DEBUG || isDev) {
      console.log('[cbridge] Request:', {
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
      
      if (CBRIDGE_DEBUG || isDev) {
        console.error(`[cbridge] API error: status=${response.status}, error=${truncatedError}`)
      }

      return {
        result: null,
        error: {
          provider: 'cbridge',
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

    if (CBRIDGE_DEBUG || isDev) {
      console.log('[cbridge] Response:', JSON.stringify(data).substring(0, 500))
    }

    // Parse cBridge response
    const minAmountOut = data.minAmountOut || data.amountOut || data.outputAmount || data.dstAmount || data.destinationAmount || data.toAmount || data.receiveAmount
    const feeAmount = data.feeAmount || data.fee || data.bridgeFee || data.protocolFee || data.relayFee || '0'
    const estimatedGas = data.estimatedGas || data.gasEstimate || data.gasLimit
    const feeUsd = data.feeUSD || data.feeUsd || data.totalFeeUsd || undefined
    const gasUsd = data.gasUSD || data.gasUsd || undefined
    const estimatedTime = data.estimatedTime || data.eta || data.estimatedDuration

    if (!minAmountOut || minAmountOut === '0' || minAmountOut === 0) {
      if (CBRIDGE_DEBUG || isDev) {
        console.warn('[cbridge] Invalid response: missing or zero output amount')
      }
      return {
        result: null,
        error: {
          provider: 'cbridge',
          error: 'Invalid response format: missing or zero output amount',
          errorCode: 'INVALID_RESPONSE',
          url,
        },
      }
    }

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
        provider: 'cbridge',
        fromChainId: input.fromChainId,
        toChainId: input.toChainId,
        fromTokenAddress: input.fromTokenAddress,
        toTokenAddress: input.toTokenAddress,
        estimatedTime: estimatedTime ? Number(estimatedTime) : undefined,
      },
    ]

    const result: QuoteResult = {
      provider: 'cbridge',
      fromAmount: input.amountBase,
      toAmount: minAmountOut.toString(),
      fees,
      routeSteps,
      meta: {
        ...data,
        latencyMs,
        _provider: 'cbridge',
      },
      latencyMs,
      isIndicative: !input.userAddress || input.userAddress === '0x1111111111111111111111111111111111111111' || input.userAddress === ZERO_ADDRESS,
    }

    if (CBRIDGE_DEBUG || isDev) {
      console.log('[cbridge] Quote success:', {
        fromAmount: result.fromAmount,
        toAmount: result.toAmount,
        fees: result.fees.length,
        latencyMs: result.latencyMs,
      })
    }

    return { result }
  } catch (error) {
    const latencyMs = Date.now() - startTime
    
    if (CBRIDGE_DEBUG || isDev) {
      console.error('[cbridge] Error:', error instanceof Error ? error.message : String(error))
    }

    return {
      result: null,
      error: {
        provider: 'cbridge',
        error: error instanceof Error ? error.message : String(error),
        errorCode: error instanceof Error && error.message.includes('timeout') ? 'TIMEOUT' : 'NETWORK_ERROR',
        url: CBRIDGE_ENDPOINTS.quote,
      },
    }
  }
}
