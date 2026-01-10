/**
 * ChangeNOW API provider integration
 * Handles cross-family swaps (TON↔TRON, TON/TRON↔EVM)
 */

import { getEnvWithDefault } from '../env'

const isDev = process.env.NODE_ENV === 'development'

export interface CNQuote {
  estimatedAmount: string
  minAmount?: string
  maxAmount?: string
  rateId?: string
}

export interface CNTx {
  id: string
  payinAddress: string
  payoutAddress: string
  fromAmount: string
  toAmount?: string
}

export interface CNStatus {
  id: string
  status: string // 'waiting', 'confirming', 'exchanging', 'completed', 'failed', 'refunded'
  payinAddress?: string
  payoutAddress?: string
  fromAmount?: string
  toAmount?: string
}

const API_BASE = 'https://api.changenow.io/v2'
const REQUEST_TIMEOUT = 10000 // 10 seconds

/**
 * Get API key from environment
 */
function getApiKey(): string {
  return getEnvWithDefault('CHANGENOW_API_KEY', '')
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout')
    }
    throw error
  }
}

/**
 * Get exchange amount estimate from ChangeNOW
 */
export async function getExchangeAmount(
  fromTicker: string,
  toTicker: string,
  amount: string, // Human-readable amount
  fromNetwork: string,
  toNetwork: string
): Promise<{ quote: CNQuote | null; error?: string }> {
  const apiKey = getApiKey()
  if (!apiKey) {
    return { quote: null, error: 'ChangeNOW API key not configured' }
  }

  try {
    const params = new URLSearchParams({
      fromCurrency: fromTicker,
      toCurrency: toTicker,
      fromAmount: amount,
      fromNetwork,
      toNetwork,
      flow: 'standard',
      api_key: apiKey,
    })

    const url = `${API_BASE}/exchange/estimated?${params.toString()}`

    if (isDev) {
      console.log('[changenow] Quote request:', { fromTicker, toTicker, amount, fromNetwork, toNetwork })
    }

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      if (isDev) {
        console.error('[changenow] Quote failed:', response.status, errorText)
      }
      
      // If Base network is unsupported, try Ethereum as fallback
      if (fromNetwork === 'base' || toNetwork === 'base') {
        const fallbackFromNetwork = fromNetwork === 'base' ? 'eth' : fromNetwork
        const fallbackToNetwork = toNetwork === 'base' ? 'eth' : toNetwork
        
        if (isDev) {
          console.log('[changenow] Retrying with Ethereum fallback:', { fallbackFromNetwork, fallbackToNetwork })
        }
        
        // Retry with Ethereum
        const fallbackParams = new URLSearchParams({
          fromCurrency: fromTicker,
          toCurrency: toTicker,
          fromAmount: amount,
          fromNetwork: fallbackFromNetwork,
          toNetwork: fallbackToNetwork,
          flow: 'standard',
          api_key: apiKey,
        })
        const fallbackUrl = `${API_BASE}/exchange/estimated?${fallbackParams.toString()}`
        
        const fallbackResponse = await fetchWithTimeout(fallbackUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          const quote: CNQuote = {
            estimatedAmount: fallbackData.toAmount || fallbackData.estimatedAmount || '0',
            minAmount: fallbackData.minAmount,
            maxAmount: fallbackData.maxAmount,
            rateId: fallbackData.rateId || fallbackData.id,
          }
          if (isDev) {
            console.log('[changenow] Fallback quote response:', quote)
          }
          return { quote }
        }
      }
      
      return {
        quote: null,
        error: `ChangeNOW API error (${response.status}): ${errorText.substring(0, 200)}`,
      }
    }

    const data = await response.json()

    // ChangeNOW API response format
    const quote: CNQuote = {
      estimatedAmount: data.toAmount || data.estimatedAmount || '0',
      minAmount: data.minAmount,
      maxAmount: data.maxAmount,
      rateId: data.rateId || data.id,
    }

    if (isDev) {
      console.log('[changenow] Quote response:', quote)
    }

    return { quote }
  } catch (error) {
    if (isDev) {
      console.error('[changenow] Quote error:', error)
    }
    return {
      quote: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Create exchange transaction
 */
export async function createTransaction(
  fromTicker: string,
  toTicker: string,
  amount: string, // Human-readable amount
  toAddress: string, // Payout address
  fromNetwork: string,
  toNetwork: string,
  refundAddress?: string
): Promise<{ tx: CNTx | null; error?: string }> {
  const apiKey = getApiKey()
  if (!apiKey) {
    return { tx: null, error: 'ChangeNOW API key not configured' }
  }

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
    })

    const url = `${API_BASE}/exchange?${params.toString()}`

    const body = {
      fromCurrency: fromTicker,
      toCurrency: toTicker,
      fromAmount: amount,
      fromNetwork,
      toNetwork,
      address: toAddress, // Payout address
      flow: 'standard',
      ...(refundAddress && { refundAddress }),
    }

    if (isDev) {
      console.log('[changenow] Create transaction:', { fromTicker, toTicker, amount, toAddress, fromNetwork, toNetwork })
    }

    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      REQUEST_TIMEOUT
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      if (isDev) {
        console.error('[changenow] Create transaction failed:', response.status, errorText)
      }
      return {
        tx: null,
        error: `ChangeNOW API error (${response.status}): ${errorText.substring(0, 200)}`,
      }
    }

    const data = await response.json()

    // ChangeNOW API response format
    const tx: CNTx = {
      id: data.id || data.transactionId || '',
      payinAddress: data.payinAddress || data.address || '',
      payoutAddress: data.payoutAddress || data.address || toAddress,
      fromAmount: data.fromAmount || amount,
      toAmount: data.toAmount || data.estimatedAmount,
    }

    if (isDev) {
      console.log('[changenow] Transaction created:', tx)
    }

    return { tx }
  } catch (error) {
    if (isDev) {
      console.error('[changenow] Create transaction error:', error)
    }
    return {
      tx: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(id: string): Promise<{ status: CNStatus | null; error?: string }> {
  const apiKey = getApiKey()
  if (!apiKey) {
    return { status: null, error: 'ChangeNOW API key not configured' }
  }

  try {
    const params = new URLSearchParams({
      id,
      api_key: apiKey,
    })

    const url = `${API_BASE}/exchange/by-id?${params.toString()}`

    if (isDev) {
      console.log('[changenow] Get status:', { id })
    }

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      if (isDev) {
        console.error('[changenow] Get status failed:', response.status, errorText)
      }
      return {
        status: null,
        error: `ChangeNOW API error (${response.status}): ${errorText.substring(0, 200)}`,
      }
    }

    const data = await response.json()

    // ChangeNOW API response format
    // Handle both direct response and nested response formats
    const status: CNStatus = {
      id: data.id || data.transactionId || data.transaction_id || id,
      status: data.status || data.state || 'unknown',
      payinAddress: data.payinAddress || data.payin_address || data.address,
      payoutAddress: data.payoutAddress || data.payout_address,
      fromAmount: data.fromAmount || data.from_amount,
      toAmount: data.toAmount || data.to_amount,
    }

    if (isDev) {
      console.log('[changenow] Status response:', status)
    }

    return { status }
  } catch (error) {
    if (isDev) {
      console.error('[changenow] Get status error:', error)
    }
    return {
      status: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
