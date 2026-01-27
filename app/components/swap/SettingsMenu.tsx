'use client'

import { useState } from 'react'

interface SettingsMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsMenu({ isOpen, onClose }: SettingsMenuProps) {
  const [deadline, setDeadline] = useState('5m')
  const [priority, setPriority] = useState<'Fast' | 'Balanced' | 'Best price'>('Balanced')
  const [fillType, setFillType] = useState<'partial' | 'full'>('full')

  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      {/* Settings Panel */}
      <div className="absolute right-0 top-full mt-2 w-64 backdrop-blur-xl bg-[rgba(255,255,255,0.05)] rounded-2xl p-4 border border-white/10 z-50 space-y-4">
        {/* Max execution time */}
        <div>
          <label className="text-xs text-gray-400 font-light mb-2 block">Max execution time</label>
          <div className="flex gap-2 flex-wrap">
            {['5m', '15m', '30m', 'custom'].map((time) => (
              <button
                key={time}
                onClick={() => {
                  if (time !== 'custom') {
                    setDeadline(time)
                  }
                }}
                className={`px-3 py-2 rounded-lg text-xs font-light transition-colors ${
                  deadline === time
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/5'
                }`}
              >
                {time === 'custom' ? 'Custom' : time}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="text-xs text-gray-400 font-light mb-2 block">Priority</label>
          <div className="flex gap-2 flex-wrap">
            {(['Fast', 'Balanced', 'Best price'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`px-3 py-2 rounded-lg text-xs font-light transition-colors ${
                  priority === p
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/5'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Fill Type */}
        <div>
          <label className="text-xs text-gray-400 font-light mb-2 block">Fill type</label>
          <div className="flex gap-2">
            {(['partial', 'full'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFillType(type)}
                className={`px-3 py-2 rounded-lg text-xs font-light transition-colors capitalize ${
                  fillType === type
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/5'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
