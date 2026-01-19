'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSafeAccount, useSafeConnect } from '@/lib/wagmi/safeHooks'

export default function ReferralPage() {
  const { isConnected } = useSafeAccount()
  const { connect, connectors } = useSafeConnect()

  const handleConnectWallet = () => {
    const availableConnector = connectors[0]
    if (availableConnector) {
      connect({ connector: availableConnector })
    }
  }

  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-12 py-16 sm:py-24 md:py-32">
      <div className="max-w-2xl mx-auto w-full space-y-4 sm:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl p-6 sm:p-8 md:p-12"
        >
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light mb-2">Referral Program</h1>
            <p className="text-xs sm:text-sm text-gray-400 font-light px-2">
              Invite friends. Earn rewards when referrals use Kielswap.
            </p>
          </div>

          {!isConnected ? (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="text-center mb-4">
                  <p className="text-xs text-gray-500 font-light mb-2">Status</p>
                  <p className="text-sm text-gray-400 font-light">Locked</p>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 font-light">
                    <span>Progress</span>
                    <span>$0 / $10,000</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-pink-500/30 via-accent/35 to-purple-500/30" style={{ width: '0%' }} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-light text-center">
                  Your referral link will appear once unlocked
                </p>
              </div>
              <Button
                onClick={handleConnectWallet}
                className="w-full h-12 bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 text-white rounded-xl hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 hover:border-pink-400/50 shadow-lg shadow-accent/20 hover:shadow-accent/30 font-light transition-all duration-300"
              >
                Connect Wallet
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Locked State */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="text-center mb-4">
                  <p className="text-xs text-gray-500 font-light mb-2">Status</p>
                  <p className="text-sm text-gray-400 font-light">Locked</p>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 font-light">
                    <span>Progress</span>
                    <span>$0 / $10,000</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-pink-500/30 via-accent/35 to-purple-500/30" style={{ width: '0%' }} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-light text-center">
                  Your referral link will appear once unlocked
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
