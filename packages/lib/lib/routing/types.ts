/**
 * Route planning and execution types
 */

export type Family = 'EVM' | 'SOLANA' | 'TRON' | 'TON' | 'UNSUPPORTED'

export type WalletContext = {
  evm?: { address: string }
  solana?: { pubkey: string }
  tron?: { address: string }
  ton?: { address: string }
}

export type StepKind = 'SWAP' | 'BRIDGE' | 'TRANSFER' | 'APPROVE' | 'WRAP' | 'UNWRAP' | 'OFFCHAIN_SWAP'

export interface RouteStep {
  id: string
  kind: StepKind
  from: {
    networkId: string
    chainId?: number | null
    family: Family
    tokenId: string
    tokenAddress: string // Resolved address/mint for the network
  }
  to: {
    networkId: string
    chainId?: number | null
    family: Family
    tokenId: string
    tokenAddress: string // Resolved address/mint for the network
  }
  amountInBase: string
  quote?: any // Provider quote response
  provider: string
  requiresWallet: Family[] // Which wallet signatures are needed
  estimatedOutBase?: string
}

export interface RoutePlan {
  id: string
  steps: RouteStep[]
  totalEstimatedOutBase?: string
  warnings: string[]
  requiresWallets: Family[] // Aggregated list of required wallets
}

export interface ResolvedToken {
  tokenId: string
  symbol: string
  decimals: number
  address: string // Network-specific address (contract, mint, etc.)
  family: Family
}

export interface RoutePlanRequest {
  fromNetworkId: string
  toNetworkId: string
  fromTokenId: string
  toTokenId: string
  amount: string // Human-readable
  wallets: WalletContext
}

export interface RoutePlanResponse {
  ok: boolean
  plan?: RoutePlan
  error?: string
  errorCode?: string
  debug?: any
}



















