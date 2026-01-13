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
  
  const data = await response.json() as TokenPricesResponse
  
  // If response is not ok or prices are empty/incomplete, throw error
  // This prevents React Query from replacing good data with empty data
  if (!response.ok || !data.ok || !data.prices || Object.keys(data.prices).length === 0) {
    throw new Error('PRICE_UNAVAILABLE')
  }
  
  // Verify we have prices for all requested tokens
  const normalizedIds = tokenIds.map(id => id.toLowerCase())
  const hasAllPrices = normalizedIds.every(id => data.prices[id] && data.prices[id] > 0)
  
  if (!hasAllPrices) {
    throw new Error('PRICE_UNAVAILABLE')
  }
  
  return data
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
    refetchIntervalInBackground: false, // Don't poll in background to reduce load
    refetchOnWindowFocus: false,
    retry: 3, // Retry up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
    placeholderData: (previousData) => previousData, // Keep previous data on error
  })
}
