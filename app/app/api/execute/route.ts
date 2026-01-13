/**
 * Execution endpoint - creates transactions for cross-family swaps
 * Currently supports ChangeNOW provider
 */

import { NextRequest, NextResponse } from 'next/server'
import { getNetworkFamily } from '@/lib/chainRegistry'
import { resolveChangeNowAsset } from '@/lib/providers/changenowMap'
import { createTransaction } from '@/lib/providers/changenow'
import { getTokenInfo } from '@/lib/tokens'
import { checkRateLimit, getClientIP } from '@/lib/api/rateLimit'
import { validateBody, routeSchemas } from '@/lib/api/validate'
import { randomUUID } from 'crypto'

const isDev = process.env.NODE_ENV === 'development'

interface ExecuteRequest {
  provider: 'changenow'
  routePlanId?: string
  fromNetworkId: string
  toNetworkId: string
  fromTokenSymbol: string
  toTokenSymbol: string
  amountHuman: string
  user: {
    tonAddress?: string
    tronAddress?: string
    evmAddress?: string
  }
}

interface ExecuteResponse {
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
  error?: string
  errorCode?: string
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID()
  
  try {
    // Rate limiting
    const ip = getClientIP(request)
    const rateLimitResult = await checkRateLimit('execute', ip)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json({
        ok: false,
        error: 'RATE_LIMITED',
        retryAfter: rateLimitResult.retryAfter,
        requestId,
      } as ExecuteResponse, { status: 429 })
    }

    const body = await request.json()

    // Validate body with Zod
    const validation = validateBody(routeSchemas['execute'], body, requestId)
    if (!validation.success) {
      console.error(`[execute] [${requestId}] Validation failed:`, validation.details)
      return NextResponse.json({
        ok: false,
        error: validation.error,
        errorCode: 'BAD_REQUEST',
        details: validation.details,
        requestId,
      } as ExecuteResponse, { status: 400 })
    }

    const bodyValidated = validation.data

    // Determine payout address based on destination family
    const toFamily = getNetworkFamily(bodyValidated.toNetworkId)
    let payoutAddress: string | undefined

    switch (toFamily) {
      case 'TRON':
        payoutAddress = bodyValidated.user.tronAddress
        break
      case 'TON':
        payoutAddress = bodyValidated.user.tonAddress
        break
      case 'EVM':
        payoutAddress = bodyValidated.user.evmAddress
        break
      default:
        return NextResponse.json({
          ok: false,
          error: `Destination network ${bodyValidated.toNetworkId} requires wallet address`,
          errorCode: 'MISSING_WALLET_ADDRESS',
          requestId,
          debug: {
            toNetworkId: bodyValidated.toNetworkId,
            toFamily,
            requiredWallet: toFamily.toLowerCase(),
          },
        } as ExecuteResponse, { status: 400 })
    }

    if (!payoutAddress) {
      return NextResponse.json({
        ok: false,
        error: `Missing wallet address for destination network ${bodyValidated.toNetworkId}`,
        errorCode: 'MISSING_WALLET_ADDRESS',
        requestId,
        debug: {
          toNetworkId: bodyValidated.toNetworkId,
          toFamily,
          requiredWallet: toFamily.toLowerCase(),
        },
      } as ExecuteResponse, { status: 400 })
    }

    // Resolve ChangeNOW asset codes
    const fromAsset = resolveChangeNowAsset(bodyValidated.fromNetworkId, bodyValidated.fromTokenSymbol)
    const evmNetworkId = bodyValidated.toNetworkId === 'base' ? 'ethereum' : bodyValidated.toNetworkId
    const toAsset = resolveChangeNowAsset(evmNetworkId, bodyValidated.toTokenSymbol)

    if (!fromAsset || !toAsset) {
      return NextResponse.json({
        ok: false,
        error: 'Unsupported asset pair for ChangeNOW',
        errorCode: 'UNSUPPORTED_ASSET',
        requestId,
        debug: {
          fromNetworkId: bodyValidated.fromNetworkId,
          fromTokenSymbol: bodyValidated.fromTokenSymbol,
          toNetworkId: bodyValidated.toNetworkId,
          toTokenSymbol: bodyValidated.toTokenSymbol,
        },
      } as ExecuteResponse, { status: 400 })
    }

    // Validate min amount if we have quote data (would come from route-plan, but for now just proceed)
    // In production, you'd check minAmount from the quote

    // Create transaction
    const txResult = await createTransaction(
      fromAsset.ticker,
      toAsset.ticker,
      bodyValidated.amountHuman,
      payoutAddress,
      fromAsset.network,
      toAsset.network
    )

    if (!txResult.tx) {
      return NextResponse.json({
        ok: false,
        error: txResult.error || 'Failed to create transaction',
        errorCode: 'TRANSACTION_CREATE_FAILED',
        requestId,
      } as ExecuteResponse, { status: 500 })
    }

    // Get token info for estimated amount conversion
    const toToken = getTokenInfo(bodyValidated.toTokenSymbol.toLowerCase())
    const estimatedAmountHuman = txResult.tx.toAmount || '0'

    if (isDev) {
      console.log(`[execute] [${requestId}] Transaction created:`, {
        txId: txResult.tx.id,
        payinAddress: txResult.tx.payinAddress,
        payoutAddress: txResult.tx.payoutAddress,
      })
    }

    return NextResponse.json({
      ok: true,
      execution: {
        provider: 'changenow',
        txId: txResult.tx.id,
        payinAddress: txResult.tx.payinAddress,
        payoutAddress: txResult.tx.payoutAddress,
        from: {
          networkId: bodyValidated.fromNetworkId,
          tokenSymbol: bodyValidated.fromTokenSymbol,
          amountHuman: bodyValidated.amountHuman,
        },
        to: {
          networkId: bodyValidated.toNetworkId,
          tokenSymbol: bodyValidated.toTokenSymbol,
          estimatedAmountHuman,
        },
        nextAction: {
          kind: 'USER_TRANSFER',
          networkId: bodyValidated.fromNetworkId,
          tokenSymbol: bodyValidated.fromTokenSymbol,
          toAddress: txResult.tx.payinAddress,
        },
      },
      requestId,
    } as ExecuteResponse)
  } catch (error) {
    console.error(`[execute] [${requestId}] Error:`, error)
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'EXECUTION_ERROR',
      requestId,
    } as ExecuteResponse, { status: 500 })
  }
}
