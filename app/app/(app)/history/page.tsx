'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSafeAccount, useSafeConnect } from '@/lib/wagmi/safeHooks'
import { Button } from '@/components/ui/button'
import { ExternalLink, Clock, CheckCircle, XCircle, Loader } from 'lucide-react'

interface HistoryItem {
  id: string
  timestamp: number
  fromToken: string
  fromNetwork: string
  toToken: string
  toNetwork: string
  amount: string
  status: 'pending' | 'completed' | 'failed'
  txHash?: string
}

export default function HistoryPage() {
  const { address, isConnected } = useSafeAccount()
  const { connect, connectors } = useSafeConnect()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isConnected && address) {
      // TODO: Fetch actual history from API
      fetchHistory(address)
    } else {
      setIsLoading(false)
    }
  }, [isConnected, address])

  const fetchHistory = async (walletAddress: string) => {
    setIsLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/history?address=${walletAddress}`)
      // const data = await response.json()
      // setHistory(data.history || [])
      
      // Mock data for now
      setHistory([])
    } catch (error) {
      console.error('Failed to fetch history:', error)
      setHistory([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectWallet = () => {
    const availableConnector = connectors[0]
    if (availableConnector) {
      connect({ connector: availableConnector })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />
      case 'pending':
        return <Loader className="w-4 h-4 text-yellow-400 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'failed':
        return 'Failed'
      case 'pending':
        return 'Pending'
      default:
        return 'Unknown'
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <section className="relative z-10 min-h-screen px-6 md:px-12 py-12 md:py-16">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl p-8 md:p-12 border border-white/10 shadow-xl"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-light mb-2">History</h1>
            <p className="text-sm text-gray-400 font-light">
              Your swap transaction history
            </p>
          </div>

          {!isConnected ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-gray-400 font-light">
                Connect your wallet to view your transaction history
              </p>
              <Button
                onClick={handleConnectWallet}
                className="h-12 bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 text-white rounded-xl hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 hover:border-pink-400/50 shadow-lg shadow-accent/20 hover:shadow-accent/30 font-light transition-all duration-300"
              >
                Connect Wallet
              </Button>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <Loader className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-400 font-light">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400 font-light mb-4">
                No transactions yet
              </p>
              <p className="text-xs text-gray-500 font-light">
                Your swap history will appear here once you start using kielswap
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-strong rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(item.status)}
                        <span className="text-sm font-light text-white">
                          {item.amount} {item.fromToken} → {item.toToken}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 font-light ml-7">
                        {item.fromNetwork} → {item.toNetwork} • {formatDate(item.timestamp)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-light px-2 py-1 rounded ${
                        item.status === 'completed' ? 'text-green-400 bg-green-400/10' :
                        item.status === 'failed' ? 'text-red-400 bg-red-400/10' :
                        'text-yellow-400 bg-yellow-400/10'
                      }`}>
                        {getStatusText(item.status)}
                      </span>
                      {item.txHash && (
                        <a
                          href={`https://etherscan.io/tx/${item.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
