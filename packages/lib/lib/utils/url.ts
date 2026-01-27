/**
 * URL join utility to safely combine base URL and path
 * Prevents double slashes and double version prefixes
 */
export function joinUrl(base: string, path: string): string {
  // Remove trailing slash from base
  const baseClean = base.replace(/\/+$/, '')
  
  // Remove leading slash from path
  const pathClean = path.replace(/^\/+/, '')
  
  // Combine with single slash
  return `${baseClean}/${pathClean}`
}


















