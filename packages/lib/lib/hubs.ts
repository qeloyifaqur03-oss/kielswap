/**
 * Hub network definitions for cross-family routing
 */

import { Family } from './families'

export interface Hub {
  networkId: string
  chainId: number | null
  family: Family
  priority: number // Lower = higher priority
}

/**
 * Hub networks for cross-family routing
 */
export const HUBS: Record<Family, Hub | null> = {
  EVM: {
    networkId: 'base', // Primary EVM hub (cheaper than Ethereum)
    chainId: 8453,
    family: 'EVM',
    priority: 1,
  },
  SOLANA: {
    networkId: 'solana',
    chainId: 101,
    family: 'SOLANA',
    priority: 1,
  },
  TON: {
    networkId: 'ton',
    chainId: 607,
    family: 'TON',
    priority: 1,
  },
  TRON: null, // TRON is not a hub for now
  UNSUPPORTED: null,
}

/**
 * Get EVM hub (Base, with Ethereum fallback)
 */
export function getEVMHub(): Hub {
  return HUBS.EVM!
}

/**
 * Get hub for a given family
 */
export function getHubForFamily(family: Family): Hub | null {
  return HUBS[family]
}

/**
 * Check if a network is a hub
 */
export function isHub(networkId: string): boolean {
  return Object.values(HUBS).some(
    (hub) => hub !== null && hub.networkId.toLowerCase() === networkId.toLowerCase()
  )
}



















