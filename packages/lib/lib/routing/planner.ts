/**
 * Multi-leg route planner
 */

import { getTokenInfo, getChainId, toBaseUnits } from '../tokens'
import { getEnvWithDefault } from '../env'
import {
  Family,
  WalletContext,
  RoutePlan,
  RouteStep,
  RoutePlanRequest,
  RoutePlanResponse,
  ResolvedToken,
} from './types'
import { resolveToken, getNetworkFamily, getFamilyHub, getCanonicalBridgeTokens } from './resolve'
import { PLACEHOLDER_EOA } from '@/app/api/quote/route'

const isDev = process.env.NODE_ENV === 'development'

// Placeholder EOA for quotes when wallet not connected
const PLACEHOLDER_EOA = '0x1111111111111111111111111111111111111111'

/**
 * Generate unique step ID
 */
function generateStepId(index: number): string {
  return `step-${Date.now()}-${index}`
}

/**
 * Generate unique plan ID
 */
function generatePlanId(): string {
  return `plan-${Date.now()}-${Math.random().toString(36).substring(7)}`
}

/**
 * Check if wallet context has required wallet types
 */
function hasRequiredWallets(wallets: WalletContext, required: Family[]): { hasAll: boolean; missing: Family[] } {
  const missing: Family[] = []

  for (const family of required) {
    switch (family) {
      case 'EVM':
        if (!wallets.evm?.address) missing.push('EVM')
        break
      case 'SOLANA':
        if (!wallets.solana?.pubkey) missing.push('SOLANA')
        break
      case 'TRON':
        if (!wallets.tron?.address) missing.push('TRON')
        break
      case 'TON':
        if (!wallets.ton?.address) missing.push('TON')
        break
    }
  }

  return {
    hasAll: missing.length === 0,
    missing,
  }
}

/**
 * Fetch quote from quote API
 * This calls the internal /api/quote endpoint
 * In production, you might want to refactor to call quote functions directly to avoid HTTP overhead
 */
