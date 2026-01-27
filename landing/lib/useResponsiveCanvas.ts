'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface UseResponsiveCanvasOptions {
  /**
   * Maximum device pixel ratio (default: 2)
   * Higher values = sharper but more expensive
   */
  maxDpr?: number
  /**
   * Minimum device pixel ratio (default: 1)
   */
  minDpr?: number
  /**
   * Pause rendering when tab is hidden (default: true)
   */
  pauseOnHidden?: boolean
  /**
   * Disable animations if prefers-reduced-motion (default: true)
   */
  respectReducedMotion?: boolean
  /**
   * Throttle resize events (ms, default: 100)
   */
  resizeThrottle?: number
  /**
   * Callback when canvas size changes
   */
  onResize?: (width: number, height: number, dpr: number) => void
}

export interface UseResponsiveCanvasReturn {
  /**
   * Canvas ref to attach to <canvas> element
   */
  canvasRef: React.RefObject<HTMLCanvasElement>
  /**
   * Container ref to attach to parent element
   */
  containerRef: React.RefObject<HTMLDivElement>
  /**
   * Canvas width in physical pixels (for rendering)
   */
  width: number
  /**
   * Canvas height in physical pixels (for rendering)
   */
  height: number
  /**
   * Device pixel ratio (capped)
   */
  dpr: number
  /**
   * Whether animations should be disabled (prefers-reduced-motion)
   */
  reducedMotion: boolean
  /**
   * Whether canvas is visible (not hidden)
   */
  isVisible: boolean
}

/**
 * Universal hook for responsive canvas elements
 * 
 * Features:
 * - Automatic DPR handling (crisp rendering)
 * - ResizeObserver for container size tracking
 * - Throttled resize events
 * - Visibility API support (pause when hidden)
 * - prefers-reduced-motion support
 * - SSR-safe (no window access during render)
 */
export function useResponsiveCanvas(
  options: UseResponsiveCanvasOptions = {}
): UseResponsiveCanvasReturn {
  const {
    maxDpr = 2,
    minDpr = 1,
    pauseOnHidden = true,
    respectReducedMotion = true,
    resizeThrottle = 100,
    onResize,
  } = options

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, dpr: 1 })
  const [reducedMotion, setReducedMotion] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  
  const resizeTimeoutRef = useRef<NodeJS.Timeout>()
  const rafRef = useRef<number>()

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined' || !respectReducedMotion) {
      setReducedMotion(false)
      return
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [respectReducedMotion])

  // Handle visibility changes
  useEffect(() => {
    if (typeof document === 'undefined' || !pauseOnHidden) {
      setIsVisible(true)
      return
    }

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [pauseOnHidden])

  // Update canvas size
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    
    if (!canvas || !container || typeof window === 'undefined') return

    // Get container CSS size
    const rect = container.getBoundingClientRect()
    const cssWidth = rect.width
    const cssHeight = rect.height

    // Skip if container has no size
    if (cssWidth === 0 || cssHeight === 0) return

    // Calculate DPR (capped)
    const rawDpr = window.devicePixelRatio || 1
    const dpr = Math.max(minDpr, Math.min(maxDpr, rawDpr))

    // Set CSS size (display size)
    canvas.style.width = `${cssWidth}px`
    canvas.style.height = `${cssHeight}px`

    // Set internal size (render size) - physical pixels
    const physicalWidth = Math.floor(cssWidth * dpr)
    const physicalHeight = Math.floor(cssHeight * dpr)

    canvas.width = physicalWidth
    canvas.height = physicalHeight

    // Scale context for crisp rendering
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
    }

    setDimensions({ width: physicalWidth, height: physicalHeight, dpr })
    onResize?.(physicalWidth, physicalHeight, dpr)
  }, [maxDpr, minDpr, onResize])

  // Throttled resize handler
  const handleResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current)
    }
    
    resizeTimeoutRef.current = setTimeout(() => {
      updateCanvasSize()
    }, resizeThrottle)
  }, [updateCanvasSize, resizeThrottle])

  // Setup ResizeObserver
  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof window === 'undefined') return

    // Initial size
    updateCanvasSize()

    // Use ResizeObserver for container size changes
    const resizeObserver = new ResizeObserver(() => {
      handleResize()
    })

    resizeObserver.observe(container)

    // Also listen to window resize (for fixed/absolute positioned containers)
    window.addEventListener('resize', handleResize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [handleResize, updateCanvasSize])

  return {
    canvasRef,
    containerRef,
    width: dimensions.width,
    height: dimensions.height,
    dpr: dimensions.dpr,
    reducedMotion,
    isVisible,
  }
}
