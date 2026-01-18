'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, Lock } from 'lucide-react'
import Background from '@/components/Background'
import NewYearAnimation from '@/components/NewYearAnimation'
import { useSafeAccount, useSafeConnect, useSafeDisconnect } from '@/lib/wagmi/safeHooks'
import { InlineDropdown } from '@/components/InlineDropdown'
import { DevDomDiagnostics } from '@/components/DevDomDiagnostics'

// Format address for display
function formatAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Check if user has earned badges for a specific address
function hasEarnedBadges(address?: string): boolean {
  if (!address) return false
  try {
    const stored = localStorage.getItem('earned_badges')
    if (stored) {
      const badgesByAddress = JSON.parse(stored)
      // Support both old format (array) and new format (object with addresses)
      if (Array.isArray(badgesByAddress)) {
        return badgesByAddress.length > 0
      }
      if (badgesByAddress && typeof badgesByAddress === 'object') {
        const badges = badgesByAddress[address.toLowerCase()]
        return Array.isArray(badges) && badges.length > 0
      }
    }
  } catch (error) {
    // Ignore errors
  }
  return false
}

// Check if user has any eligible badges that are NOT yet claimed for a specific address
function hasEligibleBadges(address?: string): boolean {
  if (!address) return false
  try {
    // Get list of claimed badges for this address
    const claimedStr = localStorage.getItem('earned_badges')
    let claimed: string[] = []
    
    if (claimedStr) {
      const badgesByAddress = JSON.parse(claimedStr)
      // Support both old format (array) and new format (object with addresses)
      if (Array.isArray(badgesByAddress)) {
        claimed = badgesByAddress // Old format - use all claimed badges
      } else if (badgesByAddress && typeof badgesByAddress === 'object') {
        claimed = badgesByAddress[address.toLowerCase()] || []
      }
    }

    // Early Intent User - available immediately after access code
    const hasAccess = localStorage.getItem('access_granted') === 'true'
    if (hasAccess && !claimed.includes('beta-participant')) return true

    // Product Contributor - at least 1 feedback
    const feedbackCount = parseInt(localStorage.getItem('feedback_count') || '0', 10)
    if (feedbackCount >= 1 && !claimed.includes('feedback-contributor')) return true

    // Explorer - 3 conditions
    const swapCount = parseInt(localStorage.getItem('total_swaps') || '0', 10)
    const bridgeCount = parseInt(localStorage.getItem('bridge_count') || '0', 10)
    const volume = parseFloat(localStorage.getItem('total_volume') || '0')
    if (swapCount >= 1 && bridgeCount >= 1 && volume >= 100 && !claimed.includes('explorer')) return true

    // Connector - 1 referral + referral did 1 swap
    const referralsCount = parseInt(localStorage.getItem('referrals_count') || '0', 10)
    const referralSwaps = parseInt(localStorage.getItem('referral_swaps') || '0', 10)
    if (referralsCount >= 1 && referralSwaps >= 1 && !claimed.includes('referral')) return true
  } catch (error) {
    // Ignore errors
  }
  return false
}

