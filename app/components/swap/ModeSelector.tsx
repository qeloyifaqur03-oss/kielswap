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
    <div className="flex gap-2">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => handleModeChange(mode.id)}
          className={`relative px-4 py-2 rounded-xl text-sm font-light transition-all duration-200 ${
            currentMode === mode.id
              ? 'text-white'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          {currentMode === mode.id && (
            <div className="absolute inset-0 bg-white/10 rounded-xl border border-white/20" />
          )}
          <span className="relative z-10">{mode.label}</span>
        </button>
      ))}
    </div>
  )
}
