/**
 * Provider chain fetchers
 * Fetches supported chains from various bridge/swap providers
 */

import { fetchJson } from '../utils/fetchJson'
import { getProviderEndpoints } from '../providers/config'
import { fetchProviderChainsGeneric } from './providers-helper'

const FETCH_TIMEOUT_MS = 10000 // 10 second timeout per provider for chains/tokens/pools

export interface ProviderChain {
  chainId: number
  key?: string
  name?: string
  nativeSymbol?: string
}

export interface ProviderChainResult {
  provider: string
  chains: ProviderChain[]
}

// Type definitions for provider chain response formats
type ProviderChainItem = {
  chainId?: number
  key?: string
  name?: string
  nativeCurrency?: { symbol?: string; name?: string }
}

type LiFiChainsResponse = {
  chains?: Array<{ id: number; key?: string; name?: string; nativeCurrency?: { symbol?: string; name?: string } }>
}

type GenericChainsResponse = ProviderChainItem[] | { chains?: ProviderChainItem[] }

/**
 * Fetch LiFi supported chains
 * Endpoint: https://li.quest/v1/chains
 */
export async function fetchLiFiChains(): Promise<ProviderChainResult | null> {
  try {
    const result = await fetchJson<LiFiChainsResponse>('https://li.quest/v1/chains', {
      timeoutMs: FETCH_TIMEOUT_MS,
    })
    
    if (!result.ok || !result.data) {
      if (result.errorCode !== 'NOT_FOUND') {
        console.warn('[chains] LiFi chains endpoint failed:', result.error || result.status)
      }
      return null
    }
    
    const data = result.data
    
    // LiFi response format: { chains: Array<{ id: number, key: string, name: string, nativeCurrency: { symbol: string } }> }
    const chains: ProviderChain[] = []
    
    if (data.chains && Array.isArray(data.chains)) {
      for (const chain of data.chains) {
        if (chain.id && typeof chain.id === 'number') {
          chains.push({
            chainId: chain.id,
            key: chain.key || chain.name?.toLowerCase().replace(/\s+/g, '-'),
            name: chain.name,
            nativeSymbol: chain.nativeCurrency?.symbol || chain.nativeCurrency?.name,
          })
        }
      }
    }
    
    return {
      provider: 'lifi',
      chains,
    }
  } catch (error) {
    return null
  }
}

/**
 * Fetch 0x supported chains
 * Note: 0x doesn't have a public /chains endpoint, so we skip gracefully
 */
export async function fetch0xChains(): Promise<ProviderChainResult | null> {
  // 0x doesn't expose a chains endpoint - skip gracefully
  return null
}

/**
 * Fetch Relay supported chains
 * Note: Relay doesn't have a public /chains endpoint, so we skip gracefully
 */
export async function fetchRelayChains(): Promise<ProviderChainResult | null> {
  // Relay doesn't expose a chains endpoint - skip gracefully
  return null
}

/**
 * Fetch Stargate supported chains
 */
export async function fetchStargateChains(): Promise<ProviderChainResult | null> {
  const endpoints = getProviderEndpoints('stargate')
  if (!endpoints.chainsUrl) {
    return null
  }
  
  try {
    const result = await fetchJson<GenericChainsResponse>(endpoints.chainsUrl, {
      timeoutMs: FETCH_TIMEOUT_MS,
    })
    
    if (!result.ok || !result.data) {
      if (result.errorCode !== 'NOT_FOUND') {
        console.warn('[chains] Stargate chains endpoint failed:', result.error || result.status)
      }
      return null
    }
    
    const data = result.data
    
    // Parse response - adjust format based on actual API
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
      provider: 'stargate',
      chains,
    }
  } catch (error) {
    // Error already logged in fetchJson
    return null
  }
}

/**
 * Fetch Across supported chains
 */
export async function fetchAcrossChains(): Promise<ProviderChainResult | null> {
  const endpoints = getProviderEndpoints('across')
  if (!endpoints.chainsUrl) {
    return null
  }
  return fetchProviderChainsGeneric('across', endpoints.chainsUrl)
}

/**
 * Fetch Hop supported chains
 */
export async function fetchHopChains(): Promise<ProviderChainResult | null> {
  const endpoints = getProviderEndpoints('hop')
  if (!endpoints.chainsUrl) {
    return null
  }
  return fetchProviderChainsGeneric('hop', endpoints.chainsUrl)
}

/**
 * Fetch Synapse supported chains
 * Note: Synapse doesn't have a /chains endpoint per user spec
 */
export async function fetchSynapseChains(): Promise<ProviderChainResult | null> {
  // Synapse doesn't expose a chains endpoint - skip gracefully
  return null
}

/**
 * Fetch cBridge supported chains
 */
export async function fetchCBridgeChains(): Promise<ProviderChainResult | null> {
  const endpoints = getProviderEndpoints('cbridge')
  if (!endpoints.chainsUrl) {
    return null
  }
  return fetchProviderChainsGeneric('cbridge', endpoints.chainsUrl)
}

/**
 * Fetch deBridge supported chains
 */
export async function fetchDebridgeChains(): Promise<ProviderChainResult | null> {
  const endpoints = getProviderEndpoints('debridge')
  if (!endpoints.chainsUrl) {
    return null
  }
  return fetchProviderChainsGeneric('debridge', endpoints.chainsUrl)
}

/**
 * Fetch Bungee supported chains
 */
export async function fetchBungeeChains(): Promise<ProviderChainResult | null> {
  const endpoints = getProviderEndpoints('bungee')
  if (!endpoints.supportedChainsUrl) {
    return null
  }
  return fetchProviderChainsGeneric('bungee', endpoints.supportedChainsUrl)
}

/**
 * Fetch all provider chains in parallel
 */
export async function fetchAllProviderChains(): Promise<ProviderChainResult[]> {
  const results = await Promise.allSettled([
    fetchLiFiChains(),
    fetch0xChains(),
    fetchRelayChains(),
    // Only fetch bridge provider chains if feature flags are enabled
    process.env.ENABLE_STARGATE === '1' ? fetchStargateChains() : Promise.resolve(null),
    process.env.ENABLE_ACROSS === '1' ? fetchAcrossChains() : Promise.resolve(null),
    process.env.ENABLE_HOP === '1' ? fetchHopChains() : Promise.resolve(null),
    process.env.ENABLE_SYNAPSE === '1' ? fetchSynapseChains() : Promise.resolve(null),
    process.env.ENABLE_CBRIDGE === '1' ? fetchCBridgeChains() : Promise.resolve(null),
    process.env.ENABLE_DEBRIDGE === '1' ? fetchDebridgeChains() : Promise.resolve(null),
    process.env.ENABLE_BUNGEE === '1' ? fetchBungeeChains() : Promise.resolve(null),
  ])
  
  const validResults: ProviderChainResult[] = []
  
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value !== null) {
      validResults.push(result.value)
    }
  }
  
  return validResults
}

