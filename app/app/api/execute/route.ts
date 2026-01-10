/**
 * Execution endpoint - creates transactions for cross-family swaps
 * Currently supports ChangeNOW provider
 */

import { NextRequest, NextResponse } from 'next/server'
import { getNetworkFamily } from '@/lib/chainRegistry'
import { resolveChangeNowAsset } from '@/lib/providers/changenowMap'
import { createTransaction } from '@/lib/providers/changenow'
import { getTokenInfo } from '@/lib/tokens'

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
  try {
    const body: ExecuteRequest = await request.json()

    if (body.provider !== 'changenow') {
      return NextResponse.json({
        ok: false,
        error: 'Only ChangeNOW provider is currently supported',
        errorCode: 'UNSUPPORTED_PROVIDER',
      } as ExecuteResponse, { status: 400 })
    }

    // Validate required fields
    if (!body.fromNetworkId || !body.toNetworkId || !body.fromTokenSymbol || !body.toTokenSymbol || !body.amountHuman) {
      return NextResponse.json({
        ok: false,
        error: 'Missing required fields',
        errorCode: 'INVALID_REQUEST',
      } as ExecuteResponse, { status: 400 })
    }

    // Determine payout address based on destination family
    const toFamily = getNetworkFamily(body.toNetworkId)
    let payoutAddress: string | undefined

    switch (toFamily) {
      case 'TRON':
        payoutAddress = body.user.tronAddress
        break
      case 'TON':
        payoutAddress = body.user.tonAddress
        break
      case 'EVM':
        payoutAddress = body.user.evmAddress
        break
      default:
        return NextResponse.json({
          ok: false,
          error: `Destination network ${body.toNetworkId} requires wallet address`,
          errorCode: 'MISSING_WALLET_ADDRESS',
          debug: {
            toNetworkId: body.toNetworkId,
            toFamily,
            requiredWallet: toFamily.toLowerCase(),
          },
        } as ExecuteResponse, { status: 400 })
    }

    if (!payoutAddress) {
      return NextResponse.json({
        ok: false,
        error: `Missing wallet address for destination network ${body.toNetworkId}`,
        errorCode: 'MISSING_WALLET_ADDRESS',
        debug: {
          toNetworkId: body.toNetworkId,
          toFamily,
          requiredWallet: toFamily.toLowerCase(),
        },
      } as ExecuteResponse, { status: 400 })
    }

    // Resolve ChangeNOW asset codes
    const fromAsset = resolveChangeNowAsset(body.fromNetworkId, body.fromTokenSymbol)
    const evmNetworkId = body.toNetworkId === 'base' ? 'ethereum' : body.toNetworkId
    const toAsset = resolveChangeNowAsset(evmNetworkId, body.toTokenSymbol)

    if (!fromAsset || !toAsset) {
      return NextResponse.json({
        ok: false,
        error: 'Unsupported asset pair for ChangeNOW',
        errorCode: 'UNSUPPORTED_ASSET',
        debug: {
          fromNetworkId: body.fromNetworkId,
          fromTokenSymbol: body.fromTokenSymbol,
          toNetworkId: body.toNetworkId,
          toTokenSymbol: body.toTokenSymbol,
        },
      } as ExecuteResponse, { status: 400 })
    }

    // Validate min amount if we have quote data (would come from route-plan, but for now just proceed)
    // In production, you'd check minAmount from the quote

    // Create transaction
    const txResult = await createTransaction(
      fromAsset.ticker,
      toAsset.ticker,
      body.amountHuman,
      payoutAddress,
      fromAsset.network,
      toAsset.network
    )

    if (!txResult.tx) {
      return NextResponse.json({
        ok: false,
        error: txResult.error || 'Failed to create transaction',
        errorCode: 'TRANSACTION_CREATE_FAILED',
      } as ExecuteResponse, { status: 500 })
    }

    // Get token info for estimated amount conversion
    const toToken = getTokenInfo(body.toTokenSymbol.toLowerCase())
    const estimatedAmountHuman = txResult.tx.toAmount || '0'

    if (isDev) {
      console.log('[execute] Transaction created:', {
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
          networkId: body.fromNetworkId,
          tokenSymbol: body.fromTokenSymbol,
          amountHuman: body.amountHuman,
        },
        to: {
          networkId: body.toNetworkId,
          tokenSymbol: body.toTokenSymbol,
          estimatedAmountHuman,
        },
        nextAction: {
          kind: 'USER_TRANSFER',
          networkId: body.fromNetworkId,
          tokenSymbol: body.fromTokenSymbol,
          toAddress: txResult.tx.payinAddress,
        },
      },
    } as ExecuteResponse)
  } catch (error) {
    console.error('[execute] Error:', error)
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'EXECUTION_ERROR',
    } as ExecuteResponse, { status: 500 })
  }
}
