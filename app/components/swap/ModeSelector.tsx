'use client'

import { useRouter } from 'next/navigation'

interface ModeSelectorProps {
  currentMode: 'instant' | 'intent' | 'limit'
}

export function ModeSelector({ currentMode }: ModeSelectorProps) {
  const router = useRouter()

  const modes = [
    { id: 'intent', label: 'Intent' },
    { id: 'instant', label: 'Instant' },
    { id: 'limit', label: 'Limit' },
  ] as const

  const handleModeChange = (mode: string) => {
    router.push(`/swap?mode=${mode}`)
  }

  return (
    <div className="flex gap-1 sm:gap-2">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => handleModeChange(mode.id)}
          className={`relative px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-light transition-all duration-200 ${
            currentMode === mode.id
              ? 'text-white'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          {currentMode === mode.id && (
            <div className="absolute inset-0 bg-white/10 rounded-lg sm:rounded-xl border border-white/20" />
          )}
          <span className="relative z-10">{mode.label}</span>
        </button>
      ))}
    </div>
  )
}
