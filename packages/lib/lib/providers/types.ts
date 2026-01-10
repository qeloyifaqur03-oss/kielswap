/**
 * Provider adapter types for EVM bridge aggregator
 */

export type ProviderId =
  | 'relay'
  | 'lifi'
  | 'zerox'
  | 'stargate'
  | 'hop'
  | 'across'
  | 'synapse'
  | 'cbridge'
  | 'debridge'
  | 'bungee'
  | 'socket'

export interface QuoteInput {
  fromChainId: number
  toChainId: number
  fromTokenAddress: string // Token contract address or '0x000...0000' for native
  toTokenAddress: string // Token contract address or '0x000...0000' for native
  amountBase: string // Amount in base units (wei, etc.)
  userAddress: string // User's wallet address (EOA)
  slippageBps?: number // Optional slippage tolerance in basis points (e.g., 50 = 0.5%)
}

export interface RouteStep {
  provider: ProviderId
  fromChainId: number
  toChainId: number
  fromTokenAddress: string
  toTokenAddress: string
  estimatedTime?: number // Estimated time in seconds
}

export interface FeeBreakdown {
  type: string // e.g., 'bridge', 'gas', 'protocol'
  amount: string // Fee amount in base units
  tokenAddress: string // Token address for fee
  usdValue?: string // Optional USD value
}

export interface QuoteResult {
  provider: ProviderId
  fromAmount: string // Input amount in base units
  toAmount: string // Output amount in base units (what user receives)
  fees: FeeBreakdown[] // Fee breakdown
  routeSteps: RouteStep[] // Route steps (usually single step for direct bridges)
  tx?: {
    to: string // Contract address to call
    data: string // Transaction data
    value?: string // Native token value (for native token swaps)
    gasLimit?: string // Estimated gas limit
  }
  meta?: Record<string, unknown> // Provider-specific metadata
  latencyMs: number // Response latency in milliseconds
  isIndicative: boolean // Whether quote is indicative (wallet not connected) or executable
}

export interface ProviderError {
  provider: ProviderId
  error: string
  errorCode?: string
  status?: number
  statusText?: string
  url?: string
  request?: unknown
}

