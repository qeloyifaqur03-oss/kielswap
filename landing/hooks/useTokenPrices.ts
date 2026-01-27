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
    return {
      prices: {},
      ok: false,
      source: 'empty',
    }
  }
  
  const data = await response.json() as TokenPricesResponse
  return data
}

/**
 * Hook to fetch token prices with 3-second polling
 * Simplified: no retry, no throw on error, relies on Next.js fetch cache
 */
export function useTokenPrices(tokenIds: string[]) {
  const normalizedIds = tokenIds.map(id => id.toLowerCase())
  const idsKey = normalizedIds.sort().join(',')
  
  return useQuery<TokenPricesResponse>({
    queryKey: ['token-prices', idsKey],
    queryFn: () => fetchTokenPrices(normalizedIds),
    refetchInterval: 3000, // Poll every 3 seconds
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false, // No retry to prevent request storms
    staleTime: 3000, // Consider data fresh for 3 seconds
    gcTime: 600_000, // Keep in cache for 10 minutes
    placeholderData: (previousData) => previousData, // Keep previous data on error
  })
}
