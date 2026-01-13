/**
 * Status endpoint - check transaction status for cross-family swaps
 * Currently supports ChangeNOW provider
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTransactionStatus } from '@/lib/providers/changenow'
import { checkRateLimit, getClientIP } from '@/lib/api/rateLimit'
import { validateQuery, routeSchemas } from '@/lib/api/validate'
import { randomUUID } from 'crypto'

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
  requestId?: string
}

export async function GET(request: NextRequest) {
  const requestId = randomUUID()
  
  try {
    // Rate limiting
    const ip = getClientIP(request)
    const rateLimitResult = await checkRateLimit('status', ip)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json({
        ok: false,
        error: 'RATE_LIMITED',
        retryAfter: rateLimitResult.retryAfter,
        requestId,
      } as StatusResponse, { status: 429 })
    }

    // Validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryObj: Record<string, string> = {}
    for (const [key, value] of searchParams.entries()) {
      queryObj[key] = value
    }
    
    const validation = validateQuery(routeSchemas['status'], queryObj, requestId)
    if (!validation.success) {
      console.error(`[status] [${requestId}] Validation failed:`, validation.details)
      return NextResponse.json({
        ok: false,
        error: validation.error,
        errorCode: 'BAD_REQUEST',
        details: validation.details,
        requestId,
      } as StatusResponse, { status: 400 })
    }

    const { provider, txId } = validation.data

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
      console.log(`[status] [${requestId}] Transaction status:`, {
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
      requestId,
    } as StatusResponse)
  } catch (error) {
    console.error(`[status] [${requestId}] Error:`, error)
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'STATUS_ERROR',
      requestId,
    } as StatusResponse, { status: 500 })
  }
}
