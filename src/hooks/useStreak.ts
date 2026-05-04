import { useEffect, useState } from 'react'

interface StreakData {
  current: number
  best: number
  lastActiveDate: string // YYYY-MM-DD
}

const KEY = 'zd_streak'
const today = () => new Date().toISOString().slice(0, 10)
const yesterday = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function load(): StreakData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as StreakData
  } catch { /* */ }
  return { current: 0, best: 0, lastActiveDate: '' }
}

function save(data: StreakData) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function useStreak(completedTodayCount: number) {
  const [streak, setStreak] = useState<StreakData>(load)

  useEffect(() => {
    if (completedTodayCount === 0) return

    setStreak((prev) => {
      const t = today()
      if (prev.lastActiveDate === t) return prev // already counted today

      const isConsecutive = prev.lastActiveDate === yesterday()
      const next: StreakData = {
        current: isConsecutive ? prev.current + 1 : 1,
        best: 0,
        lastActiveDate: t,
      }
      next.best = Math.max(prev.best, next.current)
      save(next)
      return next
    })
  }, [completedTodayCount])

  // Break streak if skipped a day (detected on load)
  useEffect(() => {
    const data = load()
    if (
      data.lastActiveDate &&
      data.lastActiveDate !== today() &&
      data.lastActiveDate !== yesterday()
    ) {
      const reset: StreakData = { current: 0, best: data.best, lastActiveDate: data.lastActiveDate }
      save(reset)
      setStreak(reset)
    }
  }, [])

  return streak
}
