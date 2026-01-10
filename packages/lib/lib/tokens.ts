/**
 * Token registry with decimals and contract addresses per chain
 */

export interface TokenInfo {
  id: string
  symbol: string
  name: string
  icon?: string
  decimals: number
  verified: boolean // Whether token is verified/curated
  // Chain ID -> contract address (native tokens use null or 'NATIVE')
  // For EVM: contract address
  // For Solana: mint address
  // For Cosmos: denom
  addresses: Record<string, string | null>
  // Optional: Per-chain decimals override (when chain-specific decimals differ from default)
  chainDecimals?: Record<string, number>
}

/**
 * Token reference - family-specific token identifier
 * Never use 0x000... for non-EVM families
 */
export type TokenRef =
  | { type: 'address'; value: string; family: 'EVM' } // EVM contract address (0x...)
  | { type: 'native'; value: 'native'; family: 'EVM' } // EVM native token (ETH, etc.)
  | { type: 'mint'; value: string; family: 'SOLANA' } // Solana mint address (base58)
  | { type: 'jetton'; value: string; family: 'TON' } // TON Jetton master address (EQ...)
  | { type: 'native'; value: 'TON'; family: 'TON' } // TON native
  | { type: 'trc20'; value: string; family: 'TRON' } // TRON TRC20 contract (T...)
  | { type: 'native'; value: 'TRX'; family: 'TRON' } // TRON native

/**
 * Provider currency/network mapping for cross-family providers
 */
export interface ProviderCurrency {
  currency: string // e.g., 'usdt', 'eth'
  network: string // e.g., 'ton', 'trx', 'eth'
}

// Legacy CHAIN_IDS for backward compatibility (fallback only)
// Prefer using getChainId() which uses the dynamic registry
const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  bnb: 56,
  polygon: 137,
  optimism: 10,
  arbitrum: 42161,
  base: 8453,
  avalanche: 43114,
  celo: 42220,
  zksync: 324,
  linea: 59144,
  scroll: 534352,
  blast: 81457, // Blast mainnet chainId
  gnosis: 100,
  opbnb: 204,
  mantle: 5000,
  cronos: 25,
  rootstock: 30,
  sonic: 146,
  core: 1116,
  ronin: 2020, // Ronin chainId
  kava: 2222,
  plasma: 9745,
  plume: 98866,
  pulsechain: 369,
  berachain: 80094,
  'immutable x': 13371, // Immutable zkEVM
  'immutable-zkevm': 13371,
  'world (chain)': 480, // World Chain
  'world-chain': 480,
  goat: 2345, // GOAT Network
  merlin: 4200, // Merlin Chain
  katana: 747474,
  ink: 57073,
  bob: 60808,
  'BOB': 60808,
  abstract: 2741,
  monad: 143, // Monad Testnet
  bera: 80094, // Berachain (mapped from 'bera' networkId)
  // EVM-only mode: non-EVM chain IDs removed
}

