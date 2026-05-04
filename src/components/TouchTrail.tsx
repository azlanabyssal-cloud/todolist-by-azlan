import { useEffect, useRef } from 'react'
import { useStore } from '@/store'
import { ACCENT_PALETTES } from '@/types'

interface TrailPoint {
  x: number
  y: number
  createdAt: number
}

const LIFETIME = 600

export default function TouchTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointsRef = useRef<TrailPoint[]>([])
  const rafRef    = useRef<number>(0)
  const accent    = useStore((s) => s.accent)
  const color     = ACCENT_PALETTES[accent].shades[400]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    const addPoint = (x: number, y: number) => {
      pointsRef.current.push({ x, y, createdAt: Date.now() })
    }

    const onTouchStart = (e: TouchEvent) => {
      for (const t of e.changedTouches) addPoint(t.clientX, t.clientY)
    }
    const onTouchMove = (e: TouchEvent) => {
      for (const t of e.changedTouches) addPoint(t.clientX, t.clientY)
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove',  onTouchMove,  { passive: true })

    // Parse hex → r, g, b once per color change
    const hex = color.replace('#', '')
    const r   = parseInt(hex.slice(0, 2), 16)
    const g   = parseInt(hex.slice(2, 4), 16)
    const b   = parseInt(hex.slice(4, 6), 16)

    const draw = () => {
      const now = Date.now()
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      pointsRef.current = pointsRef.current.filter((p) => now - p.createdAt < LIFETIME)

      for (const p of pointsRef.current) {
        const progress = (now - p.createdAt) / LIFETIME  // 0 → 1
        const alpha    = (1 - progress) * 0.6
        const size     = 22 * (1 - progress * 0.55)

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size)
        grad.addColorStop(0,   `rgba(${r},${g},${b},${alpha})`)
        grad.addColorStop(0.45, `rgba(${r},${g},${b},${alpha * 0.35})`)
        grad.addColorStop(1,   `rgba(${r},${g},${b},0)`)

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove',  onTouchMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [color])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[100]"
      aria-hidden
    />
  )
}
