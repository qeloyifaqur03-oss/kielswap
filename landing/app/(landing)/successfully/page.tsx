'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react'
import { getTokenInfo } from '@/lib/tokens'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SuccessfullyPage() {
  // Fixed prices for display
  const fromAmount = '1000'
  const fromToken = 'USDC'
  const toAmount = '0.333333'
  const toToken = 'ETH'
  const priceRate = '1 ETH = $3,000 USDC'
  const transactionHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  const network = 'Ethereum'

  return (
    <div className="min-h-screen flex items-center justify-center px-6 md:px-12 py-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        {/* Success Card */}
        <div className="glass-strong rounded-3xl p-8 md:p-12 space-y-8">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
            className="flex justify-center"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-3xl md:text-4xl font-light text-center"
          >
            Swap completed successfully
          </motion.h1>

          {/* Swap Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-6"
          >
            {/* From Token */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500 font-light">You paid</span>
                <span className="text-xs text-gray-500">{network}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
                  {(() => {
                    const tokenInfo = getTokenInfo(fromToken.toLowerCase())
                    return tokenInfo?.icon ? (
                      <img
                        src={tokenInfo.icon}
                        alt={fromToken}
                        className="w-7 h-7"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500/20 via-accent/20 to-purple-500/20"></div>
                    )
                  })()}
                </div>
                <div>
                  <div className="text-3xl font-light">{fromAmount}</div>
                  <div className="text-sm text-gray-400 font-light">{fromToken}</div>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <motion.div
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <ArrowRight className="w-6 h-6 text-gray-500 rotate-90" />
              </motion.div>
            </div>

            {/* To Token */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500 font-light">You received</span>
                <span className="text-xs text-gray-500">{network}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
                  {(() => {
                    const tokenInfo = getTokenInfo(toToken.toLowerCase())
                    return tokenInfo?.icon ? (
                      <img
                        src={tokenInfo.icon}
                        alt={toToken}
                        className="w-7 h-7"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500/20 via-accent/20 to-purple-500/20"></div>
                    )
                  })()}
                </div>
                <div>
                  <div className="text-3xl font-light">{toAmount}</div>
                  <div className="text-sm text-gray-400 font-light">{toToken}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Price Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center text-sm text-gray-500 font-light"
          >
            Exchange rate: {priceRate}
          </motion.div>

          {/* Transaction Hash */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="glass rounded-xl p-4 border border-white/5"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 font-light mb-1">Transaction</div>
                <div className="text-sm font-mono text-gray-300 truncate">
                  {transactionHash}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="flex-shrink-0"
                onClick={() => {
                  window.open(`https://etherscan.io/tx/${transactionHash}`, '_blank')
                }}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <Link href="/swap" className="flex-1">
              <Button className="w-full h-12 rounded-xl font-light bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 hover:border-pink-400/50 shadow-lg shadow-accent/20 hover:shadow-accent/30 text-white transition-all duration-300">
                Make another swap
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button
                variant="ghost"
                className="w-full h-12 rounded-xl font-light border border-white/10 hover:bg-white/5"
              >
                Back to home
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

