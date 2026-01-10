/**
 * Hard reset function to clear all wallet-related state
 * This prevents "phantom connected" state from stale localStorage
 */

/**
 * Reset all wallet-related storage and disconnect wagmi
 * Clears: localStorage, sessionStorage for wagmi/rainbowkit/walletconnect
 * Also calls wagmi disconnect() if available
 */
export async function resetWalletStateHard(): Promise<void> {
  if (typeof window === 'undefined') return

  // Clear localStorage keys containing wallet-related prefixes
  const localStorageKeys = Object.keys(localStorage)
  const walletKeys = localStorageKeys.filter(key => {
    const lower = key.toLowerCase()
    return (
      lower.includes('wagmi') ||
      lower.includes('walletconnect') ||
      lower.includes('wallet') ||
      lower.includes('wc-') ||
      lower.includes('wc@') ||
      lower.includes('rainbow') ||
      lower.includes('rk-') ||
      lower.includes('WALLETCONNECT') ||
      lower.includes('connector')
    )
  })

  walletKeys.forEach(key => {
    localStorage.removeItem(key)
  })

  // Clear sessionStorage keys
  const sessionStorageKeys = Object.keys(sessionStorage)
  const walletSessionKeys = sessionStorageKeys.filter(key => {
    const lower = key.toLowerCase()
    return (
      lower.includes('wagmi') ||
      lower.includes('walletconnect') ||
      lower.includes('wallet') ||
      lower.includes('rainbow') ||
      lower.includes('connector')
    )
  })

  walletSessionKeys.forEach(key => {
    sessionStorage.removeItem(key)
  })

  // Unregister service workers if any (WalletConnect uses service workers)
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const registration of registrations) {
      // Only unregister wallet-related service workers
      if (registration.scope.includes('walletconnect') || registration.scope.includes('wallet')) {
        await registration.unregister()
      }
    }
  }

  // Note: wagmi disconnect() must be called from a component with useDisconnect hook
  // This function only clears storage - the component should call disconnect() separately
}

















