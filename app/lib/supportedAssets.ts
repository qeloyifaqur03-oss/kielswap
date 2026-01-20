
export interface Network {
  id: string
  name: string
  icon?: string
  chainId: number
  nativeToken: string
}

export interface Token {
  id: string
  symbol: string
  name: string
  icon?: string
  networkIds: string[]
  decimals?: number
  coingeckoId?: string // Price identifier for CoinGecko API
  cmcId?: string // Price identifier for CoinMarketCap API (optional)
}

// Network definitions with CDN icon URLs
const NETWORK_DEFINITIONS = [
  { id: 'ethereum', name: 'Ethereum', chainId: 1, nativeToken: 'ETH' },
  { id: 'bnb', name: 'BNB Chain', chainId: 56, nativeToken: 'BNB' },
  { id: 'polygon', name: 'Polygon', chainId: 137, nativeToken: 'MATIC' },
  { id: 'avalanche', name: 'Avalanche', chainId: 43114, nativeToken: 'AVAX' },
  { id: 'arbitrum', name: 'Arbitrum', chainId: 42161, nativeToken: 'ETH' },
  { id: 'optimism', name: 'Optimism', chainId: 10, nativeToken: 'ETH' },
  { id: 'base', name: 'Base', chainId: 8453, nativeToken: 'ETH' },
  { id: 'zksync', name: 'zkSync Era', chainId: 324, nativeToken: 'ETH' },
  { id: 'linea', name: 'Linea', chainId: 59144, nativeToken: 'ETH' },
  { id: 'scroll', name: 'Scroll', chainId: 534352, nativeToken: 'ETH' },
  { id: 'blast', name: 'Blast', chainId: 81457, nativeToken: 'ETH' },
  { id: 'gnosis', name: 'Gnosis', chainId: 100, nativeToken: 'XDAI' },
  { id: 'opbnb', name: 'opBNB', chainId: 204, nativeToken: 'BNB' },
  { id: 'mantle', name: 'Mantle', chainId: 5000, nativeToken: 'MNT' },
  { id: 'ronin', name: 'Ronin', chainId: 2020, nativeToken: 'RON' },
  { id: 'cronos', name: 'Cronos', chainId: 25, nativeToken: 'CRO' },
  { id: 'rootstock', name: 'Rootstock', chainId: 30, nativeToken: 'RBTC' },
  { id: 'sonic', name: 'Sonic', chainId: 146, nativeToken: 'S' },
  { id: 'core', name: 'Core', chainId: 1116, nativeToken: 'CORE' },
  { id: 'kava', name: 'Kava', chainId: 2222, nativeToken: 'KAVA' },
  { id: 'plasma', name: 'Plasma', chainId: 9745, nativeToken: 'XPL' },
  { id: 'pulsechain', name: 'PulseChain', chainId: 369, nativeToken: 'PLS' },
  { id: 'berachain', name: 'Berachain', chainId: 80094, nativeToken: 'BERA' },
  { id: 'plume', name: 'Plume', chainId: 98866, nativeToken: 'PLUME' },
  { id: 'immutable-x', name: 'Immutable zkEVM', chainId: 13371, nativeToken: 'ETH' },
  { id: 'world-chain', name: 'World Chain', chainId: 480, nativeToken: 'ETH' },
  { id: 'goat', name: 'GOAT Network', chainId: 2345, nativeToken: 'BTC' },
  { id: 'merlin', name: 'Merlin', chainId: 4200, nativeToken: 'BTC' },
  { id: 'abstract', name: 'Abstract', chainId: 2741, nativeToken: 'ETH' },
  { id: 'katana', name: 'Katana', chainId: 747474, nativeToken: 'ETH' },
]

import { getNetworkIconUrl, getTokenIconUrl } from './iconUrls'

// CoinGecko ID mapping for tokens (used to populate coingeckoId in tokens)
const TOKEN_COINGECKO_ID_MAP: Record<string, string> = {
  usdc: 'usd-coin',
  'usdt-ethereum': 'tether',
  'usdt-bnb': 'tether',
  dai: 'dai',
  eth: 'ethereum',
  bnb: 'binancecoin',
  matic: 'polygon-ecosystem-token', // CoinGecko ID for Polygon POL token (MATIC migrated to POL in Sep 2024)
  avax: 'avalanche-2',
  cro: 'crypto-com-chain',
  mnt: 'mantle',
  plume: 'plume',
  pls: 'pulsechain',
  bera: 'berachain',
  rbtc: 'rootstock',
  kava: 'kava',
  xpl: 'plasma',
  s: 'sonic',
  core: 'coredaoorg',
  xdai: 'gnosis',
  ron: 'ronin',
  btc: 'bitcoin',
  weth: 'weth',
  wbtc: 'wrapped-bitcoin',
  link: 'chainlink',
  uni: 'uniswap',
  aave: 'aave',
  crv: 'curve-dao-token',
  mkr: 'maker',
  snx: 'havven',
  comp: 'compound-governance-token',
  sushi: 'sushi',
  '1inch': '1inch',
  frax: 'frax',
  fxs: 'frax-share',
  ldo: 'lido-dao',
  grt: 'the-graph',
  arb: 'arbitrum',
  op: 'optimism',
  'matic-erc20': 'polygon-ecosystem-token', // ERC20 version of POL (MATIC migrated to POL)
  velo: 'velodrome-finance',
  aero: 'aerodrome-finance',
  cake: 'pancakeswap-token',
  xvs: 'venus',
  quick: 'quickswap',
  gmx: 'gmx',
  joe: 'trader-joe',
  qi: 'qi-dao',
  'mnt-token': 'mantle',
}

