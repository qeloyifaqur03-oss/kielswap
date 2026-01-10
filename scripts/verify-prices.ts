/**
 * Verification script for token price mappings
 * Checks that all tokens have proper price mappings
 */

import { TOKEN_REGISTRY } from '../lib/tokens'
import { NETWORKS } from '../lib/networks'
import { getChainId } from '../lib/tokens'

// Price mappings from token-price route
const TOKEN_TO_COINGECKO_ID: Record<string, string> = {
  eth: 'ethereum',
  bnb: 'binancecoin',
  matic: 'matic-network',
  pol: 'matic-network',
  avax: 'avalanche-2',
  op: 'optimism',
  arb: 'arbitrum',
  base: 'base',
  zksync: 'zksync',
  linea: 'linea',
  scroll: 'scroll',
  blast: 'blast',
  gnosis: 'gnosis',
  opbnb: 'opbnb',
  mantle: 'mantle',
  cronos: 'cronos',
  cro: 'crypto-com-chain',
  rootstock: 'rootstock',
  rbtc: 'rootstock',
  sonic: 'sonic',
  s: 'sonic',
  core: 'coredaoorg',
  ronin: 'ronin',
  ron: 'ronin',
  xdai: 'gnosis',
  kava: 'kava',
  plasma: 'plasma',
  xpl: 'plasma',
  plume: 'plume',
  pulsechain: 'pulsechain',
  pls: 'pulsechain',
  berachain: 'berachain',
  bera: 'berachain',
  mnt: 'mantle',
  celo: 'celo',
  'immutable x': 'immutable-x',
  'immutable-zkevm': 'immutable-x',
  'world (chain)': 'worldcoin-wld',
  'world-chain': 'worldcoin-wld',
  goat: 'goat',
  btc: 'bitcoin',
  merlin: 'merlin',
  katana: 'katana',
  ink: 'ink',
  bob: 'bob',
  abstract: 'abstract',
  mon: 'monad',
  usdc: 'usd-coin',
  usdt: 'tether',
  dai: 'dai',
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
  susd: 'nusd',
  '1inch': '1inch',
  frax: 'frax',
  fxs: 'frax-share',
  ldo: 'lido-dao',
  grt: 'the-graph',
  'matic-erc20': 'matic-network',
  gmx: 'gmx',
  velo: 'velodrome-finance',
  aero: 'aerodrome-finance',
  cake: 'pancakeswap-token',
  xvs: 'venus',
  joe: 'trader-joe',
  qi: 'qi-dao',
  quick: 'quickswap',
  'mnt-token': 'mantle',
  'matic-erc20': 'matic-network',
}

const TOKEN_TO_CMC_SYMBOL: Record<string, string> = {
  eth: 'ETH',
  bnb: 'BNB',
  matic: 'MATIC',
  pol: 'POL',
  avax: 'AVAX',
  cro: 'CRO',
  celo: 'CELO',
  s: 'S',
  pls: 'PLS',
  ron: 'RON',
  mnt: 'MNT',
  bera: 'BERA',
  core: 'CORE',
  xdai: 'XDAI',
  rbtc: 'RBTC',
  xpl: 'XPL',
  plume: 'PLUME',
  kava: 'KAVA',
  btc: 'BTC',
  op: 'OP',
  arb: 'ARB',
  usdc: 'USDC',
  usdt: 'USDT',
  dai: 'DAI',
  weth: 'WETH',
  wbtc: 'WBTC',
  link: 'LINK',
  uni: 'UNI',
  aave: 'AAVE',
  crv: 'CRV',
  mkr: 'MKR',
  snx: 'SNX',
  comp: 'COMP',
  sushi: 'SUSHI',
  '1inch': '1INCH',
  frax: 'FRAX',
  fxs: 'FXS',
  ldo: 'LDO',
  grt: 'GRT',
  gmx: 'GMX',
  velo: 'VELO',
  aero: 'AERO',
  cake: 'CAKE',
  xvs: 'XVS',
  joe: 'JOE',
  qi: 'QI',
  quick: 'QUICK',
  'mnt-token': 'MNT',
  'matic-erc20': 'MATIC',
}

