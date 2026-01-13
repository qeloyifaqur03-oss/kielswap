'use client'

import { useQuery } from '@tanstack/react-query'

interface TokenPricesResponse {
  prices: Record<string, number>
  ok: boolean
  source: 'cache_fresh' | 'cache_stale' | 'coingecko' | 'empty'
}

async function fetchTokenPrices(tokenIds: string[]): Promise<TokenPricesResponse> {
  const idsParam = tokenIds.join(',')
  const response = await fetch(`/api/token-price?ids=${idsParam}`)
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

/**
 * Hook to fetch token prices with optimized caching
 * Uses React Query for client-side caching with 3-second polling
 */
export function useTokenPrices(tokenIds: string[]) {
  const normalizedIds = tokenIds.map(id => id.toLowerCase())
  const idsKey = normalizedIds.sort().join(',')
  
  return useQuery<TokenPricesResponse>({
    queryKey: ['token-prices', idsKey],
    queryFn: () => fetchTokenPrices(normalizedIds),
    staleTime: 0, // Always consider stale to allow refetch
    gcTime: 600_000, // 10 minutes - cache time
    refetchInterval: 3000, // Poll every 3 seconds
    refetchIntervalInBackground: true, // Continue polling in background
    refetchOnWindowFocus: false,
    retry: 1,
  })
}
