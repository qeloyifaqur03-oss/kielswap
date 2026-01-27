/**
 * Provider endpoint configuration
 * Explicit URLs for each provider endpoint (no path concatenation)
 */

export interface ProviderEndpoints {
  chainsUrl?: string
  tokensUrl?: string
  poolsUrl?: string
  quoteUrl?: string
  transferUrl?: string
  txUrl?: string
  submitUrl?: string
  limitsUrl?: string
  prepareUrl?: string
  estimateUrl?: string
  bridgeUrl?: string
  destinationTokensUrl?: string
  bridgeLimitsUrl?: string
  bridgeTxStatusUrl?: string
  supportedChainsUrl?: string
  tokensListUrl?: string
  tokensSearchUrl?: string
  buildTxUrl?: string
  statusUrl?: string
}

/**
 * Get provider endpoints with explicit URLs
 */
export function getProviderEndpoints(provider: string): ProviderEndpoints {
  const baseUrls: Record<string, string> = {
    stargate: process.env.STARGATE_BASE_URL || 'https://api.stargate.finance/v1',
    hop: process.env.HOP_BASE_URL || 'https://api.hop.exchange/v1',
    across: process.env.ACROSS_BASE_URL || 'https://api.across.to/v1',
    synapse: process.env.SYNAPSE_BASE_URL || 'https://api.synapseprotocol.com',
    cbridge: process.env.CBRIDGE_BASE_URL || 'https://api.cbridge.celer.network/v1',
    debridge: process.env.DEBRIDGE_BASE_URL || 'https://api.debridge.finance/api/v2',
    bungee: process.env.BUNGEE_BASE_URL || 'https://public-backend.bungee.exchange/api/v1',
  }

  const baseUrl = baseUrls[provider.toLowerCase()] || ''

  switch (provider.toLowerCase()) {
    case 'stargate':
      return {
        chainsUrl: 'https://api.stargate.finance/v1/chains',
        tokensUrl: 'https://api.stargate.finance/v1/tokens',
        poolsUrl: 'https://api.stargate.finance/v1/pools',
        quoteUrl: 'https://api.stargate.finance/v1/quote',
        transferUrl: 'https://api.stargate.finance/v1/transfer',
      }
    case 'hop':
      return {
        chainsUrl: 'https://api.hop.exchange/v1/chains',
        tokensUrl: 'https://api.hop.exchange/v1/tokens',
        poolsUrl: 'https://api.hop.exchange/v1/pools',
        quoteUrl: 'https://api.hop.exchange/v1/quote',
        txUrl: 'https://api.hop.exchange/v1/tx',
      }
    case 'across':
      return {
        chainsUrl: 'https://api.across.to/v1/chains',
        tokensUrl: 'https://api.across.to/v1/tokens',
        poolsUrl: 'https://api.across.to/v1/pools',
        quoteUrl: 'https://api.across.to/v1/quote',
        txUrl: 'https://api.across.to/v1/tx',
      }
    case 'synapse':
      return {
        bridgeUrl: 'https://api.synapseprotocol.com/bridge',
        destinationTokensUrl: 'https://api.synapseprotocol.com/destinationTokens',
        bridgeLimitsUrl: 'https://api.synapseprotocol.com/bridgeLimits',
        bridgeTxStatusUrl: 'https://api.synapseprotocol.com/bridgeTxStatus',
      }
    case 'cbridge':
      return {
        chainsUrl: 'https://api.cbridge.celer.network/v1/chains',
        tokensUrl: 'https://api.cbridge.celer.network/v1/tokens',
        quoteUrl: 'https://api.cbridge.celer.network/v1/quote',
        submitUrl: 'https://api.cbridge.celer.network/v1/submit',
        limitsUrl: 'https://api.cbridge.celer.network/v1/limits',
      }
    case 'debridge':
      return {
        chainsUrl: 'https://api.debridge.finance/api/v2/chains',
        tokensUrl: 'https://api.debridge.finance/api/v2/tokens',
        poolsUrl: 'https://api.debridge.finance/api/v2/pools',
        quoteUrl: 'https://api.debridge.finance/api/v2/quote',
        prepareUrl: 'https://api.debridge.finance/api/v2/prepare',
        estimateUrl: 'https://api.debridge.finance/api/v2/estimate',
      }
    case 'bungee':
      return {
        supportedChainsUrl: 'https://public-backend.bungee.exchange/api/v1/supported-chains',
        tokensListUrl: 'https://public-backend.bungee.exchange/api/v1/tokens/list',
        tokensSearchUrl: 'https://public-backend.bungee.exchange/api/v1/tokens/search',
        quoteUrl: 'https://public-backend.bungee.exchange/api/v1/bungee/quote',
        submitUrl: 'https://public-backend.bungee.exchange/api/v1/bungee/submit',
        buildTxUrl: 'https://public-backend.bungee.exchange/api/v1/bungee/build-tx',
        statusUrl: 'https://public-backend.bungee.exchange/api/v1/bungee/status',
      }
    default:
      return {}
  }
}

















