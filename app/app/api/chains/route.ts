/**
 * Chains API endpoint
 * Returns enabled and disabled chains for debugging
 */

import { NextRequest, NextResponse } from 'next/server'
import { getResolvedChainRegistry } from '@/lib/server/chainRegistry'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const forceRefresh = searchParams.get('refresh') === '1'
    
    // TODO: Implement caching with forceRefresh support
    const registry = getResolvedChainRegistry()
    
    // All chains are enabled by default in getResolvedChainRegistry
    const enabled = registry
    const disabled: typeof registry = []
    
    // Transform to match expected format with id and enabled flag
    const chains = registry.map(chain => ({
      id: chain.key,
      name: chain.name,
      chainId: chain.identifiers.chainId,
      enabled: true, // All chains from registry are enabled
      icon: chain.nativeAsset?.logo,
    }))
    
    return NextResponse.json({
      chains,
      enabled: chains,
      disabled: [],
      total: chains.length,
      enabledCount: chains.length,
      disabledCount: 0,
    })
  } catch (error) {
    console.error('[api/chains] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to load chain registry',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}


















