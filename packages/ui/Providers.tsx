'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getWagmiConfig } from '@/lib/wagmi/config'
import { useState, useEffect } from 'react'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [config, setConfig] = useState<ReturnType<typeof getWagmiConfig> | null>(null)

  // Only initialize wagmi config after component mounts (client-side only)
  useEffect(() => {
    setMounted(true)
    try {
      const wagmiConfig = getWagmiConfig()
      setConfig(wagmiConfig)
    } catch (error: any) {
      // Silently handle MetaMask connection errors
      const errorMessage = error?.message || error?.reason?.message || String(error || '')
      const errorStack = error?.stack || error?.reason?.stack || ''
      
      const isMetaMaskError = 
        errorMessage.includes('Failed to connect to MetaMask') ||
        errorMessage.includes('i: Failed to connect to MetaMask') ||
        errorStack.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
        errorStack.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn')
      
      if (!isMetaMaskError) {
        // Only log non-MetaMask errors
        console.error('[Providers] Failed to initialize wagmi config:', error)
      }
      // Silently ignore MetaMask errors - app will work without wallet functionality
    }
  }, [])

  // Don't render wagmi provider until mounted and config is ready
  // This prevents SSR/hydration issues and extension-related crashes
  // Even if wagmi config fails, still render children so app works without wallet
  if (!mounted) {
    // Show minimal loading state during mount
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
  
  // If config failed to initialize, render without wagmi (app works but wallet features disabled)
  if (!config) {
    console.warn('[Providers] Wagmi config not available, rendering without wallet support')
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}










