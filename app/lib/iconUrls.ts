// CDN icon URLs for networks and tokens
// Using simplr-sh/coin-logos CDN as primary source (16,119+ logos in PNG format)
// Fallback to CoinGecko CDN if simplr-sh doesn't have the logo

const SIMPLR_CDN_BASE = 'https://cdn.jsdelivr.net/gh/simplr-sh/coin-logos/images'

// CoinGecko ID mapping for networks
const NETWORK_COINGECKO_IDS: Record<string, string> = {
  ethereum: 'ethereum',
  bnb: 'binancecoin',
  polygon: 'matic-network',
  avalanche: 'avalanche-2',
  arbitrum: 'arbitrum',
  optimism: 'optimism',
  base: 'base',
  zksync: 'zksync',
  linea: 'linea',
  scroll: 'scroll',
  blast: 'blast',
  gnosis: 'gnosis',
  opbnb: 'opbnb',
  mantle: 'mantle',
  ronin: 'ronin',
  cronos: 'cronos',
  rootstock: 'rootstock',
  sonic: 'sonic',
  core: 'coredaoorg',
  kava: 'kava',
  plasma: 'plasma',
  pulsechain: 'pulsechain',
  berachain: 'berachain',
  plume: 'plume',
  'immutable-x': 'immutable-x',
  'world-chain': 'worldcoin-wld',
  goat: 'goat',
  merlin: 'merlin',
  abstract: 'abstract',
  katana: 'katana',
}

