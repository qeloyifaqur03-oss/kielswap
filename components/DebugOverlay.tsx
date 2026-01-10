'use client'

import { useEffect, useState } from 'react'

export function DebugOverlay() {
  const [bootInfo, setBootInfo] = useState<any>(null)

  useEffect(() => {
    console.log('[BOOT] DebugOverlay mounted', window.location.href)

    // Collect boot information
    const info = {
      href: window.location.href,
      readyState: document.readyState,
      resourcesCount: performance.getEntriesByType('resource').length,
      hasNextData: typeof (window as any).__NEXT_DATA__ !== 'undefined',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    }

    setBootInfo(info)
    console.log('[BOOT] Boot info:', info)

    // Global error handlers
    const onError = (event: ErrorEvent) => {
      console.error('[window.onerror]', event.error || event.message, event)
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[unhandledrejection]', event.reason || event)
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  if (!bootInfo) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[99999] bg-red-900 text-white p-2 text-xs font-mono">
        [BOOT] DebugOverlay loading...
      </div>
    )
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] bg-black/95 text-white p-3 text-xs font-mono border-b-2 border-yellow-500">
      <div className="font-bold text-yellow-400 mb-2">[APP BOOTED] Debug Overlay Active</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div>
          <span className="text-gray-400">href:</span>{' '}
          <span className="text-yellow-300 break-all">{bootInfo.href}</span>
        </div>
        <div>
          <span className="text-gray-400">readyState:</span>{' '}
          <span className="text-green-300">{bootInfo.readyState}</span>
        </div>
        <div>
          <span className="text-gray-400">resources:</span>{' '}
          <span className="text-blue-300">{bootInfo.resourcesCount}</span>
        </div>
        <div>
          <span className="text-gray-400">__NEXT_DATA__:</span>{' '}
          <span className={bootInfo.hasNextData ? 'text-green-300' : 'text-red-300'}>
            {bootInfo.hasNextData ? 'YES' : 'NO'}
          </span>
        </div>
        <div className="col-span-2">
          <span className="text-gray-400">userAgent:</span>{' '}
          <span className="text-gray-300 text-[10px] break-all">{bootInfo.userAgent}</span>
        </div>
        <div className="col-span-2">
          <span className="text-gray-400">timestamp:</span>{' '}
          <span className="text-gray-300">{bootInfo.timestamp}</span>
        </div>
      </div>
    </div>
  )
}