async function fetchQuoteFromAPI(
  fromNetworkId: string,
  toNetworkId: string,
  fromTokenId: string,
  toTokenId: string,
  amountBase: string,
  userAddress?: string
): Promise<{ ok: boolean; quote?: any; error?: string; provider?: string; outAmountBase?: string }> {
  try {
    // Get base URL for internal API calls
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
    
    // Convert amountBase back to human-readable for the API (it expects human-readable)
    const fromToken = getTokenInfo(fromTokenId)
    const amountHuman = fromToken 
      ? (parseInt(amountBase) / Math.pow(10, fromToken.decimals)).toString()
      : amountBase
    
    const quoteResponse = await fetch(`${baseUrl}/api/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amountHuman,
        fromTokenId,
        toTokenId,
        fromNetworkId,
        toNetworkId,
        userAddress: userAddress || PLACEHOLDER_EOA,
      }),
    })

    if (!quoteResponse.ok) {
      const error = await quoteResponse.json().catch(() => ({}))
      return { ok: false, error: error.error || 'Quote failed' }
    }

    const data = await quoteResponse.json()
    return {
      ok: data.ok,
      quote: data,
      provider: data.provider,
      outAmountBase: data.outAmountBase || data.destinationAmount,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Quote request failed',
    }
  }
}

/**
 * Build a direct route (same family)
 */
async function buildDirectRoute(
  request: RoutePlanRequest,
  fromFamily: Family
): Promise<RoutePlan | null> {
  const fromResolved = resolveToken(request.fromNetworkId, request.fromTokenId, fromFamily)
  const toResolved = resolveToken(request.toNetworkId, request.toTokenId, fromFamily)

  if (!fromResolved || !toResolved) {
    return null
  }

  const fromToken = getTokenInfo(request.fromTokenId)
  if (!fromToken) return null

  const amountBase = toBaseUnits(request.amount, fromToken.decimals)

  // Determine user address based on family
  let userAddress: string | undefined
  if (fromFamily === 'EVM' && request.wallets.evm?.address) {
    userAddress = request.wallets.evm.address
  } else if (fromFamily === 'SOLANA' && request.wallets.solana?.pubkey) {
    userAddress = request.wallets.solana.pubkey
  } else if (fromFamily === 'TRON' && request.wallets.tron?.address) {
    userAddress = request.wallets.tron.address
  } else if (fromFamily === 'TON' && request.wallets.ton?.address) {
    userAddress = request.wallets.ton.address
  }

  const quoteResult = await fetchQuoteFromAPI(
    request.fromNetworkId,
    request.toNetworkId,
    request.fromTokenId,
    request.toTokenId,
    amountBase,
    userAddress
  )

  if (!quoteResult.ok || !quoteResult.quote) {
    return null
  }

  const step: RouteStep = {
    id: generateStepId(0),
    kind: fromFamily !== request.toNetworkId ? 'BRIDGE' : 'SWAP',
    from: {
      networkId: request.fromNetworkId,
      chainId: getChainId(request.fromNetworkId),
      family: fromFamily,
      tokenId: request.fromTokenId,
      tokenAddress: fromResolved.address,
    },
    to: {
      networkId: request.toNetworkId,
      chainId: getChainId(request.toNetworkId),
      family: fromFamily,
      tokenId: request.toTokenId,
      tokenAddress: toResolved.address,
    },
    amountInBase: amountBase,
    quote: quoteResult.quote,
    provider: quoteResult.provider || 'unknown',
    requiresWallet: [fromFamily],
    estimatedOutBase: quoteResult.quote.outAmountBase || quoteResult.quote.destinationAmount,
  }

  return {
    id: generatePlanId(),
    steps: [step],
    totalEstimatedOutBase: step.estimatedOutBase,
    warnings: [],
    requiresWallets: [fromFamily],
  }
}

/**
 * Build multi-leg route via hub networks
 */
async function buildMultiLegRoute(
  request: RoutePlanRequest,
  fromFamily: Family,
  toFamily: Family
): Promise<RoutePlan | null> {
  const warnings: string[] = []
  
  // Strategy: route through hub networks using canonical bridgeable tokens
  const fromHub = getFamilyHub(request.fromNetworkId)
  const toHub = getFamilyHub(request.toNetworkId)

  // Get canonical tokens for bridging
  const fromCanonical = getCanonicalBridgeTokens(fromFamily)
  const toCanonical = getCanonicalBridgeTokens(toFamily)

  // Try to find a common bridgeable token
  const bridgeToken = fromCanonical.find((token) => toCanonical.includes(token)) || 'usdt' // Default to USDT

  const steps: RouteStep[] = []
  const requiresWallets: Family[] = []

  // Step 1: fromToken -> bridgeToken on fromFamily (via hub if needed)
  let currentAmount = toBaseUnits(request.amount, getTokenInfo(request.fromTokenId)?.decimals || 18)
  let currentToken = request.fromTokenId
  let currentNetwork = request.fromNetworkId

  // If fromToken is not the bridge token, swap to bridge token first
  if (request.fromTokenId.toLowerCase() !== bridgeToken.toLowerCase()) {
    const fromResolved = resolveToken(currentNetwork, currentToken, fromFamily)
    const bridgeResolved = resolveToken(currentNetwork, bridgeToken, fromFamily)

    if (!fromResolved || !bridgeResolved) {
      return null
    }

    const quote1 = await fetchQuoteFromAPI(
      currentNetwork,
      currentNetwork, // Same network swap
      currentToken,
      bridgeToken,
      currentAmount,
      fromFamily === 'EVM' ? request.wallets.evm?.address : undefined
    )

    if (!quote1.ok || !quote1.quote) {
      return null // Can't swap to bridge token
    }

    currentAmount = quote1.quote.outAmountBase || quote1.quote.destinationAmount
    currentToken = bridgeToken

    steps.push({
      id: generateStepId(steps.length),
      kind: 'SWAP',
      from: {
        networkId: currentNetwork,
        chainId: getChainId(currentNetwork),
        family: fromFamily,
        tokenId: request.fromTokenId,
        tokenAddress: fromResolved.address,
      },
      to: {
        networkId: currentNetwork,
        chainId: getChainId(currentNetwork),
        family: fromFamily,
        tokenId: bridgeToken,
        tokenAddress: bridgeResolved.address,
      },
      amountInBase: toBaseUnits(request.amount, getTokenInfo(request.fromTokenId)?.decimals || 18),
      quote: quote1.quote,
      provider: quote1.provider || 'unknown',
      requiresWallet: [fromFamily],
      estimatedOutBase: currentAmount,
    })

    requiresWallets.push(fromFamily)
  }

  // Step 2: Bridge fromFamily -> toFamily via hub
  // For now, we'll attempt a direct bridge if providers support it
  // Otherwise mark as OFFCHAIN_SWAP

  const bridgeSupported = (fromFamily === 'EVM' && toFamily === 'EVM') ||
                          (fromFamily === 'EVM' && toFamily === 'SOLANA') ||
                          (fromFamily === 'SOLANA' && toFamily === 'EVM')

  // Resolve bridge tokens before attempting quote
  const bridgeResolvedFrom = resolveToken(currentNetwork, bridgeToken, fromFamily)
  const bridgeResolvedTo = resolveToken(request.toNetworkId, bridgeToken, toFamily)

  if (!bridgeResolvedFrom || !bridgeResolvedTo) {
    warnings.push(`Bridge token ${bridgeToken} not available on target network`)
    return null
  }

  if (bridgeSupported) {
    // Try bridge quote

    if (!bridgeResolvedFrom || !bridgeResolvedTo) {
      warnings.push(`Bridge token ${bridgeToken} not available on target network`)
      return null
    }

    const bridgeQuote = await fetchQuoteFromAPI(
      currentNetwork,
      request.toNetworkId,
      bridgeToken,
      bridgeToken,
      currentAmount,
      fromFamily === 'EVM' ? request.wallets.evm?.address : undefined
    )

    if (bridgeQuote.ok && bridgeQuote.quote) {
      const bridgeAmount = bridgeQuote.outAmountBase || bridgeQuote.quote.outAmountBase || bridgeQuote.quote.destinationAmount
      const bridgeFromNetwork = currentNetwork // Network we're bridging FROM
      currentNetwork = request.toNetworkId // Update to target network after bridge
      currentAmount = bridgeAmount

      steps.push({
        id: generateStepId(steps.length),
        kind: 'BRIDGE',
        from: {
          networkId: bridgeFromNetwork,
          chainId: getChainId(bridgeFromNetwork),
          family: fromFamily,
          tokenId: bridgeToken,
          tokenAddress: bridgeResolvedFrom.address,
        },
        to: {
          networkId: request.toNetworkId,
          chainId: getChainId(request.toNetworkId),
          family: toFamily,
          tokenId: bridgeToken,
          tokenAddress: bridgeResolvedTo.address,
        },
        amountInBase: steps.length > 0 ? steps[steps.length - 1].estimatedOutBase || currentAmount : currentAmount,
        quote: bridgeQuote.quote,
        provider: bridgeQuote.provider || 'unknown',
        requiresWallet: [fromFamily],
        estimatedOutBase: bridgeAmount,
      })

      requiresWallets.push(fromFamily)
    } else {
      // Bridge not available, use OFFCHAIN_SWAP
      warnings.push(`Direct bridge not available, using off-chain swap`)
      
      steps.push({
        id: generateStepId(steps.length),
        kind: 'OFFCHAIN_SWAP',
        from: {
          networkId: currentNetwork,
          chainId: getChainId(currentNetwork),
          family: fromFamily,
          tokenId: bridgeToken,
          tokenAddress: bridgeResolvedFrom.address,
        },
        to: {
          networkId: request.toNetworkId,
          chainId: getChainId(request.toNetworkId),
          family: toFamily,
          tokenId: bridgeToken,
          tokenAddress: bridgeResolvedTo.address,
        },
        amountInBase: steps.length > 0 ? steps[steps.length - 1].estimatedOutBase || currentAmount : currentAmount,
        provider: 'offchain',
        requiresWallet: [fromFamily, toFamily],
        estimatedOutBase: currentAmount, // Rough estimate
      })

      requiresWallets.push(fromFamily, toFamily)
      currentNetwork = request.toNetworkId
    }
  } else {
    // Cross-family bridge not supported by on-chain providers
    warnings.push(`Cross-family bridge ${fromFamily} -> ${toFamily} requires off-chain swap`)

      steps.push({
        id: generateStepId(steps.length),
        kind: 'OFFCHAIN_SWAP',
        from: {
          networkId: currentNetwork,
          chainId: getChainId(currentNetwork),
          family: fromFamily,
          tokenId: bridgeToken,
          tokenAddress: bridgeResolvedFrom.address,
        },
        to: {
          networkId: request.toNetworkId,
          chainId: getChainId(request.toNetworkId),
          family: toFamily,
          tokenId: bridgeToken,
          tokenAddress: bridgeResolvedTo.address,
        },
        amountInBase: steps.length > 0 ? steps[steps.length - 1].estimatedOutBase || currentAmount : currentAmount,
        provider: 'offchain',
        requiresWallet: [fromFamily, toFamily],
        estimatedOutBase: currentAmount,
      })

      requiresWallets.push(fromFamily, toFamily)
      currentNetwork = request.toNetworkId
    }

  // Step 3: bridgeToken -> toToken on toFamily
  if (request.toTokenId.toLowerCase() !== bridgeToken.toLowerCase()) {
    const bridgeResolved = resolveToken(currentNetwork, bridgeToken, toFamily)
    const toResolved = resolveToken(request.toNetworkId, request.toTokenId, toFamily)

    if (!bridgeResolved || !toResolved) {
      return null
    }

    const quote3 = await fetchQuoteFromAPI(
      currentNetwork,
      request.toNetworkId,
      bridgeToken,
      request.toTokenId,
      currentAmount,
      toFamily === 'EVM' ? request.wallets.evm?.address :
      toFamily === 'SOLANA' ? request.wallets.solana?.pubkey :
      toFamily === 'TRON' ? request.wallets.tron?.address :
      request.wallets.ton?.address
    )

    if (!quote3.ok || !quote3.quote) {
      return null
    }

    steps.push({
      id: generateStepId(steps.length),
      kind: 'SWAP',
      from: {
        networkId: currentNetwork,
        chainId: getChainId(currentNetwork),
        family: toFamily,
        tokenId: bridgeToken,
        tokenAddress: bridgeResolved.address,
      },
      to: {
        networkId: request.toNetworkId,
        chainId: getChainId(request.toNetworkId),
        family: toFamily,
        tokenId: request.toTokenId,
        tokenAddress: toResolved.address,
      },
      amountInBase: currentAmount,
      quote: quote3.quote,
      provider: quote3.provider || 'unknown',
      requiresWallet: [toFamily],
      estimatedOutBase: quote3.quote.outAmountBase || quote3.quote.destinationAmount,
    })

    requiresWallets.push(toFamily)
  }

  // Calculate total estimated output
  const totalEstimated = steps[steps.length - 1]?.estimatedOutBase

  return {
    id: generatePlanId(),
    steps,
    totalEstimatedOutBase: totalEstimated,
    warnings,
    requiresWallets: Array.from(new Set(requiresWallets)),
  }
}

/**
 * Main route planning function
 */
export async function buildRoutePlan(
  request: RoutePlanRequest
): Promise<RoutePlanResponse> {
  if (isDev) {
    console.log('[route-plan] Building plan:', {
      from: `${request.fromNetworkId}/${request.fromTokenId}`,
      to: `${request.toNetworkId}/${request.toTokenId}`,
      amount: request.amount,
    })
  }

  // Validate inputs
  if (!request.amount || parseFloat(request.amount) <= 0) {
    return {
      ok: false,
      error: 'Invalid amount',
      errorCode: 'INVALID_AMOUNT',
    }
  }

  const fromFamily = getNetworkFamily(request.fromNetworkId)
  const toFamily = getNetworkFamily(request.toNetworkId)

  if (fromFamily === 'UNSUPPORTED' || toFamily === 'UNSUPPORTED') {
    return {
      ok: false,
      error: `Unsupported network family`,
      errorCode: 'UNSUPPORTED_NETWORK',
      debug: { fromFamily, toFamily },
    }
  }

  let plan: RoutePlan | null = null

  // Try direct route first (same family)
  if (fromFamily === toFamily) {
    plan = await buildDirectRoute(request, fromFamily)
  }

  // If no direct route, try multi-leg
  if (!plan) {
    plan = await buildMultiLegRoute(request, fromFamily, toFamily)
  }

  if (!plan) {
    return {
      ok: false,
      error: 'No route found',
      errorCode: 'NO_ROUTE',
      debug: {
        fromFamily,
        toFamily,
        fromNetworkId: request.fromNetworkId,
        toNetworkId: request.toNetworkId,
      },
    }
  }

  // Check wallet requirements
  const walletCheck = hasRequiredWallets(request.wallets, plan.requiresWallets)
  if (!walletCheck.hasAll) {
    return {
      ok: false,
      error: `Missing required wallets: ${walletCheck.missing.join(', ')}`,
      errorCode: 'WALLET_MISSING_FOR_ROUTE',
      debug: {
        required: plan.requiresWallets,
        missing: walletCheck.missing,
      },
    }
  }

  if (isDev) {
    console.log('[route-plan] Plan created:', {
      planId: plan.id,
      steps: plan.steps.length,
      requiresWallets: plan.requiresWallets,
      warnings: plan.warnings,
    })
  }

  return {
    ok: true,
    plan,
  }
}