// CoinGecko ID mapping for tokens
const TOKEN_COINGECKO_IDS: Record<string, string> = {
  usdc: 'usd-coin',
  'usdt-ethereum': 'tether',
  'usdt-bnb': 'tether',
  dai: 'dai',
  eth: 'ethereum',
  bnb: 'binancecoin',
  matic: 'matic-network',
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
  'matic-erc20': 'matic-network',
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

// Fallback URLs from CoinGecko CDN (used if simplr-sh doesn't have the logo)
const NETWORK_FALLBACK_URLS: Record<string, string> = {
  ethereum: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  bnb: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  polygon: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
  avalanche: 'https://assets.coingecko.com/coins/images/15085/large/avalanche.png',
  arbitrum: 'https://assets.coingecko.com/coins/images/16547/large/Arbitrum.png',
  optimism: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png',
  base: 'https://assets.coingecko.com/asset_platforms/images/8453/large/base.png',
  zksync: 'https://assets.coingecko.com/asset_platforms/images/324/large/zksync.png',
  linea: 'https://assets.coingecko.com/asset_platforms/images/59144/large/linea.png',
  scroll: 'https://assets.coingecko.com/asset_platforms/images/534352/large/scroll.png',
  blast: 'https://assets.coingecko.com/asset_platforms/images/81457/large/blast.png',
  gnosis: 'https://assets.coingecko.com/coins/images/8635/large/gnosis.png',
  opbnb: 'https://assets.coingecko.com/asset_platforms/images/144/small/opbnb.png',
  mantle: 'https://assets.coingecko.com/coins/images/30973/large/Mantle.png',
  ronin: 'https://assets.coingecko.com/coins/images/31289/large/ronin.png',
  cronos: 'https://assets.coingecko.com/coins/images/7310/large/crypto-com-coin.png',
  rootstock: 'https://assets.coingecko.com/coins/images/12948/large/Rootstock.png',
  sonic: 'https://assets.coingecko.com/coins/images/38371/large/sonic.png',
  core: 'https://assets.coingecko.com/coins/images/21369/large/core.png',
  kava: 'https://assets.coingecko.com/coins/images/9761/large/kava.png',
  plasma: 'https://assets.coingecko.com/coins/images/38370/large/plasma.png',
  pulsechain: 'https://assets.coingecko.com/coins/images/24946/large/pulsechain.png',
  berachain: 'https://assets.coingecko.com/coins/images/25235/large/BERA.png',
  plume: 'https://assets.coingecko.com/coins/images/38369/large/plume.png',
  'immutable-x': 'https://assets.coingecko.com/asset_platforms/images/13371/large/immutable-x.png',
  'world-chain': 'https://assets.coingecko.com/coins/images/33904/large/worldcoin-wld.png',
  goat: 'https://assets.coingecko.com/asset_platforms/images/2345/large/goat.png',
  merlin: 'https://assets.coingecko.com/asset_platforms/images/4200/large/merlin.png',
  abstract: 'https://assets.coingecko.com/asset_platforms/images/2741/large/abstract.png',
  katana: 'https://assets.coingecko.com/asset_platforms/images/747474/large/katana.png',
}

const TOKEN_FALLBACK_URLS: Record<string, string> = {
  usdc: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
  'usdt-ethereum': 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
  'usdt-bnb': 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
  dai: 'https://assets.coingecko.com/coins/images/9956/large/4943.png',
  eth: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  bnb: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  matic: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
  avax: 'https://assets.coingecko.com/coins/images/15085/large/avalanche.png',
  cro: 'https://assets.coingecko.com/coins/images/7310/large/cro_token_logo.png',
  mnt: 'https://assets.coingecko.com/coins/images/30973/large/Mantle.png',
  plume: 'https://assets.coingecko.com/coins/images/38369/large/plume.png',
  pls: 'https://assets.coingecko.com/coins/images/24946/large/pulsechain.png',
  bera: 'https://assets.coingecko.com/coins/images/34241/large/bera.png',
  rbtc: 'https://assets.coingecko.com/coins/images/12948/large/Rootstock.png',
  kava: 'https://assets.coingecko.com/coins/images/9761/large/kava.png',
  xpl: 'https://assets.coingecko.com/coins/images/38370/large/plasma.png',
  s: 'https://assets.coingecko.com/coins/images/38371/large/sonic.png',
  core: 'https://assets.coingecko.com/coins/images/21369/large/core.png',
  xdai: 'https://assets.coingecko.com/coins/images/8635/large/gnosis.png',
  ron: 'https://assets.coingecko.com/coins/images/31289/large/ronin.png',
  btc: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  weth: 'https://assets.coingecko.com/coins/images/2518/large/weth.png',
  wbtc: 'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png',
  link: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
  uni: 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png',
  aave: 'https://assets.coingecko.com/coins/images/12645/large/AAVE.png',
  crv: 'https://assets.coingecko.com/coins/images/12124/large/Curve.png',
  mkr: 'https://assets.coingecko.com/coins/images/1364/large/mkr.png',
  snx: 'https://assets.coingecko.com/coins/images/3406/large/SNX.png',
  comp: 'https://assets.coingecko.com/coins/images/10775/large/COMP.png',
  sushi: 'https://assets.coingecko.com/coins/images/12271/large/sushi.png',
  '1inch': 'https://assets.coingecko.com/coins/images/13469/large/1inch.png',
  frax: 'https://assets.coingecko.com/coins/images/13422/large/frax.png',
  fxs: 'https://assets.coingecko.com/coins/images/18023/large/fxs.png',
  ldo: 'https://assets.coingecko.com/coins/images/13573/large/Lido_DAO.png',
  grt: 'https://assets.coingecko.com/coins/images/13397/large/Graph_Token.png',
  arb: 'https://assets.coingecko.com/coins/images/16547/large/Arbitrum.png',
  op: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png',
  'matic-erc20': 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
  velo: 'https://assets.coingecko.com/coins/images/25724/large/velodrome.png',
  aero: 'https://assets.coingecko.com/coins/images/30223/large/aerodrome.png',
  cake: 'https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo.png',
  xvs: 'https://assets.coingecko.com/coins/images/5013/large/venus.png',
  quick: 'https://assets.coingecko.com/coins/images/13970/large/quick.png',
  gmx: 'https://assets.coingecko.com/coins/images/18323/large/arbit.png',
  joe: 'https://assets.coingecko.com/coins/images/15199/large/traderjoe.png',
  qi: 'https://assets.coingecko.com/coins/images/15329/large/qi-dao.png',
  'mnt-token': 'https://assets.coingecko.com/coins/images/30973/large/Mantle.png',
}

// Direct CoinGecko URLs for networks (using URLs found manually)
const NETWORK_DIRECT_URLS: Record<string, string> = {
  goat: 'https://assets.coingecko.com/coins/images/69522/standard/goated.png',
  merlin: 'https://assets.coingecko.com/asset_platforms/images/188/small/merlin-chain.jpeg',
  abstract: 'https://assets.coingecko.com/asset_platforms/images/22196/small/abstract.jpg',
  katana: 'https://assets.coingecko.com/asset_platforms/images/32239/small/katana.jpg',
  berachain: 'https://assets.coingecko.com/coins/images/25235/standard/BERA.png',
  plume: 'https://assets.coingecko.com/coins/images/53623/standard/plume-token.png',
  plasma: 'https://assets.coingecko.com/coins/images/66489/standard/Plasma-symbol-green-1.png',
  sonic: 'https://assets.coingecko.com/coins/images/38108/standard/200x200_Sonic_Logo.png',
  cronos: 'https://assets.coingecko.com/coins/images/7310/standard/cro_token_logo.png',
  opbnb: 'https://assets.coingecko.com/asset_platforms/images/144/small/opbnb.png',
  linea: 'https://assets.coingecko.com/coins/images/68507/standard/linea-logo.jpeg',
}

// Get network icon URL - приоритет: прямые URL, затем simplr-sh CDN, затем fallback
export function getNetworkIconUrl(networkId: string): string | undefined {
  const normalizedId = networkId.toLowerCase()
  
  // 1. Для проблемных сетей используем прямые URL из CoinGecko
  if (NETWORK_DIRECT_URLS[normalizedId]) {
    return NETWORK_DIRECT_URLS[normalizedId]
  }
  
  const coingeckoId = NETWORK_COINGECKO_IDS[normalizedId]
  
  if (coingeckoId) {
    // 2. Используем simplr-sh CDN как основной источник
    return `${SIMPLR_CDN_BASE}/${coingeckoId}/large.png`
  }
  
  // 3. Fallback на CoinGecko CDN если есть
  return NETWORK_FALLBACK_URLS[normalizedId]
}

// Direct CoinGecko URLs for tokens (using URLs found manually)
const TOKEN_DIRECT_URLS: Record<string, string> = {
  joe: 'https://assets.coingecko.com/coins/images/17569/standard/LFJ_JOE_Logo.png',
  s: 'https://assets.coingecko.com/coins/images/38108/standard/200x200_Sonic_Logo.png',
  xpl: 'https://assets.coingecko.com/coins/images/66489/standard/Plasma-symbol-green-1.png',
  bera: 'https://assets.coingecko.com/coins/images/25235/standard/BERA.png',
  plume: 'https://assets.coingecko.com/coins/images/53623/standard/plume-token.png',
  cro: 'https://assets.coingecko.com/coins/images/7310/standard/cro_token_logo.png',
}

// Get token icon URL - приоритет: прямые URL, затем simplr-sh CDN, затем fallback
export function getTokenIconUrl(tokenId: string): string | undefined {
  const normalizedId = tokenId.toLowerCase()
  
  // 1. Для проблемных токенов используем прямые URL из CoinGecko
  if (TOKEN_DIRECT_URLS[normalizedId]) {
    return TOKEN_DIRECT_URLS[normalizedId]
  }
  
  const coingeckoId = TOKEN_COINGECKO_IDS[normalizedId]
  
  if (coingeckoId) {
    // 2. Используем simplr-sh CDN как основной источник
    return `${SIMPLR_CDN_BASE}/${coingeckoId}/large.png`
  }
  
  // 3. Fallback на CoinGecko CDN если есть
  return TOKEN_FALLBACK_URLS[normalizedId]
}
