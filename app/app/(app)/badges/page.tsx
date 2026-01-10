'use client'

import { BadgesPreview } from '@/components/badges/BadgesPreview'
import { useState } from 'react'

export default function BadgesPage() {
  const [hardResetKey, setHardResetKey] = useState(0)

  const handleHardReset = () => {
    // Reset wallet state if needed
    setHardResetKey(prev => prev + 1)
  }

  return <BadgesPreview key={hardResetKey} onHardReset={handleHardReset} />
}

