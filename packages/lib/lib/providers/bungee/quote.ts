/**
 * Bungee quote adapter - uses Socket Protocol API
 * Socket aggregates multiple bridge providers (Hop, Across, Synapse, cBridge, etc.)
 * This adapter uses Socket API which provides access to multiple bridges
 */

import { quoteSocket } from '../socket/quote'
import type { QuoteInput, QuoteResult, ProviderError } from '../types'

/**
 * Bungee uses Socket Protocol API under the hood
 * Re-export Socket implementation for Bungee
 */
export async function quoteBungee(
  input: QuoteInput,
  timeoutMs?: number
): Promise<{ result: QuoteResult | null; error?: ProviderError }> {
  // Bungee is powered by Socket Protocol
  // Use Socket implementation
  return quoteSocket(input, timeoutMs)
}

