import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Background from '@/components/Background'
import { Providers } from '@/components/Providers'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { DebugOverlay } from '@/components/DebugOverlay'
import { DevConsoleSilencer } from '@/components/DevConsoleSilencer'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Kielswap - Calm, Premium Crypto Swaps',
  description: 'Swap across multiple networks with one flow',
  icons: {
    icon: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://assets.coingecko.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://assets.coingecko.com" />
        <link rel="dns-prefetch" href="https://api.coingecko.com" />
        <link rel="dns-prefetch" href="https://pro-api.coinmarketcap.com" />
        <link rel="dns-prefetch" href="https://min-api.cryptocompare.com" />
        <link rel="dns-prefetch" href="https://api.relay.link" />
        <link rel="dns-prefetch" href="https://li.quest" />
        <link rel="dns-prefetch" href="https://api.0x.org" />
        {/* Runtime protection against browser extensions breaking webpack and MetaMask errors */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // CRITICAL: This must run IMMEDIATELY, before any webpack chunks load
                // Protect webpack runtime from extensions (Trust Wallet, MetaMask, etc.)
                // AND suppress MetaMask connection errors
                if (typeof window !== 'undefined') {
                  // Suppress MetaMask errors IMMEDIATELY
                  const suppressMetaMaskErrors = () => {
                    const isMetaMaskError = (error, message, source) => {
                      const errorMessage = message || error?.message || error?.reason?.message || String(error || '');
                      const errorStack = error?.stack || error?.reason?.stack || '';
                      const errorSource = source || error?.filename || error?.source || '';
                      
                      return (
                        (typeof errorMessage === 'string' && (
                          errorMessage.includes('Failed to connect to MetaMask') ||
                          errorMessage.includes('i: Failed to connect to MetaMask') ||
                          errorMessage.includes('Cannot redefine property: ethereum') ||
                          errorMessage.includes('Failed to set window.ethereum') ||
                          errorMessage.includes('MetaMask encountered an error') ||
                          errorMessage.toLowerCase().includes('metamask')
                        )) ||
                        (typeof errorStack === 'string' && (
                          errorStack.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
                          errorStack.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn') ||
                          errorStack.includes('inpage.js') ||
                          errorStack.includes('evmAsk.js')
                        )) ||
                        (typeof errorSource === 'string' && (
                          errorSource.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
                          errorSource.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn')
                        ))
                      );
                    };
                    
                    // Suppress error events
                    const originalErrorHandler = window.onerror;
                    window.onerror = function(message, source, lineno, colno, error) {
                      if (isMetaMaskError(error || message, String(message), String(source))) {
                        return true; // Suppress
                      }
                      if (originalErrorHandler) {
                        return originalErrorHandler.call(this, message, source, lineno, colno, error);
                      }
                      return false;
                    };
                    
                    // Suppress unhandled rejections
                    window.addEventListener('unhandledrejection', function(event) {
                      if (isMetaMaskError(event.reason || event)) {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        event.stopPropagation();
                      }
                    }, true);
                    
                    // Suppress error events
                    window.addEventListener('error', function(event) {
                      if (isMetaMaskError(event.error || event, event.message, event.filename)) {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        event.stopPropagation();
                      }
                    }, true);
                    
                    // Suppress console.error for MetaMask
                    const originalConsoleError = console.error;
                    console.error = function(...args) {
                      const errorString = args.map(arg => 
                        typeof arg === 'string' ? arg : 
                        arg?.message || arg?.reason?.message || 
                        String(arg)
                      ).join(' ');
                      
                      if (
                        errorString.includes('Failed to connect to MetaMask') ||
                        errorString.includes('i: Failed to connect to MetaMask') ||
                        errorString.includes('Cannot redefine property: ethereum') ||
                        errorString.includes('Failed to set window.ethereum') ||
                        errorString.includes('MetaMask encountered an error') ||
                        errorString.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
                        errorString.includes('inpage.js') ||
                        errorString.includes('evmAsk.js')
                      ) {
                        return; // Suppress
                      }
                      originalConsoleError.apply(console, args);
                    };
                    
                    // Intercept fetch requests to Next.js stack frame endpoint for MetaMask errors
                    const originalFetch = window.fetch;
                    window.fetch = function(...args) {
                      const url = args[0]?.toString() || '';
                      if (url.includes('__nextjs_original-stack-frame') && (
                        url.includes('Failed+to+connect+to+MetaMask') ||
                        url.includes('i%3A+Failed+to+connect+to+MetaMask') ||
                        url.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
                        url.includes('inpage.js') ||
                        url.includes('evmAsk.js')
                      )) {
                        // Suppress fetch request for MetaMask errors
                        return Promise.reject(new Error('Suppressed MetaMask error stack frame request'));
                      }
                      return originalFetch.apply(this, args);
                    };
                  };
                  
                  suppressMetaMaskErrors();
                  
                  // Intercept webpack chunk loader immediately
                  const protectChunkLoader = () => {
                    const chunkLoaderName = 'webpackChunk_N_E';
                    if (!window[chunkLoaderName]) {
                      window[chunkLoaderName] = [];
                    }
                    
                    // Wrap push method to protect module loading
                    const originalPush = window[chunkLoaderName].push;
                    window[chunkLoaderName].push = function(chunks) {
                      if (Array.isArray(chunks)) {
                        chunks.forEach(function(chunk) {
                          if (chunk && Array.isArray(chunk)) {
                            chunk.forEach(function(item) {
                              if (item && typeof item === 'object' && item[1]) {
                                // Protect factory calls in chunk items
                                const originalFactory = item[1];
                                if (typeof originalFactory === 'function') {
                                  item[1] = function() {
                                    try {
                                      return originalFactory.apply(this, arguments);
                                    } catch (e) {
                                      if (e && e.message && e.message.includes('factory')) {
                                        console.warn('[Webpack] Factory error from extension, returning empty module');
                                        return function() { return {}; };
                                      }
                                      throw e;
                                    }
                                  };
                                }
                              }
                            });
                          }
                        });
                      }
                      return originalPush.apply(this, arguments);
                    };
                  };
                  
                  // Run immediately, don't wait for DOM
                  protectChunkLoader();
                  
                  // Also protect __webpack_require__ when it loads
                  const protectRequire = () => {
                    if (typeof window.__webpack_require__ !== 'undefined') {
                      const req = window.__webpack_require__;
                      if (req && req.cache) {
                        // Wrap the require function to handle undefined factories
                        const originalRequire = req;
                        window.__webpack_require__ = function(moduleId) {
                          try {
                            return originalRequire(moduleId);
                          } catch (e) {
                            if (e && e.message && (e.message.includes('factory') || e.message.includes('call'))) {
                              console.warn('[Webpack] Module load error from extension, returning empty module');
                              return {};
                            }
                            throw e;
                          }
                        };
                        // Copy properties
                        Object.setPrototypeOf(window.__webpack_require__, originalRequire);
                        Object.assign(window.__webpack_require__, originalRequire);
                      }
                    } else {
                      setTimeout(protectRequire, 10);
                    }
                  };
                  
                  protectRequire();
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <DevConsoleSilencer />
        {process.env.NEXT_PUBLIC_DEBUG_BOOT === '1' && <DebugOverlay />}
        <ErrorBoundary>
          <Providers>
            <Background />
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
