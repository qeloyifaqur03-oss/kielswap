/**
 * Route planning endpoint for cross-family swaps
 * Returns execution plans for routes that cannot be handled by direct quote providers
 */

import { NextRequest, NextResponse } from 'next/server'
import { getChainInfo, getNetworkFamily, isCrossFamily, isEVM } from '@/lib/chainRegistry'
import { resolveTokenForFamily } from '@/lib/tokenResolver'
import { getTokenInfo, toBaseUnits, getTokenRef } from '@/lib/tokens'
import { resolveChangeNowAsset } from '@/lib/providers/changenowMap'
import { getExchangeAmount } from '@/lib/providers/changenow'

const isDev = process.env.NODE_ENV === 'development'
const DEBUG_QUOTES = process.env.DEBUG_QUOTES === '1'

// Route plan cache to prevent polling spam
interface CachedRoutePlan {
  response: RoutePlanResponse
  timestamp: number
}

const routePlanCache = new Map<string, CachedRoutePlan>()
const CACHE_TTL = 3000 // 3 seconds cache

interface RoutePlanRequest {
  fromNetworkId: string
  toNetworkId: string
  fromTokenSymbol?: string
  toTokenSymbol?: string
  fromTokenId?: string
  toTokenId?: string
  amountBase: string
  user?: {
    evmAddress?: string
    tonAddress?: string
    tronAddress?: string
  }
}

interface RouteStep {
  stepId: string
  kind: 'SWAP' | 'BRIDGE' | 'TRANSFER' | 'WRAP' | 'UNWRAP'
  family: string
  provider: string
  from: { networkId: string; tokenId: string; amountBase: string; decimals: number }
  to: { networkId: string; tokenId: string; estimatedAmountBase: string; decimals: number }
  requiresWallet: 'evm' | 'ton' | 'tron' | 'solana' | 'none'
  txTemplate?: any
  quote?: any
  notes?: string
  executionHint?: {
    requiresCreateExchange?: boolean
    provider?: string
    depositAddress?: string
    [key: string]: any
  }
}

interface RoutePlanResponse {
  ok: boolean
  routePlan?: {
    requestId: string
    from: { networkId: string; family: string; tokenId: string; decimals: number }
    to: { networkId: string; family: string; tokenId: string; decimals: number }
    steps: RouteStep[]
    requires: {
      wallets: Array<'evm' | 'ton' | 'tron' | 'solana'>
      approvals: Array<any>
    }
    warnings?: string[]
  }
  error?: string
  errorCode?: string
  debug?: any
  walletRequirements?: {
    required: Array<'evm' | 'ton' | 'tron' | 'solana'>
    missing: Array<'evm' | 'ton' | 'tron' | 'solana'>
  }
}

function generateRequestId(): string {
  return `plan-${Date.now()}-${Math.random().toString(36).substring(7)}`
}

function generateStepId(index: number): string {
  return `step-${index}-${Date.now()}`
}

/**
 * Build route plan for TON → TRON using ChangeNOW
 */
async function buildTonToTronPlan(
  fromTokenId: string,
  toTokenId: string,
  amountBase: string
): Promise<RoutePlanResponse['routePlan']> {
  const fromResolved = resolveTokenForFamily(fromTokenId, 'ton')
  const toResolved = resolveTokenForFamily(toTokenId, 'tron')

  if (!fromResolved || !toResolved) {
    return undefined
  }

  const fromToken = getTokenInfo(fromTokenId)
  const toToken = getTokenInfo(toTokenId)

  if (!fromToken || !toToken) {
    return undefined
  }

  // Resolve ChangeNOW asset codes
  const fromAsset = resolveChangeNowAsset('ton', fromToken.symbol)
  const toAsset = resolveChangeNowAsset('tron', toToken.symbol)

  if (!fromAsset || !toAsset) {
    return undefined
  }

  // Convert amount to human-readable for ChangeNOW API
  const amountHuman = (parseInt(amountBase) / Math.pow(10, fromToken.decimals)).toString()

  // Get quote from ChangeNOW
  const quoteResult = await getExchangeAmount(
    fromAsset.ticker,
    toAsset.ticker,
    amountHuman,
    fromAsset.network,
    toAsset.network
  )

  if (!quoteResult.quote) {
    return undefined // ChangeNOW quote failed
  }

  // Convert estimated amount back to base units
  const estimatedAmountBase = (parseFloat(quoteResult.quote.estimatedAmount) * Math.pow(10, toToken.decimals)).toString()

  // Single BRIDGE step via ChangeNOW
  const steps: RouteStep[] = [
    {
      stepId: generateStepId(0),
      kind: 'BRIDGE',
      family: 'TON',
      provider: 'changenow',
      from: {
        networkId: 'ton',
        tokenId: fromTokenId,
        amountBase,
        decimals: fromToken.decimals,
      },
      to: {
        networkId: 'tron',
        tokenId: toTokenId,
        estimatedAmountBase,
        decimals: toToken.decimals,
      },
      requiresWallet: 'ton',
      quote: {
        estimatedAmount: quoteResult.quote.estimatedAmount,
        minAmount: quoteResult.quote.minAmount,
        maxAmount: quoteResult.quote.maxAmount,
        rateId: quoteResult.quote.rateId,
      },
      notes: 'Use ChangeNOW to bridge USDT from TON to TRON. Call /api/execute to get deposit address.',
    },
  ]

  return {
    requestId: generateRequestId(),
    from: {
      networkId: 'ton',
      family: 'TON',
      tokenId: fromTokenId,
      decimals: fromToken.decimals,
    },
    to: {
      networkId: 'tron',
      family: 'TRON',
      tokenId: toTokenId,
      decimals: toToken.decimals,
    },
    steps,
    requires: {
      wallets: ['ton', 'tron'], // Payer on TON, recipient on TRON
      approvals: [],
    },
  }
}

