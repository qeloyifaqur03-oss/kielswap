'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import NewYearAnimation from '@/components/NewYearAnimation'

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="relative z-10">
      <NewYearAnimation />
      <Header />
      {children}
      <Footer />
    </main>
  )
}













