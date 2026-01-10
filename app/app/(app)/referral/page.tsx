'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSafeAccount, useSafeConnect } from '@/lib/wagmi/safeHooks'
import { Copy, Check, ExternalLink } from 'lucide-react'

export default function ReferralPage() {
  const { address, isConnected } = useSafeAccount()
  const { connect, connectors } = useSafeConnect()
  const [copied, setCopied] = useState(false)
  const [referralCode, setReferralCode] = useState('')

  const referralLink = address 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/access?ref=${address.slice(0, 8)}`
    : ''

  const handleCopy = async () => {
    if (referralLink) {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleConnectWallet = () => {
    const availableConnector = connectors[0]
    if (availableConnector) {
      connect({ connector: availableConnector })
    }
  }

  const handleVerifyCode = async () => {
    if (!referralCode.trim()) return
    // TODO: Implement referral code verification
    console.log('Verifying referral code:', referralCode)
  }

  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center px-6 md:px-12 py-32">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl p-8 md:p-12 border border-white/10 shadow-xl"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-light mb-2">Referral Program</h1>
            <p className="text-sm text-gray-400 font-light">
              Share kielswap and earn rewards
            </p>
          </div>

          {!isConnected ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-400 font-light text-center">
                Connect your wallet to get your referral link
              </p>
              <Button
                onClick={handleConnectWallet}
                className="w-full h-12 bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 text-white rounded-xl hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 hover:border-pink-400/50 shadow-lg shadow-accent/20 hover:shadow-accent/30 font-light transition-all duration-300"
              >
                Connect Wallet
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Share Your Link */}
              <div className="space-y-3">
                <label className="text-xs text-gray-500 font-light">Your Referral Link</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 bg-white/5 border-white/10 text-white font-light"
                  />
                  <Button
                    onClick={handleCopy}
                    className="px-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-light rounded-xl transition-all duration-200"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {copied && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-gray-500 font-light text-center"
                  >
                    Copied to clipboard!
                  </motion.p>
                )}
              </div>

              {/* Verify Referral Code */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <label className="text-xs text-gray-500 font-light">Verify Referral Code</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 bg-white/5 border-white/10 text-white font-light"
                  />
                  <Button
                    onClick={handleVerifyCode}
                    disabled={!referralCode.trim()}
                    className="px-6 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-light rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Verify
                  </Button>
                </div>
              </div>

              {/* Stats Section */}
              <div className="pt-6 border-t border-white/10">
                <h3 className="text-sm font-light text-white mb-4">Your Referral Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-strong rounded-xl p-4 border border-white/10">
                    <p className="text-xs text-gray-500 font-light mb-1">Total Referrals</p>
                    <p className="text-2xl font-light text-white">0</p>
                  </div>
                  <div className="glass-strong rounded-xl p-4 border border-white/10">
                    <p className="text-xs text-gray-500 font-light mb-1">Rewards Earned</p>
                    <p className="text-2xl font-light text-white">0</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
