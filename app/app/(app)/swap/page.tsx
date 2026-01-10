'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TokenSelect, type Token } from '@/components/swap/TokenSelect'
import { NetworkSelect } from '@/components/swap/NetworkSelect'
import { RouteDetails } from '@/components/swap/RouteDetails'
import { WalletModal } from '@/components/swap/WalletModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowUpDown } from 'lucide-react'
import { useSafeAccount, useSafeConnect } from '@/lib/wagmi/safeHooks'

export default function SwapPage() {
  const { address, isConnected } = useSafeAccount()
  const { connect, connectors } = useSafeConnect()
  const [fromNetwork, setFromNetwork] = useState<string>('')
  const [fromToken, setFromToken] = useState<string>('')
  const [toNetwork, setToNetwork] = useState<string>('')
  const [toToken, setToToken] = useState<string>('')
  const [fromAmount, setFromAmount] = useState<string>('')
  const [toAmount, setToAmount] = useState<string | null>(null)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [tokens, setTokens] = useState<Token[]>([])
  const [networks, setNetworks] = useState<Array<{ id: string; name: string; icon?: string }>>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch tokens and networks
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch chains/networks
        const chainsRes = await fetch('/api/chains')
        const chainsData = await chainsRes.json()
        if (chainsData.chains) {
          setNetworks(chainsData.chains.map((chain: any) => ({
            id: chain.id || chain.chainId,
            name: chain.name,
            icon: chain.icon
          })))
        }

        // Fetch tokens (simplified - you may need to adjust based on your API)
        // For now, using a basic list
        setTokens([
          { id: 'eth', symbol: 'ETH', name: 'Ethereum', icon: '/icons/eth.png' },
          { id: 'usdt', symbol: 'USDT', name: 'Tether', icon: '/icons/usdt.png' },
          { id: 'usdc', symbol: 'USDC', name: 'USD Coin', icon: '/icons/usdc.png' },
        ])
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to fetch data:', error)
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSwap = useCallback(() => {
    const tempNetwork = fromNetwork
    const tempToken = fromToken
    const tempAmount = fromAmount
    
    setFromNetwork(toNetwork)
    setFromToken(toToken)
    setFromAmount(toAmount || '')
    setToNetwork(tempNetwork)
    setToToken(tempToken)
    setToAmount(tempAmount)
  }, [fromNetwork, fromToken, fromAmount, toNetwork, toToken, toAmount])

  const handleExecute = useCallback(async () => {
    if (!fromNetwork || !fromToken || !toNetwork || !toToken || !fromAmount) {
      return
    }

    if (!isConnected) {
      const availableConnector = connectors[0]
      if (availableConnector) {
        connect({ connector: availableConnector })
      }
      return
    }

    try {
      // Execute swap logic here
      console.log('Executing swap:', { fromNetwork, fromToken, toNetwork, toToken, fromAmount })
      // TODO: Implement actual swap execution
    } catch (error) {
      console.error('Swap execution failed:', error)
    }
  }, [fromNetwork, fromToken, toNetwork, toToken, fromAmount, isConnected, connectors, connect])

  if (isLoading) {
    return (
      <section className="relative z-10 min-h-screen flex items-center justify-center px-6 md:px-12 py-32">
        <div className="max-w-md mx-auto w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl p-8 md:p-12 border border-white/10 text-center"
          >
            <p className="text-gray-400 font-light">Loading...</p>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center px-6 md:px-12 py-32">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-start">
          {/* Left Column - Main Swap Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass rounded-2xl p-8 md:p-12 border border-white/10 shadow-xl"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-light mb-2">Swap</h1>
              <p className="text-sm text-gray-400 font-light">
                Swap tokens across networks
              </p>
            </div>

            <div className="space-y-4">
              {/* From */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500 font-light">You pay</label>
                <div className="space-y-2">
                  <NetworkSelect
                    networks={networks}
                    value={fromNetwork}
                    onValueChange={setFromNetwork}
                    placeholder="Select network"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                      placeholder="0.0"
                      className="flex-1 bg-white/5 border-white/10 text-white font-light"
                    />
                    <TokenSelect
                      tokens={tokens}
                      value={fromToken}
                      onValueChange={setFromToken}
                      placeholder="Select token"
                    />
                  </div>
                </div>
              </div>

              {/* To */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500 font-light">You receive</label>
                <div className="space-y-2">
                  <NetworkSelect
                    networks={networks}
                    value={toNetwork}
                    onValueChange={setToNetwork}
                    placeholder="Select network"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={toAmount || ''}
                      placeholder="0.0"
                      disabled
                      className="flex-1 bg-white/5 border-white/10 text-gray-400 font-light"
                    />
                    <TokenSelect
                      tokens={tokens}
                      value={toToken}
                      onValueChange={setToToken}
                      placeholder="Select token"
                    />
                  </div>
                </div>
              </div>

              {/* Execute Button */}
              <Button
                onClick={handleExecute}
                disabled={!fromNetwork || !fromToken || !toNetwork || !toToken || !fromAmount}
                className="w-full h-12 bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 text-white rounded-xl hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 hover:border-pink-400/50 shadow-lg shadow-accent/20 hover:shadow-accent/30 disabled:opacity-50 disabled:cursor-not-allowed font-light transition-all duration-300 mt-6"
              >
                {isConnected ? 'Swap' : 'Connect Wallet to Swap'}
              </Button>
            </div>
          </motion.div>

          {/* Center - Swap Button */}
          <div className="flex items-center justify-center relative z-10 hidden lg:flex">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSwap}
              className="w-12 h-12 rounded-full glass-strong border border-white/20 flex items-center justify-center hover:border-pink-400/50 transition-colors shadow-lg"
            >
              <ArrowUpDown className="w-5 h-5 text-gray-300" />
            </motion.button>
          </div>

          {/* Right Column - Service Panel (Route Details) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass rounded-2xl p-8 md:p-12 border border-white/10 shadow-xl hidden lg:block"
          >
            <div className="text-center mb-8">
              <h2 className="text-xl font-light mb-2">Route Details</h2>
              <p className="text-xs text-gray-400 font-light">
                Execution information
              </p>
            </div>

            {(fromNetwork || fromToken || toNetwork || toToken) ? (
              <RouteDetails
                fromNetwork={networks.find(n => n.id === fromNetwork)?.name}
                fromToken={tokens.find(t => t.id === fromToken)?.symbol}
                toNetwork={networks.find(n => n.id === toNetwork)?.name}
                toToken={tokens.find(t => t.id === toToken)?.symbol}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 font-light">
                  Select tokens to see route details
                </p>
              </div>
            )}
          </motion.div>

          {/* Mobile Swap Button - shown below main panel on mobile */}
          <div className="flex items-center justify-center relative z-10 lg:hidden -my-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSwap}
              className="w-10 h-10 rounded-full glass-strong border border-white/20 flex items-center justify-center hover:border-pink-400/50 transition-colors"
            >
              <ArrowUpDown className="w-4 h-4 text-gray-300" />
            </motion.button>
          </div>

          {/* Mobile Route Details - shown below on mobile */}
          {(fromNetwork || fromToken || toNetwork || toToken) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6 border border-white/10 lg:hidden"
            >
              <h3 className="text-lg font-light mb-4 text-center">Route Details</h3>
              <RouteDetails
                fromNetwork={networks.find(n => n.id === fromNetwork)?.name}
                fromToken={tokens.find(t => t.id === fromToken)?.symbol}
                toNetwork={networks.find(n => n.id === toNetwork)?.name}
                toToken={tokens.find(t => t.id === toToken)?.symbol}
              />
            </motion.div>
          )}
        </div>
      </div>

      <WalletModal
        open={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </section>
  )
}
