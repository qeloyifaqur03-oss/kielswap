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
 * Uses React Query for client-side caching
 */
export function useTokenPrices(tokenIds: string[]) {
  const normalizedIds = tokenIds.map(id => id.toLowerCase())
  const idsKey = normalizedIds.sort().join(',')
  
  return useQuery<TokenPricesResponse>({
    queryKey: ['token-prices', idsKey],
    queryFn: () => fetchTokenPrices(normalizedIds),
    staleTime: 60_000, // 60 seconds - data is fresh
    gcTime: 600_000, // 10 minutes - cache time
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  })
}
