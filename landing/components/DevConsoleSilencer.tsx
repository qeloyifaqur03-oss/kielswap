'use client'

import { useEffect } from 'react'

/**
 * Console silencer for MetaMask extension errors
 * 
 * Suppresses specific non-fatal errors from MetaMask extension that don't affect app functionality:
 * - "Failed to connect to MetaMask" errors
 * - Errors from chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn (MetaMask)
 * 
 * This suppression:
 * - Works in all environments (development and production)
 * - Only suppresses the 2 specific error signatures above
 * - Does NOT suppress any other errors (real app errors will still show)
 * - Does NOT modify wagmi/ethereum logic
 */
export function DevConsoleSilencer() {
  useEffect(() => {
    // Suppress MetaMask errors in all environments

    // Check if error is from MetaMask extension
    const isMetaMaskError = (error: any, message?: string, source?: string): boolean => {
      const errorMessage = message || error?.message || error?.reason?.message || String(error || '')
      const errorStack = error?.stack || error?.reason?.stack || ''
      const errorSource = source || error?.filename || error?.source || ''

      // Check for MetaMask-specific error messages
      if (
        typeof errorMessage === 'string' &&
        (errorMessage.includes('Failed to connect to MetaMask') ||
         errorMessage.includes('i: Failed to connect to MetaMask') ||
         errorMessage.includes('Cannot redefine property: ethereum') ||
         errorMessage.includes('Failed to set window.ethereum') ||
         errorMessage.includes('MetaMask encountered an error') ||
         errorMessage.toLowerCase().includes('metamask'))
      ) {
        return true
      }

      // Check for MetaMask extension ID in stack/source
      const metaMaskExtensionId = 'nkbihfbeogaeaoehlefnkodbefgpgknn'
      const fullExtensionUrl = `chrome-extension://${metaMaskExtensionId}`
      
      if (
        (typeof errorStack === 'string' && (
          errorStack.includes(metaMaskExtensionId) || 
          errorStack.includes(fullExtensionUrl) ||
          errorStack.includes('inpage.js') ||
          errorStack.includes('evmAsk.js')
        )) ||
        (typeof errorSource === 'string' && (
          errorSource.includes(metaMaskExtensionId) || 
          errorSource.includes(fullExtensionUrl) ||
          errorSource.includes('inpage.js') ||
          errorSource.includes('evmAsk.js')
        ))
      ) {
        return true
      }

      return false
    }

    // Suppress error events from MetaMask
    const handleError = (event: ErrorEvent) => {
      if (isMetaMaskError(event.error || event, event.message, event.filename)) {
        event.preventDefault()
        event.stopImmediatePropagation()
        event.stopPropagation()
        // Silently ignore - don't log to console
        return true
      }
      // Let other errors through normally
      return false
    }

    // Suppress unhandled promise rejections from MetaMask
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isMetaMaskError(event.reason || event)) {
        event.preventDefault()
        event.stopImmediatePropagation()
        event.stopPropagation()
        // Silently ignore - don't log to console
        return true
      }
      // Let other rejections through normally
      return false
    }

    // Also intercept window.onerror (older API, but some code still uses it)
    const originalOnError = window.onerror
    window.onerror = function(message, source, lineno, colno, error) {
      if (isMetaMaskError(error || message, String(message), String(source))) {
        // Suppress MetaMask error
        return true
      }
      // Call original handler for other errors
      if (originalOnError) {
        return originalOnError.call(this, message, source, lineno, colno, error)
      }
      return false
    }

    // Intercept console.error to suppress MetaMask errors
    const originalConsoleError = console.error
    console.error = function(...args: any[]) {
      const errorString = args.map(arg => 
        typeof arg === 'string' ? arg : 
        arg?.message || arg?.reason?.message || 
        String(arg)
      ).join(' ')
      
      if (
        errorString.includes('Failed to connect to MetaMask') ||
        errorString.includes('nkbihfbeogaeaoehlefnkodbefgpgknn')
      ) {
        // Suppress MetaMask errors - don't log
        return
      }
      
      // Log other errors normally
      originalConsoleError.apply(console, args)
    }

    // Intercept Next.js error overlay
    const suppressNextJsOverlay = () => {
      // Hide Next.js error overlay for MetaMask errors
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              const element = node as HTMLElement
              // Check if it's Next.js error overlay
              let classNameStr = ''
              try {
                if (typeof element.className === 'string') {
                  classNameStr = element.className
                } else if (element.className && typeof element.className === 'object') {
                  // Handle SVGAnimatedString or other objects
                  classNameStr = (element.className as any)?.baseVal || String(element.className || '')
                } else {
                  classNameStr = String(element.className || '')
                }
              } catch (e) {
                classNameStr = ''
              }
              
              const isNextJsOverlay = 
                element.id === '__nextjs_original-stack-frames' ||
                (typeof classNameStr === 'string' && classNameStr.includes && classNameStr.includes('nextjs-toast-errors')) ||
                element.querySelector?.('[data-nextjs-dialog]') ||
                element.querySelector?.('[data-nextjs-toast]')
              
              if (isNextJsOverlay) {
                // Check if error is from MetaMask
                const errorText = element.textContent || element.innerText || ''
                if (
                  isMetaMaskError(null, errorText) ||
                  errorText.includes('Failed to connect to MetaMask') ||
                  errorText.includes('i: Failed to connect to MetaMask') ||
                  errorText.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
                  errorText.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn')
                ) {
                  element.style.display = 'none'
                  element.remove()
                  return
                }
              }
              
              // Also check child elements
              const errorElements = element.querySelectorAll?.('[data-nextjs-dialog], [data-nextjs-toast], [class*="nextjs-error"], [id*="nextjs"]')
              errorElements?.forEach((el) => {
                if (!(el instanceof HTMLElement)) return
                const text = el.textContent || el.innerText || ''
                if (
                  isMetaMaskError(null, text) ||
                  text.includes('Failed to connect to MetaMask') ||
                  text.includes('i: Failed to connect to MetaMask') ||
                  text.includes('Cannot redefine property: ethereum') ||
                  text.includes('Failed to set window.ethereum') ||
                  text.includes('MetaMask encountered an error') ||
                  text.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
                  text.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn') ||
                  text.includes('inpage.js') ||
                  text.includes('evmAsk.js')
                ) {
                  el.style.display = 'none'
                  el.remove()
                }
              })
            }
          })
        })
      })
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      })
      
      // Also check immediately for existing overlays
      const checkExisting = () => {
        const existingOverlays = document.querySelectorAll('[data-nextjs-dialog], [data-nextjs-toast], [class*="nextjs-error"], [id*="nextjs"], [class*="nextjs-toast"]')
        existingOverlays.forEach((el) => {
          if (el instanceof HTMLElement) {
            const text = el.textContent || el.innerText || ''
            if (
              isMetaMaskError(null, text) ||
              text.includes('Failed to connect to MetaMask') ||
              text.includes('i: Failed to connect to MetaMask') ||
              text.includes('Cannot redefine property: ethereum') ||
              text.includes('Failed to set window.ethereum') ||
              text.includes('MetaMask encountered an error') ||
              text.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
              text.includes('inpage.js') ||
              text.includes('evmAsk.js')
            ) {
              el.style.display = 'none'
              el.remove()
            }
          }
        })
      }
      
      // Check immediately and periodically
      checkExisting()
      const interval = setInterval(checkExisting, 100)
      
      return () => {
        observer.disconnect()
        clearInterval(interval)
      }
    }

    // Intercept fetch requests to Next.js stack frame endpoint for MetaMask errors
    const originalFetch = window.fetch
    window.fetch = function(...args) {
      const url = args[0]?.toString() || ''
      if (url.includes('__nextjs_original-stack-frame') && (
        url.includes('Failed+to+connect+to+MetaMask') ||
        url.includes('i%3A+Failed+to+connect+to+MetaMask') ||
        url.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
        url.includes('inpage.js') ||
        url.includes('evmAsk.js')
      )) {
        // Suppress fetch request for MetaMask errors
        return Promise.reject(new Error('Suppressed MetaMask error stack frame request'))
      }
      return originalFetch.apply(this, args)
    }
    
    // Add event listeners with capture phase to intercept early
    window.addEventListener('error', handleError, true)
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true)
    
    // Start Next.js overlay suppression
    const cleanupOverlay = suppressNextJsOverlay()
    
    // Cleanup
    return () => {
      window.removeEventListener('error', handleError, true)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true)
      window.onerror = originalOnError
      console.error = originalConsoleError
      window.fetch = originalFetch
      cleanupOverlay()
    }
  }, [])

  // This component doesn't render anything
  return null
}
