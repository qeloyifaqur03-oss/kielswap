/**
 * Status endpoint - check transaction status for cross-family swaps
 * Currently supports ChangeNOW provider
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTransactionStatus } from '@/lib/providers/changenow'

const isDev = process.env.NODE_ENV === 'development'

export const dynamic = 'force-dynamic' // This route uses searchParams, must be dynamic

interface StatusRequest {
  provider: 'changenow'
  txId: string
}

interface StatusResponse {
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
  error?: string
  errorCode?: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const provider = searchParams.get('provider')
    const txId = searchParams.get('txId')

    if (!provider || !txId) {
      return NextResponse.json({
        ok: false,
        error: 'Missing required parameters: provider and txId',
        errorCode: 'INVALID_REQUEST',
      } as StatusResponse, { status: 400 })
    }

    if (provider !== 'changenow') {
      return NextResponse.json({
        ok: false,
        error: 'Only ChangeNOW provider is currently supported',
        errorCode: 'UNSUPPORTED_PROVIDER',
      } as StatusResponse, { status: 400 })
    }

    // Get transaction status
    const statusResult = await getTransactionStatus(txId)

    if (!statusResult.status) {
      return NextResponse.json({
        ok: false,
        error: statusResult.error || 'Failed to get transaction status',
        errorCode: 'STATUS_FETCH_FAILED',
      } as StatusResponse, { status: 500 })
    }

    if (isDev) {
      console.log('[status] Transaction status:', {
        txId: statusResult.status.id,
        status: statusResult.status.status,
      })
    }

    return NextResponse.json({
      ok: true,
      status: {
        provider: 'changenow',
        txId: statusResult.status.id,
        status: statusResult.status.status,
        payinAddress: statusResult.status.payinAddress,
        payoutAddress: statusResult.status.payoutAddress,
        fromAmount: statusResult.status.fromAmount,
        toAmount: statusResult.status.toAmount,
      },
      raw: statusResult.status,
    } as StatusResponse)
  } catch (error) {
    console.error('[status] Error:', error)
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'STATUS_ERROR',
    } as StatusResponse, { status: 500 })
  }
}
