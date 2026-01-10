/**
 * Strict wallet connection check for badges
 * Excludes placeholder addresses used by quote API
 */

// Placeholder address used by quote API for indicative quotes
// This must NEVER be treated as a connected wallet in badges logic
const PLACEHOLDER_EOA = '0x1111111111111111111111111111111111111111'

// Zero address (never valid as a wallet)
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const DEBUG_WALLET = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG_WALLET === '1'

/**
 * Check if an address is a placeholder (not a real wallet)
 */
export function isPlaceholderAddress(address: string | undefined): boolean {
  if (!address) return true
  
  const normalized = address.toLowerCase()
  const isPlaceholder = normalized === PLACEHOLDER_EOA.toLowerCase() || normalized === ZERO_ADDRESS.toLowerCase()
  
  if (DEBUG_WALLET && isPlaceholder) {
    console.log('[walletCheck] isPlaceholderAddress:', { address, normalized, isPlaceholder })
  }
  
  return isPlaceholder
}

/**
 * Strict wallet-connected predicate for badges
 * 
 * Requirements:
 * - isConnected must be true
 * - address must be a valid 0x EVM address (40 hex chars)
 * - address must NOT be zero address
 * - address must NOT be the placeholder EOA
 * - connector must be present OR status must be 'connected'
 */
export function isWalletConnectedForBadges(
  isConnected: boolean,
  address: string | undefined,
  connector?: { id: string } | null,
  status?: string
): boolean {
  // Must be connected
  if (!isConnected) {
    if (DEBUG_WALLET) {
      console.log('[walletCheck] isWalletConnectedForBadges: false (not connected)', { isConnected, address, connectorId: connector?.id, status })
    }
    return false
  }
  
  // Must have an address
  if (!address) {
    if (DEBUG_WALLET) {
      console.log('[walletCheck] isWalletConnectedForBadges: false (no address)', { isConnected, address, connectorId: connector?.id, status })
    }
    return false
  }
  
  // Must be a valid EVM address format (0x + 40 hex chars)
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    if (DEBUG_WALLET) {
      console.log('[walletCheck] isWalletConnectedForBadges: false (invalid format)', { isConnected, address, connectorId: connector?.id, status })
    }
    return false
  }
  
  // Must NOT be a placeholder address
  if (isPlaceholderAddress(address)) {
    if (DEBUG_WALLET) {
      console.log('[walletCheck] isWalletConnectedForBadges: false (placeholder address)', { isConnected, address, connectorId: connector?.id, status })
    }
    return false
  }
  
  // Must have connector OR status must be 'connected'
  // Note: In wagmi v2, when autoConnect runs, status might be 'connecting' temporarily
  // We require either a connector OR explicit 'connected' status
  const hasConnector = !!connector?.id
  const isStatusConnected = status === 'connected'
  
  if (!hasConnector && !isStatusConnected) {
    if (DEBUG_WALLET) {
      console.log('[walletCheck] isWalletConnectedForBadges: false (no connector and status not connected)', { isConnected, address, connectorId: connector?.id, status, hasConnector, isStatusConnected })
    }
    return false
  }
  
  if (DEBUG_WALLET) {
    console.log('[walletCheck] isWalletConnectedForBadges: true (valid wallet)', { isConnected, address, connectorId: connector?.id, status })
  }
  
  return true
}

