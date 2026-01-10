/**
 * Minimal route planner with hub routing support
 */

import { getTokenInfo, getTokenAddress, getChainId, toBaseUnits, fromBaseUnits } from './tokens'
import { getFamily, getFamilyFromNetworkId, Family, requiresWalletForFamily } from './families'
import { getEVMHub, getHubForFamily } from './hubs'
import { findHubRoute, getBridgeToken, isRouteSupported } from './hubRoutes'
import { resolveToken } from './routing/resolve'

const isDev = process.env.NODE_ENV === 'development'

// Placeholder for quotes when wallet not connected
const PLACEHOLDER_EOA = '0x1111111111111111111111111111111111111111'

// Import quote functions from quote route
// Note: In production, these should be extracted to a shared module
async function fetchQuoteFromAPI(
  fromNetworkId: string,
  toNetworkId: string,
  fromTokenId: string,
  toTokenId: string,
  amountBase: string,
  userAddress?: string
): Promise<{ ok: boolean; quote?: any; error?: string; provider?: string; outAmountBase?: string; errorCode?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
    
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
      return { 
        ok: false, 
        error: error.error || 'Quote failed',
        errorCode: error.errorCode || 'QUOTE_FAILED',
      }
    }

    const data = await quoteResponse.json()
    return {
      ok: data.ok,
      quote: data,
      provider: data.provider,
      outAmountBase: data.outAmountBase,
      errorCode: data.errorCode,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Quote request failed',
      errorCode: 'QUOTE_ERROR',
    }
  }
}

/**
 * Simple route plan types (minimal)
 */
export interface RoutePlanParams {
  fromNetworkId: string
  toNetworkId: string
  fromTokenId: string
  toTokenId: string
  amount: string // Human-readable
  wallets?: {
    evm?: { address: string }
    solana?: { pubkey: string }
    tron?: { address: string }
    ton?: { address: string }
  }
}

export interface RouteStep {
  id: string
  kind: 'SWAP' | 'BRIDGE' | 'OFFCHAIN_SWAP'
  from: { networkId: string; family: Family; tokenId: string; tokenAddress: string }
  to: { networkId: string; family: Family; tokenId: string; tokenAddress: string }
  amountInBase: string
  estimatedOutBase?: string
  provider: string
  requiresWallet: Family[]
  quote?: any
  adapterMissing?: string // If adapter is not implemented
}

export interface RoutePlan {
  id: string
  steps: RouteStep[]
  totalEstimatedOutBase?: string
  requiresWallets: Family[]
  warnings: string[]
}