// Token registry with decimals and addresses per chain
export const TOKEN_REGISTRY: TokenInfo[] = [
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    icon: '/chain-logos/ethereum-eth-logo.png',
    decimals: 18,
    verified: true,
    addresses: {
      '1': null, // Native on Ethereum
      '10': null, // Native on Optimism
      '42161': null, // Native on Arbitrum
      '8453': null, // Native on Base
      '324': null, // Native on zkSync
      '59144': null, // Native on Linea
      '534352': null, // Native on Scroll
      '81457': null, // Native on Blast
      '747474': null, // Native on Katana
      '57073': null, // Native on Ink
      '60808': null, // Native on BOB
      '480': null, // Native on World Chain
      '2741': null, // Native on Abstract
      '13371': null, // Native on Immutable zkEVM
    },
  },
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    icon: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1698815413',
    decimals: 6, // USDC is 6 decimals on most chains
    verified: true,
    addresses: {
      '1': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum
      '10': '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // Optimism
      '42161': '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // Arbitrum
      '8453': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
      '137': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon
      '43114': '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // Avalanche
      '56': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // BNB Chain
      '324': '0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4', // zkSync Era
      '59144': '0x176211869cA2b568f2A7D4EE941E073a821EE1ff', // Linea
      '534352': '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4', // Scroll
      '81457': '0x4300000000000000000000000000000000000003', // Blast (USDB)
      '5000': '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9', // Mantle
    },
  },
  {
    id: 'usdt',
    symbol: 'USDT',
    name: 'Tether',
    icon: 'https://assets.coingecko.com/coins/images/325/large/Tether.png?1698815413',
    decimals: 6, // Default: USDT is 6 decimals on most chains
    verified: true,
    addresses: {
      '1': '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Ethereum
      '10': '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // Optimism
      '42161': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // Arbitrum
      '8453': '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', // Base - Note: Verify this address is correct for Base USDT
      '137': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // Polygon
      '43114': '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', // Avalanche
      '56': '0x55d398326f99059fF775485246999027B3197955', // BNB Chain
      '324': '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C', // zkSync Era
      '59144': '0xA219439258ca9da29E9Cc4cE5596924745e12B93', // Linea
      '534352': '0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df', // Scroll
      '5000': '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE', // Mantle
      // EVM-only mode: non-EVM token addresses removed
    },
    // Per-chain decimals override (when chain-specific decimals differ from default)
    chainDecimals: {
      '56': 18, // BNB Chain USDT uses 18 decimals (NOT 6)
      '8453': 6, // Base USDT uses 6 decimals
    },
  },
  // EVM-only mode: TRX token removed
  {
    id: 'dai',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    icon: 'https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png?1698815413',
    decimals: 18,
    verified: true,
    addresses: {
      '1': '0x6B175474E89094C44Da98b954EedeAC495271d0F', // Ethereum
      '10': '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // Optimism
      '42161': '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // Arbitrum
      '8453': '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // Base
      '137': '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', // Polygon
      '59144': '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5', // Linea
    },
  },
  // WETH (Wrapped ETH) - used by some providers (like 0x) for native token swaps
  // Note: For Cronos, the wrapped native token is WCRO (not WETH), but we map it as WETH for compatibility
  {
    id: 'weth',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    icon: '/chain-logos/ethereum-eth-logo.png', // Use ETH icon
    decimals: 18,
    verified: true,
    addresses: {
      '1': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Ethereum
      '10': '0x4200000000000000000000000000000000000006', // Optimism
      '42161': '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // Arbitrum
      '8453': '0x4200000000000000000000000000000000000006', // Base
      '25': '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23', // Cronos - WCRO (wrapped CRO)
    },
  },
  // Native tokens for each EVM network
  {
    id: 'bnb',
    symbol: 'BNB',
    name: 'BNB',
    icon: '/chain-logos/bnb-bnb-logo.png',
    decimals: 18,
    verified: true,
    addresses: {
      '56': null, // Native on BNB Chain
      '204': null, // Native on opBNB
    },
  },
  {
    id: 'matic',
    symbol: 'MATIC',
    name: 'Matic',
    icon: '/chain-logos/polygon-matic-logo.png',
    decimals: 18,
    verified: true,
    addresses: {
      '137': null, // Native on Polygon
    },
  },
  {
    id: 'avax',
    symbol: 'AVAX',
    name: 'Avalanche',
    icon: '/chain-logos/avalanche-avax-logo.png',
    decimals: 18,
    verified: true,
    addresses: {
      '43114': null, // Native on Avalanche
    },
  },
  {
    id: 'cro',
    symbol: 'CRO',
    name: 'Cronos',
    icon: '/chain-logos/cronos.png',
    decimals: 18,
    verified: true,
    addresses: {
      '25': null, // Native on Cronos
    },
  },
  {
    id: 'celo',
    symbol: 'CELO',
    name: 'Celo',
    icon: '/chain-logos/celo-celo-logo.png',
    decimals: 18,
    verified: true,
    addresses: {
      '42220': null, // Native on Celo
    },
  },
  {
    id: 'mnt',
    symbol: 'MNT',
    name: 'Mantle',
    icon: '/chain-logos/mantle.png',
    decimals: 18,
    verified: true,
    addresses: {
      '5000': null, // Native on Mantle
    },
  },
  {
    id: 'plume',
    symbol: 'PLUME',
    name: 'Plume',
    icon: '/chain-logos/plume.png',
    decimals: 18,
    verified: true,
    addresses: {
      '98866': null, // Native on Plume
    },
  },
  {
    id: 'pls',
    symbol: 'PLS',
    name: 'Pulse',
    icon: '/chain-logos/pulsechain.png',
    decimals: 18,
    verified: true,
    addresses: {
      '369': null, // Native on PulseChain
    },
  },
  {
    id: 'bera',
    symbol: 'BERA',
    name: 'Bera',
    icon: '/chain-logos/bera.png',
    decimals: 18,
    verified: true,
    addresses: {
      '80094': null, // Native on Berachain
    },
  },
  {
    id: 'rbtc',
    symbol: 'RBTC',
    name: 'RBTC',
    icon: '/chain-logos/rootstock.png',
    decimals: 18,
    verified: true,
    addresses: {
      '30': null, // Native on Rootstock
    },
  },
  {
    id: 'kava',
    symbol: 'KAVA',
    name: 'Kava',
    icon: '/chain-logos/kava-kava-logo.png',
    decimals: 18,
    verified: true,
    addresses: {
      '2222': null, // Native on Kava
    },
  },
  {
    id: 'xpl',
    symbol: 'XPL',
    name: 'XPL',
    icon: '/chain-logos/plasma.png',
    decimals: 18,
    verified: true,
    addresses: {
      '9745': null, // Native on Plasma
    },
  },
  {
    id: 's',
    symbol: 'S',
    name: 'Sonic',
    icon: '/chain-logos/sonic.png',
    decimals: 18,
    verified: true,
    addresses: {
      '146': null, // Native on Sonic
    },
  },
  {
    id: 'core',
    symbol: 'CORE',
    name: 'Core',
    icon: '/chain-logos/core.png',
    decimals: 18,
    verified: true,
    addresses: {
      '1116': null, // Native on Core
    },
  },
  {
    id: 'xdai',
    symbol: 'xDAI',
    name: 'xDAI',
    icon: '/chain-logos/gnosis-gno-gno-logo.png',
    decimals: 18,
    verified: true,
    addresses: {
      '100': null, // Native on Gnosis
    },
  },
  {
    id: 'ron',
    symbol: 'RON',
    name: 'Ronin',
    icon: '/chain-logos/ronin-ron-logo.png',
    decimals: 18,
    verified: true,
    addresses: {
      '2020': null, // Native on Ronin
    },
  },
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: '/chain-logos/bitcoin-btc-logo.png',
    decimals: 18,
    verified: true,
    addresses: {
      '2345': null, // Native on GOAT Network (BTC)
    },
  },
  // Wrapped Bitcoin (WBTC) - Most liquid wrapped BTC on EVM chains
  {
    id: 'wbtc',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    icon: '/chain-logos/bitcoin-btc-logo.png',
    decimals: 8, // WBTC uses 8 decimals
    verified: true,
    addresses: {
      '1': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // Ethereum
      '10': '0x68f180fcCe6836688e9084f035309E29Bf0A2095', // Optimism
      '42161': '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', // Arbitrum
      '8453': '0x3c3a81e81dc49A522A592e7622A7E711c06bf354', // Base
      '137': '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', // Polygon
      '43114': '0x50b7545627a5162F82A992c33b87aDc75187B218', // Avalanche
      '56': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // BNB Chain
      '324': '0xBBeB516fb02a01611cBBE0453Fe3c580D7281011', // zkSync
      '59144': '0x3aAB2285ddcDdaD8edf438C1bAB47e1a9D05a9b4', // Linea
      '534352': '0x3C1BCa5a656e69edCD0D4E36BBbb3da953b0E44e', // Scroll
    },
  },
  // Chainlink (LINK) - Most liquid oracle token
  {
    id: 'link',
    symbol: 'LINK',
    name: 'Chainlink',
    icon: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png?1698815413',
    decimals: 18,
    verified: true,
    addresses: {
      '1': '0x514910771AF9Ca656af840dff83E8264EcF986CA', // Ethereum
      '10': '0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6', // Optimism
      '42161': '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4', // Arbitrum
      '8453': '0x88DfaAABaf06f3a41D2606EA98BC8edA109AbeBb', // Base
      '137': '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39', // Polygon
      '43114': '0x5947BB275c521040051D82396192181b412227C3', // Avalanche
      '56': '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD', // BNB Chain
      '324': '0xEfC57bD715eFeDbc896C6bFCB2d275F1A65B3D67', // zkSync
      '59144': '0x5B16228B94b68C7cE33AF2ACc5663eBdE4dCFA2d', // Linea
    },
  },
  // Uniswap (UNI) - Most liquid DEX token
  {
    id: 'uni',
    symbol: 'UNI',
    name: 'Uniswap',
    icon: 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png?1698815413',
    decimals: 18,
    verified: true,
    addresses: {
      '1': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // Ethereum
      '10': '0x6fd9d7AD17242c41f7131d257212c54A0e816691', // Optimism
      '42161': '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0', // Arbitrum
      '8453': '0x6cC5F688a315f3dC28A7781717a9A798a59fDA7b', // Base
      '137': '0xb33EaAd8d922B1083446DC23f610c2567fB5180f', // Polygon
      '43114': '0x8eBAf22B6F053dFFeaf46f4Dd9eFA95D89ba8580', // Avalanche
      '56': '0xBf5140A22578168FD562DCcF235E5D43A02ce9B1', // BNB Chain
    },
  },
  // Aave (AAVE) - Most liquid lending token
  {
    id: 'aave',
    symbol: 'AAVE',
    name: 'Aave',
    icon: 'https://assets.coingecko.com/coins/images/12645/large/AAVE.png?1697207847',
    decimals: 18,
    verified: true,
    addresses: {
      '1': '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', // Ethereum
      '10': '0x76FB31fb4af56892A25e32cFC43De717950c9278', // Optimism
      '42161': '0xba5DdD1f9d7F570dc94a51479a000E3BCE967196', // Arbitrum
      '8453': '0xa6B280B42CB0b7c4a4F789eC6cCC3a7609A1Bc39', // Base
      '137': '0xD6DF932A45C0f255f85145f286eA0b292B21C90B', // Polygon
      '43114': '0x63a72806098Bd3D9520cC43356dD78afe5D386D9', // Avalanche
      '56': '0xfb6115445Bff7b52FeB98650C87f44907E58f802', // BNB Chain
    },
  },
  // Curve DAO Token (CRV)
  {
    id: 'crv',
    symbol: 'CRV',
    name: 'Curve DAO Token',
    icon: 'https://assets.coingecko.com/coins/images/12124/large/Curve.png?1698815413',
    decimals: 18,
    verified: true,
    addresses: {
      '1': '0xD533a949740bb3306d119CC777fa900bA034cd52', // Ethereum
      '10': '0x0994206dfE8De6Ec6920FF4D5Bdb2D87B95cF4D9', // Optimism
      '42161': '0x11cDb42B0EB46D95f991Bea4aC86F4E820dF4C5b', // Arbitrum
      '137': '0x172370d5Cd63279eFa6d502DAB29171933a610AF', // Polygon
      '43114': '0x249848BeCA43aC405b8102Ec90Dd5F22CA513c06', // Avalanche
      '56': '0x8Ee73c484A26e0A5df2Ee2a4960B789967dd0415', // BNB Chain
    },
  },
  // Maker (MKR)
  {
    id: 'mkr',
    symbol: 'MKR',
    name: 'Maker',
    icon: 'https://assets.coingecko.com/coins/images/1364/large/maker.png?1698815413',
    decimals: 18,
    verified: true,
    addresses: {
      '1': '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', // Ethereum
      '10': '0xab7bAdEF82E9Fe11f6f33f87BC9bC2AA27F2fCB5', // Optimism
      '42161': '0x2e9a6Df78E42a30712c10a9Dc4b1C8656f8F2879', // Arbitrum
      '137': '0x6f7C932e7684666C9fd2d445a65640Ce4B08c979', // Polygon
    },
  },
  // Synthetix (SNX)
  {
    id: 'snx',
    symbol: 'SNX',
    name: 'Synthetix',
    icon: 'https://assets.coingecko.com/coins/images/3406/large/snx.png?1698815413',
    decimals: 18,
    verified: true,
    addresses: {
      '1': '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F', // Ethereum
      '10': '0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4', // Optimism (main chain)
      '42161': '0xcBA56Cd8216FCBBF3fA6DF6137F3147cBcD37FC9', // Arbitrum
      '137': '0x50B728D8D964fd00C2d0AAD81718b71311feF68a', // Polygon
    },
  },
  // Compound (COMP)
  {
    id: 'comp',
    symbol: 'COMP',
    name: 'Compound',
    icon: 'https://assets.coingecko.com/coins/images/10775/large/COMP.png?1698815413',
    decimals: 18,
    verified: true,
    addresses: {
      '1': '0xc00e94Cb662C3520282E6f5717214004A7f26888', // Ethereum
      '10': '0x0e5c5792aE2e16F9F9a3c6b5f0fA2D9a2a2e3d1e', // Optimism
      '42161': '0x354A6dA3fcde098F8389cad84b0182725c6C91dE', // Arbitrum
      '137': '0x8505b9d2254A7Ae468c0E9dd10Ccea3A837aef5c', // Polygon
    },
  },
  // SushiSwap (SUSHI)
  {
    id: 'sushi',
    symbol: 'SUSHI',
    name: 'SushiSwap',
    icon: 'https://cryptologos.cc/logos/sushiswap-sushi-logo.png',
    decimals: 18,
    verified: true,
    addresses: {
      '1': '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2', // Ethereum
      '10': '0x3eaEb77b03bC0F7497d1611b751Cc40D88d3DED7', // Optimism
      '42161': '0xd4d42F0b6DEF4CE0383636770eF773390d85c61A', // Arbitrum
      '8453': '0x7D49a065D17d6d4a55dC13689901EDd1Fa80e906', // Base
      '137': '0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a', // Polygon
      '43114': '0x37B608519F91f70F2EeB0e5Ed9AF4061722e4F76', // Avalanche
      '56': '0x947950BcC74888a40Ffa2593C5798F11Fc9124C4', // BNB Chain
    },
  },
  // Additional popular tokens
  // 1inch (1INCH)
  {
    id: '1inch',
    symbol: '1INCH',
    name: '1inch',
    icon: 'https://assets.coingecko.com/coins/images/13469/large/1inch-token.png?1698815413',
    decimals: 18,
    verified: true,
    addresses: {
      '1': '0x111111111117dC0aa78b770fA6A738034120C302', // Ethereum
      '10': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // Optimism
      '42161': '0x6314C31A7a1652cE482cffe247E9CB7c3f4BB9aF', // Arbitrum
      '137': '0x9c2C5fd7b07E95EE044DDeba0E97a665F142394f', // Polygon
      '43114': '0xd501281565bf7789224523144Fe5D98e8B28f267', // Avalanche
      '56': '0x111111111117dC0aa78b770fA6A738034120C302', // BNB Chain
    },
  },
  // Frax (FRAX)
  {
    id: 'frax',
    symbol: 'FRAX',
    name: 'Frax',
    icon: 'https://assets.coingecko.com/coins/images/13422/large/FRAX_icon.png?1698815413',
    decimals: 18,
    verified: true,
    addresses: {
      '1': '0x853d955aCEf822Db058eb8505911ED77F175b99e', // Ethereum
      '10': '0x2E3D870790dC77A83DD1d18184Acc7439A53f475', // Optimism
      '42161': '0x17FC002b466eEc40DaE837Fc4bE5c67993ddBd6F', // Arbitrum
      '8453': '0x417Ac0e078398C154EdFadD9Ef675d30Be60Af93', // Base
      '137': '0x45c32fA6DF82ead1e2EF74d17b76547EDdFaFF89', // Polygon
      '43114': '0xD24C2Ad096400B6FBcd2ad8B24E7acBc21A1da64', // Avalanche
      '56': '0x90C97F71E18723b0Cf0dfa30ee176Ab653E89F40', // BNB Chain
    },
  },
  // Frax Share (FXS)
  {
    id: 'fxs',
    symbol: 'FXS',
    name: 'Frax Share',
    icon: 'https://assets.coingecko.com/coins/images/13423/large/frax_share.png?1698815413',
    decimals: 18,
    verified: true,
    addresses: {
      '1': '0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0', // Ethereum
      '10': '0x67CCEA5bb16181E7b4109c9c2143c24a1c2205Be', // Optimism
      '42161': '0xc6fDe3FD2Cc2b173aEC24cc3f267cb3Cd78a26B7', // Arbitrum
      '8453': '0x8a41536C31f52CBFd6df7De0fC958cC06Cb4b9e3', // Base
      '137': '0x1a3acf6D19267E2d3e7f898f42803e90C9219062', // Polygon
      '43114': '0x214DB107654fF987AD859F34125307783fC8e387', // Avalanche
    },
  },
  // Lido DAO (LDO)
  {
    id: 'ldo',
    symbol: 'LDO',
    name: 'Lido DAO',
    icon: 'https://assets.coingecko.com/coins/images/13573/large/Lido_DAO.png?1698815413',
    decimals: 18,
    verified: true,
    addresses: {
      '1': '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32', // Ethereum
      '10': '0xFdb794692724153d1488CcdBE0C56c252596735F', // Optimism
      '42161': '0x13Ad51ed4F1B7e9Dc168d8a00cB3f4dDD85EfA60', // Arbitrum
      '137': '0xC3C7d42280985203b97F4DE73d23548a80206bd5', // Polygon
    },
  },
  // The Graph (GRT)
  {
    id: 'grt',
    symbol: 'GRT',
    name: 'The Graph',
    icon: 'https://assets.coingecko.com/coins/images/13397/large/Graph_Token.png?1698815413',
    decimals: 18,
    verified: true,
    addresses: {
      '1': '0xc944E90C64B2c07662A292be6244BDf05Cda44a7', // Ethereum
      '10': '0x5a7d51Ece858df5E14A906321Ed84986248a1f4f', // Optimism
      '42161': '0x9623063377AD1B27544C965cCd7342f7EA7e88C7', // Arbitrum
      '137': '0x5fe2B58c013d7601147DcdD68C143A77499f5531', // Polygon
      '43114': '0x8a0cAc13c7da965a312f08ea4229c37869e85cB9', // Avalanche
    },
  },
  // Polygon (MATIC) - as ERC20 on other chains
  {
    id: 'matic-erc20',
    symbol: 'MATIC',
    name: 'Matic (ERC20)',
    icon: '/chain-logos/polygon-matic-logo.png',
    decimals: 18,
    verified: true,
    addresses: {
      '1': '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', // Ethereum
      '10': '0x4200000000000000000000000000000000000006', // Optimism (WETH)
      '42161': '0x561877b6b3DD7651313794e5F2894B2F18bE0766', // Arbitrum
      '56': '0xCC42724C6683B7E57334c4E856f4c9965ED682bD', // BNB Chain
    },
  },
  // Arbitrum ecosystem tokens
  {
    id: 'arb',
    symbol: 'ARB',
    name: 'Arbitrum',
    icon: 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg?1698815413',
    decimals: 18,
    verified: true,
    addresses: {
      '42161': null, // Native on Arbitrum
    },
  },
  {
    id: 'gmx',
    symbol: 'GMX',
    name: 'GMX',
    icon: 'https://assets.coingecko.com/coins/images/18323/large/arbit.png?1698815413',
    decimals: 18,
    verified: true,
    addresses: {
      '42161': '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a', // Arbitrum
      '43114': '0x62edc0692BD897D2295872a9FFCac5425011c661', // Avalanche
    },
  },
  // Optimism ecosystem tokens
  {
    id: 'op',
    symbol: 'OP',
    name: 'Optimism',
    icon: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png?1698815413',
    decimals: 18,
    verified: true,
    addresses: {
      '10': null, // Native on Optimism
    },
  },
  {
    id: 'velo',
    symbol: 'VELO',
    name: 'Velodrome Finance',
    icon: 'https://assets.coingecko.com/coins/images/25783/large/velo.png?1698815413',
    decimals: 18,
    verified: true,
    addresses: {
      '10': '0x3c8B650257cFb5f272f799F5e2b4e65093a11a05', // Optimism
      '8453': '0x9560e827aF36c94D2Ac33a39bCE1Fe78631088Db', // Base (AERO - Aerodrome, Velodrome fork)
    },
  },
  // Base ecosystem tokens
  {
    id: 'aero',
    symbol: 'AERO',
    name: 'Aerodrome Finance',
    icon: 'https://assets.coingecko.com/coins/images/35611/large/aero.png?1698815413',
    decimals: 18,
    verified: true,
    addresses: {
      '8453': '0x940181a94A35A4569E4529A3CDfB74e38FD98631', // Base
    },
  },
  // BNB Chain ecosystem tokens
  {
    id: 'cake',
    symbol: 'CAKE',
    name: 'PancakeSwap',
    icon: 'https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo_%281%29.png?1698815413',
    decimals: 18,
    verified: true,
    addresses: {
      '56': '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', // BNB Chain
    },
  },
  {
    id: 'xvs',
    symbol: 'XVS',
    name: 'Venus',
    icon: 'https://assets.coingecko.com/coins/images/12677/large/venus.jpg?1698815413',
    decimals: 18,
    verified: true,
    addresses: {
      '56': '0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63', // BNB Chain
    },
  },
  // Avalanche ecosystem tokens
  {
    id: 'joe',
    symbol: 'JOE',
    name: 'Trader Joe',
    icon: 'https://assets.coingecko.com/coins/images/17569/large/joe_200x200.png?1698815413',
    decimals: 18,
    verified: true,
    addresses: {
      '43114': '0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd', // Avalanche
      '42161': '0x371c7ec6D8039ff7933a2AA28EB827Ffe1F52f07', // Arbitrum
    },
  },
  {
    id: 'qi',
    symbol: 'QI',
    name: 'Qi Dao',
    icon: 'https://assets.coingecko.com/coins/images/15329/large/qi.png?1698815413',
    decimals: 18,
    verified: true,
    addresses: {
      '137': '0x580A84C73811E1839F75d86d75d88cCa0c241fF4', // Polygon
      '43114': '0x8729438EB15e2C8B576fCc6AeCdA6A148776C0F5', // Avalanche
    },
  },
  // Polygon ecosystem tokens
  {
    id: 'quick',
    symbol: 'QUICK',
    name: 'Quickswap',
    icon: 'https://assets.coingecko.com/coins/images/13970/large/1_pOU6pBMEmiL-ZJVb0CYRjQ.png?1698815413',
    decimals: 18,
    verified: true,
    addresses: {
      '137': '0x831753DD7087CaC61aB5644b308642cc1c33Dc13', // Polygon
    },
  },
  // Mantle ecosystem
  {
    id: 'mnt-token',
    symbol: 'MNT',
    name: 'Mantle Token',
    icon: '/chain-logos/mantle.png',
    decimals: 18,
    verified: true,
    addresses: {
      '5000': null, // Native on Mantle (but also as ERC20)
      '1': '0x3c3a81e81dc49A522A592e7622A7E711c06bf354', // Ethereum (if bridged)
    },
  },
]

