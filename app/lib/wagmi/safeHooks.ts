/**
 * Safe wagmi hooks wrapper
 * Prevents crashes from broken browser extensions
 */

import { useAccount as wagmiUseAccount, useConnect as wagmiUseConnect, useDisconnect as wagmiUseDisconnect, useChainId as wagmiUseChainId, useChains as wagmiUseChains, useBalance as wagmiUseBalance } from 'wagmi'
import { useState, useEffect } from 'react'

/**
 * Safe useAccount hook - only works after mount
 */
export function useSafeAccount() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  try {
    const account = wagmiUseAccount()
    return {
      ...account,
      mounted,
      // Override isConnected to false if not mounted
      isConnected: mounted ? account.isConnected : false,
    }
  } catch (error) {
    // If wagmi hook fails (e.g., due to broken extension or SSR), return safe defaults
    // Suppress warnings during build-time static generation and SSR (WagmiProvider not available)
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                       process.env.VERCEL === '1' || 
                       process.env.CI === 'true'
    const isSSR = typeof window === 'undefined'
    if (!isBuildTime && !isSSR) {
      console.warn('[useSafeAccount] Failed to access account:', error)
    }
    return {
      address: undefined,
      isConnected: false,
      status: 'disconnected' as const,
      connector: undefined,
      chainId: undefined,
      mounted: false,
    }
  }
}

/**
 * Safe useConnect hook
 */
export function useSafeConnect() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  try {
    const connectResult = wagmiUseConnect()
    
    // Wrap connect function to handle errors silently
    const originalConnect = connectResult.connect
    const safeConnect = async (...args: Parameters<typeof originalConnect>) => {
      try {
        const result = originalConnect(...args) as any
        // If connect returns a Promise, catch rejections
        if (result && typeof result?.catch === 'function') {
          return result.catch((error: any) => {
            // Silently handle MetaMask connection errors
            const errorMessage = error?.message || error?.reason?.message || String(error || '')
            const errorStack = error?.stack || error?.reason?.stack || ''
            
            const isMetaMaskError = 
              errorMessage.includes('Failed to connect to MetaMask') ||
              errorMessage.includes('i: Failed to connect to MetaMask') ||
              errorMessage.match(/^i:\s*Failed/i) ||
              errorStack.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
              errorStack.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn') ||
              errorStack.includes('inpage.js')
            
            if (isMetaMaskError) {
              // Silently ignore MetaMask errors - return resolved promise instead of throwing
              return Promise.resolve()
            }
            
            // Re-throw non-MetaMask errors
            throw error
          })
        }
        return result
      } catch (error: any) {
        // Silently handle MetaMask connection errors (synchronous)
        const errorMessage = error?.message || error?.reason?.message || String(error || '')
        const errorStack = error?.stack || error?.reason?.stack || ''
        
        const isMetaMaskError = 
          errorMessage.includes('Failed to connect to MetaMask') ||
          errorMessage.includes('i: Failed to connect to MetaMask') ||
          errorMessage.match(/^i:\s*Failed/i) ||
          errorStack.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
          errorStack.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn') ||
          errorStack.includes('inpage.js')
        
        if (isMetaMaskError) {
          // Silently ignore MetaMask errors - return resolved promise
          return Promise.resolve()
        }
        
        // Re-throw non-MetaMask errors
        throw error
      }
    }
    
    return {
      ...connectResult,
      connect: safeConnect,
    }
  } catch (error) {
    // Suppress warnings during build-time static generation and SSR (WagmiProvider not available)
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                       process.env.VERCEL === '1' || 
                       process.env.CI === 'true'
    const isSSR = typeof window === 'undefined'
    if (!isBuildTime && !isSSR) {
      console.warn('[useSafeConnect] Failed to access connect:', error)
    }
    return {
      connect: () => {},
      connectors: [],
      error: null,
      isPending: false,
      isSuccess: false,
      variables: undefined,
    }
  }
}

/**
 * Safe useDisconnect hook
 */
export function useSafeDisconnect() {
  try {
    return wagmiUseDisconnect()
  } catch (error) {
    // Suppress warnings during build-time static generation and SSR
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                       process.env.VERCEL === '1' || 
                       process.env.CI === 'true'
    const isSSR = typeof window === 'undefined'
    if (!isBuildTime && !isSSR) {
      console.warn('[useSafeDisconnect] Failed to access disconnect:', error)
    }
    return {
      disconnect: () => {},
      disconnectAsync: async () => {},
      isPending: false,
      isSuccess: false,
      error: null,
    }
  }
}

/**
 * Safe useChainId hook
 */
export function useSafeChainId() {
  try {
    return wagmiUseChainId()
  } catch (error) {
    // Suppress warnings during build-time static generation and SSR
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                       process.env.VERCEL === '1' || 
                       process.env.CI === 'true'
    const isSSR = typeof window === 'undefined'
    if (!isBuildTime && !isSSR) {
      console.warn('[useSafeChainId] Failed to access chainId:', error)
    }
    return 1 // Default to mainnet
  }
}

/**
 * Safe useChains hook
 */
export function useSafeChains() {
  try {
    return wagmiUseChains()
  } catch (error) {
    // Suppress warnings during build-time static generation and SSR
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                       process.env.VERCEL === '1' || 
                       process.env.CI === 'true'
    const isSSR = typeof window === 'undefined'
    if (!isBuildTime && !isSSR) {
      console.warn('[useSafeChains] Failed to access chains:', error)
    }
    return []
  }
}

/**
 * Safe useBalance hook
 */
export function useSafeBalance(params?: { address?: `0x${string}` }) {
  try {
    return wagmiUseBalance(params as any)
  } catch (error) {
    // Suppress warnings during build-time static generation and SSR
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                       process.env.VERCEL === '1' || 
                       process.env.CI === 'true'
    const isSSR = typeof window === 'undefined'
    if (!isBuildTime && !isSSR) {
      console.warn('[useSafeBalance] Failed to access balance:', error)
    }
    return {
      data: undefined,
      error: null,
      isPending: false,
      isSuccess: false,
      refetch: async () => ({}),
    }
  }
}
