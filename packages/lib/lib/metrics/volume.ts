/**
 * Shared volume metrics
 * Single source of truth for total volume tracking
 */

const VOLUME_STORAGE_KEY = 'kielswap_total_volume'

/**
 * Get total volume in USD
 * Returns 0 if not available or on server
 */
export function getTotalVolumeUSD(): number {
  if (typeof window === 'undefined') return 0
  
  try {
    const stored = localStorage.getItem(VOLUME_STORAGE_KEY)
    return stored ? parseFloat(stored) : 0
  } catch {
    return 0
  }
}

/**
 * Add volume to total
 * This should be called when a swap completes
 */
export function addVolume(amount: number): void {
  if (typeof window === 'undefined') return
  
  const current = getTotalVolumeUSD()
  const newTotal = current + amount
  localStorage.setItem(VOLUME_STORAGE_KEY, newTotal.toString())
}






