/**
 * Get token info by ID
 */
export function getTokenInfo(tokenId: string): TokenInfo | undefined {
  return TOKEN_REGISTRY.find((t) => t.id === tokenId)
}

/**
 * Get token contract address for a specific chain
 * Returns null for native tokens (ETH, etc.)
 */
export function getTokenAddress(tokenId: string, chainId: number): string | null {
  const token = getTokenInfo(tokenId)
  if (!token) return null
  return token.addresses[chainId.toString()] ?? null
}

/**
 * Check if a token ID represents a native token (ETH, MNT, etc.)
 * Native tokens are identified by tokenId, NOT by missing address
 */
export function isNativeTokenId(tokenId: string): boolean {
  const normalized = tokenId.toLowerCase()
  // Only ETH is native token in EVM context
  // (MNT is Mantle native but we model it as ETH since it's ETH-compatible)
  return normalized === 'eth'
}

/**
 * Check if a token is supported on a specific chain
 * - Native tokens (ETH): supported if tokenId is native
 * - ERC20 tokens: supported only if getTokenAddress returns a non-zero address
 */
export function isTokenSupportedOnChain(tokenId: string, chainId: number): boolean {
  const token = getTokenInfo(tokenId)
  if (!token) return false
  
  // Native tokens are always supported (they don't need an address)
  if (isNativeTokenId(tokenId)) {
    return true
  }
  
  // ERC20 tokens must have a non-zero address
  const address = getTokenAddress(tokenId, chainId)
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
  return address !== null && address !== ZERO_ADDRESS
}

