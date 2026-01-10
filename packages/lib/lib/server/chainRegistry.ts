import fs from 'fs'
import path from 'path'

// Server-only module: This file must never be imported in client components
// It accesses process.env and file system, which are only available on the server
// Usage: Only import in API routes (app/api/**/route.ts) or server components

// Runtime check to prevent accidental client-side import
if (typeof window !== 'undefined') {
  throw new Error('chainRegistry.ts is server-only and cannot be imported on the client')
}

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

/**
 * Resolve placeholders in a string by replacing env variable references
 * Uses canonical environment variable names from lib/env.ts
 */
function resolvePlaceholders(str: string): string {
  let resolved = str
  // Use canonical ALCHEMY_API_KEY (INFURA_API_KEY removed - not in canonical list)
  resolved = resolved.replace(/\$\{ALCHEMY_API_KEY\}/g, process.env.ALCHEMY_API_KEY || '')
  // Note: INFURA_API_KEY placeholder support removed - use ALCHEMY_API_KEY or other canonical providers
  return resolved
}

/**
 * Resolve endpoints by replacing placeholders and filtering out invalid URLs
 */
function resolveEndpoints(endpoints: ChainEndpoint): ChainEndpoint {
  const resolved: ChainEndpoint = {}

  // Process each endpoint type
  const endpointTypes: (keyof ChainEndpoint)[] = ['rpc', 'ws', 'rest', 'grpc']
  
  for (const type of endpointTypes) {
    if (!endpoints[type]) {
      continue
    }

    const resolvedUrls = endpoints[type]!
      .map((url) => resolvePlaceholders(url))
      .filter((url) => {
        // Filter out URLs that still contain ${...} placeholders
        // (means the env var wasn't set)
        return !/\$\{[^}]+\}/.test(url) && url.trim().length > 0
      })

    if (resolvedUrls.length > 0) {
      resolved[type] = resolvedUrls
    }
  }

  return resolved
}

/**
 * Load the chain registry template from JSON file
 */
export function loadChainRegistryTemplate(): Chain[] {
  try {
    // Try multiple paths for flexibility
    const possiblePaths = [
      path.join(process.cwd(), 'chain_registry_full.json'), // Root (primary)
      path.join(process.cwd(), 'data', 'chains.registry.json'), // Data directory (fallback)
      path.join(process.cwd(), 'packages', 'lib', 'lib', 'data', 'chains.registry.json'), // Packages data (fallback)
    ]
    
    for (const filePath of possiblePaths) {
      try {
        if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath, 'utf-8')
          const parsed = JSON.parse(fileContent) as Chain[]
          console.log(`[chainRegistry] Loaded ${parsed.length} chains from ${filePath}`)
          return parsed
        }
      } catch (err) {
        // Try next path
        continue
      }
    }
    
    // Fallback: try relative path from this file location
    try {
      const relativePath = path.join(__dirname, '..', '..', '..', '..', '..', 'data', 'chains.registry.json')
      if (fs.existsSync(relativePath)) {
        const fileContent = fs.readFileSync(relativePath, 'utf-8')
        const parsed = JSON.parse(fileContent) as Chain[]
        console.log(`[chainRegistry] Loaded ${parsed.length} chains from ${relativePath}`)
        return parsed
      }
    } catch {
      // Ignore
    }
    
    // Last resort: empty array
    console.warn('[chainRegistry] Could not find chain registry file in any expected location')
    return []
  } catch (error) {
    console.error('[chainRegistry] Failed to load chain registry:', error)
    return []
  }
}

/**
 * Get the fully resolved chain registry with all placeholders replaced
 * and invalid URLs filtered out
 */
export function getResolvedChainRegistry(): Chain[] {
  const chains = loadChainRegistryTemplate()
  
  // Track statistics for debug logging
  const stats: Record<string, { before: number; after: number }> = {}

  const resolvedChains = chains.map((chain) => {
    const originalRpcCount = chain.endpoints.rpc?.length || 0
    const originalWsCount = chain.endpoints.ws?.length || 0

    const resolvedEndpoints = resolveEndpoints(chain.endpoints)

    const newRpcCount = resolvedEndpoints.rpc?.length || 0
    const newWsCount = resolvedEndpoints.ws?.length || 0

    // Log if endpoints were filtered
    const filteredRpc = originalRpcCount - newRpcCount
    const filteredWs = originalWsCount - newWsCount

    if (filteredRpc > 0 || filteredWs > 0) {
      stats[chain.key] = {
        before: originalRpcCount + originalWsCount,
        after: newRpcCount + newWsCount,
      }
      console.log(
        `[chainRegistry] Chain "${chain.name}" (${chain.key}): filtered ${filteredRpc} RPC and ${filteredWs} WS endpoints due to missing env vars`
      )
    }

    return {
      ...chain,
      endpoints: resolvedEndpoints,
    }
  })

  // Log summary if any chains had filtered endpoints
  const chainsWithFilteredEndpoints = Object.keys(stats).length
  if (chainsWithFilteredEndpoints > 0) {
    console.log(
      `[chainRegistry] Resolved ${resolvedChains.length} chains. ${chainsWithFilteredEndpoints} chains had endpoints filtered due to missing API keys.`
    )
  } else {
    console.log(`[chainRegistry] Successfully resolved ${resolvedChains.length} chains.`)
  }

  return resolvedChains
}