const moreMenuItems = [
  { href: '/history', label: 'History' },
  { href: '/referral', label: 'Referral' },
  { href: '/feedback', label: 'Feedback' },
  { href: '/earn', label: 'Earn', disabled: true },
]

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const isAccessPage = pathname === '/access'
  const { isConnected, address } = useSafeAccount()
  const { connect, connectors } = useSafeConnect()
  const { disconnect } = useSafeDisconnect()
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false)
  const [hasBadges, setHasBadges] = useState(false)

  // Check for eligible badges - reactive to localStorage changes
  useEffect(() => {
    // Set access_granted flag when user has access (already on /swap page means access granted)
    if (!isAccessPage) {
      localStorage.setItem('access_granted', 'true')
    }
    
    const checkBadges = () => {
      setHasBadges(hasEligibleBadges(address || undefined))
    }
    
    // Initial check
    checkBadges()
    
    // Listen for storage changes (when badges become eligible or earned)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'earned_badges' || e.key === 'access_granted' || e.key === 'feedback_count' || e.key === 'total_swaps' || e.key === 'bridge_count' || e.key === 'total_volume' || e.key === 'referrals_count' || e.key === 'referral_swaps') {
        checkBadges()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also check on focus (for same-tab updates)
    const handleFocus = () => checkBadges()
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [address]) // Re-check when address changes

  const handleConnectWallet = () => {
    if (connectors && connectors.length > 0) {
      connect({ connector: connectors[0] })
    }
  }

  const handleDisconnect = () => {
    disconnect()
    setIsWalletDropdownOpen(false)
  }

  const handleProfile = () => {
    router.push('/profile')
    setIsWalletDropdownOpen(false)
  }

  return (
    <div className="relative min-h-screen">
      <DevDomDiagnostics />
      <Background />
      <NewYearAnimation />
      {/* Dark overlay - only for pages except /access */}
      {!isAccessPage && (
        <div className="fixed inset-0 z-[1] bg-black/20 pointer-events-none" />
      )}
      
      {/* Navigation */}
      <nav className={`relative z-20 border-b border-white/10 backdrop-blur-xl bg-[rgba(255,255,255,0.03)]`}>
        <div className="w-full">
          <div className="flex items-center justify-between h-16">
            {/* Logo - at left edge with minimal padding */}
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
            
            {/* Navigation Items - hidden on /access - at right edge with minimal padding */}
            {!isAccessPage && (
              <div className="flex items-center gap-1 pr-0.5 sm:pr-1 md:pr-3">
                {/* Swap */}
                <Link
                  href="/swap"
                  className="px-4 py-2 text-sm font-light rounded-lg transition-all duration-200 text-gray-400 hover:text-gray-300 hover:bg-white/5"
                >
                  Swap
                </Link>

                {/* Badges */}
                <Link
                  href="/badges"
                  className="px-4 py-2 text-sm font-light rounded-lg transition-all duration-200 relative text-gray-400 hover:text-gray-300 hover:bg-white/5"
                >
                  <span className={`relative ${hasBadges ? 'drop-shadow-[0_0_12px_rgba(236,72,153,0.6)] text-white' : ''}`}>
                    Badges
                    {hasBadges && (
                      <>
                        <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-gradient-to-r from-pink-500/80 via-accent/80 to-purple-500/80 shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gradient-to-r from-pink-400 via-accent to-purple-400 shadow-[0_0_6px_rgba(236,72,153,0.8)]" />
                      </>
                    )}
                  </span>
                </Link>

                {/* More */}
                <InlineDropdown
                  open={isMoreOpen}
                  onOpenChange={setIsMoreOpen}
                  align="end"
                  trigger={
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-light rounded-lg transition-all duration-200 flex items-center gap-1 text-gray-400 hover:text-gray-300 hover:bg-white/5"
                    >
                      More
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  }
                >
                  <div className="space-y-1">
                    {moreMenuItems.map((item) => {
                      const isActive = pathname === item.href
                      if (item.disabled) {
                        return (
                          <div
                            key={item.href}
                            className="group relative px-3 py-2 text-sm font-light text-gray-500 cursor-not-allowed flex items-center gap-2 rounded-lg"
                          >
                            <Lock className="w-3 h-3" />
                            {item.label}
                            <div className="absolute left-0 top-full mt-1 px-2 py-1 text-xs font-light text-gray-400 bg-black/80 border border-white/10 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                              Coming soon
                            </div>
                          </div>
                        )
                      }
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMoreOpen(false)}
                          className={`px-3 py-2 text-sm font-light rounded-lg transition-colors block ${
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
                </InlineDropdown>

                {/* Wallet */}
                {!isConnected ? (
                  <button
                    onClick={handleConnectWallet}
                    className="px-4 py-2 text-sm font-light rounded-lg bg-gradient-to-br from-pink-500/30 via-accent/35 to-purple-500/30 border border-pink-400/30 hover:from-pink-500/40 hover:via-accent/45 hover:to-purple-500/40 hover:border-pink-400/50 text-white transition-all duration-300 shadow-lg shadow-accent/20 hover:shadow-accent/30"
                  >
                    Connect wallet
                  </button>
                ) : (
                  <InlineDropdown
                    open={isWalletDropdownOpen}
                    onOpenChange={setIsWalletDropdownOpen}
                    align="end"
                    trigger={
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-light rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors flex items-center gap-2"
                      >
                        {formatAddress(address || '')}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    }
                  >
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={handleProfile}
                        className="w-full px-3 py-2 text-sm font-light text-gray-400 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors text-left"
                      >
                        My profile
                      </button>
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="w-full px-3 py-2 text-sm font-light text-gray-400 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors text-left"
                      >
                        Disconnect
                      </button>
                    </div>
                  </InlineDropdown>
                )}
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
