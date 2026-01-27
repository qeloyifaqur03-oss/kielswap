/**
 * Single source of truth for wallet connection state
 * Used by badges page and other components that require strict wallet connection
 */

// Placeholder addresses that must NEVER be treated as connected wallets
const PLACEHOLDER_EOA = '0x1111111111111111111111111111111111111111'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// List of all placeholder addresses to reject
const PLACEHOLDER_ADDRESSES = [
  PLACEHOLDER_EOA.toLowerCase(),
  ZERO_ADDRESS.toLowerCase(),
] as const

export interface IsTrulyConnectedInput {
  mounted: boolean
  isConnected?: boolean
  status?: string
  address?: string | null
  connectorId?: string | null
}

export interface IsTrulyConnectedResult {
  ok: boolean
  reason: string
}

/**
 * Strict predicate to determine if wallet is truly connected
 * 
 * Requirements (ALL must be true):
 * - mounted === true (must be evaluated client-side after hydration)
 * - isConnected === true OR status === 'connected'
 * - address matches /^0x[a-fA-F0-9]{40}$/ (valid EVM address format)
 * - address !== '0x0000000000000000000000000000000000000000' (zero address)
 * - address !== '0x1111111111111111111111111111111111111111' (placeholder EOA)
 * - address is not any other placeholder found in codebase
 * - connectorId is present (preferred) OR status === 'connected'
 * 
 * This predicate is the SINGLE SOURCE OF TRUTH for wallet connection state.
 * All components should use this instead of checking isConnected/address directly.
 */
export function isTrulyConnected(input: IsTrulyConnectedInput): IsTrulyConnectedResult {
  const { mounted, isConnected, status, address, connectorId } = input

  // MUST be evaluated only after mount (client-side only)
  if (!mounted) {
    return { ok: false, reason: 'NOT_MOUNTED' }
  }

  // Must have connection indication (isConnected OR status === 'connected')
  const hasConnectionSignal = isConnected === true || status === 'connected'
  if (!hasConnectionSignal) {
    return { ok: false, reason: 'NOT_CONNECTED' }
  }

  // Must have an address
  if (!address) {
    return { ok: false, reason: 'NO_ADDRESS' }
  }

  // Must be valid EVM address format (0x + 40 hex chars)
  const isValidFormat = /^0x[a-fA-F0-9]{40}$/.test(address)
  if (!isValidFormat) {
    return { ok: false, reason: 'INVALID_ADDRESS_FORMAT' }
  }

  // Must NOT be a placeholder address
  const normalizedAddress = address.toLowerCase()
  const isPlaceholder = PLACEHOLDER_ADDRESSES.includes(normalizedAddress as any)
  if (isPlaceholder) {
    return { ok: false, reason: 'PLACEHOLDER_ADDRESS' }
  }

  // Must have connector OR status === 'connected'
  // Note: connectorId is preferred, but status === 'connected' is acceptable
  const hasConnector = !!connectorId
  const isStatusConnected = status === 'connected'
  if (!hasConnector && !isStatusConnected) {
    return { ok: false, reason: 'NO_CONNECTOR' }
  }

  // All checks passed
  return { ok: true, reason: 'CONNECTED' }
}

















