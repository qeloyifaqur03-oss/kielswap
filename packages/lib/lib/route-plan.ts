/**
 * Route plan fetching service for cross-family swaps
 * Calls server-side API route which uses ChangeNOW or other providers
 */

export interface RoutePlanResult {
  ok: boolean
  routePlan?: {
    requestId: string
    from: { networkId: string; family: string; tokenId: string; decimals: number }
    to: { networkId: string; family: string; tokenId: string; decimals: number }
    steps: Array<{
      stepId: string
      kind: 'SWAP' | 'BRIDGE' | 'TRANSFER' | 'WRAP' | 'UNWRAP'
      family: string
      provider: string
      from: { networkId: string; tokenId: string; amountBase: string; decimals: number }
      to: { networkId: string; tokenId: string; estimatedAmountBase: string; decimals: number }
      requiresWallet: 'evm' | 'ton' | 'tron' | 'solana' | 'none'
      quote?: any
      notes?: string
    }>
    requires: {
      wallets: Array<'evm' | 'ton' | 'tron' | 'solana'>
      approvals: Array<any>
    }
  }
  errorCode?: string
  errorMessage?: string
  debug?: any
}

/**
 * Fetch route plan from server-side API route
 */
export async function fetchRoutePlan(
  amountBase: string,
  fromTokenId: string,
  toTokenId: string,
  fromNetworkId: string,
  toNetworkId: string,
  user?: {
    evmAddress?: string
    tonAddress?: string
    tronAddress?: string
  }
): Promise<RoutePlanResult> {
  const isDev = typeof window !== 'undefined' && process.env.NODE_ENV === 'development'

  try {
    const response = await fetch('/api/route-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fromNetworkId,
        toNetworkId,
        fromTokenId,
        toTokenId,
        amountBase,
        user,
      }),
    })

    if (!response.ok) {
      let errorBody: string | any
      try {
        errorBody = await response.json()
      } catch {
        errorBody = await response.text()
      }

      return {
        ok: false,
        errorCode: errorBody.errorCode || 'HTTP_ERROR',
        errorMessage: errorBody.error || `API error (${response.status})`,
        debug: errorBody.debug,
      }
    }

    const data = await response.json()

    if (isDev) {
      console.log('[route-plan] API response:', {
        ok: data.ok,
        steps: data.routePlan?.steps.length,
        provider: data.routePlan?.steps[0]?.provider,
      })
    }

    return {
      ok: data.ok,
      routePlan: data.routePlan,
      errorCode: data.errorCode,
      errorMessage: data.error,
      debug: data.debug,
    }
  } catch (error) {
    if (isDev) {
      console.error('[route-plan] Fetch error:', error)
    }
    return {
      ok: false,
      errorCode: 'FETCH_ERROR',
      errorMessage: 'Network error',
      debug: error instanceof Error ? { message: error.message, name: error.name } : error,
    }
  }
}



















