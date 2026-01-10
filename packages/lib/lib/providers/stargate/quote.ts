/**
 * Stargate Finance quote adapter
 * Endpoint: GET https://api.stargate.finance/v1/quote
 * 
 * Stargate API documentation: https://stargateprotocol.gitbook.io/stargate/developers/stargate-api
 * 
 * Rules:
 * - Quotes only ERC20 transfers (skips native tokens)
 * - Does NOT auto-execute (quote only)
 * - Normalizes output to internal format
 */

import { STARGATE_ENDPOINTS } from '../endpoints/stargate'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'
import type { QuoteInput, QuoteResult, ProviderError, FeeBreakdown, RouteStep } from '../types'

const isDev = process.env.NODE_ENV === 'development'
const STARGATE_DEBUG = process.env.DEBUG_STARGATE === '1'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const DEFAULT_TIMEOUT_MS = 4500 // 4.5 seconds (within 4-5s range)

export async function quoteStargate(
  input: QuoteInput,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<{ result: QuoteResult | null; error?: ProviderError }> {
  const startTime = Date.now()

  try {
    // Stargate quotes only ERC20 transfers - skip native tokens
    if (input.fromTokenAddress === ZERO_ADDRESS || input.toTokenAddress === ZERO_ADDRESS) {
      if (STARGATE_DEBUG || isDev) {
        console.log('[stargate] Skipping native token quote (ERC20 only)')
      }
      return { result: null }
    }

    // Build query parameters for GET request
    const params = new URLSearchParams({
      srcChainId: input.fromChainId.toString(),
      dstChainId: input.toChainId.toString(),
      srcTokenAddress: input.fromTokenAddress,
      dstTokenAddress: input.toTokenAddress,
      amount: input.amountBase,
      userAddress: input.userAddress,
    })

    // Add optional slippage if provided
    if (input.slippageBps !== undefined) {
      params.append('slippage', (input.slippageBps / 10000).toString())
    }

    const url = `${STARGATE_ENDPOINTS.quote}?${params.toString()}`

    if (STARGATE_DEBUG || isDev) {
      console.log('[stargate] Request:', {
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
      
      if (STARGATE_DEBUG || isDev) {
        console.error(`[stargate] API error: status=${response.status}, error=${truncatedError}`)
      }

      return {
        result: null,
        error: {
          provider: 'stargate',
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

    if (STARGATE_DEBUG || isDev) {
      console.log('[stargate] Response:', JSON.stringify(data).substring(0, 500))
    }

    // Parse Stargate response - try common field names
    const minAmountOut = data.minAmountOut || data.amountOut || data.outputAmount || data.dstAmount || data.dstAmountMin
    const feeAmount = data.feeAmount || data.fee || data.protocolFee || data.bridgeFee || '0'
    const estimatedGas = data.estimatedGas || data.gasEstimate || data.gasLimit
    const feeUsd = data.feeUSD || data.feeUsd || undefined
    const gasUsd = data.gasUSD || data.gasUsd || undefined

    // Validate output amount - must be present and non-zero
    if (!minAmountOut || minAmountOut === '0' || minAmountOut === 0) {
      if (STARGATE_DEBUG || isDev) {
        console.warn('[stargate] Invalid response: missing or zero output amount')
      }
      return {
        result: null,
        error: {
          provider: 'stargate',
          error: 'Invalid response format: missing or zero output amount',
          errorCode: 'INVALID_RESPONSE',
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

    // Build fee breakdown
    const fees: FeeBreakdown[] = []
    
    // Bridge fee
    if (feeAmount && feeAmount !== '0') {
      fees.push({
        type: 'bridge',
        amount: feeAmount.toString(),
        tokenAddress: input.fromTokenAddress,
        usdValue: feeUsd?.toString(),
      })
    }

    // Gas fee (if provided)
    if (gasUsd) {
      fees.push({
        type: 'gas',
        amount: estimatedGas?.toString() || '0',
        tokenAddress: ZERO_ADDRESS, // Native token for gas
        usdValue: gasUsd.toString(),
      })
    }

    // Build route steps
    const routeSteps: RouteStep[] = [
      {
        provider: 'stargate',
        fromChainId: input.fromChainId,
        toChainId: input.toChainId,
        fromTokenAddress: input.fromTokenAddress,
        toTokenAddress: input.toTokenAddress,
        estimatedTime: data.estimatedTime || data.eta || data.estimatedDuration ? Number(data.estimatedTime || data.eta || data.estimatedDuration) : undefined,
      },
    ]

    // Do NOT include transaction data - quote only, no auto-execution
    // executionData should be null for quote-only providers

    const result: QuoteResult = {
      provider: 'stargate',
      fromAmount: input.amountBase,
      toAmount: minAmountOut.toString(),
      fees,
      routeSteps,
      tx: undefined, // No transaction data - quote only
      meta: {
        ...data,
        latencyMs,
        _provider: 'stargate',
      },
      latencyMs,
      isIndicative: !input.userAddress || input.userAddress === '0x1111111111111111111111111111111111111111' || input.userAddress === ZERO_ADDRESS,
    }

    if (STARGATE_DEBUG || isDev) {
      console.log('[stargate] Quote success:', {
        fromAmount: result.fromAmount,
        toAmount: result.toAmount,
        fees: result.fees.length,
        latencyMs: result.latencyMs,
      })
    }

    return { result }
  } catch (error) {
    const latencyMs = Date.now() - startTime
    
    // Silent skip on error - do not throw fatal errors
    if (STARGATE_DEBUG || isDev) {
      console.error('[stargate] Error:', error instanceof Error ? error.message : String(error))
    }

    return {
      result: null,
      error: {
        provider: 'stargate',
        error: error instanceof Error ? error.message : String(error),
        errorCode: error instanceof Error && error.message.includes('timeout') ? 'TIMEOUT' : 'NETWORK_ERROR',
        url: STARGATE_ENDPOINTS.quote,
      },
    }
  }
}
