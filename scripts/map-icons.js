// Map chain keys to icon paths
const iconMap = {
  'ethereum': '/chain-logos/ethereum-eth-logo.png',
  'optimism': '/chain-logos/optimism-ethereum-op-logo.png',
  'cronos': '/chain-logos/cronos.png',
  'rootstock': '/chain-logos/rootstock.png',
  'bnb': '/chain-logos/bnb-bnb-logo.png',
  'gnosis': '/chain-logos/gnosis-gno-gno-logo.png',
  'polygon': '/chain-logos/polygon-matic-logo.png',
  'sonic': '/chain-logos/sonic.png',
  'eni': '/chain-logos/eni.png',
  'opbnb': '/chain-logos/opbnb.png',
  'zksync': '/chain-logos/zksync.png',
  'pulsechain': '/chain-logos/pulsechain.png',
  'world (chain)': '/chain-logos/world.png',
  'world-chain': '/chain-logos/world.png',
  'core': '/chain-logos/core.png',
  'ronin': '/chain-logos/ronin-ron-logo.png',
  'goat': '/chain-logos/goat.png',
  'abstract': '/chain-logos/abstract.png',
  'mantle': '/chain-logos/mantle.png',
  'base': '/chain-logos/base.png',
  'plasma': '/chain-logos/plasma.png',
  'monad': '/chain-logos/monad.jpg',
  'immutable x': '/chain-logos/immutable-x-imx-logo.png',
  'immutable-zkevm': '/chain-logos/immutable-x-imx-logo.png',
  'arbitrum': '/chain-logos/arbitrum.png',
  'celo': '/chain-logos/celo-celo-logo.png',
  'avalanche': '/chain-logos/avalanche-avax-logo.png',
  'ink': '/chain-logos/ink.png',
  'linea': '/chain-logos/linea.png',
  'BOB': '/chain-logos/bob.png',
  'bob': '/chain-logos/bob.png',
  'bera': '/chain-logos/bera.png',
  'berachain': '/chain-logos/bera.png',
  'blast': '/chain-logos/blast.png',
  'plume': '/chain-logos/plume.png',
  'scroll': '/chain-logos/scroll.png',
  'katana': '/chain-logos/katana.jpg',
};

// Helper to get icon path
function getIconPath(key) {
  return iconMap[key] || '/chain-logos/ethereum-eth-logo.png'; // default fallback
}

module.exports = { iconMap, getIconPath };
















