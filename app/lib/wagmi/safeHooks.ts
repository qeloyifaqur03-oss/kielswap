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
    // If wagmi hook fails (e.g., due to broken extension), return safe defaults
    console.warn('[useSafeAccount] Failed to access account:', error)
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
    const safeConnect = (...args: Parameters<typeof originalConnect>) => {
      try {
        return originalConnect(...args)
      } catch (error: any) {
        // Silently handle MetaMask connection errors
        const errorMessage = error?.message || error?.reason?.message || String(error || '')
        const errorStack = error?.stack || error?.reason?.stack || ''
        
        const isMetaMaskError = 
          errorMessage.includes('Failed to connect to MetaMask') ||
          errorMessage.includes('i: Failed to connect to MetaMask') ||
          errorStack.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
          errorStack.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn')
        
        if (isMetaMaskError) {
          // Silently ignore MetaMask errors - don't log or throw
          return
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
    console.warn('[useSafeConnect] Failed to access connect:', error)
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
    console.warn('[useSafeDisconnect] Failed to access disconnect:', error)
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
    console.warn('[useSafeChainId] Failed to access chainId:', error)
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
    console.warn('[useSafeChains] Failed to access chains:', error)
    return []
  }
}

/**
 * Safe useBalance hook
 */
export function useSafeBalance(params?: { address?: string }) {
  try {
    return wagmiUseBalance(params)
  } catch (error) {
    console.warn('[useSafeBalance] Failed to access balance:', error)
    return {
      data: undefined,
      error: null,
      isPending: false,
      isSuccess: false,
      refetch: async () => ({}),
    }
  }
}
