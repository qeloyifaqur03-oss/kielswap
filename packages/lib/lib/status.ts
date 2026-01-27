/**
 * Transaction status checking service for cross-family swaps
 */

export interface StatusResult {
  ok: boolean
  status?: {
    provider: string
    txId: string
    status: string // 'waiting', 'confirming', 'exchanging', 'completed', 'failed', 'refunded'
    payinAddress?: string
    payoutAddress?: string
    fromAmount?: string
    toAmount?: string
  }
  raw?: any
  errorCode?: string
  errorMessage?: string
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(
  provider: 'changenow',
  txId: string
): Promise<StatusResult> {
  const isDev = typeof window !== 'undefined' && process.env.NODE_ENV === 'development'

  try {
    const response = await fetch(`/api/status?provider=${provider}&txId=${encodeURIComponent(txId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
      }
    }

    const data = await response.json()

    if (isDev) {
      console.log('[status] API response:', {
        ok: data.ok,
        status: data.status?.status,
      })
    }

    return {
      ok: data.ok,
      status: data.status,
      raw: data.raw,
      errorCode: data.errorCode,
      errorMessage: data.error,
    }
  } catch (error) {
    if (isDev) {
      console.error('[status] Fetch error:', error)
    }
    return {
      ok: false,
      errorCode: 'FETCH_ERROR',
      errorMessage: 'Network error',
    }
  }
}



















