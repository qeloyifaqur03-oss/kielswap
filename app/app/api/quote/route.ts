import { NextRequest, NextResponse } from 'next/server'
import { getTokenInfo, getTokenAddress, getChainId, toBaseUnits, fromBaseUnits, getTokenDecimals } from '@/lib/tokens'
import { getEnvWithDefault } from '@/lib/env'
import { getChainInfo, isEVM } from '@/lib/chainRegistry'
import { getEnabledProviders, quoteFromProvider, type ProviderId } from '@/lib/providers'
import type { QuoteResult as ProviderQuoteResult } from '@/lib/providers/types'

// EVM-only mode: non-EVM providers removed

// Use Node.js runtime for module-scope Map singletons (not compatible with edge runtime)
export const runtime = 'nodejs'

const isDev = process.env.NODE_ENV === 'development'
const RELAY_DEBUG = process.env.RELAY_DEBUG === 'true'

// Module-scope singletons for request coalescing and caching
type CacheEntry<T> = { expiresAt: number; value: T }

const inFlightRequests = new Map<string, Promise<any>>()
const responseCache = new Map<string, CacheEntry<any>>()
const providerNegativeCache = new Map<string, CacheEntry<any>>() // for Relay INVALID_INPUT_CURRENCY etc.

function nowMs() {
  return Date.now()
}

function cacheGet<T>(map: Map<string, CacheEntry<T>>, key: string): T | null {
  const hit = map.get(key)
  if (!hit) return null
  if (hit.expiresAt <= nowMs()) {
    map.delete(key)
    return null
  }
  return hit.value
}

function cacheSet<T>(map: Map<string, CacheEntry<T>>, key: string, value: T, ttlMs: number) {
  map.set(key, { value, expiresAt: nowMs() + ttlMs })
}

async function coalesce<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlightRequests.get(key)
  if (existing) return existing as Promise<T>

  const p = (async () => {
    try {
      return await fn()
    } finally {
      inFlightRequests.delete(key)
    }
  })()

  inFlightRequests.set(key, p as Promise<any>)
  return p
}

function getCacheKey(fromChainId: number, toChainId: number, fromToken: string, toToken: string, amountBase: string, userAddress: string, isIndicative: boolean): string {
  // Cache key includes all relevant parameters for wallet-aware caching
  return JSON.stringify({ fromChainId, toChainId, fromToken, toToken, amountBase, userAddress, isIndicative })
}

const CACHE_TTL = 5000 // 5 seconds cache for successful quotes
const NO_ROUTE_CACHE_TTL = 30000 // 30 seconds for NO_ROUTE errors
const NEGATIVE_CACHE_TTL = 600000 // 10 minutes for Relay INVALID_INPUT_CURRENCY

/**
 * Fetch with timeout using AbortController
 */
