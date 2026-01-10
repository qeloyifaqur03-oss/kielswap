'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Ignore extension errors (chrome.runtime.sendMessage, etc.)
    const errorMessage = error?.message || String(error || '')
    const errorStack = error?.stack || ''
    
    const isExtensionError = 
      errorMessage.includes('chrome.runtime.sendMessage') ||
      errorMessage.includes('runtime.sendMessage') ||
      errorMessage.includes('must specify an Extension ID') ||
      errorMessage.includes('Error in invocation of runtime.sendMessage') ||
      errorStack.includes('chrome-extension://') ||
      errorStack.includes('chrome.runtime') ||
      errorMessage.includes('Failed to connect to MetaMask') ||
      errorStack.includes('nkbihfbeogaeaoehlefnkodbefgpgknn')
    
    if (isExtensionError) {
      // Don't trigger error boundary for extension errors
      return { hasError: false, error: null }
    }
    
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Check if it's an extension error and ignore it
    const errorMessage = error?.message || String(error || '')
    const errorStack = error?.stack || ''
    
    const isExtensionError = 
      errorMessage.includes('chrome.runtime.sendMessage') ||
      errorMessage.includes('runtime.sendMessage') ||
      errorMessage.includes('must specify an Extension ID') ||
      errorMessage.includes('Error in invocation of runtime.sendMessage') ||
      errorStack.includes('chrome-extension://') ||
      errorStack.includes('chrome.runtime') ||
      errorMessage.includes('Failed to connect to MetaMask') ||
      errorStack.includes('nkbihfbeogaeaoehlefnkodbefgpgknn')
    
    if (isExtensionError) {
      // Silently ignore extension errors
      return
    }
    
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // If it's a ChunkLoadError, log additional info
    if (error.message && error.message.includes('ChunkLoadError')) {
      console.error('ChunkLoadError detected. This might be due to:')
      console.error('1. Browser extensions blocking chunk loading')
      console.error('2. Network issues')
      console.error('3. Stale cache - try hard refresh (Ctrl+Shift+R)')
    }
  }

  render() {
    if (this.state.hasError) {
      const error = this.state.error
      return this.props.fallback || (
        <div className="fixed inset-0 z-[99998] bg-black text-white p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-red-400">Error Boundary Caught an Error</h2>
            <p className="text-lg mb-6 text-gray-300">
              Something went wrong. Error details below:
            </p>
            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded">
                <div className="font-mono text-sm">
                  <div className="text-red-300 font-bold mb-2">Error Message:</div>
                  <div className="text-white mb-4">{error.message || String(error)}</div>
                  {error.stack && (
                    <>
                      <div className="text-red-300 font-bold mb-2">Stack Trace:</div>
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap break-all">
                        {error.stack}
                      </pre>
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="flex gap-4">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
              <button
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

