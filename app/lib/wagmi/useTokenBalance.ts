'use client'

import { useReadContract, useBalance } from 'wagmi'
import { useSafeAccount } from './safeHooks'
import { SUPPORTED_TOKENS, SUPPORTED_NETWORKS } from '@/lib/supportedAssets'
import { formatUnits } from 'viem'

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
] as const

// Token addresses for major tokens (add more as needed)
const TOKEN_ADDRESSES: Record<string, Record<number, `0x${string}`>> = {
  usdc: {
    1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum
    10: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // Optimism
    42161: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // Arbitrum
    8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
    137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon
    43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // Avalanche
    56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // BNB Chain
  },
  'usdt-ethereum': {
    1: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Ethereum
    10: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // Optimism
    42161: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // Arbitrum
    8453: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', // Base
    137: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // Polygon
    43114: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', // Avalanche
  },
  dai: {
    1: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // Ethereum
    10: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // Optimism
    42161: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // Arbitrum
    8453: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // Base
    137: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', // Polygon
  },
  weth: {
    1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Ethereum
    10: '0x4200000000000000000000000000000000000006', // Optimism
    42161: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // Arbitrum
    8453: '0x4200000000000000000000000000000000000006', // Base
  },
}

// Native tokens (no contract address needed)
const NATIVE_TOKENS = ['eth', 'bnb', 'matic', 'avax', 'cro', 'mnt', 'plume', 'pls', 'bera', 'rbtc', 'kava', 'xpl', 's', 'core', 'xdai', 'ron', 'btc']

/**
 * Hook to get token balance for a given token and chain
 */
export function useTokenBalance(tokenId: string, chainId: number) {
  const { address, isConnected } = useSafeAccount()
  
  // Find token definition
  const token = SUPPORTED_TOKENS.find(t => t.id === tokenId)
  const decimals = token?.decimals || 18
  
  // Check if it's a native token
  const isNative = NATIVE_TOKENS.includes(tokenId.toLowerCase())
  
  // Get token address if it's an ERC20 token
  const tokenAddress: `0x${string}` | undefined = !isNative ? (TOKEN_ADDRESSES[tokenId]?.[chainId] || undefined) : undefined
  
  // For native tokens, use useBalance
  const { data: nativeBalance, isLoading: isLoadingNative } = useBalance({
    address: isConnected ? address : undefined,
    chainId: isNative ? chainId : undefined,
    query: {
      enabled: isConnected && isNative,
    },
  })
  
  // For ERC20 tokens, use useReadContract
  const { data: erc20Balance, isLoading: isLoadingERC20 } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: !isNative ? chainId : undefined,
    query: {
      enabled: isConnected && !isNative && !!tokenAddress && !!address,
    },
  })
  
  if (!isConnected || !address) {
    return { balance: null, formatted: null, isLoading: false }
  }
  
  if (isNative) {
    if (isLoadingNative) {
      return { balance: null, formatted: null, isLoading: true }
    }
    if (!nativeBalance) {
      return { balance: null, formatted: null, isLoading: false }
    }
    return {
      balance: nativeBalance.value,
      formatted: formatUnits(nativeBalance.value, decimals),
      isLoading: false,
    }
  }
  
  if (isLoadingERC20) {
    return { balance: null, formatted: null, isLoading: true }
  }
  
  if (!erc20Balance || !tokenAddress) {
    return { balance: null, formatted: null, isLoading: false }
  }
  
  return {
    balance: erc20Balance as bigint,
    formatted: formatUnits(erc20Balance as bigint, decimals),
    isLoading: false,
  }
}
