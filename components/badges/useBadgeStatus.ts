'use client'

import { useState, useEffect } from 'react'
import { useSafeAccount } from '@/lib/wagmi/safeHooks'
import { Badge } from '@/lib/badges'
import { isTrulyConnected } from '@/lib/wallet/isTrulyConnected'

export type BadgeStatus = 'CLAIMED' | 'NEEDS_WALLET' | 'ELIGIBLE' | 'INELIGIBLE'

/**
 * Compute badge status based on claimed state, wallet connection, and eligibility
 * Status precedence: CLAIMED > NEEDS_WALLET > ELIGIBLE > INELIGIBLE
 * Uses strict wallet connection check via isTrulyConnected (excludes placeholder addresses)
 */
export function useBadgeStatus(badge: Badge): BadgeStatus {
  const accountResult = useSafeAccount()
  const { isConnected, address, connector, status, mounted } = accountResult
  
  // SINGLE SOURCE OF TRUTH: Use isTrulyConnected helper
  const connectionResult = isTrulyConnected({
    mounted,
    isConnected,
    status,
    address: address || null,
    connectorId: connector?.id || null,
  })
  const walletConnected = connectionResult.ok

  // CLAIMED is terminal state - always takes precedence
  if (badge.isClaimed) {
    return 'CLAIMED'
  }

  // If wallet not connected (strict check), need wallet before claiming
  if (!walletConnected) {
    return 'NEEDS_WALLET'
  }

  // If eligible and wallet connected, can claim
  if (badge.isUnlocked) {
    return 'ELIGIBLE'
  }

  // Not eligible
  return 'INELIGIBLE'
}


