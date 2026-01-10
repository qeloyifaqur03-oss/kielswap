/**
 * Synapse Protocol quote adapter
 * Endpoint: https://api.synapseprotocol.com/bridge
 */

import { SYNAPSE_ENDPOINTS } from '../endpoints/synapse'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'
import type { QuoteInput, QuoteResult, ProviderError, FeeBreakdown, RouteStep } from '../types'

const isDev = process.env.NODE_ENV === 'development'
const SYNAPSE_DEBUG = process.env.DEBUG_SYNAPSE === '1'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const DEFAULT_TIMEOUT_MS = 10000

export async function quoteSynapse(
  input: QuoteInput,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<{ result: QuoteResult | null; error?: ProviderError }> {
  const startTime = Date.now()

  try {
    // Synapse uses POST for bridge quotes
    const requestBody = {
      originChainId: input.fromChainId,
      destinationChainId: input.toChainId,
      originToken: input.fromTokenAddress,
      destinationToken: input.toTokenAddress,
      amount: input.amountBase,
      recipient: input.userAddress,
      ...(input.slippageBps !== undefined && { slippage: input.slippageBps / 10000 }),
    }

    if (SYNAPSE_DEBUG || isDev) {
      console.log('[synapse] Request:', requestBody)
    }

    const response = await fetchWithTimeout(
      SYNAPSE_ENDPOINTS.bridge,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
      timeoutMs
    )

    const latencyMs = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      const truncatedError = errorText.length > 500 ? errorText.substring(0, 500) + '...' : errorText
      
      if (SYNAPSE_DEBUG || isDev) {
        console.error(`[synapse] API error: status=${response.status}, error=${truncatedError}`)
      }

      return {
        result: null,
        error: {
          provider: 'synapse',
          status: response.status,
          statusText: response.statusText,
          error: truncatedError || `HTTP ${response.status}`,
          errorCode: response.status === 400 ? 'INVALID_INPUT' : response.status === 404 ? 'NO_ROUTE' : 'API_ERROR',
          url: SYNAPSE_ENDPOINTS.bridge,
          request: requestBody,
        },
      }
    }

    const data = await response.json()

    if (SYNAPSE_DEBUG || isDev) {
      console.log('[synapse] Response:', JSON.stringify(data).substring(0, 500))
    }

    // Parse Synapse response
    const minAmountOut = data.minAmountOut || data.amountOut || data.outputAmount || data.destinationAmount || data.toAmount || data.receiveAmount
    const feeAmount = data.feeAmount || data.fee || data.bridgeFee || data.protocolFee || '0'
    const estimatedGas = data.estimatedGas || data.gasEstimate || data.gasLimit
    const feeUsd = data.feeUSD || data.feeUsd || data.totalFeeUsd || undefined
    const gasUsd = data.gasUSD || data.gasUsd || undefined
    const estimatedTime = data.estimatedTime || data.eta || data.estimatedDuration

    if (!minAmountOut || minAmountOut === '0' || minAmountOut === 0) {
      if (SYNAPSE_DEBUG || isDev) {
        console.warn('[synapse] Invalid response: missing or zero output amount')
      }
      return {
        result: null,
        error: {
          provider: 'synapse',
          error: 'Invalid response format: missing or zero output amount',
          errorCode: 'INVALID_RESPONSE',
          url: SYNAPSE_ENDPOINTS.bridge,
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
        provider: 'synapse',
        fromChainId: input.fromChainId,
        toChainId: input.toChainId,
        fromTokenAddress: input.fromTokenAddress,
        toTokenAddress: input.toTokenAddress,
        estimatedTime: estimatedTime ? Number(estimatedTime) : undefined,
      },
    ]

    const result: QuoteResult = {
      provider: 'synapse',
      fromAmount: input.amountBase,
      toAmount: minAmountOut.toString(),
      fees,
      routeSteps,
      meta: {
        ...data,
        latencyMs,
        _provider: 'synapse',
      },
      latencyMs,
      isIndicative: !input.userAddress || input.userAddress === '0x1111111111111111111111111111111111111111' || input.userAddress === ZERO_ADDRESS,
    }

    if (SYNAPSE_DEBUG || isDev) {
      console.log('[synapse] Quote success:', {
        fromAmount: result.fromAmount,
        toAmount: result.toAmount,
        fees: result.fees.length,
        latencyMs: result.latencyMs,
      })
    }

    return { result }
  } catch (error) {
    const latencyMs = Date.now() - startTime
    
    if (SYNAPSE_DEBUG || isDev) {
      console.error('[synapse] Error:', error instanceof Error ? error.message : String(error))
    }

    return {
      result: null,
      error: {
        provider: 'synapse',
        error: error instanceof Error ? error.message : String(error),
        errorCode: error instanceof Error && error.message.includes('timeout') ? 'TIMEOUT' : 'NETWORK_ERROR',
        url: SYNAPSE_ENDPOINTS.bridge,
      },
    }
  }
}
