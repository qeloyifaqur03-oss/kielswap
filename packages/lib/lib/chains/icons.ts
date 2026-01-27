/**
 * Chain icon mapping
 * Maps networkId to icon path
 */

export const CHAIN_ICON: Record<string, string> = {
  ethereum: '/icons/chains/ethereum.svg',
  bnb: '/icons/chains/bnb.svg',
  polygon: '/icons/chains/polygon.svg',
  optimism: '/icons/chains/optimism.svg',
  arbitrum: '/icons/chains/arbitrum.svg',
  base: '/icons/chains/base.svg',
  avalanche: '/icons/chains/avalanche.svg',
  celo: '/icons/chains/celo.svg',
  zksync: '/icons/chains/zksync.svg',
  linea: '/icons/chains/linea.svg',
  scroll: '/icons/chains/scroll.svg',
  blast: '/icons/chains/blast.svg',
  gnosis: '/icons/chains/gnosis.svg',
  opbnb: '/icons/chains/opbnb.svg',
  mantle: '/icons/chains/mantle.svg',
  fantom: '/icons/chains/fantom.svg',
  moonbeam: '/icons/chains/moonbeam.svg',
  moonriver: '/icons/chains/moonriver.svg',
  aurora: '/icons/chains/aurora.svg',
  metis: '/icons/chains/metis.svg',
  'polygon-zkevm': '/icons/chains/polygon-zkevm.svg',
  'arbitrum-nova': '/icons/chains/arbitrum-nova.svg',
  boba: '/icons/chains/boba.svg',
  mode: '/icons/chains/mode.svg',
  zora: '/icons/chains/zora.svg',
  fraxtal: '/icons/chains/fraxtal.svg',
  taiko: '/icons/chains/taiko.svg',
  ronin: '/icons/chains/ronin.svg',
  cronos: '/icons/chains/cronos.svg',
  kava: '/icons/chains/kava.svg',
  rootstock: '/icons/chains/rootstock.svg',
  core: '/icons/chains/core.svg',
  harmony: '/icons/chains/harmony.svg',
  okxchain: '/icons/chains/okxchain.svg',
  astar: '/icons/chains/astar.svg',
  shiden: '/icons/chains/shiden.svg',
  evmos: '/icons/chains/evmos.svg',
  telos: '/icons/chains/telos.svg',
  iotex: '/icons/chains/iotex.svg',
  wanchain: '/icons/chains/wanchain.svg',
  velas: '/icons/chains/velas.svg',
  'oasis-emerald': '/icons/chains/oasis-emerald.svg',
  syscoin: '/icons/chains/syscoin.svg',
  energyweb: '/icons/chains/energyweb.svg',
  meter: '/icons/chains/meter.svg',
  fuse: '/icons/chains/fuse.svg',
  kcc: '/icons/chains/kcc.svg',
  elastos: '/icons/chains/elastos.svg',
  'milkomeda-c1': '/icons/chains/milkomeda-c1.svg',
  callisto: '/icons/chains/callisto.svg',
  dfk: '/icons/chains/dfk.svg',
  palm: '/icons/chains/palm.svg',
  heco: '/icons/chains/heco.svg',
}

/**
 * Get icon path for a network ID
 */
export function getChainIcon(networkId: string): string | undefined {
  return CHAIN_ICON[networkId.toLowerCase()]
}


















