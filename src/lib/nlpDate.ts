// Client-side natural language date parser.
// Todoist + TickTick architecture: runs entirely locally, zero network calls.
// Supports: today, tomorrow, weekday names, "next X", "in N days", "month day" forms.

const DAYS_LONG  = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
const DAYS_SHORT = ['sun','mon','tue','wed','thu','fri','sat']
const MON_LONG   = ['january','february','march','april','may','june','july','august','september','october','november','december']

function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}

function nextWeekday(targetDay: number, today: Date, forceNext = false): Date {
  const diff = ((targetDay - today.getDay()) + 7) % 7
  const offset = (diff === 0 || (forceNext && diff === 0)) ? 7 : diff
  return addDays(today, forceNext && diff !== 0 ? diff + 7 : offset)
}

function monthIndex(s: string): number {
  const lo = s.toLowerCase()
  const li = MON_LONG.findIndex((m) => lo.startsWith(m.slice(0, 3)))
  return li
}

function dayIndex(s: string): number {
  const lo = s.toLowerCase()
  let i = DAYS_LONG.indexOf(lo)
  if (i === -1) i = DAYS_SHORT.indexOf(lo)
  return i
}

export interface NLPResult {
  date: string | null   // YYYY-MM-DD
  label: string | null  // human-readable label shown to user
  cleaned: string       // title with date phrase stripped
}

function strip(raw: string, match: string): string {
  return raw.replace(new RegExp(`\\s*\\b${escapeRegex(match)}\\b\\s*`, 'i'), ' ').trim()
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function parseNaturalDate(raw: string): NLPResult {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lo = raw.toLowerCase()

  // today
  const todayM = lo.match(/\b(today|tod)\b/)
  if (todayM) {
    return { date: iso(today), label: 'Today', cleaned: strip(raw, todayM[0]) }
  }

  // tomorrow
  const tmrM = lo.match(/\b(tomorrow|tmr|tmrw)\b/)
  if (tmrM) {
    const d = addDays(today, 1)
    return { date: iso(d), label: 'Tomorrow', cleaned: strip(raw, tmrM[0]) }
  }

  // in N days
  const inDaysM = lo.match(/\bin (\d+) days?\b/)
  if (inDaysM) {
    const d = addDays(today, parseInt(inDaysM[1]))
    return { date: iso(d), label: `In ${inDaysM[1]} days`, cleaned: strip(raw, inDaysM[0]) }
  }

  // next week
  const nextWeekM = lo.match(/\bnext week\b/)
  if (nextWeekM) {
    const d = addDays(today, 7)
    return { date: iso(d), label: 'Next week', cleaned: strip(raw, nextWeekM[0]) }
  }

  // next <weekday>
  const nextDayM = lo.match(/\bnext (monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/)
  if (nextDayM) {
    const di = dayIndex(nextDayM[1])
    if (di !== -1) {
      const d = nextWeekday(di, today, true)
      const dayName = DAYS_LONG[di]
      const label = `Next ${dayName[0].toUpperCase()}${dayName.slice(1)}`
      return { date: iso(d), label, cleaned: strip(raw, nextDayM[0]) }
    }
  }

  // this <weekday>
  const thisDayM = lo.match(/\bthis (monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/)
  if (thisDayM) {
    const di = dayIndex(thisDayM[1])
    if (di !== -1) {
      const d = nextWeekday(di, today, false)
      const dayName = DAYS_LONG[di]
      const label = `This ${dayName[0].toUpperCase()}${dayName.slice(1)}`
      return { date: iso(d), label, cleaned: strip(raw, thisDayM[0]) }
    }
  }

  // bare weekday (monday, tue, etc.) — next occurrence
  const dayM = lo.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/)
  if (dayM) {
    const di = dayIndex(dayM[1])
    if (di !== -1) {
      const d = nextWeekday(di, today, false)
      const dayName = DAYS_LONG[di]
      const label = dayName[0].toUpperCase() + dayName.slice(1)
      return { date: iso(d), label, cleaned: strip(raw, dayM[0]) }
    }
  }

  // month day: "jan 15", "january 15th"
  const monDayM = lo.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/)
  if (monDayM) {
    const mi = monthIndex(monDayM[1])
    if (mi !== -1) {
      const day = parseInt(monDayM[2])
      const d = new Date(today.getFullYear(), mi, day)
      if (d < today) d.setFullYear(d.getFullYear() + 1)
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      return { date: iso(d), label, cleaned: strip(raw, monDayM[0]) }
    }
  }

  // day month: "15 jan", "15th january"
  const dayMonM = lo.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/)
  if (dayMonM) {
    const mi = monthIndex(dayMonM[2])
    if (mi !== -1) {
      const day = parseInt(dayMonM[1])
      const d = new Date(today.getFullYear(), mi, day)
      if (d < today) d.setFullYear(d.getFullYear() + 1)
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      return { date: iso(d), label, cleaned: strip(raw, dayMonM[0]) }
    }
  }

  return { date: null, label: null, cleaned: raw }
}
