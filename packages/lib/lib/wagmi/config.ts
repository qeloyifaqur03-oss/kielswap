/**
 * Wagmi configuration for EVM wallet connections
 * EVM-only mode: only EVM chains supported
 */

import { createConfig, http } from 'wagmi'
import { base, mainnet, bsc, polygon, avalanche, arbitrum, optimism, zkSync, celo, gnosis } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { defineChain } from 'viem'

// Additional EVM chains not in wagmi/chains by default
const linea = defineChain({
  id: 59144,
  name: 'Linea',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.linea.build'] },
  },
  blockExplorers: {
    default: { name: 'LineaScan', url: 'https://lineascan.build' },
  },
})

const scroll = defineChain({
  id: 534352,
  name: 'Scroll',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.scroll.io'] },
  },
  blockExplorers: {
    default: { name: 'ScrollScan', url: 'https://scrollscan.com' },
  },
})

const blast = defineChain({
  id: 81457,
  name: 'Blast',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.blast.io'] },
  },
  blockExplorers: {
    default: { name: 'BlastScan', url: 'https://blastscan.io' },
  },
})

const opbnb = defineChain({
  id: 204,
  name: 'opBNB',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://opbnb-mainnet-rpc.bnbchain.org'] },
  },
  blockExplorers: {
    default: { name: 'opBNBScan', url: 'https://opbnbscan.com' },
  },
})

const mantle = defineChain({
  id: 5000,
  name: 'Mantle',
  nativeCurrency: { name: 'Mantle', symbol: 'MNT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Mantle Explorer', url: 'https://explorer.mantle.xyz' },
  },
})

// EVM chain allowlist
export const supportedChains = [
  mainnet,      // 1 - Ethereum
  bsc,          // 56 - BNB Chain
  polygon,      // 137 - Polygon
  avalanche,    // 43114 - Avalanche
  arbitrum,     // 42161 - Arbitrum
  optimism,     // 10 - Optimism
  base,         // 8453 - Base
  zkSync,       // 324 - zkSync Era
  celo,         // 42220 - Celo
  gnosis,       // 100 - Gnosis
  linea,        // 59144 - Linea
  scroll,       // 534352 - Scroll
  blast,        // 81457 - Blast
  opbnb,        // 204 - opBNB
  mantle,       // 5000 - Mantle
]

// EVM-only mode: Using injected() connector for MetaMask, Rabby, and other browser wallets
// WalletConnect disabled temporarily to avoid build errors (pino-pretty dependency)
// To re-enable WalletConnect later, add: import { walletConnect } from 'wagmi/connectors'
// and include walletConnect({ projectId }) in connectors array if NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is set

const DEBUG_WALLET = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG_WALLET === '1'

/**
 * Create wagmi config lazily (client-only)
 * This prevents synchronous access to window.ethereum during module import
 * which can crash when browser extensions inject broken providers
 */
let wagmiConfigInstance: ReturnType<typeof createConfig> | null = null

export function getWagmiConfig() {
  // Only create config on client-side after window is available
  if (typeof window === 'undefined') {
    throw new Error('Wagmi config can only be created on client-side')
  }

  if (!wagmiConfigInstance) {
    try {
      // Safely create injected connector - wrap in try-catch to handle broken extensions
      let injectedConnector
      try {
        // injected() may access window.ethereum synchronously
        // If extension is broken, this could throw
        injectedConnector = injected()
      } catch (error) {
        console.warn('[wagmi/config] Failed to create injected connector:', error)
        // Continue without injected connector - app will work but wallet won't be available
        injectedConnector = null
      }

      wagmiConfigInstance = createConfig({
        chains: supportedChains as any,
        connectors: [
          ...(injectedConnector ? [injectedConnector] : []), // Only add if successfully created
          // WalletConnect (coming soon) - disabled to avoid build errors
        ],
        transports: {
          // Use public RPC endpoints (can be overridden with env vars if needed)
          [mainnet.id]: http(),
          [bsc.id]: http(),
          [polygon.id]: http(),
          [avalanche.id]: http(),
          [arbitrum.id]: http(),
          [optimism.id]: http(),
          [base.id]: http(),
          [zkSync.id]: http(),
          [celo.id]: http(),
          [gnosis.id]: http(),
          [linea.id]: http(),
          [scroll.id]: http(),
          [blast.id]: http(),
          [opbnb.id]: http(),
          [mantle.id]: http(),
        },
        // Note: In wagmi v2, autoConnect behavior is controlled by the connector's storage
        // The injected() connector will auto-reconnect if a wallet was previously connected
        // To prevent phantom connected state, we rely on isTrulyConnected() to validate
        // connection state strictly (requires connector + address + status === 'connected')
        // This config does not expose an autoConnect option - it's connector-level behavior
      })

      // Debug logging for wagmi config initialization
      if (DEBUG_WALLET) {
        console.log('[wagmi/config] Wagmi config initialized', {
          chainsCount: supportedChains.length,
          connectors: wagmiConfigInstance.connectors.map(c => c.id),
        })
      }
    } catch (error) {
      // If config creation fails (e.g., due to broken extension), log and rethrow
      console.error('[wagmi/config] Failed to create wagmi config:', error)
      throw error
    }
  }

  return wagmiConfigInstance
}

// Export for backward compatibility, but it will only work client-side
// This should be replaced with getWagmiConfig() in all places
export const wagmiConfig = typeof window !== 'undefined' ? getWagmiConfig() : null as any

