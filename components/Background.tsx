'use client'

import { useEffect, useRef } from 'react'

export default function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resize()
    window.addEventListener('resize', resize)

    // Create noise texture
    const imageData = ctx.createImageData(canvas.width, canvas.height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255
      data[i] = value
      data[i + 1] = value
      data[i + 2] = value
      data[i + 3] = 3 // Very subtle opacity
    }

    ctx.putImageData(imageData, 0, 0)

    return () => {
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <>
      <div className="fixed inset-0 z-0 overflow-hidden">
        {/* Dark gradient base */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
        
        {/* Blurred blobs */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl animate-slow-float" style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, rgba(196, 37, 88, 0.10) 50%, rgba(147, 51, 234, 0.15) 100%)' }} />
          <div className="absolute top-40 right-20 w-[500px] h-[500px] rounded-full blur-3xl animate-slow-float-reverse" style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.12) 0%, rgba(196, 37, 88, 0.08) 50%, rgba(147, 51, 234, 0.12) 100%)' }} />
          <div className="absolute bottom-20 left-1/4 w-[450px] h-[450px] rounded-full blur-3xl animate-slow-float" style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.10) 0%, rgba(196, 37, 88, 0.06) 50%, rgba(147, 51, 234, 0.10) 100%)' }} />
          <div className="absolute top-1/2 right-1/3 w-80 h-80 rounded-full blur-3xl animate-slow-float-reverse" style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.14) 0%, rgba(196, 37, 88, 0.09) 50%, rgba(147, 51, 234, 0.14) 100%)' }} />
          <div className="absolute bottom-40 right-10 w-[400px] h-[400px] rounded-full blur-3xl animate-slow-float" style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.11) 0%, rgba(196, 37, 88, 0.07) 50%, rgba(147, 51, 234, 0.11) 100%)' }} />
          <div className="absolute top-1/3 left-1/2 w-72 h-72 rounded-full blur-3xl animate-slow-float-reverse" style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.13) 0%, rgba(196, 37, 88, 0.08) 50%, rgba(147, 51, 234, 0.13) 100%)' }} />
        </div>
        
        {/* Noise texture overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full opacity-30"
          style={{ mixBlendMode: 'overlay' }}
        />
      </div>
    </>
  )
}















