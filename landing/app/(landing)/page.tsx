'use client'

import NewHero from '@/components/NewHero'
import KeyFeatures from '@/components/KeyFeatures'
import VisionSection from '@/components/VisionSection'
import HowItWorks from '@/components/HowItWorks'
import EarlyAccessSection from '@/components/EarlyAccessSection'

export default function Home() {
  return (
    <>
      <NewHero />
      <VisionSection />
      <KeyFeatures />
      <HowItWorks />
      <EarlyAccessSection />
    </>
  )
}