export const SUPPORTED_NETWORKS: Network[] = NETWORK_DEFINITIONS.map(network => ({
  ...network,
  icon: getNetworkIconUrl(network.id),
}))

// Token definitions with CDN icon URLs
const TOKEN_DEFINITIONS = [
  // Stablecoins
  { id: 'usdc', symbol: 'USDC', name: 'USD Coin', networkIds: ['ethereum', 'bnb', 'polygon', 'avalanche', 'arbitrum', 'optimism', 'base', 'zksync', 'linea', 'scroll', 'blast', 'gnosis', 'opbnb', 'mantle', 'ronin', 'cronos', 'rootstock', 'sonic', 'core', 'kava', 'plasma', 'pulsechain', 'berachain', 'plume', 'immutable-x', 'world-chain', 'goat', 'merlin', 'abstract', 'katana'], decimals: 6 },
  // USDT: 6 decimals on most chains, 18 on BNB Chain
  { id: 'usdt-ethereum', symbol: 'USDT', name: 'Tether', networkIds: ['ethereum', 'polygon', 'avalanche', 'arbitrum', 'optimism', 'base', 'zksync', 'linea', 'scroll', 'blast', 'gnosis', 'opbnb', 'mantle', 'ronin', 'cronos', 'rootstock', 'sonic', 'core', 'kava', 'plasma', 'pulsechain', 'berachain', 'plume', 'immutable-x', 'world-chain', 'goat', 'merlin', 'abstract', 'katana'], decimals: 6 },
  { id: 'usdt-bnb', symbol: 'USDT', name: 'Tether', networkIds: ['bnb'], decimals: 18 },
  { id: 'dai', symbol: 'DAI', name: 'Dai Stablecoin', networkIds: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche'], decimals: 18 },
  
  // Native tokens
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', networkIds: ['ethereum', 'arbitrum', 'optimism', 'base', 'zksync', 'linea', 'scroll', 'blast', 'immutable-x', 'world-chain', 'abstract', 'katana'], decimals: 18 },
  { id: 'bnb', symbol: 'BNB', name: 'BNB', networkIds: ['bnb', 'opbnb'], decimals: 18 },
  { id: 'matic', symbol: 'POL', name: 'Polygon', networkIds: ['polygon'], decimals: 18 },
  { id: 'avax', symbol: 'AVAX', name: 'Avalanche', networkIds: ['avalanche'], decimals: 18 },
  { id: 'cro', symbol: 'CRO', name: 'Cronos', networkIds: ['cronos'], decimals: 18 },
  { id: 'mnt', symbol: 'MNT', name: 'Mantle', networkIds: ['mantle'], decimals: 18 },
  { id: 'plume', symbol: 'PLUME', name: 'Plume', networkIds: ['plume'], decimals: 18 },
  { id: 'pls', symbol: 'PLS', name: 'Pulse', networkIds: ['pulsechain'], decimals: 18 },
  { id: 'bera', symbol: 'BERA', name: 'Bera', networkIds: ['berachain'], decimals: 18 },
  { id: 'rbtc', symbol: 'RBTC', name: 'Rootstock', networkIds: ['rootstock'], decimals: 18 },
  { id: 'kava', symbol: 'KAVA', name: 'Kava', networkIds: ['kava'], decimals: 18 },
  { id: 'xpl', symbol: 'XPL', name: 'Plasma', networkIds: ['plasma'], decimals: 18 },
  { id: 's', symbol: 'S', name: 'Sonic', networkIds: ['sonic'], decimals: 18 },
  { id: 'core', symbol: 'CORE', name: 'Core', networkIds: ['core'], decimals: 18 },
  { id: 'xdai', symbol: 'xDAI', name: 'Gnosis', networkIds: ['gnosis'], decimals: 18 },
  { id: 'ron', symbol: 'RON', name: 'Ronin', networkIds: ['ronin'], decimals: 18 },
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', networkIds: ['goat', 'merlin'], decimals: 8 },
  
  // Wrapped tokens
  { id: 'weth', symbol: 'WETH', name: 'Wrapped Ether', networkIds: ['ethereum', 'optimism', 'arbitrum', 'base'], decimals: 18 },
  { id: 'wbtc', symbol: 'WBTC', name: 'Wrapped Bitcoin', networkIds: ['ethereum', 'polygon', 'avalanche', 'arbitrum', 'optimism', 'base', 'zksync', 'linea', 'scroll', 'blast'], decimals: 8 },
  
  // DeFi tokens
  { id: 'link', symbol: 'LINK', name: 'Chainlink', networkIds: ['ethereum', 'polygon', 'avalanche', 'arbitrum', 'optimism', 'base', 'zksync', 'linea', 'scroll'], decimals: 18 },
  { id: 'uni', symbol: 'UNI', name: 'Uniswap', networkIds: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'zksync', 'scroll'], decimals: 18 },
  { id: 'aave', symbol: 'AAVE', name: 'Aave', networkIds: ['ethereum', 'polygon', 'avalanche', 'arbitrum', 'optimism', 'base', 'scroll'], decimals: 18 },
  { id: 'crv', symbol: 'CRV', name: 'Curve DAO Token', networkIds: ['ethereum', 'polygon', 'avalanche', 'arbitrum', 'optimism', 'base'], decimals: 18 },
  { id: 'mkr', symbol: 'MKR', name: 'Maker', networkIds: ['ethereum', 'polygon', 'arbitrum', 'optimism'], decimals: 18 },
  { id: 'snx', symbol: 'SNX', name: 'Synthetix', networkIds: ['ethereum', 'optimism', 'arbitrum', 'base'], decimals: 18 },
  { id: 'comp', symbol: 'COMP', name: 'Compound', networkIds: ['ethereum', 'polygon', 'arbitrum', 'optimism'], decimals: 18 },
  { id: 'sushi', symbol: 'SUSHI', name: 'SushiSwap', networkIds: ['ethereum', 'polygon', 'avalanche', 'arbitrum', 'optimism', 'base', 'scroll'], decimals: 18 },
  { id: '1inch', symbol: '1INCH', name: '1inch', networkIds: ['ethereum', 'polygon', 'avalanche', 'arbitrum', 'optimism', 'base'], decimals: 18 },
  { id: 'frax', symbol: 'FRAX', name: 'Frax', networkIds: ['ethereum', 'polygon', 'avalanche', 'arbitrum', 'optimism', 'base', 'scroll'], decimals: 18 },
  { id: 'fxs', symbol: 'FXS', name: 'Frax Share', networkIds: ['ethereum', 'polygon', 'avalanche', 'arbitrum', 'optimism', 'base'], decimals: 18 },
  { id: 'ldo', symbol: 'LDO', name: 'Lido DAO', networkIds: ['ethereum', 'polygon', 'arbitrum', 'optimism'], decimals: 18 },
  { id: 'grt', symbol: 'GRT', name: 'The Graph', networkIds: ['ethereum', 'polygon', 'avalanche', 'arbitrum', 'optimism'], decimals: 18 },
  
  // Ecosystem tokens
  { id: 'arb', symbol: 'ARB', name: 'Arbitrum', networkIds: ['arbitrum'], decimals: 18 },
  { id: 'op', symbol: 'OP', name: 'Optimism', networkIds: ['optimism'], decimals: 18 },
  { id: 'matic-erc20', symbol: 'POL', name: 'Polygon ERC20', networkIds: ['ethereum', 'optimism', 'arbitrum', 'bnb'], decimals: 18 },
  
  // DEX tokens
  { id: 'velo', symbol: 'VELO', name: 'Velodrome Finance', networkIds: ['optimism', 'base'], decimals: 18 },
  { id: 'aero', symbol: 'AERO', name: 'Aerodrome Finance', networkIds: ['base'], decimals: 18 },
  { id: 'cake', symbol: 'CAKE', name: 'PancakeSwap', networkIds: ['bnb'], decimals: 18 },
  { id: 'xvs', symbol: 'XVS', name: 'Venus', networkIds: ['bnb'], decimals: 18 },
  { id: 'quick', symbol: 'QUICK', name: 'Quickswap', networkIds: ['polygon'], decimals: 18 },
  
  // Other DeFi tokens
  { id: 'gmx', symbol: 'GMX', name: 'GMX', networkIds: ['arbitrum', 'avalanche'], decimals: 18 },
  { id: 'joe', symbol: 'JOE', name: 'Trader Joe', networkIds: ['avalanche', 'arbitrum'], decimals: 18 },
  { id: 'qi', symbol: 'QI', name: 'Qi Dao', networkIds: ['polygon', 'avalanche'], decimals: 18 },
  { id: 'mnt-token', symbol: 'MNT', name: 'Mantle Token', networkIds: ['ethereum'], decimals: 18 },
]

export const SUPPORTED_TOKENS: Token[] = TOKEN_DEFINITIONS.map(token => ({
  ...token,
  icon: getTokenIconUrl(token.id),
  coingeckoId: TOKEN_COINGECKO_ID_MAP[token.id] || undefined,
}))
