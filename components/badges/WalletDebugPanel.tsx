'use client'

import { useEffect, useState } from 'react'
import { useSafeAccount, useSafeDisconnect } from '@/lib/wagmi/safeHooks'
import { isTrulyConnected } from '@/lib/wallet/isTrulyConnected'

const DEBUG_WALLET = process.env.NEXT_PUBLIC_DEBUG_WALLET === '1'

interface WalletDebugPanelProps {
  mounted: boolean
}

export function WalletDebugPanel({ mounted: propMounted }: WalletDebugPanelProps) {
  const accountResult = useSafeAccount()
  const { address, isConnected, status, connector, chainId, mounted: hookMounted } = accountResult
  const { disconnect } = useSafeDisconnect()
  const mounted = propMounted && hookMounted
  
  const [localStorageKeys, setLocalStorageKeys] = useState<string[]>([])

  // Get localStorage keys on mount and when wallet state changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const keys = Object.keys(localStorage).filter(key => {
      const lower = key.toLowerCase()
      return lower.includes('wallet') || 
             lower.includes('wagmi') || 
             lower.includes('connector') || 
             lower.includes('address') || 
             lower.includes('session')
    })
    setLocalStorageKeys(keys)
  }, [mounted, address, isConnected, status])

  // Compute truly connected state
  const connectionResult = isTrulyConnected({
    mounted,
    isConnected,
    status,
    address: address || null,
    connectorId: connector?.id || null,
  })

  if (!DEBUG_WALLET) {
    return null
  }

  const handleResetLocalStorage = () => {
    if (typeof window === 'undefined') return
    
    const keys = Object.keys(localStorage).filter(key => {
      const lower = key.toLowerCase()
      return lower.includes('wallet') || 
             lower.includes('wagmi') || 
             lower.includes('connector') || 
             lower.includes('address') || 
             lower.includes('session')
    })
    
    keys.forEach(key => {
      localStorage.removeItem(key)
    })
    
    window.location.reload()
  }

  const handleForceDisconnect = () => {
    disconnect()
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black/95 border-2 border-white/40 rounded-lg text-xs font-mono text-white z-[9999] max-w-md shadow-2xl">
      <div className={`font-bold mb-3 text-lg ${connectionResult.ok ? 'text-green-400' : 'text-red-400'}`}>
        [DEBUG] Wallet Connection State
      </div>
      
      {/* Core state */}
      <div className="mb-3 space-y-1">
        <div>mounted: <span className={mounted ? 'text-green-400' : 'text-red-400'}>{mounted ? '✓' : '✗'}</span></div>
        <div>wagmi.status: <span className="text-yellow-300">{status || 'null'}</span></div>
        <div>wagmi.isConnected: <span className={isConnected ? 'text-green-400' : 'text-red-400'}>{isConnected ? '✓' : '✗'}</span></div>
        <div>wagmi.connector.id: <span className="text-yellow-300">{connector?.id || 'null'}</span></div>
        <div>wagmi.chainId: <span className="text-yellow-300">{chainId || 'null'}</span></div>
        <div>wagmi.address: <span className="text-yellow-300 break-all">{address || 'null'}</span></div>
      </div>

      {/* Connection result */}
      <div className={`mb-3 p-2 rounded border ${connectionResult.ok ? 'bg-green-900/30 border-green-500/50' : 'bg-red-900/30 border-red-500/50'}`}>
        <div className="font-bold">
          isTrulyConnected: <span className={connectionResult.ok ? 'text-green-400' : 'text-red-400'}>{connectionResult.ok ? 'TRUE' : 'FALSE'}</span>
        </div>
        <div className="text-xs mt-1">
          reason: <span className="text-yellow-300">{connectionResult.reason}</span>
        </div>
        <div className="text-xs mt-1">
          shouldGate: <span className={!connectionResult.ok ? 'text-red-400' : 'text-green-400'}>{!connectionResult.ok ? 'TRUE (show preview)' : 'FALSE (show badges)'}</span>
        </div>
      </div>

      {/* localStorage keys */}
      {localStorageKeys.length > 0 && (
        <div className="mb-3 p-2 rounded bg-gray-900/50 border border-white/20">
          <div className="font-bold mb-1">localStorage keys:</div>
          <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
            {localStorageKeys.map(key => (
              <div key={key} className="break-all text-yellow-300">
                {key}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug buttons */}
      <div className="space-y-2 mt-3 pt-3 border-t border-white/20">
        <button
          onClick={handleResetLocalStorage}
          className="w-full px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded text-xs font-bold transition-colors"
        >
          FORCE RESET LOCAL STORAGE (wallet)
        </button>
        <button
          onClick={handleForceDisconnect}
          className="w-full px-3 py-2 bg-orange-600/80 hover:bg-orange-600 text-white rounded text-xs font-bold transition-colors"
        >
          FORCE DISCONNECT (wagmi)
        </button>
      </div>
    </div>
  )
}