/**
 * Build route plan for TRON → EVM or TON → EVM using ChangeNOW
 */
async function buildTronOrTonToEVMPlan(
  fromNetworkId: string,
  toNetworkId: string,
  fromTokenId: string,
  toTokenId: string,
  amountBase: string
): Promise<RoutePlanResponse['routePlan']> {
  const fromResolved = resolveTokenForFamily(fromTokenId, fromNetworkId)
  const toResolved = resolveTokenForFamily(toTokenId, toNetworkId)

  if (!fromResolved || !toResolved) {
    return undefined
  }

  const fromToken = getTokenInfo(fromTokenId)
  const toToken = getTokenInfo(toTokenId)

  if (!fromToken || !toToken) {
    return undefined
  }

  const fromFamily = getNetworkFamily(fromNetworkId)

  // Resolve ChangeNOW asset codes
  const fromAsset = resolveChangeNowAsset(fromNetworkId, fromToken.symbol)
  
  // For EVM destination, use Ethereum network code (ChangeNOW may not support Base directly)
  const evmNetworkId = toNetworkId === 'base' ? 'ethereum' : toNetworkId
  const toAsset = resolveChangeNowAsset(evmNetworkId, toToken.symbol)

  if (!fromAsset || !toAsset) {
    return undefined // ChangeNOW doesn't support this route
  }

  // Convert amount to human-readable for ChangeNOW API
  const amountHuman = (parseInt(amountBase) / Math.pow(10, fromToken.decimals)).toString()

  // Get quote from ChangeNOW
  const quoteResult = await getExchangeAmount(
    fromAsset.ticker,
    toAsset.ticker,
    amountHuman,
    fromAsset.network,
    toAsset.network
  )

  if (!quoteResult.quote) {
    return undefined // ChangeNOW quote failed
  }

  // Convert estimated amount back to base units
  const estimatedAmountBase = (parseFloat(quoteResult.quote.estimatedAmount) * Math.pow(10, toToken.decimals)).toString()

  // Single BRIDGE step via ChangeNOW
  const steps: RouteStep[] = [
    {
      stepId: generateStepId(0),
      kind: 'BRIDGE',
      family: fromFamily,
      provider: 'changenow',
      from: {
        networkId: fromNetworkId,
        tokenId: fromTokenId,
        amountBase,
        decimals: fromToken.decimals,
      },
      to: {
        networkId: toNetworkId,
        tokenId: toTokenId,
        estimatedAmountBase,
        decimals: toToken.decimals,
      },
      requiresWallet: fromFamily.toLowerCase() as any,
      quote: {
        estimatedAmount: quoteResult.quote.estimatedAmount,
        minAmount: quoteResult.quote.minAmount,
        maxAmount: quoteResult.quote.maxAmount,
        rateId: quoteResult.quote.rateId,
      },
      notes: `Use ChangeNOW to bridge ${fromToken.symbol} from ${fromNetworkId} to ${toNetworkId}. Call /api/execute to get deposit address.`,
    },
  ]

  return {
    requestId: generateRequestId(),
    from: {
      networkId: fromNetworkId,
      family: fromFamily,
      tokenId: fromTokenId,
      decimals: fromToken.decimals,
    },
    to: {
      networkId: toNetworkId,
      family: 'EVM',
      tokenId: toTokenId,
      decimals: toToken.decimals,
    },
    steps,
    requires: {
      wallets: [fromFamily.toLowerCase() as any, 'evm'],
      approvals: [],
    },
  }
}

