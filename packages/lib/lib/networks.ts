export type Network = {
  id: string
  name: string
  icon: string
}

// All EVM networks supported by LiFi/Relay/Jumper for maximum chain coverage
export const NETWORKS: Network[] = [
  // Major L1s
  { id: 'ethereum', name: 'Ethereum', icon: '/chain-logos/ethereum-eth-logo.png' },
  { id: 'bnb', name: 'BNB Chain', icon: '/chain-logos/bnb-bnb-logo.png' },
  { id: 'polygon', name: 'Polygon', icon: '/chain-logos/polygon-matic-logo.png' },
  { id: 'avalanche', name: 'Avalanche', icon: '/chain-logos/avalanche-avax-logo.png' },
  { id: 'cronos', name: 'Cronos', icon: '/chain-logos/cronos.png' },
  { id: 'rootstock', name: 'Rootstock', icon: '/chain-logos/rootstock.png' },
  { id: 'gnosis', name: 'Gnosis', icon: '/chain-logos/gnosis-gno-gno-logo.png' },
  { id: 'pulsechain', name: 'PulseChain', icon: '/chain-logos/pulsechain.png' },
  { id: 'core', name: 'Core', icon: '/chain-logos/core.png' },
  { id: 'sonic', name: 'Sonic', icon: '/chain-logos/sonic.png' },
  { id: 'ronin', name: 'Ronin', icon: '/chain-logos/ronin-ron-logo.png' },
  
  // Major L2s
  { id: 'arbitrum', name: 'Arbitrum', icon: '/chain-logos/arbitrum.png' },
  { id: 'optimism', name: 'Optimism', icon: '/chain-logos/optimism-ethereum-op-logo.png' },
  { id: 'base', name: 'Base', icon: '/chain-logos/base.png' },
  { id: 'zksync', name: 'zkSync', icon: '/chain-logos/zksync.png' },
  { id: 'linea', name: 'Linea', icon: '/chain-logos/linea.png' },
  { id: 'scroll', name: 'Scroll', icon: '/chain-logos/scroll.png' },
  { id: 'blast', name: 'Blast', icon: '/chain-logos/blast.png' },
  { id: 'mantle', name: 'Mantle', icon: '/chain-logos/mantle.png' },
  { id: 'opbnb', name: 'opBNB', icon: '/chain-logos/opbnb.png' },
  { id: 'immutable x', name: 'Immutable zkEVM', icon: '/chain-logos/immutable-x-imx-logo.png' },
  
  // Emerging chains
  { id: 'bera', name: 'Berachain', icon: '/chain-logos/bera.png' },
  { id: 'plume', name: 'Plume', icon: '/chain-logos/plume.png' },
  { id: 'plasma', name: 'Plasma', icon: '/chain-logos/plasma.png' },
  { id: 'BOB', name: 'BOB', icon: '/chain-logos/bob.png' },
  { id: 'world (chain)', name: 'World Chain', icon: '/chain-logos/world.png' },
  { id: 'goat', name: 'GOAT Network', icon: '/chain-logos/goat.png' },
  { id: 'abstract', name: 'Abstract', icon: '/chain-logos/abstract.png' },
  { id: 'ink', name: 'Ink', icon: '/chain-logos/ink.png' },
  { id: 'katana', name: 'Katana', icon: '/chain-logos/katana.jpg' },
]

/**
 * Get a network by its ID
 */
export function getNetworkById(id: string): Network | undefined {
  return NETWORKS.find((network) => network.id === id)
}

/**
 * Get the icon path for a network by its ID
 * Returns the explicit icon path from the NETWORKS mapping
 */
export function getNetworkIcon(id: string): string | undefined {
  return getNetworkById(id)?.icon
}