/**
 * Get token decimals for a specific chain (with per-chain override support)
 * This is the source of truth for token decimals per chain
 */
export function getTokenDecimals(tokenId: string, chainId: number): number | null {
  const token = getTokenInfo(tokenId)
  if (!token) return null
  
  // Check for per-chain decimals override first (e.g., BNB USDT = 18, not 6)
  if ('chainDecimals' in token && token.chainDecimals && typeof token.chainDecimals === 'object') {
    const chainDecimals = token.chainDecimals as Record<string, number>
    const chainIdStr = chainId.toString()
    if (chainDecimals[chainIdStr] !== undefined) {
      return chainDecimals[chainIdStr]
    }
  }
  
  // Fall back to default decimals
  return token.decimals
}

/**
 * Get chain ID from network ID
 * Uses dynamic chain registry (sync version)
 * Falls back to legacy CHAIN_IDS if registry not loaded
 */
export function getChainId(networkId: string): number | null {
  // Try dynamic registry first
  try {
    const { getChainIdSync } = require('./chains/registry')
    const chainId = getChainIdSync(networkId)
    if (chainId !== null) {
      return chainId
    }
  } catch (error) {
    // Registry not available, fall back to legacy
  }
  
  // Fallback to legacy CHAIN_IDS
  return CHAIN_IDS[networkId] ?? null
}

