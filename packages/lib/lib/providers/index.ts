/**
 * Provider registry and adapter exports
 * EVM-only bridge aggregator providers
 */

import type { ProviderId, QuoteInput, QuoteResult, ProviderError } from './types'
import { quoteStargate } from './stargate/quote'
import { quoteHop } from './hop/quote'
import { quoteAcross } from './across/quote'
import { quoteSynapse } from './synapse/quote'
import { quoteCBridge } from './cbridge/quote'
import { quoteDebridge } from './debridge/quote'
import { quoteBungee } from './bungee/quote'
import { quoteSocket } from './socket/quote'

export type { ProviderId, QuoteInput, QuoteResult, ProviderError }

export interface ProviderAdapter {
  quote: (input: QuoteInput, timeoutMs?: number) => Promise<{ result: QuoteResult | null; error?: ProviderError }>
  enabled: boolean
  priority: number // Lower number = higher priority
  name: string
}

/**
 * Provider registry
 * All new providers are disabled by default (behind feature flags)
 */
export const PROVIDERS: Record<ProviderId, ProviderAdapter> = {
  relay: {
    quote: async () => ({ result: null, error: { provider: 'relay', error: 'Relay adapter not migrated yet' } }),
    enabled: true, // Existing provider
    priority: 1,
    name: 'Relay',
  },
  lifi: {
    quote: async () => ({ result: null, error: { provider: 'lifi', error: 'LiFi adapter not migrated yet' } }),
    enabled: true, // Existing provider
    priority: 2,
    name: 'LiFi',
  },
  zerox: {
    quote: async () => ({ result: null, error: { provider: 'zerox', error: '0x adapter not migrated yet' } }),
    enabled: true, // Existing provider
    priority: 3,
    name: '0x',
  },
  stargate: {
    quote: quoteStargate,
    enabled: false, // Disabled by default - only supports ERC20, not native tokens
    priority: 4,
    name: 'stargate',
  },
  hop: {
    quote: quoteHop,
    enabled: false, // Disabled - API requires token symbol, not address, and is slow
    priority: 5,
    name: 'hop',
  },
  across: {
    quote: quoteAcross,
    enabled: false, // Disabled - API endpoint returns 404, and is slow
    priority: 6,
    name: 'across',
  },
  synapse: {
    quote: quoteSynapse,
    enabled: false, // Disabled - API endpoint returns 404, and is slow
    priority: 7,
    name: 'synapse',
  },
  cbridge: {
    quote: quoteCBridge,
    enabled: false, // Disabled - API endpoint fails, and is slow
    priority: 8,
    name: 'cbridge',
  },
  debridge: {
    quote: quoteDebridge,
    enabled: process.env.ENABLE_DEBRIDGE === '1',
    priority: 9,
    name: 'debridge',
  },
  bungee: {
    quote: quoteBungee,
    enabled: false, // Disabled - use Socket instead
    priority: 10,
    name: 'bungee',
  },
  socket: {
    quote: quoteSocket,
    enabled: false, // Disabled - requires paid API access or special configuration
    priority: 10,
    name: 'socket',
  },
}

/**
 * Get enabled providers sorted by priority
 */
export function getEnabledProviders(): ProviderAdapter[] {
  return Object.values(PROVIDERS)
    .filter((p) => p.enabled)
    .sort((a, b) => a.priority - b.priority)
}

/**
 * Quote from a specific provider
 */
export async function quoteFromProvider(
  providerId: ProviderId,
  input: QuoteInput,
  timeoutMs: number = 10000
): Promise<{ result: QuoteResult | null; error?: ProviderError }> {
  const provider = PROVIDERS[providerId]
  if (!provider || !provider.enabled) {
    return {
      result: null,
      error: {
        provider: providerId,
        error: `Provider ${providerId} is not enabled`,
        errorCode: 'PROVIDER_DISABLED',
      },
    }
  }

  return provider.quote(input, timeoutMs)
}