const TOKEN_TO_CRYPTOCOMPARE_SYMBOL: Record<string, string> = {
  eth: 'ETH',
  bnb: 'BNB',
  matic: 'MATIC',
  avax: 'AVAX',
  op: 'OP',
  arb: 'ARB',
  base: 'BASE',
  celo: 'CELO',
  cro: 'CRO',
  kava: 'KAVA',
  btc: 'BTC',
  s: 'S',
  pls: 'PLS',
  ron: 'RON',
  mnt: 'MNT',
  bera: 'BERA',
  core: 'CORE',
  xdai: 'XDAI',
  rbtc: 'RBTC',
  xpl: 'XPL',
  plume: 'PLUME',
  usdc: 'USDC',
  usdt: 'USDT',
  dai: 'DAI',
  weth: 'WETH',
  wbtc: 'WBTC',
  link: 'LINK',
  uni: 'UNI',
  aave: 'AAVE',
  crv: 'CRV',
  mkr: 'MKR',
  snx: 'SNX',
  comp: 'COMP',
  sushi: 'SUSHI',
  '1inch': '1INCH',
  frax: 'FRAX',
  fxs: 'FXS',
  ldo: 'LDO',
  grt: 'GRT',
  gmx: 'GMX',
  velo: 'VELO',
  aero: 'AERO',
  cake: 'CAKE',
  xvs: 'XVS',
  joe: 'JOE',
  qi: 'QI',
  quick: 'QUICK',
  'mnt-token': 'MNT',
  'matic-erc20': 'MATIC',
}

function verifyPriceMappings() {
  console.log('=== ПРОВЕРКА МАППИНГОВ ЦЕН ДЛЯ ТОКЕНОВ ===\n')
  
  const missingCoinGecko: string[] = []
  const missingCMC: string[] = []
  const missingCryptoCompare: string[] = []
  
  for (const token of TOKEN_REGISTRY) {
    const tokenId = token.id.toLowerCase()
    const hasCoinGecko = !!TOKEN_TO_COINGECKO_ID[tokenId]
    const hasCMC = !!TOKEN_TO_CMC_SYMBOL[tokenId]
    const hasCryptoCompare = !!TOKEN_TO_CRYPTOCOMPARE_SYMBOL[tokenId]
    
    if (!hasCoinGecko) {
      missingCoinGecko.push(token.id)
    }
    if (!hasCMC) {
      missingCMC.push(token.id)
    }
    if (!hasCryptoCompare) {
      missingCryptoCompare.push(token.id)
    }
  }
  
  console.log(`Всего токенов в реестре: ${TOKEN_REGISTRY.length}`)
  console.log(`Токенов с CoinGecko маппингом: ${TOKEN_REGISTRY.length - missingCoinGecko.length}`)
  console.log(`Токенов с CoinMarketCap маппингом: ${TOKEN_REGISTRY.length - missingCMC.length}`)
  console.log(`Токенов с CryptoCompare маппингом: ${TOKEN_REGISTRY.length - missingCryptoCompare.length}\n`)
  
  if (missingCoinGecko.length > 0) {
    console.log('⚠️  Отсутствуют CoinGecko маппинги:')
    missingCoinGecko.forEach(id => console.log(`  - ${id}`))
    console.log()
  }
  
  if (missingCMC.length > 0) {
    console.log('⚠️  Отсутствуют CoinMarketCap маппинги:')
    missingCMC.forEach(id => console.log(`  - ${id}`))
    console.log()
  }
  
  if (missingCryptoCompare.length > 0) {
    console.log('⚠️  Отсутствуют CryptoCompare маппинги:')
    missingCryptoCompare.forEach(id => console.log(`  - ${id}`))
    console.log()
  }
  
  if (missingCoinGecko.length === 0 && missingCMC.length === 0 && missingCryptoCompare.length === 0) {
    console.log('✅ Все токены имеют полные маппинги цен!\n')
  }
  
  return {
    missingCoinGecko,
    missingCMC,
    missingCryptoCompare,
  }
}