export interface RoutePlanResult {
  ok: boolean
  plan?: RoutePlan
  error?: string
  errorCode?: 'NO_ROUTE' | 'ADAPTER_MISSING' | 'WALLET_MISSING_FOR_ROUTE' | 'UNSUPPORTED_NETWORK'
  debug?: {
    fromFamily?: Family
    toFamily?: Family
    attemptedLegs?: Array<{ step: string; reason: string }>
    missingAdapters?: string[]
    requiredWallets?: Family[]
  }
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`
}

/**
 * Check if wallets have required families
 */
function hasRequiredWallets(wallets: RoutePlanParams['wallets'], required: Family[]): { hasAll: boolean; missing: Family[] } {
  const missing: Family[] = []
  const walletMap = wallets || {}

  for (const family of required) {
    switch (family) {
      case 'EVM':
        if (!walletMap.evm?.address) missing.push('EVM')
        break
      case 'SOLANA':
        if (!walletMap.solana?.pubkey) missing.push('SOLANA')
        break
      case 'TRON':
        if (!walletMap.tron?.address) missing.push('TRON')
        break
      case 'TON':
        if (!walletMap.ton?.address) missing.push('TON')
        break
    }
  }

  return { hasAll: missing.length === 0, missing }
}

/**
 * Build direct route (same family)
 */
async function buildDirectRoute(params: RoutePlanParams, family: Family): Promise<RoutePlan | null> {
  const fromResolved = resolveToken(params.fromNetworkId, params.fromTokenId, family)
  const toResolved = resolveToken(params.toNetworkId, params.toTokenId, family)

  if (!fromResolved || !toResolved) {
    return null
  }

  const fromToken = getTokenInfo(params.fromTokenId)
  if (!fromToken) return null

  const amountBase = toBaseUnits(params.amount, fromToken.decimals)
  const userAddress = family === 'EVM' ? params.wallets?.evm?.address : undefined

  const quoteResult = await fetchQuoteFromAPI(
    params.fromNetworkId,
    params.toNetworkId,
    params.fromTokenId,
    params.toTokenId,
    amountBase,
    userAddress
  )

  if (!quoteResult.ok) {
    return null
  }

  const step: RouteStep = {
    id: generateId('step'),
    kind: params.fromNetworkId !== params.toNetworkId ? 'BRIDGE' : 'SWAP',
    from: {
      networkId: params.fromNetworkId,
      family,
      tokenId: params.fromTokenId,
      tokenAddress: fromResolved.address,
    },
    to: {
      networkId: params.toNetworkId,
      family,
      tokenId: params.toTokenId,
      tokenAddress: toResolved.address,
    },
    amountInBase: amountBase,
    estimatedOutBase: quoteResult.outAmountBase,
    provider: quoteResult.provider || 'unknown',
    requiresWallet: [family],
    quote: quoteResult.quote,
  }

  return {
    id: generateId('plan'),
    steps: [step],
    totalEstimatedOutBase: step.estimatedOutBase,
    requiresWallets: [family],
    warnings: [],
  }
}

/**
 * Build hub route (cross-family via hub)
 */
async function buildHubRoute(
  params: RoutePlanParams,
  fromFamily: Family,
  toFamily: Family,
  hubRoute: ReturnType<typeof findHubRoute>
): Promise<RoutePlan | null> {
  if (!hubRoute) return null

  const warnings: string[] = []
  const steps: RouteStep[] = []
  const requiresWallets: Family[] = []
  
  // Get hub network
  const hub = hubRoute.viaHub ? getHubForFamily(hubRoute.viaHub) : null
  if (!hub && hubRoute.viaHub) {
    return null
  }

  // Get bridge tokens
  const bridgeToken = getBridgeToken(hubRoute.viaHub || fromFamily)

  const fromToken = getTokenInfo(params.fromTokenId)
  if (!fromToken) return null

  let currentAmount = toBaseUnits(params.amount, fromToken.decimals)
  let currentNetwork = params.fromNetworkId
  let currentToken = params.fromTokenId
  let currentFamily = fromFamily

  // Step 1: Swap to bridge token if needed (on source network)
  if (currentToken.toLowerCase() !== bridgeToken.toLowerCase()) {
    const fromResolved = resolveToken(currentNetwork, currentToken, currentFamily)
    const bridgeResolved = resolveToken(currentNetwork, bridgeToken, currentFamily)

    if (!fromResolved || !bridgeResolved) {
      return null
    }

    const userAddress = currentFamily === 'EVM' ? params.wallets?.evm?.address : undefined
    const quote1 = await fetchQuoteFromAPI(
      currentNetwork,
      currentNetwork,
      currentToken,
      bridgeToken,
      currentAmount,
      userAddress
    )

    if (!quote1.ok) {
      // If quote fails, we can't proceed
      if (quote1.errorCode === 'ADAPTER_MISSING' || quote1.error?.includes('ADAPTER_MISSING')) {
        warnings.push(`Adapter missing for ${currentFamily} swap`)
        return null // Structured error will be returned by caller
      }
      return null
    }

    currentAmount = quote1.outAmountBase || currentAmount
    currentToken = bridgeToken

    steps.push({
      id: generateId('step'),
      kind: 'SWAP',
      from: {
        networkId: currentNetwork,
        family: currentFamily,
        tokenId: params.fromTokenId,
        tokenAddress: fromResolved.address,
      },
      to: {
        networkId: currentNetwork,
        family: currentFamily,
        tokenId: bridgeToken,
        tokenAddress: bridgeResolved.address,
      },
      amountInBase: toBaseUnits(params.amount, fromToken.decimals),
      estimatedOutBase: currentAmount,
      provider: quote1.provider || 'unknown',
      requiresWallet: [currentFamily],
      quote: quote1.quote,
    })

    requiresWallets.push(currentFamily)
  }

  // Step 2: Bridge to hub (or target if 2-step route)
  // For 2-step: fromFamily -> toFamily (direct bridge if supported)
  // For 3-step: fromFamily -> hub -> toFamily
  const targetNetwork = hubRoute.steps === 2 ? params.toNetworkId : hub!.networkId
  const targetFamily = hubRoute.steps === 2 ? toFamily : hubRoute.viaHub!

  // Resolve bridge tokens
  const bridgeFromResolved = resolveToken(currentNetwork, bridgeToken, currentFamily)
  const bridgeToResolved = resolveToken(targetNetwork, bridgeToken, targetFamily)

  if (!bridgeFromResolved || !bridgeToResolved) {
    return null
  }

  // Check if this is TRON -> something (needs OFFCHAIN_SWAP fallback)
  if (currentFamily === 'TRON' || targetFamily === 'TRON') {
    // TRON routes use OFFCHAIN_SWAP fallback
    steps.push({
      id: generateId('step'),
      kind: 'OFFCHAIN_SWAP',
      from: {
        networkId: currentNetwork,
        family: currentFamily,
        tokenId: bridgeToken,
        tokenAddress: bridgeFromResolved.address,
      },
      to: {
        networkId: targetNetwork,
        family: targetFamily,
        tokenId: bridgeToken,
        tokenAddress: bridgeToResolved.address,
      },
      amountInBase: currentAmount,
      estimatedOutBase: currentAmount, // Rough estimate
      provider: 'offchain',
      requiresWallet: [currentFamily, targetFamily],
    })

    requiresWallets.push(currentFamily, targetFamily)
    currentNetwork = targetNetwork
    currentFamily = targetFamily
    warnings.push(`TRON bridge uses off-chain swap (adapter not implemented)`)
  } else {
    // Try bridge quote
    const userAddress = currentFamily === 'EVM' ? params.wallets?.evm?.address : undefined
    const bridgeQuote = await fetchQuoteFromAPI(
      currentNetwork,
      targetNetwork,
      bridgeToken,
      bridgeToken,
      currentAmount,
      userAddress
    )

    if (!bridgeQuote.ok) {
      if (bridgeQuote.errorCode === 'ADAPTER_MISSING') {
        return null // Will be handled as adapter missing
      }
      return null
    }

    currentAmount = bridgeQuote.outAmountBase || currentAmount
    currentNetwork = targetNetwork
    currentFamily = targetFamily

    steps.push({
      id: generateId('step'),
      kind: 'BRIDGE',
      from: {
        networkId: steps.length > 0 ? steps[steps.length - 1].to.networkId : currentNetwork,
        family: currentFamily,
        tokenId: bridgeToken,
        tokenAddress: bridgeFromResolved.address,
      },
      to: {
        networkId: targetNetwork,
        family: targetFamily,
        tokenId: bridgeToken,
        tokenAddress: bridgeToResolved.address,
      },
      amountInBase: steps.length > 0 ? steps[steps.length - 1].estimatedOutBase || currentAmount : currentAmount,
      estimatedOutBase: currentAmount,
      provider: bridgeQuote.provider || 'unknown',
      requiresWallet: [steps.length > 0 ? steps[steps.length - 1].from.family : currentFamily],
      quote: bridgeQuote.quote,
    })

    requiresWallets.push(currentFamily)
  }

  // Step 3: If 3-step route, bridge from hub to target
  // After step 2, we're at hub. If target is different, bridge hub -> target
  if (hubRoute.steps === 3 && currentNetwork !== params.toNetworkId) {
    const finalBridgeToken = getBridgeToken(targetFamily)
    const finalBridgeResolved = resolveToken(params.toNetworkId, finalBridgeToken, toFamily)
    
    if (!finalBridgeResolved) {
      return null
    }

    // Bridge hub -> target
    const userAddress = targetFamily === 'EVM' ? params.wallets?.evm?.address : undefined
    const finalBridgeQuote = await fetchQuoteFromAPI(
      currentNetwork,
      params.toNetworkId,
      bridgeToken,
      finalBridgeToken,
      currentAmount,
      userAddress
    )

    if (!finalBridgeQuote.ok) {
      return null
    }

    currentAmount = finalBridgeQuote.outAmountBase || currentAmount
    currentNetwork = params.toNetworkId
    currentToken = finalBridgeToken
    currentFamily = toFamily

    steps.push({
      id: generateId('step'),
      kind: 'BRIDGE',
      from: {
        networkId: currentNetwork,
        family: currentFamily,
        tokenId: bridgeToken,
        tokenAddress: bridgeToResolved.address,
      },
      to: {
        networkId: params.toNetworkId,
        family: toFamily,
        tokenId: finalBridgeToken,
        tokenAddress: finalBridgeResolved.address,
      },
      amountInBase: steps[steps.length - 1].estimatedOutBase || currentAmount,
      estimatedOutBase: currentAmount,
      provider: finalBridgeQuote.provider || 'unknown',
      requiresWallet: [targetFamily],
      quote: finalBridgeQuote.quote,
    })

    requiresWallets.push(toFamily)
  }

  // Step 4: Swap from bridge token to target token (on target network)
  if (currentToken.toLowerCase() !== params.toTokenId.toLowerCase()) {
    const toResolved = resolveToken(params.toNetworkId, params.toTokenId, toFamily)
    const currentBridgeResolved = resolveToken(currentNetwork, currentToken, currentFamily)

    if (!toResolved || !currentBridgeResolved) {
      return null
    }

    const userAddress = toFamily === 'EVM' ? params.wallets?.evm?.address : undefined
    const finalQuote = await fetchQuoteFromAPI(
      currentNetwork,
      params.toNetworkId,
      currentToken,
      params.toTokenId,
      currentAmount,
      userAddress
    )

    if (!finalQuote.ok) {
      return null
    }

    steps.push({
      id: generateId('step'),
      kind: 'SWAP',
      from: {
        networkId: currentNetwork,
        family: currentFamily,
        tokenId: currentToken,
        tokenAddress: currentBridgeResolved.address,
      },
      to: {
        networkId: params.toNetworkId,
        family: toFamily,
        tokenId: params.toTokenId,
        tokenAddress: toResolved.address,
      },
      amountInBase: steps[steps.length - 1].estimatedOutBase || currentAmount,
      estimatedOutBase: finalQuote.outAmountBase,
      provider: finalQuote.provider || 'unknown',
      requiresWallet: [toFamily],
      quote: finalQuote.quote,
    })

    requiresWallets.push(toFamily)
  }

  return {
    id: generateId('plan'),
    steps,
    totalEstimatedOutBase: steps[steps.length - 1]?.estimatedOutBase,
    requiresWallets: Array.from(new Set(requiresWallets)),
    warnings,
  }
}

/**
 * Main route planning function
 */
export async function buildRoutePlan(params: RoutePlanParams): Promise<RoutePlanResult> {
  if (isDev) {
    console.log('[route-planner] Building plan:', {
      from: `${params.fromNetworkId}/${params.fromTokenId}`,
      to: `${params.toNetworkId}/${params.toTokenId}`,
      amount: params.amount,
    })
  }

  // Validate inputs
  if (!params.amount || parseFloat(params.amount) <= 0) {
    return {
      ok: false,
      error: 'Invalid amount',
      errorCode: 'NO_ROUTE',
      debug: { attemptedLegs: [{ step: 'validation', reason: 'Invalid amount' }] },
    }
  }

  // Get families (handle TRON gracefully - chainId may be null)
  const fromChainId = getChainId(params.fromNetworkId)
  const toChainId = getChainId(params.toNetworkId)
  
  const fromFamily = getFamily(params.fromNetworkId, fromChainId)
  const toFamily = getFamily(params.toNetworkId, toChainId)

  // Validate families
  if (fromFamily === 'UNSUPPORTED' || toFamily === 'UNSUPPORTED') {
    return {
      ok: false,
      error: `Unsupported network family`,
      errorCode: 'UNSUPPORTED_NETWORK',
      debug: {
        fromFamily,
        toFamily,
        attemptedLegs: [{ step: 'family_check', reason: `Unsupported: ${fromFamily} or ${toFamily}` }],
      },
    }
  }

  // Validate tokens exist
  const fromToken = getTokenInfo(params.fromTokenId)
  const toToken = getTokenInfo(params.toTokenId)

  if (!fromToken || !toToken) {
    return {
      ok: false,
      error: `Token not found: ${params.fromTokenId} or ${params.toTokenId}`,
      errorCode: 'NO_ROUTE',
      debug: {
        fromFamily,
        toFamily,
        attemptedLegs: [{ step: 'token_validation', reason: 'Token not in registry' }],
      },
    }
  }

  const attemptedLegs: Array<{ step: string; reason: string }> = []
  let plan: RoutePlan | null = null
  const missingAdapters: string[] = []

  // Try direct route first (same family)
  if (fromFamily === toFamily) {
    attemptedLegs.push({ step: 'direct', reason: 'Same family route' })
    plan = await buildDirectRoute(params, fromFamily)
    if (!plan) {
      attemptedLegs.push({ step: 'direct', reason: 'Direct quote failed' })
    }
  }

  // If no direct route, try hub route
  if (!plan) {
    const hubRoute = findHubRoute(fromFamily, toFamily)
    
    if (!hubRoute) {
      return {
        ok: false,
        error: `No route available from ${fromFamily} to ${toFamily}`,
        errorCode: 'NO_ROUTE',
        debug: {
          fromFamily,
          toFamily,
          attemptedLegs,
          missingAdapters,
        },
      }
    }

    attemptedLegs.push({ 
      step: 'hub_route', 
      reason: `Via ${hubRoute.viaHub || 'direct'} hub (${hubRoute.steps} steps)` 
    })

    plan = await buildHubRoute(params, fromFamily, toFamily, hubRoute)
    
    if (!plan) {
      // Check if it's a TRON route - use OFFCHAIN_SWAP fallback
      if (fromFamily === 'TRON' || toFamily === 'TRON') {
        // Create OFFCHAIN_SWAP fallback plan
        const fromResolved = resolveToken(params.fromNetworkId, params.fromTokenId, fromFamily)
        const toResolved = resolveToken(params.toNetworkId, params.toTokenId, toFamily)

        if (fromResolved && toResolved) {
          const amountBase = toBaseUnits(params.amount, fromToken.decimals)
          
          plan = {
            id: generateId('plan'),
            steps: [
              {
                id: generateId('step'),
                kind: 'OFFCHAIN_SWAP',
                from: {
                  networkId: params.fromNetworkId,
                  family: fromFamily,
                  tokenId: params.fromTokenId,
                  tokenAddress: fromResolved.address,
                },
                to: {
                  networkId: params.toNetworkId,
                  family: toFamily,
                  tokenId: params.toTokenId,
                  tokenAddress: toResolved.address,
                },
                amountInBase: amountBase,
                estimatedOutBase: amountBase, // Rough estimate
                provider: 'offchain',
                requiresWallet: [fromFamily, toFamily],
                adapterMissing: 'TRON_BRIDGE_ADAPTER',
              },
            ],
            totalEstimatedOutBase: amountBase,
            requiresWallets: [fromFamily, toFamily],
            warnings: [`TRON bridge requires off-chain swap (adapter not implemented)`],
          }

          attemptedLegs.push({ step: 'offchain_fallback', reason: 'TRON adapter not implemented' })
        }
      } else {
        // Check for adapter missing errors
        attemptedLegs.push({ step: 'hub_route', reason: 'Hub route quote failed' })
        missingAdapters.push(`${fromFamily}_QUOTE`)
        missingAdapters.push(`${toFamily}_QUOTE`)
      }
    }
  }

  if (!plan) {
    return {
      ok: false,
      error: 'No route found',
      errorCode: 'NO_ROUTE',
      debug: {
        fromFamily,
        toFamily,
        attemptedLegs,
        missingAdapters,
      },
    }
  }

  // Check wallet requirements
  const walletCheck = hasRequiredWallets(params.wallets, plan.requiresWallets)
  if (!walletCheck.hasAll) {
    return {
      ok: false,
      error: `Missing required wallets: ${walletCheck.missing.join(', ')}`,
      errorCode: 'WALLET_MISSING_FOR_ROUTE',
      debug: {
        fromFamily,
        toFamily,
        requiredWallets: plan.requiresWallets,
        missingWallets: walletCheck.missing,
        attemptedLegs,
      },
    }
  }

  // Check for missing adapters in steps
  for (const step of plan.steps) {
    if (step.adapterMissing) {
      missingAdapters.push(step.adapterMissing)
    }
  }

  if (missingAdapters.length > 0) {
    return {
      ok: false,
      error: `Missing adapters: ${missingAdapters.join(', ')}`,
      errorCode: 'ADAPTER_MISSING',
      debug: {
        fromFamily,
        toFamily,
        missingAdapters,
        attemptedLegs,
      },
    }
  }

  if (isDev) {
    console.log('[route-planner] Plan created:', {
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

