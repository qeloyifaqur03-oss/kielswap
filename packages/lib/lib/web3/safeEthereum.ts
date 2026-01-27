/**
 * Safe Ethereum provider access
 * Prevents crashes from broken browser extensions
 */

/**
 * Safely get window.ethereum provider
 * Returns null if:
 * - window is undefined (SSR)
 * - ethereum is not available
 * - ethereum.request is not a function (broken extension)
 */
export function getSafeEthereum(): any | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const eth = (window as any).ethereum
    
    // Check if ethereum exists
    if (!eth) {
      return null
    }

    // Validate that request method exists and is a function
    // This prevents crashes from broken extensions that inject partial objects
    if (typeof eth.request !== 'function') {
      return null
    }

    // Additional safety: check if it's a valid provider object
    // Some broken extensions inject objects without proper structure
    if (typeof eth !== 'object' || eth === null) {
      return null
    }

    return eth
  } catch (error) {
    // Silently fail if extension access throws
    return null
  }
}

/**
 * Safely call ethereum.request with error handling
 */
export async function safeEthereumRequest(
  method: string,
  params?: any[]
): Promise<any> {
  const eth = getSafeEthereum()
  if (!eth) {
    throw new Error('Ethereum provider not available')
  }

  try {
    return await eth.request({
      method,
      params,
    })
  } catch (error) {
    // Re-throw with context
    throw new Error(`Ethereum request failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Check if ethereum provider is available and valid
 */
export function isEthereumAvailable(): boolean {
  return getSafeEthereum() !== null
}










