'use client'

import { useEffect, useRef, useState } from 'react'

interface MobileScaleCanvasProps {
  designWidth: number
  children: React.ReactNode
  minScale?: number
  className?: string
}

export function MobileScaleCanvas({
  designWidth,
  children,
  minScale = 0.85,
  className = '',
}: MobileScaleCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [contentHeight, setContentHeight] = useState<number | null>(null)

  useEffect(() => {
    const updateScale = () => {
      if (typeof window === 'undefined') return

      const viewportWidth = window.innerWidth
      
      // Only apply scaling on mobile (<=768px)
      if (viewportWidth > 768) {
        setScale(1)
        setContentHeight(null)
        return
      }

      // Calculate scale: min(1, viewportWidth / designWidth)
      // But ensure it doesn't go below minScale
      let calculatedScale = Math.min(1, viewportWidth / designWidth)
      
      // If calculated scale is below minScale, use minScale
      // But then we need to ensure content fits - add horizontal padding if needed
      if (calculatedScale < minScale) {
        calculatedScale = minScale
      }
      
      setScale(calculatedScale)
    }

    // Initial calculation
    updateScale()

    // Update on resize
    window.addEventListener('resize', updateScale)

    return () => {
      window.removeEventListener('resize', updateScale)
    }
  }, [designWidth, minScale])

  // Separate effect for ResizeObserver to track content height
  useEffect(() => {
    if (!contentRef.current || typeof ResizeObserver === 'undefined') return

    const resizeObserver = new ResizeObserver(() => {
      if (contentRef.current) {
        const height = contentRef.current.scrollHeight
        setContentHeight(height)
      }
    })

    resizeObserver.observe(contentRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // For mobile: apply scale transform
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const shouldScale = isMobile && scale < 1

  const wrapperStyle: React.CSSProperties = shouldScale
    ? {
        height: contentHeight ? `${contentHeight * scale}px` : 'auto',
        overflow: 'visible',
        width: '100%',
        // If content is wider than viewport after scaling, allow horizontal scroll
        overflowX: 'auto',
      }
    : {}

  const contentStyle: React.CSSProperties = shouldScale
    ? {
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        width: `${designWidth}px`,
        marginLeft: 'auto',
        marginRight: 'auto',
        // Ensure pointer events work correctly
        pointerEvents: 'auto',
        // Prevent content from being cut off horizontally
        maxWidth: '100%',
      }
    : {
        width: '100%',
      }

  return (
    <div
      ref={containerRef}
      className={className}
      style={wrapperStyle}
    >
      <div
        ref={contentRef}
        style={contentStyle}
      >
        {children}
      </div>
    </div>
  )
}