function verifyNetworks() {
  console.log('=== ПРОВЕРКА СЕТЕЙ И CHAIN IDs ===\n')
  
  const networksWithoutChainId: string[] = []
  
  for (const network of NETWORKS) {
    const chainId = getChainId(network.id)
    if (!chainId) {
      networksWithoutChainId.push(network.id)
    }
  }
  
  console.log(`Всего сетей: ${NETWORKS.length}`)
  console.log(`Сетей с chain ID: ${NETWORKS.length - networksWithoutChainId.length}\n`)
  
  if (networksWithoutChainId.length > 0) {
    console.log('⚠️  Сети без chain ID:')
    networksWithoutChainId.forEach(id => console.log(`  - ${id}`))
    console.log()
  } else {
    console.log('✅ Все сети имеют chain IDs!\n')
  }
  
  return { networksWithoutChainId }
}

function generateFullReport() {
  console.log('========================================')
  console.log('ПОЛНЫЙ ОТЧЕТ: ТОКЕНЫ, СЕТИ И МАППИНГИ')
  console.log('========================================\n')
  
  const priceResults = verifyPriceMappings()
  const networkResults = verifyNetworks()
  
  console.log('=== СПИСОК ВСЕХ ТОКЕНОВ ===\n')
  TOKEN_REGISTRY.forEach((token, index) => {
    const tokenId = token.id.toLowerCase()
    const coinGecko = TOKEN_TO_COINGECKO_ID[tokenId] || '❌ НЕТ'
    const cmc = TOKEN_TO_CMC_SYMBOL[tokenId] || '❌ НЕТ'
    const cc = TOKEN_TO_CRYPTOCOMPARE_SYMBOL[tokenId] || '❌ НЕТ'
    
    console.log(`${index + 1}. ${token.symbol} (${token.id})`)
    console.log(`   CoinGecko: ${coinGecko}`)
    console.log(`   CoinMarketCap: ${cmc}`)
    console.log(`   CryptoCompare: ${cc}`)
    
    // Show supported chains
    const chains = Object.keys(token.addresses).map(cid => {
      const chainId = parseInt(cid)
      const chainName = NETWORKS.find(n => getChainId(n.id) === chainId)?.name || `Chain ${chainId}`
      return `${chainName} (${chainId})`
    }).join(', ')
    
    if (chains) {
      console.log(`   Поддерживаемые сети: ${chains}`)
    } else {
      console.log(`   Поддерживаемые сети: Native token`)
    }
    console.log()
  })
  
  console.log('=== СПИСОК ВСЕХ СЕТЕЙ ===\n')
  NETWORKS.forEach((network, index) => {
    const chainId = getChainId(network.id)
    console.log(`${index + 1}. ${network.name} (${network.id})`)
    console.log(`   Chain ID: ${chainId || '❌ НЕТ'}`)
    
    // Count tokens available on this network
    const availableTokens = TOKEN_REGISTRY.filter(token => {
      if (!chainId) return false
      const address = token.addresses[chainId.toString()]
      return address !== undefined
    })
    console.log(`   Доступных токенов: ${availableTokens.length}`)
    console.log()
  })
  
  console.log('\n========================================')
  console.log('ИТОГИ ПРОВЕРКИ')
  console.log('========================================\n')
  
  const allGood = priceResults.missingCoinGecko.length === 0 &&
                  priceResults.missingCMC.length === 0 &&
                  priceResults.missingCryptoCompare.length === 0 &&
                  networkResults.networksWithoutChainId.length === 0
  
  if (allGood) {
    console.log('✅ ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ УСПЕШНО!')
    console.log('   - Все токены имеют маппинги цен')
    console.log('   - Все сети имеют chain IDs')
    console.log('   - Все токены и сети готовы к использованию')
  } else {
    console.log('⚠️  ОБНАРУЖЕНЫ ПРОБЛЕМЫ:')
    if (priceResults.missingCoinGecko.length > 0) {
      console.log(`   - ${priceResults.missingCoinGecko.length} токенов без CoinGecko маппинга`)
    }
    if (priceResults.missingCMC.length > 0) {
      console.log(`   - ${priceResults.missingCMC.length} токенов без CoinMarketCap маппинга`)
    }
    if (priceResults.missingCryptoCompare.length > 0) {
      console.log(`   - ${priceResults.missingCryptoCompare.length} токенов без CryptoCompare маппинга`)
    }
    if (networkResults.networksWithoutChainId.length > 0) {
      console.log(`   - ${networkResults.networksWithoutChainId.length} сетей без chain ID`)
    }
  }
}

// Run verification
if (require.main === module) {
  generateFullReport()
}

export { verifyPriceMappings, verifyNetworks, generateFullReport }

