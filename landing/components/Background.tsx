'use client'

import { useEffect, useRef } from 'react'
import { useResponsiveCanvas } from '@/lib/useResponsiveCanvas'

export default function Background() {
  const { canvasRef, containerRef, width, height, dpr, reducedMotion, isVisible } = useResponsiveCanvas({
    maxDpr: 2,
    minDpr: 1,
    pauseOnHidden: true,
    respectReducedMotion: true,
    resizeThrottle: 100,
  })

  // Render noise texture
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || width === 0 || height === 0 || !isVisible) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Skip if reduced motion is enabled
    if (reducedMotion) {
      // Fill with subtle static color instead of noise
      ctx.fillStyle = 'rgba(255, 255, 255, 0.01)'
      ctx.fillRect(0, 0, width / dpr, height / dpr)
      return
    }

    // Create noise texture at CSS size (context is already scaled by dpr)
    const cssWidth = width / dpr
    const cssHeight = height / dpr
    const imageData = ctx.createImageData(cssWidth, cssHeight)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255
      data[i] = value
      data[i + 1] = value
      data[i + 2] = value
      data[i + 3] = 3 // Very subtle opacity
    }

    ctx.putImageData(imageData, 0, 0)
  }, [canvasRef, width, height, dpr, reducedMotion, isVisible])

  return (
    <div ref={containerRef} className="fixed inset-0 z-0 overflow-hidden">
      {/* Dark gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
      
      {/* Blurred blobs - responsive sizes */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className={`absolute top-20 left-10 w-64 h-64 md:w-96 md:h-96 rounded-full blur-3xl ${reducedMotion ? '' : 'animate-slow-float'}`} style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, rgba(196, 37, 88, 0.10) 50%, rgba(147, 51, 234, 0.15) 100%)' }} />
        <div className={`absolute top-40 right-20 w-80 h-80 md:w-[500px] md:h-[500px] rounded-full blur-3xl ${reducedMotion ? '' : 'animate-slow-float-reverse'}`} style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.12) 0%, rgba(196, 37, 88, 0.08) 50%, rgba(147, 51, 234, 0.12) 100%)' }} />
        <div className={`absolute bottom-20 left-1/4 w-72 h-72 md:w-[450px] md:h-[450px] rounded-full blur-3xl ${reducedMotion ? '' : 'animate-slow-float'}`} style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.10) 0%, rgba(196, 37, 88, 0.06) 50%, rgba(147, 51, 234, 0.10) 100%)' }} />
        <div className={`absolute top-1/2 right-1/3 w-56 h-56 md:w-80 md:h-80 rounded-full blur-3xl ${reducedMotion ? '' : 'animate-slow-float-reverse'}`} style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.14) 0%, rgba(196, 37, 88, 0.09) 50%, rgba(147, 51, 234, 0.14) 100%)' }} />
        <div className={`absolute bottom-40 right-10 w-64 h-64 md:w-[400px] md:h-[400px] rounded-full blur-3xl ${reducedMotion ? '' : 'animate-slow-float'}`} style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.11) 0%, rgba(196, 37, 88, 0.07) 50%, rgba(147, 51, 234, 0.11) 100%)' }} />
        <div className={`absolute top-1/3 left-1/2 w-48 h-48 md:w-72 md:h-72 rounded-full blur-3xl ${reducedMotion ? '' : 'animate-slow-float-reverse'}`} style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.13) 0%, rgba(196, 37, 88, 0.08) 50%, rgba(147, 51, 234, 0.13) 100%)' }} />
      </div>
      
      {/* Noise texture overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
        style={{ mixBlendMode: 'overlay' }}
      />
    </div>
  )
}
