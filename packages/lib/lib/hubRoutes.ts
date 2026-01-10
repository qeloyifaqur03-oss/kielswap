/**
 * Hub routing matrix - defines supported cross-family routes
 */

import { Family } from './families'
import { getEVMHub, getHubForFamily } from './hubs'

export interface HubRoute {
  fromFamily: Family
  toFamily: Family
  viaHub: Family | null // null = direct (if supported)
  steps: number // 2 = via hub, 3 = via hub with intermediate swap
  supported: boolean
}

/**
 * Minimal hub routing matrix
 * Defines which cross-family routes are supported and how
 */
const HUB_ROUTES: HubRoute[] = [
  // SOL <-> EVM via EVM hub (Base)
  {
    fromFamily: 'SOLANA',
    toFamily: 'EVM',
    viaHub: 'EVM',
    steps: 2,
    supported: true,
  },
  {
    fromFamily: 'EVM',
    toFamily: 'SOLANA',
    viaHub: 'EVM',
    steps: 2,
    supported: true,
  },

  // TON <-> EVM via EVM hub (Base)
  {
    fromFamily: 'TON',
    toFamily: 'EVM',
    viaHub: 'EVM',
    steps: 2,
    supported: true,
  },
  {
    fromFamily: 'EVM',
    toFamily: 'TON',
    viaHub: 'EVM',
    steps: 2,
    supported: true,
  },

  // TRON -> EVM: requires adapter or OFFCHAIN_SWAP
  {
    fromFamily: 'TRON',
    toFamily: 'EVM',
    viaHub: null, // Direct adapter or OFFCHAIN_SWAP fallback
    steps: 1,
    supported: false, // Will use OFFCHAIN_SWAP fallback
  },
  {
    fromFamily: 'EVM',
    toFamily: 'TRON',
    viaHub: null,
    steps: 1,
    supported: false, // Will use OFFCHAIN_SWAP fallback
  },

  // TRON -> TON: via EVM hub (3 legs) or OFFCHAIN_SWAP
  {
    fromFamily: 'TRON',
    toFamily: 'TON',
    viaHub: 'EVM',
    steps: 3, // TRON -> EVM -> TON (if adapter exists), else OFFCHAIN_SWAP
    supported: false, // Will use OFFCHAIN_SWAP fallback
  },
  {
    fromFamily: 'TON',
    toFamily: 'TRON',
    viaHub: 'EVM',
    steps: 3,
    supported: false, // Will use OFFCHAIN_SWAP fallback
  },

  // SOL <-> TON: via EVM hub (3 legs)
  {
    fromFamily: 'SOLANA',
    toFamily: 'TON',
    viaHub: 'EVM',
    steps: 3,
    supported: true,
  },
  {
    fromFamily: 'TON',
    toFamily: 'SOLANA',
    viaHub: 'EVM',
    steps: 3,
    supported: true,
  },
]

/**
 * Find hub route for cross-family swap
 */
export function findHubRoute(fromFamily: Family, toFamily: Family): HubRoute | null {
  if (fromFamily === toFamily) {
    return null // Same family, no hub needed
  }

  return (
    HUB_ROUTES.find(
      (route) => route.fromFamily === fromFamily && route.toFamily === toFamily
    ) || null
  )
}

/**
 * Check if a cross-family route is supported
 */
export function isRouteSupported(fromFamily: Family, toFamily: Family): boolean {
  if (fromFamily === toFamily) {
    return true // Same family is always supported
  }

  const route = findHubRoute(fromFamily, toFamily)
  if (!route) {
    return false
  }

  // TRON routes are not fully supported but have OFFCHAIN_SWAP fallback
  if (route.fromFamily === 'TRON' || route.toFamily === 'TRON') {
    return false // Will use OFFCHAIN_SWAP fallback instead
  }

  return route.supported
}

/**
 * Get canonical bridge token for a family
 * Used when routing through hubs
 */
export function getBridgeToken(family: Family): string {
  switch (family) {
    case 'EVM':
      return 'usdc' // USDC is most bridged on EVM
    case 'SOLANA':
      return 'usdc' // USDC has wrapped version on Solana
    case 'TON':
      return 'usdt' // USDT on TON
    case 'TRON':
      return 'usdt' // USDT on TRON
    default:
      return 'usdt' // Default fallback
  }
}



















