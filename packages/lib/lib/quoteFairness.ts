/**
 * Quote fairness checking and normalization
 * Ensures quotes are reasonable compared to market reference prices
 */

export interface ReferencePrice {
  price: number // Price per unit in USD
  timestamp: number // When price was fetched
}

export interface QuoteFairnessResult {
  isFair: boolean
  deviationBps: number // Deviation from reference in basis points
  impliedPrice: number // Price implied by the quote
  referencePrice: number // Market reference price
  thresholdBps: number // Threshold used for comparison
}

/**
 * Get reference price for a token pair
 * Uses /api/token-price endpoint
 */
export async function getReferencePrice(
  fromTokenId: string,
  toTokenId: string
): Promise<ReferencePrice | null> {
  try {
    const response = await fetch(`/api/token-price?ids=${fromTokenId},${toTokenId}`)
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    const prices = data.prices || {}
    
    const fromPrice = prices[fromTokenId.toLowerCase()]
    const toPrice = prices[toTokenId.toLowerCase()]
    
    if (!fromPrice || !toPrice || fromPrice <= 0 || toPrice <= 0) {
      return null
    }
    
    // Calculate exchange rate: how many toToken per fromToken
    const exchangeRate = fromPrice / toPrice
    
    return {
      price: exchangeRate,
      timestamp: Date.now(),
    }
  } catch (error) {
    console.warn('[quoteFairness] Failed to fetch reference price:', error)
    return null
  }
}

/**
 * Check if a quote is fair compared to reference price
 * @param amountIn - Input amount (human-readable)
 * @param amountOut - Output amount (human-readable)
 * @param referencePrice - Reference exchange rate (fromToken/toToken)
 * @param isCrossChain - Whether this is a cross-chain swap
 * @returns Fairness check result
 */
export function checkQuoteFairness(
  amountIn: string,
  amountOut: string,
  referencePrice: number | null,
  isCrossChain: boolean
): QuoteFairnessResult {
  const amountInNum = parseFloat(amountIn)
  const amountOutNum = parseFloat(amountOut)
  
  if (!amountInNum || !amountOutNum || amountInNum <= 0 || amountOutNum <= 0) {
    return {
      isFair: false,
      deviationBps: Infinity,
      impliedPrice: 0,
      referencePrice: referencePrice || 0,
      thresholdBps: isCrossChain ? 1200 : 500,
    }
  }
  
  // Calculate implied price from quote
  const impliedPrice = amountOutNum / amountInNum
  
  // If no reference price, assume fair (can't check)
  if (!referencePrice || referencePrice <= 0) {
    return {
      isFair: true,
      deviationBps: 0,
      impliedPrice,
      referencePrice: 0,
      thresholdBps: isCrossChain ? 1200 : 500,
    }
  }
  
  // Calculate deviation in basis points
  const deviation = Math.abs(impliedPrice - referencePrice) / referencePrice
  const deviationBps = deviation * 10000
  
  // Threshold: 500 bps (5%) for intra-chain, 1200 bps (12%) for cross-chain
  const thresholdBps = isCrossChain ? 1200 : 500
  const isFair = deviationBps <= thresholdBps
  
  return {
    isFair,
    deviationBps,
    impliedPrice,
    referencePrice,
    thresholdBps,
  }
}

/**
 * Calculate dynamic safety margin for guaranteed minimum
 * @param baseBps - Base safety margin (default 100 bps = 1%)
 * @param routeConfidence - Route confidence score (0-1, lower = less confident)
 * @param hasLowLiquidity - Whether route has low liquidity
 * @param isNewNetwork - Whether destination network is new/less tested
 * @returns Safety margin in basis points (capped at 100 bps = 1%)
 */
export function calculateDynamicSafetyBps(
  baseBps: number = 100,
  routeConfidence?: number,
  hasLowLiquidity?: boolean,
  isNewNetwork?: boolean
): number {
  let safetyBps = baseBps
  
  // Add penalty for low confidence
  if (routeConfidence !== undefined && routeConfidence < 0.7) {
    const confidencePenalty = Math.round((0.7 - routeConfidence) * 100) // 0-70 bps
    safetyBps += confidencePenalty
  }
  
  // Add penalty for low liquidity
  if (hasLowLiquidity) {
    safetyBps += 50
  }
  
  // Add penalty for new networks
  if (isNewNetwork) {
    safetyBps += 50
  }
  
  // Cap at 100 bps (1%) - guaranteed minimum is always at least 99% of estimate
  return Math.min(safetyBps, 100)
}

/**
 * Calculate guaranteed minimum from estimated output
 * @param estimatedOut - Estimated output amount (human-readable)
 * @param safetyBps - Safety margin in basis points
 * @returns Guaranteed minimum amount (human-readable)
 */
export function calculateGuaranteedMinimum(
  estimatedOut: string,
  safetyBps: number
): string {
  const estimatedOutNum = parseFloat(estimatedOut)
  if (!estimatedOutNum || estimatedOutNum <= 0) {
    return '0'
  }
  
  // Calculate: minReceive = estimatedOut * (1 - safetyBps / 10000)
  const safetyMultiplier = 1 - (safetyBps / 10000)
  const minReceive = estimatedOutNum * safetyMultiplier
  
  // Ensure minReceive <= estimatedOut
  const finalMinReceive = Math.min(minReceive, estimatedOutNum)
  
  // Format to reasonable precision (6 decimal places max)
  return finalMinReceive.toFixed(6).replace(/\.?0+$/, '')
}