/**
 * Convert human-readable amount to base units (wei, etc.)
 */
export function toBaseUnits(amount: string, decimals: number): string {
  const parts = amount.split('.')
  const whole = parts[0] || '0'
  const fractional = parts[1] || ''
  
  // Pad fractional part to required decimals
  const paddedFractional = fractional.padEnd(decimals, '0').slice(0, decimals)
  
  // Remove leading zeros
  const baseUnits = (whole + paddedFractional).replace(/^0+/, '') || '0'
  
  return baseUnits
}

/**
 * Convert base units to human-readable amount
 */
export function fromBaseUnits(amount: string, decimals: number): string {
  if (amount === '0') return '0'
  
  // Pad with zeros to have at least decimals digits
  const padded = amount.padStart(decimals + 1, '0')
  const whole = padded.slice(0, -decimals) || '0'
  const fractional = padded.slice(-decimals).replace(/0+$/, '')
  
  if (fractional === '') return whole
  return `${whole}.${fractional}`
}

/**
 * Get token reference for a network - returns family-specific token identifier
 * CRITICAL: Never returns 0x000... for non-EVM families
 */
/**
 * Get token reference for a network - returns family-specific token identifier
 * CRITICAL: Never returns 0x000... for non-EVM families
 */
export function getTokenRef(tokenId: string, networkId: string): TokenRef | null {
  const tokenInfo = getTokenInfo(tokenId)
  if (!tokenInfo) return null

  // Dynamic import to avoid circular dependency
  let getChainInfo: (id: string) => { family: string; chainId: number | null } | null
  try {
    if (typeof window === 'undefined') {
      // Server-side
      const chainRegistry = require('./chainRegistry')
      getChainInfo = chainRegistry.getChainInfo
    } else {
      // Client-side - use import
      return null // Client-side should not call this directly
    }
  } catch {
    return null
  }

  const chainInfo = getChainInfo(networkId)
  if (!chainInfo) return null

  const chainId = chainInfo.chainId ?? getChainId(networkId)
  let address: string | null = null

  if (chainId !== null) {
    address = getTokenAddress(tokenId, chainId)
  } else {
    // Non-EVM: check special chain IDs
    if (networkId.toLowerCase() === 'ton') {
      address = tokenInfo.addresses['607'] ?? null
    } else if (networkId.toLowerCase() === 'tron') {
      address = tokenInfo.addresses['728126428'] ?? null
    }
  }

  switch (chainInfo.family) {
    case 'EVM': {
      if (address === null) {
        // Native token - use 0x000... only for EVM
        return { type: 'native', value: 'native', family: 'EVM' }
      }
      // Validate address is not zero for non-native
      if (address === '0x0000000000000000000000000000000000000000') {
        return { type: 'native', value: 'native', family: 'EVM' }
      }
      return { type: 'address', value: address, family: 'EVM' }
    }
    case 'SOLANA': {
      if (address) {
        return { type: 'mint', value: address, family: 'SOLANA' }
      }
      return null // Solana native needs explicit mint address
    }
    case 'TON': {
      if (address) {
        return { type: 'jetton', value: address, family: 'TON' }
      }
      if (tokenId.toLowerCase() === 'ton' || tokenInfo.symbol === 'TON') {
        return { type: 'native', value: 'TON', family: 'TON' }
      }
      return null
    }
    case 'TRON': {
      if (address) {
        return { type: 'trc20', value: address, family: 'TRON' }
      }
      if (tokenId.toLowerCase() === 'trx' || tokenInfo.symbol === 'TRX') {
        return { type: 'native', value: 'TRX', family: 'TRON' }
      }
      return null
    }
    default:
      return null
  }
}