function getRoutePlanCacheKey(body: RoutePlanRequest): string {
  const fromTokenId = body.fromTokenId || body.fromTokenSymbol?.toLowerCase() || ''
  const toTokenId = body.toTokenId || body.toTokenSymbol?.toLowerCase() || ''
  return `${body.fromNetworkId}:${body.toNetworkId}:${fromTokenId}:${toTokenId}:${body.amountBase}`
}

function getCachedRoutePlan(key: string): RoutePlanResponse | null {
  const cached = routePlanCache.get(key)
  if (!cached) return null

  const age = Date.now() - cached.timestamp
  if (age > CACHE_TTL) {
    routePlanCache.delete(key)
    return null
  }

  return cached.response
}

function setCachedRoutePlan(key: string, response: RoutePlanResponse) {
  routePlanCache.set(key, {
    response,
    timestamp: Date.now(),
  })
}

// Cleanup old cache entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, cached] of routePlanCache.entries()) {
    if (now - cached.timestamp > CACHE_TTL) {
      routePlanCache.delete(key)
    }
  }
}, 5000) // Cleanup every 5 seconds

export async function POST(request: NextRequest) {
  // EVM-only mode: route-plan endpoint disabled
  return NextResponse.json(
    {
      ok: false,
      error: 'EVM-only mode enabled. Cross-family routing is not available.',
      errorCode: 'EVM_ONLY_MODE',
    },
    { status: 404 }
  )
}

