import { useState, useEffect } from 'react'

export interface ChainEndpoint {
  rpc?: string[]
  ws?: string[]
  rest?: string[]
  grpc?: string[]
}

export interface Chain {
  key: string
  name: string
  flags: {
    EVM?: boolean
    Cosmos?: boolean
    UTXO?: boolean
    Solana?: boolean
    Substrate?: boolean
    Move?: boolean
    Other?: boolean
  }
  identifiers: {
    namespace: string
    caip2: string
    chainId: number | null
    networkId: number | null
  }
  endpoints: ChainEndpoint
  explorers?: Array<{
    name: string
    url: string
    standard: string | null
  }>
  nativeAsset?: {
    name: string
    symbol: string
    decimals: number
    logo?: string
  }
}

interface ChainRegistryResponse {
  chains: Chain[]
}

// In-memory cache to avoid refetching on every render
let cachedChains: Chain[] | null = null
let cachePromise: Promise<Chain[]> | null = null

/**
 * Client hook to fetch the resolved chain registry from the API
 * Uses in-memory caching to avoid unnecessary refetches
 */
export function useChainRegistry() {
  const [chains, setChains] = useState<Chain[]>(cachedChains || [])
  const [loading, setLoading] = useState<boolean>(!cachedChains)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Return cached data immediately if available
    if (cachedChains) {
      setChains(cachedChains)
      setLoading(false)
      return
    }

    // If a fetch is already in progress, wait for it
    if (cachePromise) {
      cachePromise
        .then((data) => {
          setChains(data)
          setLoading(false)
        })
        .catch((err) => {
          setError(err)
          setLoading(false)
        })
      return
    }

    // Start new fetch
    setLoading(true)
    cachePromise = fetch('/api/chain-registry')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch chain registry: ${res.statusText}`)
        }
        const data: ChainRegistryResponse = await res.json()
        cachedChains = data.chains
        return data.chains
      })
      .then((data) => {
        setChains(data)
        setLoading(false)
        return data
      })
      .catch((err) => {
        setError(err)
        setLoading(false)
        throw err
      })
      .finally(() => {
        cachePromise = null
      })
  }, [])

  return { chains, loading, error }
}

/**
 * Helper function to get a chain by its key/id
 */
export function getChainByKey(chains: Chain[], key: string): Chain | undefined {
  return chains.find((chain) => chain.key === key)
}

/**
 * Helper function to get RPC endpoints for a chain
 */
export function getChainRpcEndpoints(chains: Chain[], key: string): string[] {
  const chain = getChainByKey(chains, key)
  return chain?.endpoints?.rpc || []
}

/**
 * Helper function to get WebSocket endpoints for a chain
 */
export function getChainWsEndpoints(chains: Chain[], key: string): string[] {
  const chain = getChainByKey(chains, key)
  return chain?.endpoints?.ws || []
}