/**
 * Get provider-specific currency/network mapping for cross-family providers (e.g., ChangeNOW)
 */
export function getProviderCurrency(
  tokenId: string,
  networkId: string
): ProviderCurrency | null {
  const tokenInfo = getTokenInfo(tokenId)
  if (!tokenInfo) return null

  const network = networkId.toLowerCase()
  const symbol = tokenInfo.symbol.toUpperCase()

  // Import resolveChangeNowAsset to avoid duplication
  try {
    const { resolveChangeNowAsset } = require('./providers/changenowMap')
    const asset = resolveChangeNowAsset(networkId, symbol)
    if (asset) {
      return { currency: asset.ticker, network: asset.network }
    }
  } catch {
    // Fallback mapping
  }

  // Fallback mapping (basic)
  if (network === 'ethereum' || network === 'eth') {
    if (symbol === 'ETH') return { currency: 'eth', network: 'eth' }
    if (symbol === 'USDT') return { currency: 'usdt', network: 'eth' }
    if (symbol === 'USDC') return { currency: 'usdc', network: 'eth' }
  }
  if (network === 'ton') {
    if (symbol === 'TON') return { currency: 'ton', network: 'ton' }
    if (symbol === 'USDT') return { currency: 'usdt', network: 'ton' }
  }
  if (network === 'tron' || network === 'trx') {
    if (symbol === 'TRX') return { currency: 'trx', network: 'trx' }
    if (symbol === 'USDT') return { currency: 'usdt', network: 'trx' }
  }

  return null
}

