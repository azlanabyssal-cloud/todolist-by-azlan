import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  onComplete: () => void
}

const LETTERS = 'AZLAN'.split('')

export default function SplashScreen({ onComplete }: Props) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 1800)
    const t2 = setTimeout(onComplete, 2500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onComplete])

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#030303' }}
      animate={{ opacity: fading ? 0 : 1 }}
      transition={{ duration: 0.7, ease: 'easeInOut' }}
    >
      {/* Ambient glow sphere */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 2.2, opacity: 0.10 }}
        transition={{ duration: 2.8, ease: 'easeOut' }}
        className="pointer-events-none absolute h-[360px] w-[360px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%)' }}
      />

      {/* Fine particle shimmer lines */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 0.06, scaleX: 1 }}
        transition={{ delay: 0.3, duration: 1.2, ease: 'easeOut' }}
        className="pointer-events-none absolute top-[38%] w-full h-px origin-center bg-white"
      />
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 0.04, scaleX: 1 }}
        transition={{ delay: 0.5, duration: 1.2, ease: 'easeOut' }}
        className="pointer-events-none absolute top-[62%] w-full h-px origin-center bg-white"
      />

      {/* AZLAN letters — each springs in independently */}
      <div className="relative flex items-baseline">
        {LETTERS.map((letter, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 90, scale: 0.25 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: i * 0.13,
              type: 'spring',
              stiffness: 210,
              damping: 15,
            }}
            className="select-none text-white"
            style={{
              fontSize: 'clamp(3.5rem, 14vw, 9rem)',
              fontWeight: 900,
              letterSpacing: '0.18em',
              lineHeight: 1,
              fontFamily: "'Inter', ui-sans-serif, sans-serif",
              textShadow:
                '0 0 30px rgba(255,255,255,0.5), 0 0 60px rgba(255,255,255,0.2), 0 0 120px rgba(255,255,255,0.08)',
            }}
          >
            {letter}
          </motion.span>
        ))}
      </div>

      {/* Decorative line sweeps from left */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.22 }}
        transition={{ delay: 0.72, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="my-5 h-px origin-left bg-white"
        style={{ width: 'clamp(160px, 34vw, 460px)' }}
      />

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 8, letterSpacing: '0.2em' }}
        animate={{ opacity: 0.4, y: 0, letterSpacing: '0.42em' }}
        transition={{ delay: 0.95, duration: 0.6, ease: 'easeOut' }}
        className="select-none text-white"
        style={{
          fontSize: 'clamp(0.52rem, 1.3vw, 0.72rem)',
          fontWeight: 700,
          textTransform: 'uppercase',
          fontFamily: "'Inter', ui-sans-serif, sans-serif",
        }}
      >
        TO-DOLIST
      </motion.p>

      {/* Ultra-subtle bottom credit */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.18 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute bottom-8 select-none text-white"
        style={{
          fontSize: '0.6rem',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          fontFamily: "'Inter', ui-sans-serif, sans-serif",
        }}
      >
        by Azlan
      </motion.p>
    </motion.div>
  )
}
