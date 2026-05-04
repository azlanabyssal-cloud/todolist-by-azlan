import { useEffect, useRef } from 'react'
import { useStore } from '@/store'
import { ACCENT_PALETTES } from '@/types'
import type { CursorStyle } from '@/types'

export default function CustomCursor() {
  const cursorStyle = useStore((s) => s.cursorStyle)
  const accent      = useStore((s) => s.accent)
  const outerRef    = useRef<HTMLDivElement>(null)
  const innerRef    = useRef<HTMLDivElement>(null)
  // Keep a ref so the animation loop always reads the latest style without stale closure
  const styleRef    = useRef<CursorStyle>(cursorStyle)
  styleRef.current  = cursorStyle

  const color = ACCENT_PALETTES[accent].shades[500]

  useEffect(() => {
    if (cursorStyle === 'default') {
      document.documentElement.style.cursor = ''
      return
    }

    document.documentElement.style.cursor = 'none'
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return

    let mx = -200, my = -200, ox = -200, oy = -200, raf = 0

    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      const rot = styleRef.current === 'star' ? ' rotate(45deg)' : ''
      inner.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)${rot}`
    }

    const loop = () => {
      ox += (mx - ox) * 0.15
      oy += (my - oy) * 0.15
      outer.style.transform = `translate(${ox}px,${oy}px) translate(-50%,-50%)`
      raf = requestAnimationFrame(loop)
    }

    document.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(loop)

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
      document.documentElement.style.cursor = ''
    }
  }, [cursorStyle])

  if (cursorStyle === 'default') return null

  const isCrosshair = cursorStyle === 'crosshair'
  const isNeon      = cursorStyle === 'neon'
  const isCircle    = cursorStyle === 'circle'

  const outerSize = isCircle ? 40 : isNeon ? 36 : isCrosshair ? 20 : 30

  return (
    <>
      {/* Lagged outer ring / crosshair */}
      <div
        ref={outerRef}
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: outerSize,
          height: outerSize,
          pointerEvents: 'none',
          zIndex: 99999,
          borderRadius: isCrosshair ? 0 : '50%',
          border: isCrosshair ? 'none' : `${isCircle ? 2 : 1.5}px solid ${color}`,
          opacity: isCircle ? 0.45 : isNeon ? 0.85 : 0.6,
          boxShadow: isNeon ? `0 0 10px ${color}99, 0 0 24px ${color}44` : 'none',
          willChange: 'transform',
        }}
      >
        {/* Crosshair lines rendered inside the outer div */}
        {isCrosshair && (
          <>
            <span style={{
              position: 'absolute', top: '50%', left: -8, right: -8,
              height: 1.5, marginTop: -0.75, backgroundColor: color, opacity: 0.8,
            }} />
            <span style={{
              position: 'absolute', left: '50%', top: -8, bottom: -8,
              width: 1.5, marginLeft: -0.75, backgroundColor: color, opacity: 0.8,
            }} />
            <span style={{
              position: 'absolute', inset: 0,
              border: `1.5px solid ${color}`, borderRadius: '50%', opacity: 0.55,
            }} />
          </>
        )}
      </div>

      {/* Immediate inner dot / shape */}
      <div
        ref={innerRef}
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width:  cursorStyle === 'star' ? 8 : 6,
          height: cursorStyle === 'star' ? 8 : 6,
          pointerEvents: 'none',
          zIndex: 99999,
          backgroundColor: color,
          borderRadius: cursorStyle === 'star' ? '2px' : '50%',
          boxShadow: isNeon ? `0 0 8px ${color}, 0 0 18px ${color}88` : 'none',
          willChange: 'transform',
        }}
      />
    </>
  )
}