async function fetchWithTimeout(
  url: string,
  opts: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs)
  
  try {
    const response = await fetch(url, {
      ...opts,
      signal: abortController.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`)
    }
    throw error
  }
}

function checkNegativeCache(provider: string, fromChainId: number, toChainId: number, fromToken: string, toToken: string): boolean {
  if (provider !== 'relay') return false
  
  const relayKey = JSON.stringify({ originChainId: fromChainId, destinationChainId: toChainId, originCurrency: fromToken, destinationCurrency: toToken })
  const cached = cacheGet(providerNegativeCache, 'relay:' + relayKey)
  return cached !== null && (cached as any).skip === true
}

function setNegativeCache(provider: string, fromChainId: number, toChainId: number, fromToken: string, toToken: string, errorCode: string) {
  if (provider !== 'relay' || errorCode !== 'INVALID_INPUT_CURRENCY') return
  
  const relayKey = JSON.stringify({ originChainId: fromChainId, destinationChainId: toChainId, originCurrency: fromToken, destinationCurrency: toToken })
  cacheSet(providerNegativeCache, 'relay:' + relayKey, { skip: true }, NEGATIVE_CACHE_TTL)
}

// Placeholder EOA address for quotes when wallet is not connected
// Must be non-zero (never use 0x000...0000) to avoid provider errors
const PLACEHOLDER_EOA = '0x1111111111111111111111111111111111111111'

// EVM-only mode: Network family is always EVM
export type NetworkFamily = 'EVM' | 'UNSUPPORTED'

// EVM chain IDs allowlist - all networks supported by LiFi/Relay/Jumper
const EVM_CHAIN_IDS = new Set([
  1,      // Ethereum
  10,     // Optimism
  25,     // Cronos
  30,     // Rootstock
  56,     // BNB Chain
  100,    // Gnosis
  137,    // Polygon
  146,    // Sonic
  204,    // opBNB
  324,    // zkSync Era
  369,    // PulseChain
  480,    // World Chain
  1116,   // Core
  2020,   // Ronin
  2345,   // GOAT Network
  2741,   // Abstract
  42161,  // Arbitrum
  43114,  // Avalanche
  5000,   // Mantle
  534352, // Scroll
  57073,  // Ink
  59144,  // Linea
  60808,  // BOB
  80094,  // Berachain
  81457,  // Blast
  8453,   // Base
  9745,   // Plasma
  98866,  // Plume
  10143,  // Monad Testnet
  13371,  // Immutable zkEVM
  747474, // Katana
])

// LiFi supported chain IDs - chains that LiFi API actually supports
// Based on LiFi API validation - chains not in this list will return 400 errors
// PulseChain (369), Ronin (2020), and some other chains are NOT supported by LiFi
const LIFI_SUPPORTED_CHAIN_IDS = new Set([
  1,      // Ethereum
  10,     // Optimism
  25,     // Cronos
  56,     // BNB Chain
  100,    // Gnosis
  137,    // Polygon
  324,    // zkSync Era
  42161,  // Arbitrum
  43114,  // Avalanche
  5000,   // Mantle
  534352, // Scroll
  59144,  // Linea
  81457,  // Blast
  8453,   // Base
  13371,  // Immutable zkEVM
])

interface QuoteRequest {
  amount: string // Human-readable amount
  fromTokenId: string
  toTokenId: string
  fromNetworkId: string
  toNetworkId: string
  userAddress?: string // Optional wallet address (if wallet connected)
  requestId?: string // Optional request ID for race condition prevention
}

interface QuoteResponse {
  ok: boolean
  provider?: string
  fromChain?: number
  toChain?: number
  fromToken?: string
  toToken?: string
  inAmount?: string
  outAmount?: string
  outAmountBase?: string
  route?: any
  error?: string
  errorCode?: string
  httpStatus?: number
  fee?: string // Legacy field for backward compatibility
  estimatedTime?: string
  isIndicative?: boolean // true if placeholder address was used
  debug?: any // Debug info when all providers fail
  requestId?: string // Request ID for tracking
  // Fee breakdown fields (EVM-only)
  estimatedGasUSD?: string | null // Estimated network gas cost in USD
  providerFeeUSD?: string | null // Provider fee in USD
  bridgeFeeUSD?: string | null // Bridge fee in USD
  totalFeeUSD?: string | null // Total fees in USD (sum of above, if available)
  warnings?: string[] // Warnings about the quote
}

interface ProviderError {
  provider: string
  status?: number
  statusText?: string
  error?: string
  url?: string
  request?: any
}

/**
 * Get WETH address for a chain (for providers like 0x that require wrapped native)
 * Uses the token registry to get WETH address
 */
function getWethAddress(chainId: number): string | null {
  return getTokenAddress('weth', chainId)
}

/**
 * Extract fee breakdown from provider response
 * Returns null for fields that are not available from the provider
 */
function extractFeeBreakdown(provider: 'relay' | 'lifi' | '0x', data: any): {
  estimatedGasUSD: string | null
  providerFeeUSD: string | null
  bridgeFeeUSD: string | null
  totalFeeUSD: string | null
} {
  // Initialize all fees as null - only populate if provider returns them
  let estimatedGasUSD: string | null = null
  let providerFeeUSD: string | null = null
  let bridgeFeeUSD: string | null = null
  let totalFeeUSD: string | null = null

  try {
    switch (provider) {
      case 'relay':
        // Relay response structure: check for fee fields in data
        // Example: data.fees?.gasUSD, data.fees?.bridgeUSD, etc.
        if (data.fees) {
          estimatedGasUSD = data.fees.gasUSD ? data.fees.gasUSD.toString() : null
          providerFeeUSD = data.fees.providerUSD ? data.fees.providerUSD.toString() : null
          bridgeFeeUSD = data.fees.bridgeUSD ? data.fees.bridgeUSD.toString() : null
          if (data.fees.totalUSD) {
            totalFeeUSD = data.fees.totalUSD.toString()
          } else if (estimatedGasUSD || providerFeeUSD || bridgeFeeUSD) {
            // Calculate total if individual fees are available
            const total = (parseFloat(estimatedGasUSD || '0') +
                          parseFloat(providerFeeUSD || '0') +
                          parseFloat(bridgeFeeUSD || '0')).toString()
            totalFeeUSD = total !== '0' ? total : null
          }
        }
        break
      
      case 'lifi':
        // LiFi response structure: check estimate.gasCosts and estimate.feeCosts
        if (data.estimate) {
          // Gas costs are typically in the native token, need USD conversion
          // For now, leave as null unless LiFi provides USD values
          if (data.estimate.gasCosts && Array.isArray(data.estimate.gasCosts)) {
            // LiFi may provide gas costs, but USD conversion requires price data
            // Leave as null for now - can be enhanced later with price lookup
          }
          // Provider/bridge fees
          if (data.estimate.feeCosts && Array.isArray(data.estimate.feeCosts)) {
            // Similar to gas costs - would need USD conversion
          }
        }
        break
      
      case '0x':
        // 0x response structure: check for fee fields
        if (data.gasPrice && data.gas) {
          // 0x provides gas estimate, but USD conversion requires price data
          // Leave as null for now
        }
        if (data.buyTokenPrice && data.sellTokenPrice) {
          // 0x may provide price information, but fee breakdown needs more processing
          // Leave as null for now
        }
        break
    }
  } catch (error) {
    // Silently fail fee extraction - better to have null than crash
    if (isDev) {
      console.warn(`[quote] Failed to extract fees from ${provider}:`, error)
    }
  }

  return {
    estimatedGasUSD,
    providerFeeUSD,
    bridgeFeeUSD,
    totalFeeUSD,
  }
}

/**
 * Get token address for provider, handling native tokens correctly
 * 
 * NATIVE TOKEN HANDLING:
 * - Different providers handle native tokens (ETH, etc.) differently:
 *   - LiFi & Relay: Accept 0x000...0000 as native token identifier
 *   - 0x: Does NOT accept 0x000...0000. Must use WETH address instead.
 *         This is because 0x aggregates DEX swaps which trade ERC20 tokens.
 *         Native ETH must be wrapped to WETH first to trade on DEXes.
 *   - Jupiter: Uses mint addresses (Solana-specific)
 * 
 * Why we don't use 0x000...0000 for all providers:
 * Sending 0x000...0000 to providers like 0x that don't support it results in:
 * - 400 Bad Request errors
 * - "Invalid token address" errors
 * - Routing failures even when WETH pairs exist
 * 
 * Solution: Use provider-specific native token representation:
 * - For 0x: Use WETH address (wrapped native token)
 * - For LiFi/Relay: Use 0x000...0000 (their API handles it)
 */
function getProviderTokenAddress(
  tokenId: string,
  chainId: number,
  provider: 'relay' | 'lifi' | '0x' | 'jupiter'
): string {
  const tokenAddress = getTokenAddress(tokenId, chainId)
  
  // If it's a native token (null address), handle per provider
  if (!tokenAddress) {
    switch (provider) {
      case '0x':
        // 0x requires WETH for native token swaps - they don't support 0x000...0000
        // This is because 0x routes through DEXes which trade ERC20 tokens
        const wethAddress = getWethAddress(chainId)
        if (!wethAddress) {
          // WETH not available - return special marker to skip 0x
          // This will be handled by the caller
          throw new Error(`WETH_NOT_AVAILABLE:${chainId}`)
        }
        return wethAddress
      case 'lifi':
        // LiFi uses zero address for native tokens, but not all chains support it
        return '0x0000000000000000000000000000000000000000'
      case 'relay':
        // Relay uses zero address for native tokens - their API supports it
        return '0x0000000000000000000000000000000000000000'
      default:
        return '0x0000000000000000000000000000000000000000'
    }
  }
  
  return tokenAddress
}

/**
 * Strict token validation before quoting
 * Validates that tokens exist on the specified chains and have correct decimals
 * Returns validated token address with strict checks
 */
function validateTokenForNetwork(
  tokenId: string,
  networkId: string,
  chainId: number | null
): { valid: boolean; error?: string; tokenAddress?: string | null; decimals?: number; tokenSymbol?: string } {
  // EVM-only mode: chainId must be valid
  if (!chainId) {
    return { valid: false, error: `Invalid chain ID for network ${networkId}. EVM-only mode enabled.` }
  }

  const token = getTokenInfo(tokenId)
  if (!token) {
    return { valid: false, error: `Token ${tokenId} not found in registry` }
  }

  // Check if token exists on this chain
  const tokenAddress = getTokenAddress(tokenId, chainId)
  // Note: tokenAddress can be null for native tokens, which is valid

  // Verify decimals match registry (prevent mismatch issues)
  if (token.decimals < 0 || token.decimals > 18) {
    return { valid: false, error: `Invalid decimals for token ${tokenId}: ${token.decimals}` }
  }

  return { valid: true, tokenAddress, decimals: token.decimals, tokenSymbol: token.symbol }
}

/**
 * Strict token address mapping validation
 * Enforces: native tokens MUST be 0x000..., non-native MUST NOT be 0x000...
 */
function validateTokenAddressMapping(
  tokenId: string,
  tokenSymbol: string,
  chainId: number,
  resolvedAddress: string | null,
  isNative: boolean
): { valid: boolean; error?: string; debug?: any } {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
  
  if (isNative) {
    // Native token MUST use zero address
    if (resolvedAddress !== null && resolvedAddress !== ZERO_ADDRESS) {
      return {
        valid: false,
        error: 'Native token must use zero address',
        debug: { chainId, tokenSymbol, resolvedAddress, expected: ZERO_ADDRESS },
      }
    }
  } else {
    // Non-native token MUST NOT use zero address
    if (resolvedAddress === null || resolvedAddress === ZERO_ADDRESS) {
      return {
        valid: false,
        error: 'Non-native token must not use zero address',
        debug: { chainId, tokenSymbol, resolvedAddress, issue: 'Expected non-zero contract address' },
      }
    }
  }
  
  return { valid: true }
}

/**
 * Check for decimals mismatch in provider response (2.3)
 * Validates that output amount matches expected decimals
 */
function checkDecimalsMismatch(
  provider: string,
  outAmountBase: string,
  tokenSymbol: string,
  expectedDecimals: number,
  providerResponse: any
): { valid: boolean; error?: string; debug?: any } {
  // For tokens with known decimals (USDT=6, USDC=6), check if output looks wrong
  if ((tokenSymbol === 'USDT' || tokenSymbol === 'USDC') && expectedDecimals === 6) {
    const formatted6Dec = fromBaseUnits(outAmountBase, 6)
    const formatted18Dec = fromBaseUnits(outAmountBase, 18)
    const ratio = parseFloat(formatted18Dec) / parseFloat(formatted6Dec)
    
    // If formatted as 18 decimals is 1e12x larger, likely mismatch
    if (ratio > 1e10) {
      return {
        valid: false,
        error: 'Decimals mismatch suspected - output appears to be 18 decimals when 6 expected',
        debug: {
          provider,
          tokenSymbol,
          expectedDecimals: 6,
          outAmountBase,
          formatted6Dec,
          formatted18Dec,
          ratio,
          providerResponse,
        },
      }
    }
  }
  
  return { valid: true }
}

/**
 * Sanity check for "magical prices" - suspicious quotes
 * Rejects quotes where output amount is suspiciously low for same-token swaps
 */
function validateQuoteSanity(
  fromTokenSymbol: string,
  toTokenSymbol: string,
  inAmountBase: string,
  outAmountBase: string,
  fromDecimals: number,
  toDecimals: number,
  provider: string
): { valid: boolean; isSuspicious?: boolean; error?: string; debug?: any } {
  const inAmount = parseFloat(fromBaseUnits(inAmountBase, fromDecimals))
  const outAmount = parseFloat(fromBaseUnits(outAmountBase, toDecimals))
  
  // Same token swap (cross-chain same symbol) - normalize for comparison
  const fromSymbolLower = fromTokenSymbol.toLowerCase().trim()
  const toSymbolLower = toTokenSymbol.toLowerCase().trim()
  const isSameTokenSwap = fromSymbolLower === toSymbolLower
  
  if (isSameTokenSwap) {
    // Output should be at least 0.5% less than input (accounting for fees)
    // But not extremely small (< 0.5% of input is suspicious)
    const minExpectedOutput = inAmount * 0.995 // 0.5% fee max
    const maxFeeRatio = 0.995
    
    if (outAmount === 0) {
      return {
        valid: false,
        error: 'Quote output is zero - likely invalid',
        debug: { fromTokenSymbol, toTokenSymbol, inAmount, outAmount, provider },
      }
    }
    
    if (outAmount < inAmount * 0.005) {
      // Less than 0.5% of input is extremely suspicious
      return {
        valid: false,
        error: 'Quote output is suspiciously low for same-token swap',
        debug: {
          fromTokenSymbol,
          toTokenSymbol,
          inAmount,
          outAmount,
          ratio: outAmount / inAmount,
          minExpected: minExpectedOutput,
          provider,
        },
      }
    }
    
    // Check for suspiciously high output (e.g., 1 ETH -> 11268 ETH)
    // For same-token swaps, output should be at most slightly more than input (within 1%)
    // This handles cases where price ratios are incorrectly applied
    const maxExpectedOutput = inAmount * 1.01 // Maximum 1% more (should never happen in reality)
    if (outAmount > maxExpectedOutput) {
      if (isDev || process.env.NEXT_PUBLIC_DEBUG_QUOTES === '1') {
        console.error('[quote] REJECTING suspiciously high same-token swap:', {
          fromTokenSymbol,
          toTokenSymbol,
          inAmount,
          outAmount,
          ratio: outAmount / inAmount,
          maxExpected: maxExpectedOutput,
          provider,
        })
      }
      return {
        valid: false,
        error: 'Quote output is suspiciously high for same-token swap',
        debug: {
          errorCode: 'SUSPICIOUS_QUOTE_HIGH_OUTPUT',
          fromTokenSymbol,
          toTokenSymbol,
          inAmount,
          outAmount,
          ratio: outAmount / inAmount,
          maxExpected: maxExpectedOutput,
          provider,
        },
      }
    }
    
    // For stable-to-stable (USDT->USDT, USDC->USDC), output should be very close to input minus fees
    const isStablecoin = ['USDT', 'USDC', 'DAI'].includes(fromTokenSymbol.toUpperCase())
    if (isStablecoin && outAmount < inAmount * maxFeeRatio) {
      // Mark as suspicious but allow if above 0.5% threshold
      if (outAmount < inAmount * 0.005) {
        return {
          valid: false,
          error: 'Stablecoin cross-chain swap output is suspiciously low',
          debug: {
            fromTokenSymbol,
            toTokenSymbol,
            inAmount,
            outAmount,
            expectedMin: inAmount * maxFeeRatio,
            provider,
          },
        }
      }
      
      // Above threshold but below expected - mark as suspicious
      return {
        valid: true,
        isSuspicious: true,
        debug: {
          fromTokenSymbol,
          toTokenSymbol,
          inAmount,
          outAmount,
          expectedMin: inAmount * maxFeeRatio,
          provider,
          warning: 'Output lower than expected for stablecoin swap',
        },
      }
    }
  }
  
  return { valid: true }
}

/**
 * Convert provider QuoteResult to QuoteResponse format
 */
function convertProviderQuoteToResponse(
  providerResult: ProviderQuoteResult,
  provider: ProviderId,
  fromTokenSymbol: string,
  toTokenSymbol: string,
  amountBase: string,
  fromTokenDecimals: number,
  toTokenDecimals: number,
  requestId?: string
): QuoteResponse {
  // Extract fee breakdown from provider result
  let estimatedGasUSD: string | null = null
  let providerFeeUSD: string | null = null
  let bridgeFeeUSD: string | null = null
  let totalFeeUSD: string | null = null

  if (providerResult.fees && providerResult.fees.length > 0) {
    for (const fee of providerResult.fees) {
      if (fee.type === 'gas' && fee.usdValue) {
        estimatedGasUSD = fee.usdValue
      } else if (fee.type === 'protocol' && fee.usdValue) {
        providerFeeUSD = fee.usdValue
      } else if (fee.type === 'bridge' && fee.usdValue) {
        bridgeFeeUSD = fee.usdValue
      }
    }
    // Calculate total if we have any fees
    const total = parseFloat(estimatedGasUSD || '0') +
                  parseFloat(providerFeeUSD || '0') +
                  parseFloat(bridgeFeeUSD || '0')
    if (total > 0) {
      totalFeeUSD = total.toString()
    }
  }

  return {
    ok: true,
    provider,
    fromChain: providerResult.routeSteps[0]?.fromChainId,
    toChain: providerResult.routeSteps[0]?.toChainId,
    fromToken: providerResult.routeSteps[0]?.fromTokenAddress,
    toToken: providerResult.routeSteps[0]?.toTokenAddress,
    inAmount: providerResult.fromAmount,
    outAmountBase: providerResult.toAmount,
    outAmount: fromBaseUnits(providerResult.toAmount, toTokenDecimals),
    route: providerResult.meta,
    isIndicative: providerResult.isIndicative,
    estimatedGasUSD,
    providerFeeUSD,
    bridgeFeeUSD,
    totalFeeUSD,
    estimatedTime: providerResult.routeSteps[0]?.estimatedTime?.toString(),
  }
}

/**
 * Validate and process a quote result from a provider
 * Returns processed quote response or null if validation fails
 */
function validateAndProcessQuote(
  providerResult: { result: QuoteResponse | null; error?: ProviderError; isIndicative?: boolean },
  fromTokenSymbol: string,
  toTokenSymbol: string,
  amountBase: string,
  fromTokenDecimals: number,
  toTokenDecimals: number,
  requestId?: string
): { response: QuoteResponse | null; error?: ProviderError } {
  if (!providerResult.result?.ok || !providerResult.result.outAmountBase) {
    return { response: null, error: providerResult.error }
  }

  const outAmountBase = providerResult.result.outAmountBase

  // Decimals mismatch check
  const decimalsCheck = checkDecimalsMismatch(
    providerResult.result.provider || 'unknown',
    outAmountBase,
    toTokenSymbol,
    toTokenDecimals,
    providerResult.result
  )

  if (!decimalsCheck.valid) {
    return {
      response: {
        ok: false,
        error: decimalsCheck.error || 'Decimals mismatch suspected',
        errorCode: 'DECIMALS_MISMATCH_SUSPECTED',
        debug: decimalsCheck.debug,
      },
    }
  }

  // Sanity check for magical prices
  const sanityCheck = validateQuoteSanity(
    fromTokenSymbol,
    toTokenSymbol,
    amountBase,
    outAmountBase,
    fromTokenDecimals,
    toTokenDecimals,
    providerResult.result.provider || 'unknown'
  )

  if (!sanityCheck.valid) {
    return {
      response: {
        ok: false,
        error: sanityCheck.error || 'Quote output suspicious',
        errorCode: 'SUSPICIOUS_QUOTE',
        debug: sanityCheck.debug,
        requestId,
      },
    }
  }

  // Format output using registry decimals only
  const processedResult: QuoteResponse = {
    ...providerResult.result,
    outAmount: fromBaseUnits(outAmountBase, toTokenDecimals),
    requestId,
  }

  // Add suspicious flag if applicable
  if (sanityCheck.isSuspicious) {
    processedResult.route = {
      ...processedResult.route,
      suspicious: true,
      suspiciousDebug: sanityCheck.debug,
    }
  }

  if (providerResult.isIndicative) {
    processedResult.isIndicative = true
  }

  return { response: processedResult }
}

/**
 * Build Relay currency string from token address
 * Per Relay API docs: native tokens use "0x0000000000000000000000000000000000000000", ERC20 uses token address
 */
function buildRelayCurrency(tokenAddress: string | null): string {
  // If native token (null or zero address), return zero address per Relay spec
  if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
    return '0x0000000000000000000000000000000000000000'
  }
  // For ERC20 tokens, return the token contract address
  return tokenAddress
}

/**
 * Try Relay API for quotes (EVM only)
 * Relay v2 endpoint: POST https://api.relay.link/quote/v2
 * Uses originCurrency/destinationCurrency schema - user is always a string address
 */
async function tryRelay(
  fromChainId: number,
  toChainId: number,
  fromTokenAddress: string,
  toTokenAddress: string,
  amountBase: string,
  userAddress: string, // Required: user address or placeholder (must be non-zero)
  fromTokenId: string,
  toTokenId: string
): Promise<{ result: QuoteResponse | null; error?: ProviderError; isIndicative?: boolean }> {
  const apiKey = getEnvWithDefault('RELAY_API_KEY', '')
  
  // Runtime assertion: userAddress must not be zero address
  if (!userAddress || userAddress === '0x0000000000000000000000000000000000000000') {
    throw new Error('Relay requires non-zero user address')
  }

  const isIndicative = userAddress === PLACEHOLDER_EOA
  
  // Skip Relay if user is placeholder (Relay requires real EOA for execution-ready quotes)
  if (isIndicative) {
    return { result: null, error: { provider: 'relay', error: 'Relay requires connected wallet (real EOA address)' }, isIndicative: true }
  }
  
  // Check negative cache for INVALID_INPUT_CURRENCY
  if (checkNegativeCache('relay', fromChainId, toChainId, fromTokenAddress, toTokenAddress)) {
    return { result: null, error: { provider: 'relay', error: 'Relay does not support this token pair (negative cached)' } }
  }
  
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (apiKey) {
      headers['X-Relay-Auth'] = apiKey
    }

    // Build Relay currency strings: native = 0x000..., ERC20 = token address
    const originCurrency = buildRelayCurrency(fromTokenAddress)
    const destinationCurrency = buildRelayCurrency(toTokenAddress)

    // Relay v2 request body - EXACT schema per Relay API docs
    const requestBody = {
      user: userAddress, // String address (never object)
      originChainId: fromChainId,
      destinationChainId: toChainId,
      originCurrency: originCurrency, // Token address or 0x000... for native
      destinationCurrency: destinationCurrency, // Token address or 0x000... for native
      amount: amountBase, // Base units as string
      tradeType: 'EXACT_INPUT' as const,
    }

    if (RELAY_DEBUG) {
      console.log('[relay] requestBody', requestBody)
    }

    const response = await fetchWithTimeout(
      'https://api.relay.link/quote/v2',
      {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      },
      3000 // 3 second timeout for Relay (optimized for speed)
    )

    if (RELAY_DEBUG) {
      console.log('[relay] status', response.status)
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      const truncatedError = errorText.length > 500 ? errorText.substring(0, 500) + '...' : errorText
      
      // Parse error JSON to check for INVALID_INPUT_CURRENCY
      let errorCode: string | undefined
      try {
        const errorJson = JSON.parse(errorText)
        errorCode = errorJson.errorCode || errorJson.code || errorJson.error?.code
      } catch {
        // Not JSON, check error text for pattern
        if (errorText.includes('INVALID_INPUT_CURRENCY') || errorText.includes('Invalid input or output currency')) {
          errorCode = 'INVALID_INPUT_CURRENCY'
        }
      }
      
      // If INVALID_INPUT_CURRENCY, set negative cache
      if (errorCode === 'INVALID_INPUT_CURRENCY') {
        setNegativeCache('relay', fromChainId, toChainId, fromTokenAddress, toTokenAddress, errorCode)
      }
      
      // Always log Relay errors with full details for debugging
      console.error(`[quote] Relay failed: status=${response.status}, statusText=${response.statusText}, error=${truncatedError}`)
      if (RELAY_DEBUG) {
        console.log('[relay] responseText', truncatedError)
        console.log('[relay] requestBody', requestBody)
      }
      
      const error: ProviderError = {
        provider: 'relay',
        status: response.status,
        statusText: response.statusText,
        url: 'https://api.relay.link/quote/v2',
        request: requestBody,
        error: errorText, // Full error text in ProviderError
      }
      
      return { result: null, error }
    }

    const data = await response.json()

    // Relay response format: { destinationAmount: string, ... } or { quote: { destinationAmount: string } }
    const destinationAmount = data.destinationAmount || data.quote?.destinationAmount || data.quote?.outputAmount
    
    if (destinationAmount) {
      // Extract fee breakdown from Relay response
      const feeBreakdown = extractFeeBreakdown('relay', data)
      
      return {
        result: {
          ok: true,
          provider: 'relay',
          fromChain: fromChainId,
          toChain: toChainId,
          fromToken: fromTokenAddress,
          toToken: toTokenAddress,
          inAmount: amountBase,
          outAmountBase: destinationAmount.toString(),
          route: data,
          isIndicative,
          estimatedGasUSD: feeBreakdown.estimatedGasUSD,
          providerFeeUSD: feeBreakdown.providerFeeUSD,
          bridgeFeeUSD: feeBreakdown.bridgeFeeUSD,
          totalFeeUSD: feeBreakdown.totalFeeUSD,
        },
        isIndicative,
      }
    }

    return { result: null }
  } catch (error) {
    const providerError: ProviderError = {
      provider: 'relay',
      url: 'https://api.relay.link/quote/v2',
      error: error instanceof Error ? error.message : String(error),
    }
    
    if (isDev) {
      console.error('[quote] Relay error:', providerError)
    }
    
    return { result: null, error: providerError }
  }
}

/**
 * Try LiFi API for quotes (EVM only)
 * LiFi uses GET with query parameters, NOT POST
 * fromAddress must NOT be zero address (0x000...0000) - use placeholder EOA instead
 * 
 * Note: LiFi does not support all EVM chains - check LIFI_SUPPORTED_CHAIN_IDS before calling
 */
async function tryLiFi(
  fromChainId: number,
  toChainId: number,
  fromToken: string,
  toToken: string,
  amountBase: string,
  userAddress: string // Required: user address or placeholder
): Promise<{ result: QuoteResponse | null; error?: ProviderError; isIndicative?: boolean }> {
  // Check if both chains are supported by LiFi
  if (!LIFI_SUPPORTED_CHAIN_IDS.has(fromChainId) || !LIFI_SUPPORTED_CHAIN_IDS.has(toChainId)) {
    // Silently skip LiFi for unsupported chains - don't throw, just return null
    throw new Error(`LIFI_UNSUPPORTED_CHAIN:${fromChainId}-${toChainId}`)
  }

  // Runtime assertion: LiFi does not accept zero address for fromAddress
  if (!userAddress || userAddress === '0x0000000000000000000000000000000000000000') {
    throw new Error('LiFi fromAddress cannot be zero address - use placeholder EOA')
  }

  const isIndicative = userAddress === PLACEHOLDER_EOA

  try {
    // LiFi uses GET with query parameters
    const params = new URLSearchParams({
      fromChain: fromChainId.toString(),
      toChain: toChainId.toString(),
      fromToken,
      toToken,
      fromAmount: amountBase,
      fromAddress: userAddress, // Use provided address or placeholder (never zero address)
      // Optional: toAddress for cross-chain
      // slippage: '0.005', // 0.5% default
      // order: 'RECOMMENDED',
    })

    const url = `https://li.quest/v1/quote?${params.toString()}`
    
    const response = await fetchWithTimeout(
      url,
      {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      },
      3000 // 3 second timeout for LiFi (optimized for speed)
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      const error: ProviderError = {
        provider: 'lifi',
        status: response.status,
        statusText: response.statusText,
        url,
        request: { fromChainId, toChainId, fromToken, toToken, amountBase },
        error: errorText,
      }
      
      if (isDev) {
        console.error(`[quote] LiFi failed:`, error)
      }
      
      return { result: null, error }
    }

    const data = await response.json()

    // Extract toAmount from LiFi response
    let toAmountBase: string | null = null

    if (data.toAmount) {
      toAmountBase = data.toAmount
    } else if (data.estimate?.toAmount) {
      toAmountBase = data.estimate.toAmount
    } else if (data.actions && Array.isArray(data.actions) && data.actions.length > 0) {
      const lastAction = data.actions[data.actions.length - 1]
      toAmountBase = lastAction.toAmount || lastAction.estimate?.toAmount || null
    }

    if (toAmountBase) {
      // Extract fee breakdown from LiFi response
      const feeBreakdown = extractFeeBreakdown('lifi', data)
      
      // Extract legacy fee field for backward compatibility
      let fee: string | undefined
      if (data.gasCosts || data.feeCosts) {
        const fees = data.gasCosts || data.feeCosts || []
        // Fee calculation simplified - would need token decimals
        fee = undefined
      }

      return {
        result: {
          ok: true,
          provider: 'lifi',
          fromChain: fromChainId,
          toChain: toChainId,
          fromToken,
          toToken,
          inAmount: amountBase,
          outAmountBase: toAmountBase,
          route: data,
          fee,
          estimatedTime: data.estimate?.executionDuration
            ? `${Math.round(data.estimate.executionDuration / 1000)}s`
            : undefined,
          isIndicative,
          estimatedGasUSD: feeBreakdown.estimatedGasUSD,
          providerFeeUSD: feeBreakdown.providerFeeUSD,
          bridgeFeeUSD: feeBreakdown.bridgeFeeUSD,
          totalFeeUSD: feeBreakdown.totalFeeUSD,
        },
        isIndicative,
      }
    }

    return { result: null }
  } catch (error) {
    const providerError: ProviderError = {
      provider: 'lifi',
      url: 'https://li.quest/v1/quote',
      error: error instanceof Error ? error.message : String(error),
    }
    
    if (isDev) {
      console.error('[quote] LiFi error:', providerError)
    }
    
    return { result: null, error: providerError }
  }
}

/**
 * Try 0x API for same-chain EVM quotes only
 * 0x uses api.0x.org with chainId as query parameter, NOT as subdomain
 * Native tokens MUST use WETH, not 0x000...
 */
async function try0x(
  fromChainId: number,
  toChainId: number,
  fromToken: string,
  toToken: string,
  amountBase: string
): Promise<{ result: QuoteResponse | null; error?: ProviderError }> {
  // 0x only supports same-chain swaps
  if (fromChainId !== toChainId) {
    return { result: null }
  }

  try {
    const apiKey = getEnvWithDefault('ZEROX_API_KEY', '')
    
    // 0x uses base domain with chainId as query param
    const params = new URLSearchParams({
      sellToken: fromToken,
      buyToken: toToken,
      sellAmount: amountBase,
      chainId: fromChainId.toString(),
    })

    const url = `https://api.0x.org/swap/v1/quote?${params.toString()}`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (apiKey) {
      headers['0x-api-key'] = apiKey
    }

    const requestParams = {
      fromChainId,
      toChainId,
      fromToken,
      toToken,
      amountBase,
    }

    const response = await fetchWithTimeout(
      url,
      {
      method: 'GET',
      headers,
      },
      3000 // 3 second timeout for 0x (reduced for faster fallback)
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      const error: ProviderError = {
        provider: '0x',
        status: response.status,
        statusText: response.statusText,
        url,
        request: requestParams,
        error: errorText,
      }
      
      if (isDev) {
        console.error(`[quote] 0x failed:`, error)
      }
      
      return { result: null, error }
    }

    const data = await response.json()

    if (data.buyAmount) {
      // Extract fee breakdown from 0x response
      const feeBreakdown = extractFeeBreakdown('0x', data)
      
      return {
        result: {
          ok: true,
          provider: '0x',
          fromChain: fromChainId,
          toChain: toChainId,
          fromToken,
          toToken,
          inAmount: amountBase,
          outAmountBase: data.buyAmount,
          route: data,
          estimatedGasUSD: feeBreakdown.estimatedGasUSD,
          providerFeeUSD: feeBreakdown.providerFeeUSD,
          bridgeFeeUSD: feeBreakdown.bridgeFeeUSD,
          totalFeeUSD: feeBreakdown.totalFeeUSD,
        },
      }
    }

    return { result: null }
  } catch (error) {
    const providerError: ProviderError = {
      provider: '0x',
      url: 'https://api.0x.org/swap/v1/quote',
      error: error instanceof Error ? error.message : String(error),
    }
    
    if (isDev) {
      console.error('[quote] 0x error:', providerError)
    }
    
    return { result: null, error: providerError }
  }
}

/**
 * Try Jupiter API for Solana-only quotes
 * Tokens must be resolved to mint addresses
 */
async function tryJupiter(
  fromToken: string, // Mint address
  toToken: string, // Mint address
  amountBase: string
): Promise<{ result: QuoteResponse | null; error?: ProviderError }> {
  try {
    const params = new URLSearchParams({
      inputMint: fromToken,
      outputMint: toToken,
      amount: amountBase,
      slippageBps: '50', // 0.5%
    })

    const url = `https://quote-api.jup.ag/v6/quote?${params.toString()}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      const error: ProviderError = {
        provider: 'jupiter',
        status: response.status,
        statusText: response.statusText,
        url,
        request: { fromToken, toToken, amountBase },
        error: errorText,
      }
      
      if (isDev) {
        console.error(`[quote] Jupiter failed:`, error)
      }
      
      return { result: null, error }
    }

    const data = await response.json()

    if (data.outAmount) {
      return {
        result: {
          ok: true,
          provider: 'jupiter',
          fromToken,
          toToken,
          inAmount: amountBase,
          outAmountBase: data.outAmount,
          route: data,
        },
      }
    }

    return { result: null }
  } catch (error) {
    const providerError: ProviderError = {
      provider: 'jupiter',
      url: 'https://quote-api.jup.ag/v6/quote',
      error: error instanceof Error ? error.message : String(error),
    }
    
    if (isDev) {
      console.error('[quote] Jupiter error:', providerError)
    }
    
    return { result: null, error: providerError }
  }
}

/**
 * Try TON API for TON quotes
 * Supports TON → Jetton or Jetton → Jetton swaps
 * Uses TON_API_KEY from environment
 */
async function tryTonQuote(
  fromToken: string, // TON address or Jetton contract address
  toToken: string, // TON address or Jetton contract address
  amountBase: string
): Promise<{ result: QuoteResponse | null; error?: ProviderError }> {
  const apiKey = getEnvWithDefault('TON_API_KEY', '')
  
  if (!apiKey) {
    if (isDev) {
      console.warn('[quote] TON_API_KEY not set, skipping TON quotes')
    }
    return { result: null }
  }

  try {
    // TON API endpoint for quotes/rates
    // Note: This is a placeholder implementation - adjust endpoint based on actual TON API docs
    const url = `https://tonapi.io/v2/rates?tokens=${fromToken},${toToken}`
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      const error: ProviderError = {
        provider: 'tonapi',
        status: response.status,
        statusText: response.statusText,
        url,
        request: { fromToken, toToken, amountBase },
        error: errorText,
      }
      
      if (isDev) {
        console.error(`[quote] TON API failed:`, error)
      }
      
      return { result: null, error }
    }

    const data = await response.json()

    // Parse TON API response (adjust based on actual API response format)
    // This is a placeholder - implement based on actual TON API documentation
    if (data.rates && data.rates[fromToken] && data.rates[toToken]) {
      const fromRate = parseFloat(data.rates[fromToken].prices?.USD || '0')
      const toRate = parseFloat(data.rates[toToken].prices?.USD || '0')
      
      if (fromRate > 0 && toRate > 0) {
        const fromAmount = parseFloat(amountBase) / 1e9 // TON uses 9 decimals
        const outAmount = (fromAmount * fromRate) / toRate
        const outAmountBase = Math.floor(outAmount * 1e9).toString()

        return {
          result: {
            ok: true,
            provider: 'tonapi',
            fromToken,
            toToken,
            inAmount: amountBase,
            outAmountBase,
            route: data,
          },
        }
      }
    }

    // If exact routing unavailable, return ADAPTER_MISSING for structured handling
    return {
      result: {
        ok: false,
        error: 'TON quote adapter not available',
        errorCode: 'ADAPTER_MISSING',
      },
    }
  } catch (error) {
    const providerError: ProviderError = {
      provider: 'tonapi',
      url: 'https://tonapi.io/v2/rates',
      error: error instanceof Error ? error.message : String(error),
    }
    
    if (isDev) {
      console.error('[quote] TON API error:', providerError)
    }
    
    return { result: null, error: providerError }
  }
}