/**
 * On-demand token import: Fetch ERC20 metadata from RPC
 * Stores in localStorage cache
 */
export async function importTokenByAddress(
  address: string,
  chainId: number,
  rpcUrl?: string
): Promise<TokenInfo | null> {
  // Check cache first
  const cacheKey = `token_${chainId}_${address.toLowerCase()}`
  const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch {
      // Invalid cache, continue to fetch
    }
  }

  // For EVM chains, fetch ERC20 metadata
  // This is a simplified version - in production, you'd use a proper RPC client
  try {
    // Use Alchemy API if available, otherwise use public RPC
    // Note: This runs server-side only, so we can use ALCHEMY_API_KEY (not NEXT_PUBLIC_)
    let apiKey: string | undefined
    if (typeof window === 'undefined') {
      // Server-side only - safe to access process.env directly
      apiKey = process.env.ALCHEMY_API_KEY
    }
    const endpoint = apiKey
      ? `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`
      : 'https://eth.llamarpc.com' // Public RPC fallback

    // Call ERC20 functions: name(), symbol(), decimals()
    const responses = await Promise.all([
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [
            {
              to: address,
              data: '0x06fdde03', // name()
            },
            'latest',
          ],
        }),
      }),
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'eth_call',
          params: [
            {
              to: address,
              data: '0x95d89b41', // symbol()
            },
            'latest',
          ],
        }),
      }),
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'eth_call',
          params: [
            {
              to: address,
              data: '0x313ce567', // decimals()
            },
            'latest',
          ],
        }),
      }),
    ])

    const [nameRes, symbolRes, decimalsRes] = await Promise.all(
      responses.map((r) => r.json())
    )

    // Decode hex strings (simplified - real implementation would properly decode ABI)
    // For now, return null and let caller handle
    // In production, use ethers.js or viem to decode properly

    return null // Placeholder - implement proper decoding
  } catch (error) {
    console.error('[tokens] Failed to import token:', error)
    return null
  }
}