// Disabled implementation (kept for reference, not exported to avoid TypeScript errors)
async function postDisabled(request: NextRequest) {
  try {
    const body: RoutePlanRequest = await request.json()

    // Check cache first
    const cacheKey = getRoutePlanCacheKey(body)
    const cached = getCachedRoutePlan(cacheKey)
    if (cached) {
      if (isDev) {
        console.log('[route-plan] Returning cached response')
      }
      return NextResponse.json(cached)
    }

    // Validation
    if (!body.fromNetworkId || !body.toNetworkId || !body.amountBase) {
      return NextResponse.json({
        ok: false,
        error: 'Missing required fields: fromNetworkId, toNetworkId, amountBase',
        errorCode: 'INVALID_REQUEST',
      } as RoutePlanResponse, { status: 400 })
    }

    // Determine token IDs (use symbol if tokenId not provided)
    const fromTokenId = body.fromTokenId || body.fromTokenSymbol?.toLowerCase() || ''
    const toTokenId = body.toTokenId || body.toTokenSymbol?.toLowerCase() || ''
    
    // For ChangeNOW mapping, use tokenSymbol for lookup (uppercase)
    const fromTokenSymbol = (body.fromTokenSymbol || body.fromTokenId || '').toUpperCase()
    const toTokenSymbol = (body.toTokenSymbol || body.toTokenId || '').toUpperCase()

    if (!fromTokenId || !toTokenId) {
      return NextResponse.json({
        ok: false,
        error: 'Missing token identifiers: fromTokenId/fromTokenSymbol and toTokenId/toTokenSymbol required',
        errorCode: 'INVALID_REQUEST',
      } as RoutePlanResponse, { status: 400 })
    }

    // Check if both are EVM - create a route plan using existing EVM providers
    if (isEVM(body.fromNetworkId) && isEVM(body.toNetworkId)) {
      // For EVM↔EVM, create a simple route plan that uses existing quote providers
      const fromToken = getTokenInfo(fromTokenId)
      const toToken = getTokenInfo(toTokenId)

      const routePlan = {
        requestId: generateRequestId(),
        from: {
          networkId: body.fromNetworkId,
          family: 'EVM',
          tokenId: fromTokenId,
          decimals: fromToken?.decimals || 18,
        },
        to: {
          networkId: body.toNetworkId,
          family: 'EVM',
          tokenId: toTokenId,
          decimals: toToken?.decimals || 18,
        },
        steps: [
          {
            stepId: generateStepId(0),
            kind: 'SWAP' as const,
            family: 'EVM',
            provider: 'relay|lifi|0x', // Uses existing EVM quote providers
            from: {
              networkId: body.fromNetworkId,
              tokenId: fromTokenId,
              amountBase: body.amountBase,
              decimals: fromToken?.decimals || 18,
            },
            to: {
              networkId: body.toNetworkId,
              tokenId: toTokenId,
              estimatedAmountBase: '0', // Will be filled by quote
              decimals: toToken?.decimals || 18,
            },
            requiresWallet: 'evm' as const,
            notes: 'Use /api/quote endpoint for EVM↔EVM swaps (Relay/LiFi/0x)',
          },
        ],
        requires: {
          wallets: ['evm' as const],
          approvals: [],
        },
      }

      // Cache and return the plan
      const response: RoutePlanResponse = {
        ok: true,
        routePlan,
      }
      setCachedRoutePlan(cacheKey, response)
      return NextResponse.json(response)
    }

    // Validate networks are known
    const fromChainInfo = getChainInfo(body.fromNetworkId)
    const toChainInfo = getChainInfo(body.toNetworkId)

    if (!fromChainInfo || !toChainInfo) {
      return NextResponse.json({
        ok: false,
        error: `Unknown network: ${body.fromNetworkId} or ${body.toNetworkId}`,
        errorCode: 'UNKNOWN_NETWORK',
        debug: {
          fromNetworkId: body.fromNetworkId,
          toNetworkId: body.toNetworkId,
        },
      } as RoutePlanResponse, { status: 400 })
    }

    const fromFamily = fromChainInfo.family
    const toFamily = toChainInfo.family

    // Wallet-aware routing: check if required wallets are connected
    const requiredWallets: Array<'evm' | 'ton' | 'tron' | 'solana'> = []
    if (fromFamily === 'EVM') requiredWallets.push('evm')
    if (fromFamily === 'TON') requiredWallets.push('ton')
    if (fromFamily === 'TRON') requiredWallets.push('tron')
    if (fromFamily === 'SOLANA') requiredWallets.push('solana')
    
    if (toFamily === 'EVM' && !requiredWallets.includes('evm')) requiredWallets.push('evm')
    if (toFamily === 'TON' && !requiredWallets.includes('ton')) requiredWallets.push('ton')
    if (toFamily === 'TRON' && !requiredWallets.includes('tron')) requiredWallets.push('tron')
    if (toFamily === 'SOLANA' && !requiredWallets.includes('solana')) requiredWallets.push('solana')

    const missingWallets: Array<'evm' | 'ton' | 'tron' | 'solana'> = []
    const user = body.user || {}
    
    if (requiredWallets.includes('evm') && !user.evmAddress) {
      missingWallets.push('evm')
    }
    if (requiredWallets.includes('ton') && !user.tonAddress) {
      missingWallets.push('ton')
    }
    if (requiredWallets.includes('tron') && !user.tronAddress) {
      missingWallets.push('tron')
    }
    
    // Note: For quotes, we allow missing wallets but mark plan as requiring wallets
    // For execution, wallets will be required

    // Build route plan based on family combinations
    let routePlan: RoutePlanResponse['routePlan'] = undefined

    // Debug logging for route-plan
    if (isDev || DEBUG_QUOTES) {
      const fromTokenRef = getTokenRef(fromTokenId, body.fromNetworkId)
      const toTokenRef = getTokenRef(toTokenId, body.toNetworkId)
      console.log('[route-plan] Request:', {
        fromNetworkId: body.fromNetworkId,
        toNetworkId: body.toNetworkId,
        fromFamily,
        toFamily,
        fromTokenId,
        toTokenId,
        fromTokenSymbol,
        toTokenSymbol,
        resolvedFromTokenRef: fromTokenRef ? `${fromTokenRef.type}:${fromTokenRef.value}` : 'null',
        resolvedToTokenRef: toTokenRef ? `${toTokenRef.type}:${toTokenRef.value}` : 'null',
        amountBase: body.amountBase,
      })
    }

    // Try ChangeNOW for cross-family routes
    if (fromFamily !== 'EVM' || toFamily !== 'EVM') {
      // Validate token refs for non-EVM (must not be 0x000...)
      const fromTokenRef = getTokenRef(fromTokenId, body.fromNetworkId)
      const toTokenRef = getTokenRef(toTokenId, body.toNetworkId)
      
      if (!fromTokenRef || !toTokenRef) {
        return NextResponse.json({
          ok: false,
          error: `Failed to resolve token identifiers for ${fromFamily} or ${toFamily}`,
          errorCode: 'TOKEN_RESOLUTION_FAILED',
          debug: {
            fromTokenId,
            toTokenId,
            fromNetworkId: body.fromNetworkId,
            toNetworkId: body.toNetworkId,
            fromTokenRef,
            toTokenRef,
          },
        } as RoutePlanResponse, { status: 400 })
      }
      
      // Validate token refs match their families
      if (fromTokenRef.family !== fromFamily || toTokenRef.family !== toFamily) {
        return NextResponse.json({
          ok: false,
          error: 'Token family mismatch',
          errorCode: 'TOKEN_FAMILY_MISMATCH',
          debug: {
            fromTokenRef,
            toTokenRef,
            expectedFromFamily: fromFamily,
            expectedToFamily: toFamily,
          },
        } as RoutePlanResponse, { status: 400 })
      }
      
      // Validate TON jetton format
      if (fromFamily === 'TON' && fromTokenRef.type === 'jetton' && !fromTokenRef.value.startsWith('EQ')) {
        return NextResponse.json({
          ok: false,
          error: 'Invalid TON jetton master address format',
          errorCode: 'INVALID_TOKEN_FORMAT',
          debug: {
            fromToken: fromTokenRef.value,
            expected: 'base64url starting with EQ',
          },
        } as RoutePlanResponse, { status: 400 })
      }
      
      if (toFamily === 'TON' && toTokenRef.type === 'jetton' && !toTokenRef.value.startsWith('EQ')) {
        return NextResponse.json({
          ok: false,
          error: 'Invalid TON jetton master address format',
          errorCode: 'INVALID_TOKEN_FORMAT',
          debug: {
            toToken: toTokenRef.value,
            expected: 'base64url starting with EQ',
          },
        } as RoutePlanResponse, { status: 400 })
      }
      
      // Validate TRON TRC20 format (should start with T)
      if (fromFamily === 'TRON' && fromTokenRef.type === 'trc20' && !fromTokenRef.value.startsWith('T')) {
        return NextResponse.json({
          ok: false,
          error: 'Invalid TRON TRC20 contract address format',
          errorCode: 'INVALID_TOKEN_FORMAT',
          debug: {
            fromToken: fromTokenRef.value,
            expected: 'base58 address starting with T',
          },
        } as RoutePlanResponse, { status: 400 })
      }
      
      if (toFamily === 'TRON' && toTokenRef.type === 'trc20' && !toTokenRef.value.startsWith('T')) {
        return NextResponse.json({
          ok: false,
          error: 'Invalid TRON TRC20 contract address format',
          errorCode: 'INVALID_TOKEN_FORMAT',
          debug: {
            toToken: toTokenRef.value,
            expected: 'base58 address starting with T',
          },
        } as RoutePlanResponse, { status: 400 })
      }
      
      const fromAsset = resolveChangeNowAsset(body.fromNetworkId, fromTokenSymbol)
      const toAsset = resolveChangeNowAsset(body.toNetworkId, toTokenSymbol)

      if (!fromAsset || !toAsset) {
        // Missing ChangeNOW mapping
        return NextResponse.json({
          ok: false,
          error: `Unsupported asset pair for ChangeNOW: ${fromTokenSymbol} on ${body.fromNetworkId} → ${toTokenSymbol} on ${body.toNetworkId}`,
          errorCode: 'UNSUPPORTED_PAIR',
          debug: {
            fromNetworkId: body.fromNetworkId,
            fromTokenSymbol,
            toNetworkId: body.toNetworkId,
            toTokenSymbol,
            fromAsset,
            toAsset,
          },
        } as RoutePlanResponse, { status: 400 })
      }
      
      if (fromAsset && toAsset) {
        // Convert amountBase to human-readable for ChangeNOW
        const fromToken = getTokenInfo(fromTokenId)
        const amountHuman = fromToken
          ? (parseFloat(body.amountBase) / Math.pow(10, fromToken.decimals)).toString()
          : body.amountBase

        const quoteResult = await getExchangeAmount(
          fromAsset.ticker,
          toAsset.ticker,
          amountHuman,
          fromAsset.network,
          toAsset.network
        )

        if (quoteResult.quote) {
          const quote = quoteResult.quote
          const toToken = getTokenInfo(toTokenId)

          // Validate minAmount if provided
          if (quote.minAmount && parseFloat(amountHuman) < parseFloat(quote.minAmount)) {
            return NextResponse.json({
              ok: false,
              error: `Amount below minimum: ${quote.minAmount} ${fromTokenId.toUpperCase()}`,
              errorCode: 'AMOUNT_TOO_LOW',
              debug: {
                amount: amountHuman,
                minAmount: quote.minAmount,
                token: fromTokenId,
              },
            } as RoutePlanResponse, { status: 400 })
          }

          routePlan = {
            requestId: generateRequestId(),
            from: {
              networkId: body.fromNetworkId,
              family: fromFamily,
              tokenId: fromTokenId,
              decimals: fromToken?.decimals || 18,
            },
            to: {
              networkId: body.toNetworkId,
              family: toFamily,
              tokenId: toTokenId,
              decimals: toToken?.decimals || 18,
            },
            steps: [
              {
                stepId: generateStepId(0),
                kind: 'BRIDGE',
                family: fromFamily,
                provider: 'changenow',
                from: {
                  networkId: body.fromNetworkId,
                  tokenId: fromTokenId,
                  amountBase: body.amountBase,
                  decimals: fromToken?.decimals || 18,
                },
                to: {
                  networkId: body.toNetworkId,
                  tokenId: toTokenId,
                  estimatedAmountBase: toToken
                    ? (parseFloat(quote.estimatedAmount) * Math.pow(10, toToken.decimals)).toString()
                    : quote.estimatedAmount,
                  decimals: toToken?.decimals || 18,
                },
                requiresWallet: fromFamily.toLowerCase() as any,
                quote: {
                  estimatedAmount: quote.estimatedAmount,
                  minAmount: quote.minAmount,
                  maxAmount: quote.maxAmount,
                  rateId: quote.rateId,
                },
                notes: 'ChangeNOW bridge - generate deposit address via /api/execute',
                executionHint: {
                  requiresCreateExchange: true,
                  provider: 'changenow',
                  depositAddress: 'Generated via /api/execute',
                },
              },
            ],
            requires: {
              wallets: requiredWallets,
              approvals: [],
            },
            warnings: missingWallets.length > 0 
              ? [`Wallet required for execution: ${missingWallets.join(', ')}`]
              : [],
          }
        } else if (quoteResult.error) {
          if (isDev) {
            console.warn('[route-plan] ChangeNOW quote failed:', quoteResult.error)
          }
          // Fall through to placeholder plans
        }
      }
    }

    // Fallback to placeholder plans if ChangeNOW not available
    if (!routePlan) {
      if (fromFamily === 'TON' && toFamily === 'TRON') {
        routePlan = await buildTonToTronPlan(fromTokenId, toTokenId, body.amountBase)
      } else if (fromFamily === 'TRON' && toFamily === 'EVM') {
        routePlan = await buildTronOrTonToEVMPlan(body.fromNetworkId, body.toNetworkId, fromTokenId, toTokenId, body.amountBase)
      } else if (fromFamily === 'TON' && toFamily === 'EVM') {
        routePlan = await buildTronOrTonToEVMPlan(body.fromNetworkId, body.toNetworkId, fromTokenId, toTokenId, body.amountBase)
      } else {
        return NextResponse.json({
          ok: false,
          error: `Route planning not yet implemented for ${fromFamily} → ${toFamily}`,
          errorCode: 'NOT_IMPLEMENTED',
          debug: {
            fromFamily,
            toFamily,
            fromNetworkId: body.fromNetworkId,
            toNetworkId: body.toNetworkId,
          },
        } as RoutePlanResponse, { status: 400 })
      }
    }

    if (!routePlan) {
      return NextResponse.json({
        ok: false,
        error: 'Failed to build route plan',
        errorCode: 'PLAN_BUILD_FAILED',
        debug: {
          fromTokenId,
          toTokenId,
          fromNetworkId: body.fromNetworkId,
          toNetworkId: body.toNetworkId,
        },
      } as RoutePlanResponse, { status: 400 })
    }

    if (isDev) {
      console.log('[route-plan] Generated plan:', {
        requestId: routePlan.requestId,
        from: `${body.fromNetworkId}/${fromTokenId}`,
        to: `${body.toNetworkId}/${toTokenId}`,
        steps: routePlan.steps.length,
      })
    }

    const response: RoutePlanResponse = {
      ok: true,
      routePlan,
    }
    setCachedRoutePlan(cacheKey, response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('[route-plan] Error:', error)
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'API_ERROR',
    } as RoutePlanResponse, { status: 500 })
  }
}
