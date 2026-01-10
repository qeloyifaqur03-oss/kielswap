'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Gift, Users, Award, TrendingUp } from 'lucide-react'

export default function EarnPage() {
  const earningMethods = [
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Referral Program',
      description: 'Share kielswap with friends and earn rewards when they use the platform',
      link: '/referral',
      gradient: 'from-pink-500/20 via-accent/25 to-purple-500/20',
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: 'Badges & Achievements',
      description: 'Complete tasks and unlock badges to earn rewards and recognition',
      link: '/badges',
      gradient: 'from-purple-500/20 via-accent/25 to-pink-500/20',
    },
  ]

  return (
    <section className="relative z-10 min-h-screen px-6 md:px-12 py-12 md:py-16">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-light mb-4">Earn with kielswap</h1>
          <p className="text-sm text-gray-400 font-light max-w-2xl mx-auto">
            Discover ways to earn rewards, unlock badges, and contribute to the kielswap ecosystem
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {earningMethods.map((method, index) => (
            <motion.div
              key={method.link}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="glass rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 group"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${method.gradient} flex items-center justify-center mb-4 border border-white/10 text-white group-hover:scale-110 transition-transform duration-300`}>
                {method.icon}
              </div>
              <h2 className="text-xl font-light text-white mb-2">{method.title}</h2>
              <p className="text-sm text-gray-400 font-light mb-6">
                {method.description}
              </p>
              <Link href={method.link}>
                <Button className="w-full h-11 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-light rounded-xl transition-all duration-200 group-hover:border-pink-400/30">
                  Learn More
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glass rounded-2xl p-8 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-light text-white">Earning Opportunities</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-light text-white mb-2">0</p>
              <p className="text-xs text-gray-500 font-light">Active Referrals</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-light text-white mb-2">0</p>
              <p className="text-xs text-gray-500 font-light">Badges Earned</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-light text-white mb-2">$0</p>
              <p className="text-xs text-gray-500 font-light">Total Rewards</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