export async function POST(request: NextRequest) {
  // Guard request.json() to prevent "Unexpected end of JSON input" crashes
  let body: QuoteRequest
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: 'Invalid request body (JSON parse failed)',
      errorCode: 'INVALID_BODY',
    } as QuoteResponse, { status: 400 })
  }
  
  try {

    // Get user address and determine if indicative quote
    let userAddress = PLACEHOLDER_EOA
    if (body.userAddress) {
      // Basic EVM address validation
      if (/^0x[a-fA-F0-9]{40}$/.test(body.userAddress)) {
        userAddress = body.userAddress
      } else if (isDev) {
        console.warn('[quote] Invalid userAddress format, using placeholder:', body.userAddress)
      }
    }
    const isIndicative = userAddress === PLACEHOLDER_EOA

    // Validation
    if (!body.amount || parseFloat(body.amount) <= 0) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid amount',
        errorCode: 'INVALID_AMOUNT',
      } as QuoteResponse)
    }

    // EVM-only mode: enforce EVM chains only
    const fromChainId = getChainId(body.fromNetworkId)
    const toChainId = getChainId(body.toNetworkId)
    
    // Validate both chains are EVM and have valid chain IDs
    if (!fromChainId || !toChainId) {
      return NextResponse.json({
        ok: false,
        error: 'EVM-only build: unsupported network',
        errorCode: 'UNSUPPORTED_NETWORK',
        debug: {
          fromNetworkId: body.fromNetworkId,
          toNetworkId: body.toNetworkId,
          fromChainId,
          toChainId,
        },
        requestId: body.requestId,
      } as QuoteResponse, { status: 400 })
    }
    
    // Validate chain IDs are in allowlist
    if (!EVM_CHAIN_IDS.has(fromChainId) || !EVM_CHAIN_IDS.has(toChainId)) {
      return NextResponse.json({
        ok: false,
        error: 'EVM-only build: unsupported network',
        errorCode: 'UNSUPPORTED_NETWORK',
        debug: {
          fromNetworkId: body.fromNetworkId,
          toNetworkId: body.toNetworkId,
          fromChainId,
          toChainId,
          allowedChainIds: Array.from(EVM_CHAIN_IDS),
        },
        requestId: body.requestId,
      } as QuoteResponse, { status: 400 })
    }
    
    // Validate both networks are EVM
    if (!isEVM(body.fromNetworkId) || !isEVM(body.toNetworkId)) {
      return NextResponse.json({
        ok: false,
        error: 'EVM-only mode enabled. Non-EVM networks are not supported.',
        errorCode: 'EVM_ONLY',
        debug: {
          fromNetworkId: body.fromNetworkId,
          toNetworkId: body.toNetworkId,
        },
        requestId: body.requestId,
      } as QuoteResponse, { status: 400 })
    }

    // Validate tokens exist on their networks
    const fromTokenValidation = validateTokenForNetwork(body.fromTokenId, body.fromNetworkId, fromChainId)
    const toTokenValidation = validateTokenForNetwork(body.toTokenId, body.toNetworkId, toChainId)

    if (!fromTokenValidation.valid) {
      return NextResponse.json({
        ok: false,
        error: fromTokenValidation.error || 'Invalid from token',
        errorCode: 'INVALID_FROM_TOKEN',
        debug: {
          fromTokenId: body.fromTokenId,
          fromNetworkId: body.fromNetworkId,
          fromChainId,
        },
      } as QuoteResponse)
    }

    if (!toTokenValidation.valid) {
      return NextResponse.json({
        ok: false,
        error: toTokenValidation.error || 'Invalid to token',
        errorCode: 'INVALID_TO_TOKEN',
        debug: {
          toTokenId: body.toTokenId,
          toNetworkId: body.toNetworkId,
          toChainId,
        },
      } as QuoteResponse)
    }

    const fromToken = getTokenInfo(body.fromTokenId)
    const toToken = getTokenInfo(body.toTokenId)

    if (!fromToken || !toToken) {
      return NextResponse.json({
        ok: false,
        error: `Unsupported token: ${body.fromTokenId} or ${body.toTokenId}`,
        errorCode: 'UNSUPPORTED_TOKEN',
        debug: {
          fromTokenId: body.fromTokenId,
          toTokenId: body.toTokenId,
        },
        requestId: body.requestId,
      } as QuoteResponse)
    }

    // Get token addresses (needed for providers and price fallback)
    const fromTokenAddress = getTokenAddress(body.fromTokenId, fromChainId)
    const toTokenAddress = getTokenAddress(body.toTokenId, toChainId)
    
    // Strict token address mapping validation (2.1)
    // EVM-only mode: both chains are EVM with valid chain IDs
    const fromIsNative = fromTokenAddress === null
    const toIsNative = toTokenAddress === null

    // Validate token address mapping
    const fromAddressValidation = validateTokenAddressMapping(
      body.fromTokenId,
      fromToken.symbol,
      fromChainId,
      fromTokenAddress,
      fromIsNative
    )
    
    if (!fromAddressValidation.valid) {
      if (isDev) {
        console.error('[quote] Token address mapping bug (from):', fromAddressValidation.debug)
      }
      return NextResponse.json({
        ok: false,
        error: fromAddressValidation.error || 'Token address mapping error',
        errorCode: 'TOKEN_ADDRESS_MAPPING_BUG',
        debug: fromAddressValidation.debug,
        requestId: body.requestId,
      } as QuoteResponse)
    }

    const toAddressValidation = validateTokenAddressMapping(
      body.toTokenId,
      toToken.symbol,
      toChainId,
      toTokenAddress,
      toIsNative
    )
    
    if (!toAddressValidation.valid) {
      if (isDev) {
        console.error('[quote] Token address mapping bug (to):', toAddressValidation.debug)
      }
      return NextResponse.json({
        ok: false,
        error: toAddressValidation.error || 'Token address mapping error',
        errorCode: 'TOKEN_ADDRESS_MAPPING_BUG',
        debug: toAddressValidation.debug,
        requestId: body.requestId,
      } as QuoteResponse)
    }

    // Decimals source of truth - use getTokenDecimals to support per-chain overrides
    const fromTokenDecimals = getTokenDecimals(body.fromTokenId, fromChainId) ?? fromToken.decimals
    const toTokenDecimals = getTokenDecimals(body.toTokenId, toChainId) ?? toToken.decimals
    
    // Runtime assertion: BNB USDT must be 18 decimals (critical fix for cosmic numbers)
    if (body.fromTokenId === 'usdt' && fromChainId === 56) {
      const tokenAddress = getTokenAddress(body.fromTokenId, fromChainId)
      if (fromTokenDecimals !== 18) {
        const errorMsg = `CRITICAL: USDT on BNB Chain (chainId=56, address=${tokenAddress}) must have 18 decimals, got ${fromTokenDecimals}. This causes cosmic numbers in quotes.`
        console.error(`[quote] ${errorMsg}`)
        return NextResponse.json({
          ok: false,
          error: errorMsg,
          errorCode: 'TOKEN_DECIMALS_MISMATCH',
          requestId: body.requestId,
        } as QuoteResponse, { status: 500 })
      }
    }
    if (body.toTokenId === 'usdt' && toChainId === 56) {
      const tokenAddress = getTokenAddress(body.toTokenId, toChainId)
      if (toTokenDecimals !== 18) {
        const errorMsg = `CRITICAL: USDT on BNB Chain (chainId=56, address=${tokenAddress}) must have 18 decimals, got ${toTokenDecimals}. This causes cosmic numbers in quotes.`
        console.error(`[quote] ${errorMsg}`)
        return NextResponse.json({
          ok: false,
          error: errorMsg,
          errorCode: 'TOKEN_DECIMALS_MISMATCH',
          requestId: body.requestId,
        } as QuoteResponse, { status: 500 })
      }
    }

    // Convert amount to base units using registry decimals
    const amountBase = toBaseUnits(body.amount, fromTokenDecimals)

    // Get provider token addresses for cache key
    const relayFromToken = getProviderTokenAddress(body.fromTokenId, fromChainId, 'relay')
    const relayToToken = getProviderTokenAddress(body.toTokenId, toChainId, 'relay')

    // Build coalescing key
    const coalesceKey = JSON.stringify({
      fromChainId,
      toChainId,
      fromTokenId: body.fromTokenId,
      toTokenId: body.toTokenId,
      amountBase,
      userAddress: userAddress || null,
      isIndicative: !!isIndicative,
    })
    
    const shouldBypassCache = RELAY_DEBUG
    
    // Check cache first (bypass cache for Relay when RELAY_DEBUG is enabled)
    const cached = shouldBypassCache ? null : cacheGet(responseCache, coalesceKey)
    if (cached) {
      if (isDev) {
        console.log('[quote] Returning cached response')
      }
      return NextResponse.json(cached)
    }
    
    // Use coalesce to wrap provider execution
    const result = await coalesce(coalesceKey, async (): Promise<QuoteResponse> => {
      // EVM-only mode: compatible providers are always EVM
      // Get enabled new providers from adapter registry (exclude existing ones handled directly)
      const enabledNewProviders = getEnabledProviders().filter(p => 
        !['relay', 'lifi', '0x'].includes(p.name.toLowerCase())
      )
      const compatibleProviders: string[] = ['relay', 'lifi', '0x', ...enabledNewProviders.map(p => p.name.toLowerCase())]

      // Single line log per request (reduced spam)
      const DEBUG_QUOTES = process.env.DEBUG_QUOTES === '1'
      if (DEBUG_QUOTES) {
        console.log(`[quote] requestId=${body.requestId || 'none'} from=${body.fromNetworkId}/${body.fromTokenId} to=${body.toNetworkId}/${body.toTokenId} amount=${body.amount} providers=${compatibleProviders.join(',')} isIndicative=${isIndicative}`)
      }

      // Track provider errors for debugging
      const providerErrors: ProviderError[] = []

      // Prepare provider promises with metadata for priority ordering - run all providers in parallel
      type ProviderPromiseWithMeta = Promise<{ result: QuoteResponse | null; error?: ProviderError; isIndicative?: boolean; provider: string }>
      const providerPromises: { promise: ProviderPromiseWithMeta; priority: number; provider: string }[] = []

      // Relay provider (priority 1 - highest)
      const relayPromise = tryRelay(fromChainId, toChainId, relayFromToken, relayToToken, amountBase, userAddress, body.fromTokenId, body.toTokenId)
      .then((result) => ({ ...result, provider: 'relay' }))
      .catch((error) => {
        if (error instanceof Error && !error.message.startsWith('WETH_NOT_AVAILABLE:')) {
          if (DEBUG_QUOTES) {
            console.warn('[quote] Relay promise rejected:', error.message)
          }
        }
        return { result: null, error: { provider: 'relay', error: error instanceof Error ? error.message : String(error) }, provider: 'relay' }
      })
    providerPromises.push({ promise: relayPromise, priority: 1, provider: 'relay' })

      // LiFi provider (priority 2)
      // Skip LiFi if chains are not supported by LiFi API
      try {
        const lifiFromToken = getProviderTokenAddress(body.fromTokenId, fromChainId, 'lifi')
        const lifiToToken = getProviderTokenAddress(body.toTokenId, toChainId, 'lifi')
        const lifiPromise = tryLiFi(fromChainId, toChainId, lifiFromToken, lifiToToken, amountBase, userAddress)
          .then((result) => ({ ...result, provider: 'lifi' }))
          .catch((error) => {
            if (error instanceof Error && (
              error.message.startsWith('LIFI_UNSUPPORTED_NATIVE:') ||
              error.message.startsWith('LIFI_UNSUPPORTED_CHAIN:')
            )) {
              // Silently skip - chain or native token not supported
              return { result: null, error: { provider: 'lifi', error: error.message }, provider: 'lifi' }
            }
            if (DEBUG_QUOTES) {
              console.warn('[quote] LiFi promise rejected:', error.message)
            }
            return { result: null, error: { provider: 'lifi', error: error instanceof Error ? error.message : String(error) }, provider: 'lifi' }
          })
        providerPromises.push({ promise: lifiPromise, priority: 2, provider: 'lifi' })
      } catch (error) {
        // Skip LiFi if token address resolution fails or chain not supported
        if (error instanceof Error && (
          error.message.startsWith('LIFI_UNSUPPORTED_NATIVE:') ||
          error.message.startsWith('LIFI_UNSUPPORTED_CHAIN:')
        )) {
          // Silently skip - don't add to promises
          if (DEBUG_QUOTES) {
            console.log(`[quote] Skipping LiFi - ${error.message}`)
          }
        } else {
          // Re-throw other errors
          throw error
        }
      }

    // 0x provider (same-chain only, priority 3)
    if (fromChainId === toChainId) {
      const oxFromToken = getProviderTokenAddress(body.fromTokenId, fromChainId, '0x')
      const oxToToken = getProviderTokenAddress(body.toTokenId, toChainId, '0x')
      const oxPromise = try0x(fromChainId, toChainId, oxFromToken, oxToToken, amountBase)
        .then((result) => ({ ...result, provider: '0x' }))
        .catch((error) => {
          if (error instanceof Error && error.message.startsWith('WETH_NOT_AVAILABLE:')) {
            if (DEBUG_QUOTES) {
              console.log(`[quote] Skipping 0x - WETH not available on chain ${fromChainId}`)
            }
          } else if (DEBUG_QUOTES) {
            console.warn('[quote] 0x promise rejected:', error.message)
          }
          return { result: null, error: { provider: '0x', error: error instanceof Error ? error.message : String(error) }, provider: '0x' }
        })
      providerPromises.push({ promise: oxPromise, priority: 3, provider: '0x' })
      }

      // New bridge providers (enabled via feature flags)
      const enabledProviders = getEnabledProviders()
      for (const providerAdapter of enabledProviders) {
        const providerId = providerAdapter.name.toLowerCase() as ProviderId
        // Skip existing providers (already handled above)
        if (['relay', 'lifi', 'zerox', '0x'].includes(providerId)) continue
        
        if (!providerAdapter.enabled) continue

        const providerFromToken = getProviderTokenAddress(body.fromTokenId, fromChainId, 'relay') // Use relay format for now (0x000... for native)
        const providerToToken = getProviderTokenAddress(body.toTokenId, toChainId, 'relay')

        const newProviderPromise = quoteFromProvider(providerId, {
          fromChainId,
          toChainId,
          fromTokenAddress: providerFromToken,
          toTokenAddress: providerToToken,
          amountBase,
          userAddress,
          slippageBps: 50, // 0.5% default slippage
        }, 2500) // 2.5 second timeout for other providers (optimized for speed)
          .then(async (adapterResult) => {
            if (adapterResult.error) {
              return { result: null, error: adapterResult.error, provider: providerId }
            }
            if (!adapterResult.result) {
              return { result: null, error: { provider: providerId, error: 'No result from provider' }, provider: providerId }
            }

            // Convert provider QuoteResult to QuoteResponse format
            const quoteResponse = convertProviderQuoteToResponse(
              adapterResult.result,
              providerId,
              fromToken.symbol,
              toToken.symbol,
              amountBase,
              fromTokenDecimals,
              toTokenDecimals,
              body.requestId
            )

            return { result: quoteResponse, provider: providerId, isIndicative: adapterResult.result.isIndicative }
          })
          .catch((error) => {
            if (DEBUG_QUOTES) {
              console.warn(`[quote] ${providerId} promise rejected:`, error.message)
            }
            return { result: null, error: { provider: providerId, error: error instanceof Error ? error.message : String(error) }, provider: providerId }
          })

        providerPromises.push({ 
          promise: newProviderPromise as Promise<{ result: QuoteResponse | null; error?: ProviderError; isIndicative?: boolean; provider: string }>,
          priority: providerAdapter.priority,
          provider: providerId
        })
      }

      // Use Promise.allSettled to run all providers in parallel and collect all results
    const allResults = await Promise.allSettled(providerPromises.map(p => p.promise))

    // Process results: collect errors and find best successful quote (by priority: Relay > LiFi > 0x)
    const successfulQuotes: { result: QuoteResponse; priority: number; provider: string; isIndicative?: boolean }[] = []
    
    for (let i = 0; i < allResults.length; i++) {
      const settled = allResults[i]
      const meta = providerPromises[i]
      
      if (settled.status === 'fulfilled') {
        const providerResult = settled.value
        if (providerResult.error) {
          providerErrors.push(providerResult.error)
        }
        if (providerResult.result?.ok) {
          successfulQuotes.push({
            result: providerResult.result,
            priority: meta.priority,
            provider: meta.provider,
            isIndicative: providerResult.isIndicative,
          })
        }
        } else {
        // Promise rejected - should not happen due to .catch handlers, but handle gracefully
        if (DEBUG_QUOTES) {
          console.warn(`[quote] Provider ${meta.provider} promise rejected:`, settled.reason)
        }
      }
    }

    // Check if this is a same-token swap
    const isSameTokenSwap = fromToken.symbol.toLowerCase() === toToken.symbol.toLowerCase()
    
    // Select best quote by priority (lower priority number = higher priority)
    if (successfulQuotes.length > 0) {
      successfulQuotes.sort((a, b) => a.priority - b.priority)
      
      // Try all quotes until we find a valid one
      for (const bestQuote of successfulQuotes) {
        // Validate and process the quote
        const validated = validateAndProcessQuote(
          { result: bestQuote.result, isIndicative: bestQuote.isIndicative },
          fromToken.symbol,
          toToken.symbol,
          amountBase,
          fromTokenDecimals,
          toTokenDecimals,
          body.requestId
        )

        if (validated.response?.ok) {
          return validated.response
        }

        // If validation failed for same-token swap with suspicious quote, skip to price fallback
        if (isSameTokenSwap && validated.response?.errorCode === 'SUSPICIOUS_QUOTE_HIGH_OUTPUT') {
          console.log('[quote] Same-token swap quote rejected, will use price fallback')
          break // Exit loop and continue to price fallback
        }

        // For other validation failures, try next quote
        // (but continue loop to try other quotes)
      }
      
      // If we reach here and it's not a same-token swap with rejected quote, return last error
      if (!isSameTokenSwap && successfulQuotes.length > 0) {
        // Try to get last validation error for non-same-token swaps
        const lastQuote = successfulQuotes[successfulQuotes.length - 1]
        const lastValidated = validateAndProcessQuote(
          { result: lastQuote.result, isIndicative: lastQuote.isIndicative },
          fromToken.symbol,
          toToken.symbol,
          amountBase,
          fromTokenDecimals,
          toTokenDecimals,
          body.requestId
        )
        if (lastValidated.response) {
          return lastValidated.response
        }
      }
      // For same-token swaps with rejected quotes, fall through to price fallback
    }

      // All EVM providers failed - try to calculate exchange rate from token prices
      console.log('[quote] All providers failed - trying price fallback:', {
        fromChainId,
        toChainId,
        fromTokenId: body.fromTokenId,
        toTokenId: body.toTokenId,
        amountBase,
      })

      // Fallback: calculate exchange rate from token prices (CoinGecko)
      // ALWAYS try price fallback - it's critical for showing prices even when providers fail
      const protocol = request.headers.get('x-forwarded-proto') || 'http'
      const host = request.headers.get('host') || 'localhost:3000'
      const pricesUrl = `${protocol}://${host}/api/token-price?ids=${encodeURIComponent(body.fromTokenId)},${encodeURIComponent(body.toTokenId)}`
      
      try {
        const pricesResponse = await fetchWithTimeout(
          pricesUrl,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          },
          5000 // Increased timeout to allow price API to complete (it needs ~3s for multiple sources)
        )
        
        if (pricesResponse.ok) {
          const pricesData = await pricesResponse.json() as { prices?: Record<string, number> }
          const prices = pricesData.prices || {}
          
          // Check if this is a same-token cross-chain swap (e.g., ETH -> ETH on different chains)
          const isSameTokenSwap = fromToken.symbol.toLowerCase() === toToken.symbol.toLowerCase()
          
          // Try multiple variations of token IDs for better matching
          const fromTokenLower = body.fromTokenId.toLowerCase()
          const toTokenLower = body.toTokenId.toLowerCase()
          
          // Try multiple variations: lowercase, original, uppercase, and also try symbol-based lookup
          const fromPrice = prices[fromTokenLower] || 
                           prices[body.fromTokenId] || 
                           prices[fromTokenLower.toUpperCase()] ||
                           prices[fromToken.symbol.toLowerCase()] ||
                           prices[fromToken.symbol.toUpperCase()] ||
                           prices[fromToken.symbol]
          
          const toPrice = prices[toTokenLower] || 
                         prices[body.toTokenId] || 
                         prices[toTokenLower.toUpperCase()] ||
                         prices[toToken.symbol.toLowerCase()] ||
                         prices[toToken.symbol.toUpperCase()] ||
                         prices[toToken.symbol]
          
          if (fromPrice && toPrice && fromPrice > 0 && toPrice > 0) {
            const inAmount = parseFloat(fromBaseUnits(amountBase, fromTokenDecimals))
            let exchangeRate: number
            let outAmount: number
            
            if (isSameTokenSwap) {
              // For same-token swaps, use 1:1 exchange rate (minus estimated 0.5% bridge fee)
              // This prevents incorrect calculations when prices vary slightly or are fetched incorrectly
              exchangeRate = 0.995 // 99.5% output (0.5% estimated fee)
              outAmount = inAmount * exchangeRate
            } else {
              // For different tokens, calculate based on price ratio
              exchangeRate = fromPrice / toPrice
              outAmount = inAmount * exchangeRate
            }
            
            const outAmountBase = toBaseUnits(outAmount.toString(), toTokenDecimals)
            
            const quoteResponse: QuoteResponse = {
              ok: true,
              provider: 'price-fallback',
              fromChain: fromChainId,
              toChain: toChainId,
              fromToken: fromTokenAddress || '0x0000000000000000000000000000000000000000',
              toToken: toTokenAddress || '0x0000000000000000000000000000000000000000',
              inAmount: amountBase,
              outAmountBase,
              outAmount: fromBaseUnits(outAmountBase, toTokenDecimals),
              isIndicative: true,
              warnings: ['Estimated rate based on market prices. Actual swap may differ due to fees and liquidity.'],
              requestId: body.requestId,
            }
            
            console.log('[quote] Price fallback SUCCESS - returning quote:', {
              fromTokenId: body.fromTokenId,
              toTokenId: body.toTokenId,
              fromTokenSymbol: fromToken.symbol,
              toTokenSymbol: toToken.symbol,
              isSameTokenSwap,
              fromPrice,
              toPrice,
              exchangeRate,
              outAmount,
              outAmountBase,
              outAmountFormatted: quoteResponse.outAmount,
            })
            
            // Return QuoteResponse object (not NextResponse) - it will be wrapped by coalesce
            return quoteResponse
          } else if (isSameTokenSwap) {
            // For same-token swaps, even if prices are missing, use 1:1 rate (minus fees)
            const inAmount = parseFloat(fromBaseUnits(amountBase, fromTokenDecimals))
            const exchangeRate = 0.995 // 99.5% output (0.5% estimated fee)
            const outAmount = inAmount * exchangeRate
            const outAmountBase = toBaseUnits(outAmount.toString(), toTokenDecimals)
            
            console.log('[quote] Price fallback SUCCESS (same-token, no prices):', {
              fromTokenId: body.fromTokenId,
              toTokenId: body.toTokenId,
              fromTokenSymbol: fromToken.symbol,
              toTokenSymbol: toToken.symbol,
              exchangeRate,
              outAmount,
            })
            
            return {
              ok: true,
              provider: 'price-fallback',
              fromChain: fromChainId,
              toChain: toChainId,
              fromToken: fromTokenAddress || '0x0000000000000000000000000000000000000000',
              toToken: toTokenAddress || '0x0000000000000000000000000000000000000000',
              inAmount: amountBase,
              outAmountBase,
              outAmount: fromBaseUnits(outAmountBase, toTokenDecimals),
              isIndicative: true,
              warnings: ['Estimated rate (1:1 minus fees). Actual swap may differ due to fees and liquidity.'],
              requestId: body.requestId,
            } as QuoteResponse
          } else {
            console.error('[quote] Price fallback FAILED - missing prices:', {
              fromTokenId: body.fromTokenId,
              toTokenId: body.toTokenId,
              fromTokenSymbol: fromToken.symbol,
              toTokenSymbol: toToken.symbol,
              isSameTokenSwap,
              fromPrice,
              toPrice,
              availablePrices: Object.keys(prices),
            })
            
            // For different tokens, if we have at least one price, provide a rough estimate
            // This is better than showing "No route"
            if (!isSameTokenSwap && (fromPrice || toPrice)) {
              console.log('[quote] Price fallback - partial prices available, using rough estimate')
              
              // If we only have one price, assume a rough 1:1 ratio as last resort
              // (this is not ideal but better than no route)
              if (fromPrice && !toPrice) {
                // We have fromPrice but not toPrice - assume same value (1:1)
                const inAmount = parseFloat(fromBaseUnits(amountBase, fromTokenDecimals))
                const outAmount = inAmount * 0.9 // Use 0.9 as conservative estimate (10% fee)
                const outAmountBase = toBaseUnits(outAmount.toString(), toTokenDecimals)
                
                return {
                  ok: true,
                  provider: 'price-fallback',
                  fromChain: fromChainId,
                  toChain: toChainId,
                  fromToken: fromTokenAddress || '0x0000000000000000000000000000000000000000',
                  toToken: toTokenAddress || '0x0000000000000000000000000000000000000000',
                  inAmount: amountBase,
                  outAmountBase,
                  outAmount: fromBaseUnits(outAmountBase, toTokenDecimals),
                  isIndicative: true,
                  warnings: ['Rough estimate - price data incomplete. Actual swap may differ significantly.'],
                  requestId: body.requestId,
                } as QuoteResponse
              } else if (!fromPrice && toPrice) {
                // We have toPrice but not fromPrice - assume same value (1:1)
                const inAmount = parseFloat(fromBaseUnits(amountBase, fromTokenDecimals))
                const outAmount = inAmount * 0.9 // Use 0.9 as conservative estimate (10% fee)
                const outAmountBase = toBaseUnits(outAmount.toString(), toTokenDecimals)
                
                return {
                  ok: true,
                  provider: 'price-fallback',
                  fromChain: fromChainId,
                  toChain: toChainId,
                  fromToken: fromTokenAddress || '0x0000000000000000000000000000000000000000',
                  toToken: toTokenAddress || '0x0000000000000000000000000000000000000000',
                  inAmount: amountBase,
                  outAmountBase,
                  outAmount: fromBaseUnits(outAmountBase, toTokenDecimals),
                  isIndicative: true,
                  warnings: ['Rough estimate - price data incomplete. Actual swap may differ significantly.'],
                  requestId: body.requestId,
                } as QuoteResponse
              }
            }
          }
        } else {
          console.error('[quote] Price fallback API error:', pricesResponse.status, pricesResponse.statusText)
        }
      } catch (priceError) {
        // Check if it's a timeout - in that case, try to use cached prices or return error
        if (priceError instanceof Error && priceError.message.includes('timeout')) {
          console.warn('[quote] Price fallback timeout - prices API is slow, consider optimization')
          // Try to get prices directly without timeout (last resort)
          try {
            const pricesResponse = await fetch(pricesUrl, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
            
            if (pricesResponse.ok) {
              const pricesData = await pricesResponse.json() as { prices?: Record<string, number> }
              const prices = pricesData.prices || {}
              
              const isSameTokenSwap = fromToken.symbol.toLowerCase() === toToken.symbol.toLowerCase()
              const fromTokenLower = body.fromTokenId.toLowerCase()
              const toTokenLower = body.toTokenId.toLowerCase()
              const fromPrice = prices[fromTokenLower] || prices[body.fromTokenId] || prices[fromToken.symbol.toLowerCase()]
              const toPrice = prices[toTokenLower] || prices[body.toTokenId] || prices[toToken.symbol.toLowerCase()]
              
              if (fromPrice && toPrice && fromPrice > 0 && toPrice > 0) {
                const inAmount = parseFloat(fromBaseUnits(amountBase, fromTokenDecimals))
                let exchangeRate: number
                let outAmount: number
                
                if (isSameTokenSwap) {
                  exchangeRate = 0.995
                  outAmount = inAmount * exchangeRate
                } else {
                  exchangeRate = fromPrice / toPrice
                  outAmount = inAmount * exchangeRate
                }
                
                const outAmountBase = toBaseUnits(outAmount.toString(), toTokenDecimals)
                
                console.log('[quote] Price fallback SUCCESS (after timeout retry):', {
                  fromTokenId: body.fromTokenId,
                  toTokenId: body.toTokenId,
                  fromPrice,
                  toPrice,
                  exchangeRate,
                  outAmount,
                })
                
                return {
                  ok: true,
                  provider: 'price-fallback',
                  fromChain: fromChainId,
                  toChain: toChainId,
                  fromToken: fromTokenAddress || '0x0000000000000000000000000000000000000000',
                  toToken: toTokenAddress || '0x0000000000000000000000000000000000000000',
                  inAmount: amountBase,
                  outAmountBase,
                  outAmount: fromBaseUnits(outAmountBase, toTokenDecimals),
                  isIndicative: true,
                  warnings: ['Estimated rate based on market prices. Actual swap may differ due to fees and liquidity.'],
                  requestId: body.requestId,
                } as QuoteResponse
              }
            }
          } catch (retryError) {
            console.error('[quote] Price fallback retry also failed:', retryError instanceof Error ? retryError.message : retryError)
          }
        }
        console.error('[quote] Price fallback exception:', priceError instanceof Error ? priceError.message : priceError)
      }

      // If price fallback also failed, return NO_ROUTE
      const noRouteResponse: QuoteResponse = {
        ok: false,
        error: 'No route found',
        errorCode: 'NO_ROUTE',
        debug: {
          fromChainId,
          toChainId,
          fromTokenId: body.fromTokenId,
          toTokenId: body.toTokenId,
          amountBase,
          fromTokenDecimals: fromToken.decimals,
          toTokenDecimals: toToken.decimals,
          compatibleProviders,
          providerErrors: DEBUG_QUOTES ? providerErrors : undefined, // Only include errors when DEBUG_QUOTES
        },
        requestId: body.requestId,
      }
      
      return noRouteResponse
    })
    
    // Cache the result before returning
    if (!RELAY_DEBUG) {
      if (result.ok) {
        cacheSet(responseCache, coalesceKey, result, CACHE_TTL)
      } else if (result.errorCode === 'NO_ROUTE') {
        cacheSet(responseCache, coalesceKey, result, NO_ROUTE_CACHE_TTL)
      }
    }
    
    return NextResponse.json(result)
  } catch (error) {
    if (isDev) {
      console.error('[quote] API error:', error)
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: 'API_ERROR',
        debug: {
          error: error instanceof Error ? error.message : String(error),
        },
      } as QuoteResponse,
      { status: 500 }
    )
  }
}
