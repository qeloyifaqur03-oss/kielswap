'use client'

import { useEffect } from 'react'

export default function ErrorHandler() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if error is from browser extension
    const isExtensionError = (error: any): boolean => {
      if (!error) return false
      
      const message = error.message || error.toString() || ''
      const stack = error.stack || ''
      const filename = (error as any).filename || ''
      const source = (error as any).source || ''
      
      const errorString = `${message} ${stack} ${filename} ${source}`.toLowerCase()
      
      return (
        errorString.includes('chrome.runtime.sendmessage') ||
        errorString.includes('chrome.runtime.sendMessage') ||
        errorString.includes('chrome-extension://') ||
        errorString.includes('moz-extension://') ||
        errorString.includes('safari-extension://') ||
        errorString.includes('extension id') ||
        errorString.includes('extension id (string)') ||
        errorString.includes('must specify an extension id') ||
        errorString.includes('invocation of runtime.sendmessage') ||
        errorString.includes('inpage.js') ||
        errorString.includes('egjidjbpglichdcondbcbdnbeeppgdph') ||
        errorString.includes('web3') ||
        errorString.includes('metamask') ||
        errorString.includes('wallet')
      )
    }

    // Check if error is related to extensions (including webpack errors caused by extensions)
    const isExtensionRelatedError = (message: string, source?: string, stack?: string, error?: any): boolean => {
      const combined = `${message} ${source || ''} ${stack || ''}`.toLowerCase()
      const fullStack = (error?.stack || stack || '').toLowerCase()
      const errorMessage = (error?.message || message || '').toLowerCase()
      
      // Check if error is webpack factory error (specific pattern: "Cannot read properties of undefined (reading 'call')")
      const isWebpackFactoryError = (errorMessage.includes('cannot read properties') || combined.includes('cannot read properties')) && 
                                    (errorMessage.includes('undefined') || combined.includes('undefined') || errorMessage.includes('null') || combined.includes('null')) &&
                                    (errorMessage.includes('call') || combined.includes('call')) && 
                                    (errorMessage.includes('webpack') || combined.includes('webpack') || 
                                     errorMessage.includes('factory') || combined.includes('factory') ||
                                     errorMessage.includes('options.factory') || combined.includes('options.factory'))
      
      // Check for react-server-dom-webpack errors (Next.js lazy loading)
      const isReactServerError = (combined.includes('react-server-dom-webpack') || fullStack.includes('react-server-dom-webpack')) && isWebpackFactoryError
      
      // Check if extension is in call stack (even if not in error message)
      const hasExtensionInStack = fullStack.includes('chrome-extension://') ||
                                   fullStack.includes('moz-extension://') ||
                                   fullStack.includes('egjidjbpglichdcondbcbdnbeeppgdph') ||
                                   fullStack.includes('inpage.js')
      
      // Also check if webpack.js is in the source and extension is in stack
      const isWebpackFile = (source || '').toLowerCase().includes('webpack.js') || 
                           fullStack.includes('webpack.js')
      
      return (
        combined.includes('chrome-extension://') ||
        combined.includes('moz-extension://') ||
        combined.includes('egjidjbpglichdcondbcbdnbeeppgdph') ||
        combined.includes('inpage.js') ||
        fullStack.includes('chrome-extension://') ||
        fullStack.includes('egjidjbpglichdcondbcbdnbeeppgdph') ||
        fullStack.includes('inpage.js') ||
        // Webpack factory error with extension in stack
        (isWebpackFactoryError && hasExtensionInStack) ||
        // Webpack factory error in webpack.js file (likely caused by extension interference)
        (isWebpackFactoryError && isWebpackFile && hasExtensionInStack) ||
        // React-server-dom-webpack errors (Next.js lazy loading) - suppress if extension is present or if it's a factory error
        (isReactServerError && (hasExtensionInStack || isWebpackFile))
      )
    }

    // Handle unhandled errors
    const handleError = (event: ErrorEvent) => {
      // Ignore errors from browser extensions
      const message = event.message || ''
      const filename = event.filename || ''
      const stack = event.error?.stack || ''
      
      if (
        isExtensionError(event) ||
        isExtensionError(event.error) ||
        isExtensionRelatedError(message, filename, stack, event.error) ||
        event.filename?.includes('chrome-extension://') ||
        event.filename?.includes('moz-extension://') ||
        message.toLowerCase().includes('chrome.runtime.sendmessage') ||
        message.toLowerCase().includes('chrome.runtime.sendMessage') ||
        message.toLowerCase().includes('extension id') ||
        message.toLowerCase().includes('must specify an extension id') ||
        message.toLowerCase().includes('invocation of runtime.sendmessage')
      ) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        return false
      }
    }

    // Handle unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (isExtensionError(event.reason)) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        return false
      }
    }

    // Intercept Next.js error overlay by overriding console.error and window error handlers
    const originalConsoleError = console.error
    console.error = (...args: any[]) => {
      const errorString = args.map(arg => 
        typeof arg === 'string' ? arg : 
        arg?.stack || arg?.message || String(arg)
      ).join(' ').toLowerCase()
      
      // Suppress extension-related errors in console
      // Check for webpack factory errors caused by extensions
      const isWebpackFactoryError = errorString.includes('cannot read properties') && 
                                    (errorString.includes('undefined') || errorString.includes('null')) &&
                                    errorString.includes('call') && 
                                    (errorString.includes('webpack') || errorString.includes('factory') || errorString.includes('options.factory'))
      
      // Check for react-server-dom-webpack errors (Next.js lazy loading)
      const isReactServerError = errorString.includes('react-server-dom-webpack') && isWebpackFactoryError
      
      const hasExtensionInContext = errorString.includes('chrome-extension://') ||
                                    errorString.includes('moz-extension://') ||
                                    errorString.includes('egjidjbpglichdcondbcbdnbeeppgdph') ||
                                    errorString.includes('inpage.js')
      
      // Suppress if it's a webpack factory error (even without explicit extension, if it's a lazy loading error)
      if (
        errorString.includes('chrome-extension://') ||
        errorString.includes('moz-extension://') ||
        errorString.includes('egjidjbpglichdcondbcbdnbeeppgdph') ||
        errorString.includes('inpage.js') ||
        (isWebpackFactoryError && (hasExtensionInContext || isReactServerError || errorString.includes('webpack.js')))
      ) {
        return // Suppress console error
      }
      
      originalConsoleError.apply(console, args)
    }

    // Also intercept React/Next.js error reporting
    // Next.js uses window.__nextjs_original_console_error for error overlay
    if (typeof (window as any).__nextjs_original_console_error === 'function') {
      const nextJsError = (window as any).__nextjs_original_console_error
      ;(window as any).__nextjs_original_console_error = (...args: any[]) => {
        const errorString = args.map(arg => 
          typeof arg === 'string' ? arg : 
          arg?.stack || arg?.message || String(arg)
        ).join(' ').toLowerCase()
        
        // Check for webpack factory errors caused by extensions
        const isWebpackFactoryError = errorString.includes('cannot read properties') && 
                                      (errorString.includes('undefined') || errorString.includes('null')) &&
                                      errorString.includes('call') && 
                                      (errorString.includes('webpack') || errorString.includes('factory') || errorString.includes('options.factory'))
        
        // Check for react-server-dom-webpack errors (Next.js lazy loading)
        const isReactServerError = errorString.includes('react-server-dom-webpack') && isWebpackFactoryError
        
        const hasExtensionInContext = errorString.includes('chrome-extension://') ||
                                      errorString.includes('moz-extension://') ||
                                      errorString.includes('egjidjbpglichdcondbcbdnbeeppgdph') ||
                                      errorString.includes('inpage.js')
        
        // Suppress if it's a webpack factory error (even without explicit extension, if it's a lazy loading error)
        if (
          errorString.includes('chrome-extension://') ||
          errorString.includes('moz-extension://') ||
          errorString.includes('egjidjbpglichdcondbcbdnbeeppgdph') ||
          errorString.includes('inpage.js') ||
          (isWebpackFactoryError && (hasExtensionInContext || isReactServerError || errorString.includes('webpack.js')))
        ) {
          return // Suppress Next.js error overlay
        }
        
        nextJsError.apply(window, args)
      }
    }

    // Add event listeners with capture phase to catch errors early
    window.addEventListener('error', handleError, true)
    window.addEventListener('unhandledrejection', handleRejection, true)

    // Also override global error handler
    const originalOnError = window.onerror
    window.onerror = (message, source, lineno, colno, error) => {
      if (typeof message === 'string') {
        const msgLower = message.toLowerCase()
        const stack = error?.stack || ''
        if (
          isExtensionError(error) ||
          isExtensionRelatedError(message, source, stack, error) ||
          msgLower.includes('chrome.runtime.sendmessage') ||
          msgLower.includes('chrome.runtime.sendMessage') ||
          msgLower.includes('chrome-extension://') ||
          msgLower.includes('extension id') ||
          msgLower.includes('must specify an extension id') ||
          msgLower.includes('invocation of runtime.sendmessage') ||
          source?.toLowerCase().includes('chrome-extension://')
        ) {
          return true // Suppress error
        }
      }
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error)
      }
      return false
    }

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError, true)
      window.removeEventListener('unhandledrejection', handleRejection, true)
      window.onerror = originalOnError
      console.error = originalConsoleError
      if (typeof (window as any).__nextjs_original_console_error === 'function') {
        // Restore original if it was overridden
        const nextJsError = (window as any).__nextjs_original_console_error
        if (nextJsError !== originalConsoleError) {
          // Try to restore, but this might not work if Next.js has already initialized
        }
      }
    }
  }, [])

  return null
}
