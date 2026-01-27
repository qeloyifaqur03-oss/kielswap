/**
 * Execution service for cross-family swaps
 * Creates transactions via ChangeNOW or other providers
 */

export interface ExecuteResult {
  ok: boolean
  execution?: {
    provider: string
    txId: string
    payinAddress: string
    payoutAddress: string
    from: { networkId: string; tokenSymbol: string; amountHuman: string }
    to: { networkId: string; tokenSymbol: string; estimatedAmountHuman: string }
    nextAction: {
      kind: 'USER_TRANSFER'
      networkId: string
      tokenSymbol: string
      toAddress: string
    }
  }
  errorCode?: string
  errorMessage?: string
  debug?: any
}

/**
 * Execute a cross-family swap by creating a transaction
 */
export async function executeSwap(
  provider: 'changenow',
  fromNetworkId: string,
  toNetworkId: string,
  fromTokenSymbol: string,
  toTokenSymbol: string,
  amountHuman: string,
  user: {
    evmAddress?: string
    tonAddress?: string
    tronAddress?: string
  }
): Promise<ExecuteResult> {
  const isDev = typeof window !== 'undefined' && process.env.NODE_ENV === 'development'

  try {
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider,
        fromNetworkId,
        toNetworkId,
        fromTokenSymbol,
        toTokenSymbol,
        amountHuman,
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
      console.log('[execute] API response:', {
        ok: data.ok,
        txId: data.execution?.txId,
        payinAddress: data.execution?.payinAddress,
      })
    }

    return {
      ok: data.ok,
      execution: data.execution,
      errorCode: data.errorCode,
      errorMessage: data.error,
      debug: data.debug,
    }
  } catch (error) {
    if (isDev) {
      console.error('[execute] Fetch error:', error)
    }
    return {
      ok: false,
      errorCode: 'FETCH_ERROR',
      errorMessage: 'Network error',
      debug: error instanceof Error ? { message: error.message, name: error.name } : error,
    }
  }
}



















