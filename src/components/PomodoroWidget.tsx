import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Timer, X, Play, Pause, RotateCcw, Coffee } from 'lucide-react'
import { cn } from '@/lib/cn'
import { playComplete } from '@/lib/sound'

type PomodoroMode = 'work' | 'short-break' | 'long-break'

const DURATIONS: Record<PomodoroMode, number> = {
  'work':        25 * 60,
  'short-break':  5 * 60,
  'long-break':  15 * 60,
}

const MODE_LABELS: Record<PomodoroMode, string> = {
  'work':        'Focus',
  'short-break': 'Short Break',
  'long-break':  'Long Break',
}

function fmt(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

function Ring({ pct }: { pct: number }) {
  const r    = 44
  const circ = 2 * Math.PI * r
  return (
    <svg width={112} height={112} className="-rotate-90" aria-hidden>
      <circle cx={56} cy={56} r={r} fill="none" stroke="currentColor" strokeWidth={5}
        className="text-slate-100 dark:text-slate-800" />
      <motion.circle
        cx={56} cy={56} r={r} fill="none" stroke="currentColor" strokeWidth={5}
        strokeLinecap="round"
        className="text-brand-500"
        strokeDasharray={circ}
        animate={{ strokeDashoffset: circ - pct * circ }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </svg>
  )
}

interface PomodoroWidgetProps {
  taskTitle?: string | null
  onClose: () => void
}

export default function PomodoroWidget({ taskTitle, onClose }: PomodoroWidgetProps) {
  const [mode, setMode]       = useState<PomodoroMode>('work')
  const [seconds, setSeconds] = useState(DURATIONS['work'])
  const [running, setRunning] = useState(false)
  const [session, setSession] = useState(1)   // 1-4
  const intervalRef           = useRef<ReturnType<typeof setInterval> | null>(null)

  const total = DURATIONS[mode]
  const pct   = seconds / total

  const clear = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
  }

  const handleComplete = useCallback(() => {
    clear()
    setRunning(false)
    playComplete()

    if (mode === 'work') {
      const nextSession = session + 1
      if (nextSession > 4) {
        setSession(1)
        setMode('long-break')
        setSeconds(DURATIONS['long-break'])
      } else {
        setSession(nextSession)
        setMode('short-break')
        setSeconds(DURATIONS['short-break'])
      }
    } else {
      setMode('work')
      setSeconds(DURATIONS['work'])
    }
  }, [mode, session])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            handleComplete()
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      clear()
    }
    return clear
  }, [running, handleComplete])

  // Update browser tab title while running
  useEffect(() => {
    if (running) {
      document.title = `${fmt(seconds)} — ${MODE_LABELS[mode]} · To-DoList by Azlan`
    } else {
      document.title = 'To-DoList by Azlan'
    }
    return () => { document.title = 'To-DoList by Azlan' }
  }, [running, seconds, mode])

  const toggleRun = () => setRunning((r) => !r)

  const reset = () => {
    setRunning(false)
    setSeconds(DURATIONS[mode])
  }

  const switchMode = (m: PomodoroMode) => {
    setRunning(false)
    setMode(m)
    setSeconds(DURATIONS[m])
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="fixed bottom-28 right-4 z-40 w-72 overflow-hidden rounded-3xl border border-slate-200/60 dark:border-slate-700/50 bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl shadow-elevated lg:bottom-8 lg:right-6"
      role="dialog"
      aria-label="Pomodoro timer"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-0">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-brand-500" aria-hidden />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Pomodoro</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
          aria-label="Close timer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 px-4 pt-3">
        {(['work', 'short-break', 'long-break'] as PomodoroMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={cn(
              'flex-1 rounded-xl py-1 text-2xs font-medium transition-colors',
              mode === m
                ? 'bg-brand-500 text-white'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            {m === 'work' ? 'Focus' : m === 'short-break' ? 'Short' : 'Long'}
          </button>
        ))}
      </div>

      {/* Ring + time */}
      <div className="relative flex flex-col items-center py-4">
        <Ring pct={pct} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums text-slate-800 dark:text-slate-100">
            {fmt(seconds)}
          </span>
          <span className="mt-0.5 text-2xs font-medium text-slate-400 uppercase tracking-wider">
            {MODE_LABELS[mode]}
          </span>
        </div>
      </div>

      {/* Task label */}
      {taskTitle && (
        <p className="px-5 pb-1 text-center text-xs text-slate-500 dark:text-slate-400 truncate">
          {taskTitle}
        </p>
      )}

      {/* Session dots */}
      <div className="flex justify-center gap-1.5 pb-1">
        {[1,2,3,4].map((s) => (
          <span
            key={s}
            className={cn(
              'h-1.5 w-1.5 rounded-full transition-colors',
              s < session
                ? 'bg-brand-500'
                : s === session
                ? mode === 'work' ? 'bg-brand-400 animate-pulse' : 'bg-amber-400 animate-pulse'
                : 'bg-slate-200 dark:bg-slate-700'
            )}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 px-5 pb-5 pt-2">
        <button
          onClick={reset}
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
          aria-label="Reset timer"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <motion.button
          onClick={toggleRun}
          whileTap={{ scale: 0.93 }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-brand hover:bg-brand-600 transition-colors"
          aria-label={running ? 'Pause' : 'Start'}
        >
          {running
            ? <Pause className="h-6 w-6" fill="white" />
            : <Play className="h-6 w-6 translate-x-0.5" fill="white" />
          }
        </motion.button>

        <button
          onClick={() => switchMode(mode === 'work' ? 'short-break' : 'work')}
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
          aria-label="Skip to break"
        >
          <Coffee className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}
