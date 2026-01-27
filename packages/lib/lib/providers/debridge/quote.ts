/**
 * deBridge quote adapter
 * Endpoint: https://api.debridge.finance/api/v2/quote
 * TODO: Implement actual quote parsing once API response format is confirmed
 */

import { DEBRIDGE_ENDPOINTS } from '../endpoints/debridge'
import type { QuoteInput, QuoteResult, ProviderError } from '../types'

export async function quoteDebridge(
  input: QuoteInput,
  timeoutMs: number = 10000
): Promise<{ result: QuoteResult | null; error?: ProviderError }> {
  const startTime = Date.now()

  try {
    // TODO: Implement actual deBridge quote API call
    // Response format unknown - scaffold with UNSUPPORTED_PROVIDER_RESPONSE
    return {
      result: null,
      error: {
        provider: 'debridge',
        error: 'deBridge quote adapter not yet implemented - API response format needs confirmation',
        errorCode: 'UNSUPPORTED_PROVIDER_RESPONSE',
        url: DEBRIDGE_ENDPOINTS.quote,
      },
    }
  } catch (error) {
    const latencyMs = Date.now() - startTime
    return {
      result: null,
      error: {
        provider: 'debridge',
        error: error instanceof Error ? error.message : String(error),
        url: DEBRIDGE_ENDPOINTS.quote,
      },
    }
  }
}

