'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import Background from '@/components/Background'
import NewYearAnimation from '@/components/NewYearAnimation'

const navItems = [
  { href: '/swap', label: 'Swap' },
  { href: '/history', label: 'History' },
  { href: '/badges', label: 'Badges' },
  { href: '/referral', label: 'Referral' },
  { href: '/earn', label: 'Earn' },
  { href: '/feedback', label: 'Feedback' },
]

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAccessPage = pathname === '/access'

  return (
    <div className="relative min-h-screen">
      <Background />
      <NewYearAnimation />
      
      {/* Navigation */}
      <nav className={`relative z-20 border-b border-white/10 backdrop-blur-xl bg-[rgba(255,255,255,0.03)]`}>
        <div className="w-full">
          <div className="flex items-center justify-between h-16">
            {/* Logo - у левого края с минимальным отступом */}
            <Link href={isAccessPage ? "/" : "/swap"} className="flex items-center h-full pl-0.5 sm:pl-1 md:pl-3">
              <Image
                src="/kielswaplogo.png"
                alt="Kielswap"
                width={120}
                height={40}
                className="h-6 w-auto object-contain"
                priority
              />
            </Link>
            
            {/* Navigation Items - hidden on /access - у правого края с минимальным отступом */}
            {!isAccessPage && (
              <div className="flex items-center gap-1 pr-0.5 sm:pr-1 md:pr-3">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href === '/swap' && pathname === '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-4 py-2 text-sm font-light rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'text-white bg-white/10'
                          : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10">
        {children}
      </main>
    </div>
  )
}
