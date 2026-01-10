/**
 * Helper function to fetch and parse provider chains
 */
import { fetchJson } from '../utils/fetchJson'
import type { ProviderChain, ProviderChainResult } from './providers'

const FETCH_TIMEOUT_MS = 10000

// Type definition for generic chains response
type GenericChainsResponse = 
  | Array<{ chainId?: number; key?: string; name?: string; nativeCurrency?: { symbol?: string } }>
  | { chains?: Array<{ chainId?: number; key?: string; name?: string; nativeCurrency?: { symbol?: string } }> }

export async function fetchProviderChainsGeneric(
  provider: string,
  chainsUrl: string
): Promise<ProviderChainResult | null> {
  try {
    const result = await fetchJson<GenericChainsResponse>(chainsUrl, {
      timeoutMs: FETCH_TIMEOUT_MS,
    })

    if (!result.ok || !result.data) {
      if (result.errorCode !== 'NOT_FOUND') {
        console.warn(`[chains] ${provider} chains endpoint failed:`, result.error || result.status)
      }
      return null
    }

    const data = result.data
    const chains: ProviderChain[] = []
    const dataArray = Array.isArray(data) ? data : (data as any).chains

    if (Array.isArray(dataArray)) {
      for (const chain of dataArray) {
        if (chain.chainId && typeof chain.chainId === 'number') {
          chains.push({
            chainId: chain.chainId,
            key: chain.key || chain.name?.toLowerCase().replace(/\s+/g, '-'),
            name: chain.name,
            nativeSymbol: chain.nativeCurrency?.symbol,
          })
        }
      }
    }

    return {
      provider,
      chains,
    }
  } catch (error) {
    return null
  }
}

