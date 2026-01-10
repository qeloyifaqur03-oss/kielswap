'use client'

import { Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function NewYearAnimation() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      setMounted(true)
      
      // Inject CSS animations if not already present
      if (!document.getElementById('newyear-animations')) {
        const style = document.createElement('style')
        style.id = 'newyear-animations'
        style.textContent = `
          @keyframes snowfall {
            0% {
              transform: translateY(0) translateX(0);
              opacity: 0;
            }
            10% {
              opacity: 0.5;
            }
            50% {
              opacity: 0.7;
            }
            90% {
              opacity: 0.5;
            }
            100% {
              transform: translateY(100vh);
              opacity: 0;
            }
          }
          
          @keyframes float {
            0%, 100% {
              transform: translate(0, 0) scale(1);
              opacity: 0.2;
            }
            50% {
              transform: scale(1.3);
              opacity: 0.5;
            }
          }
          
          .snowflake {
            animation: snowfall linear infinite;
          }
          
          .particle {
            animation: float ease-in-out infinite;
          }
        `
        document.head.appendChild(style)
      }
    } catch (error) {
      // Silently handle errors
    }
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Snowflakes / Sparkles */}
      {Array.from({ length: 15 }).map((_, i) => {
        const startX = Math.random() * 100
        const endX = Math.random() * 100
        const delay = Math.random() * 2
        const duration = Math.random() * 3 + 2
        
        return (
          <div
            key={`flake-${i}`}
            className="snowflake absolute"
            style={{
              left: `${startX}%`,
              top: '-20px',
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
              transform: `translateX(${endX - startX}vw)`,
            }}
          >
            <Sparkles className="w-2 h-2 text-accent/35" />
          </div>
        )
      })}

      {/* Floating accent particles */}
      {Array.from({ length: 6 }).map((_, i) => {
        const initialX = Math.random() * 100
        const initialY = Math.random() * 100
        const delay = Math.random() * 2
        const duration = Math.random() * 4 + 3
        
        return (
          <div
            key={`particle-${i}`}
            className="particle absolute w-1 h-1 rounded-full bg-accent/25"
            style={{
              left: `${initialX}%`,
              top: `${initialY}%`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        )
      })}
    </div>
  )
}
