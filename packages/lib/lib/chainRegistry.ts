/**
 * Chain registry with family classification and token identifier types
 */

export type NetworkFamily =
  | 'EVM'
  | 'TON'
  | 'TRON'
  | 'SOLANA'
  | 'SUI'
  | 'APTOS'
  | 'COSMOS'
  | 'STELLAR'
  | 'HEDERA'
  | 'BITCOIN'
  | 'UNKNOWN'

export type TokenIdKind =
  | 'evmAddress'
  | 'tonJetton'
  | 'tronTrc20'
  | 'solMint'
  | 'moveType'
  | 'denom'
  | 'stellarAsset'
  | 'hederaId'
  | 'other'

export type WalletKind = 'evm' | 'ton' | 'tron' | 'solana' | 'sui' | 'aptos' | 'cosmos' | 'stellar' | 'hedera'

export interface ChainInfo {
  networkId: string
  family: NetworkFamily
  chainId: number | null // EVM chainId, or null for non-EVM
  altChainId?: string | number // TON workchain, TRON internal ID, etc.
  nativeTokenSymbol: string
  tokenIdKind: TokenIdKind
  walletKinds: WalletKind[]
}

/**
 * Chain registry mapping networkId to chain metadata
 */
export const CHAIN_REGISTRY: Record<string, ChainInfo> = {
  // EVM chains
  ethereum: {
    networkId: 'ethereum',
    family: 'EVM',
    chainId: 1,
    nativeTokenSymbol: 'ETH',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  base: {
    networkId: 'base',
    family: 'EVM',
    chainId: 8453,
    nativeTokenSymbol: 'ETH',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  bnb: {
    networkId: 'bnb',
    family: 'EVM',
    chainId: 56,
    nativeTokenSymbol: 'BNB',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  polygon: {
    networkId: 'polygon',
    family: 'EVM',
    chainId: 137,
    nativeTokenSymbol: 'MATIC',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  arbitrum: {
    networkId: 'arbitrum',
    family: 'EVM',
    chainId: 42161,
    nativeTokenSymbol: 'ETH',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  optimism: {
    networkId: 'optimism',
    family: 'EVM',
    chainId: 10,
    nativeTokenSymbol: 'ETH',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  avalanche: {
    networkId: 'avalanche',
    family: 'EVM',
    chainId: 43114,
    nativeTokenSymbol: 'AVAX',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  celo: {
    networkId: 'celo',
    family: 'EVM',
    chainId: 42220,
    nativeTokenSymbol: 'CELO',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  zksync: {
    networkId: 'zksync',
    family: 'EVM',
    chainId: 324,
    nativeTokenSymbol: 'ETH',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  linea: {
    networkId: 'linea',
    family: 'EVM',
    chainId: 59144,
    nativeTokenSymbol: 'ETH',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  scroll: {
    networkId: 'scroll',
    family: 'EVM',
    chainId: 534352,
    nativeTokenSymbol: 'ETH',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  gnosis: {
    networkId: 'gnosis',
    family: 'EVM',
    chainId: 100,
    nativeTokenSymbol: 'XDAI',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  opbnb: {
    networkId: 'opbnb',
    family: 'EVM',
    chainId: 204,
    nativeTokenSymbol: 'BNB',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  mantle: {
    networkId: 'mantle',
    family: 'EVM',
    chainId: 5000,
    nativeTokenSymbol: 'MNT',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  ronin: {
    networkId: 'ronin',
    family: 'EVM',
    chainId: 2020,
    nativeTokenSymbol: 'RON',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  cronos: {
    networkId: 'cronos',
    family: 'EVM',
    chainId: 25,
    nativeTokenSymbol: 'CRO',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  rootstock: {
    networkId: 'rootstock',
    family: 'EVM',
    chainId: 30,
    nativeTokenSymbol: 'RBTC',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  sonic: {
    networkId: 'sonic',
    family: 'EVM',
    chainId: 146,
    nativeTokenSymbol: 'S',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  core: {
    networkId: 'core',
    family: 'EVM',
    chainId: 1116,
    nativeTokenSymbol: 'CORE',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  kava: {
    networkId: 'kava',
    family: 'EVM',
    chainId: 2222,
    nativeTokenSymbol: 'KAVA',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  plasma: {
    networkId: 'plasma',
    family: 'EVM',
    chainId: 9745,
    nativeTokenSymbol: 'XPL',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  pulsechain: {
    networkId: 'pulsechain',
    family: 'EVM',
    chainId: 369,
    nativeTokenSymbol: 'PLS',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  berachain: {
    networkId: 'berachain',
    family: 'EVM',
    chainId: 80094,
    nativeTokenSymbol: 'BERA',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  bera: {
    networkId: 'bera',
    family: 'EVM',
    chainId: 80094,
    nativeTokenSymbol: 'BERA',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  plume: {
    networkId: 'plume',
    family: 'EVM',
    chainId: 98866,
    nativeTokenSymbol: 'PLUME',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  'immutable x': {
    networkId: 'immutable x',
    family: 'EVM',
    chainId: 13371,
    nativeTokenSymbol: 'ETH',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  'immutable-zkevm': {
    networkId: 'immutable-zkevm',
    family: 'EVM',
    chainId: 13371,
    nativeTokenSymbol: 'ETH',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  'world (chain)': {
    networkId: 'world (chain)',
    family: 'EVM',
    chainId: 480,
    nativeTokenSymbol: 'ETH',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  'world-chain': {
    networkId: 'world-chain',
    family: 'EVM',
    chainId: 480,
    nativeTokenSymbol: 'ETH',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  goat: {
    networkId: 'goat',
    family: 'EVM',
    chainId: 4200,
    nativeTokenSymbol: 'BTC',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  merlin: {
    networkId: 'merlin',
    family: 'EVM',
    chainId: 4200,
    nativeTokenSymbol: 'BTC',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  katana: {
    networkId: 'katana',
    family: 'EVM',
    chainId: 747474,
    nativeTokenSymbol: 'ETH',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  ink: {
    networkId: 'ink',
    family: 'EVM',
    chainId: 57073,
    nativeTokenSymbol: 'ETH',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  bob: {
    networkId: 'bob',
    family: 'EVM',
    chainId: 60808,
    nativeTokenSymbol: 'ETH',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  'BOB': {
    networkId: 'BOB',
    family: 'EVM',
    chainId: 60808,
    nativeTokenSymbol: 'ETH',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  abstract: {
    networkId: 'abstract',
    family: 'EVM',
    chainId: 2741,
    nativeTokenSymbol: 'ETH',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  monad: {
    networkId: 'monad',
    family: 'EVM',
    chainId: 143,
    nativeTokenSymbol: 'MON',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  eni: {
    networkId: 'eni',
    family: 'EVM',
    chainId: 173,
    nativeTokenSymbol: 'EGAS',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },
  blast: {
    networkId: 'blast',
    family: 'EVM',
    chainId: 81457, // Blast mainnet chainId
    nativeTokenSymbol: 'ETH',
    tokenIdKind: 'evmAddress',
    walletKinds: ['evm'],
  },

  // EVM-only mode: non-EVM chains removed
  // Solana, TON, TRON, SUI, Aptos, etc. are disabled
}

/**
 * Get chain info for a network
 */
export function getChainInfo(networkId: string): ChainInfo | null {
  return CHAIN_REGISTRY[networkId.toLowerCase()] || null
}

/**
 * Get network family
 */
export function getNetworkFamily(networkId: string): NetworkFamily {
  const info = getChainInfo(networkId)
  return info?.family || 'UNKNOWN'
}

/**
 * Check if a network is EVM
 */
export function isEVM(networkId: string): boolean {
  return getNetworkFamily(networkId) === 'EVM'
}

/**
 * Check if two networks are cross-family
 */
export function isCrossFamily(fromNetworkId: string, toNetworkId: string): boolean {
  const fromFamily = getNetworkFamily(fromNetworkId)
  const toFamily = getNetworkFamily(toNetworkId)
  return fromFamily !== toFamily
}

