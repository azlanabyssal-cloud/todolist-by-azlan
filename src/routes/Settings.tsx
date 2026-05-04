import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sun, Moon, Monitor, Bell, BellOff, Download, LogOut,
  CheckCircle2, Volume2, VolumeX, Zap, ZapOff,
  LayoutList, AlignJustify, Database, Type,
} from 'lucide-react'
import { useStore } from '@/store'
import { cn } from '@/lib/cn'
import { usePWA, requestPushPermission } from '@/hooks/usePWA'
import type {
  Theme, AccentPalette, FontSize, Density, FontFamily, BackgroundStyle, CursorStyle,
} from '@/types'
import {
  ACCENT_PALETTES, FONT_FAMILIES, FONT_SIZES, BACKGROUND_STYLES, CURSOR_STYLES,
} from '@/types'

const THEMES: { value: Theme; label: string; Icon: React.ElementType }[] = [
  { value: 'light',  label: 'Light',  Icon: Sun   },
  { value: 'dark',   label: 'Dark',   Icon: Moon  },
  { value: 'system', label: 'System', Icon: Monitor },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 mt-7 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 first:mt-0">
      {children}
    </h2>
  )
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/50 shadow-card overflow-hidden', className)}>
      {children}
    </div>
  )
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={cn(
        'relative inline-flex h-[26px] w-[46px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
        on ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'
      )}
    >
      <motion.span
        layout
        className="inline-block h-[22px] w-[22px] rounded-full bg-white shadow-sm"
        animate={{ x: on ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 36 }}
      />
    </button>
  )
}

export default function Settings() {
  const {
    user, theme, setTheme,
    accent, setAccent,
    fontFamily, setFontFamily,
    backgroundStyle, setBackgroundStyle,
    fontSize, setFontSize,
    density, setDensity,
    soundEnabled, setSoundEnabled,
    reducedMotion, setReducedMotion,
    cursorStyle, setCursorStyle,
    signOut, tasks, lists,
  } = useStore()

  const { installPrompt, install, isInstalled } = usePWA()
  const [pushStatus, setPushStatus] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  )
  const [signingOut, setSigningOut] = useState(false)
  // Only show cursor section on desktop (devices with fine pointer — mice, trackpads)
  const [isDesktop] = useState(
    () => window.matchMedia('(hover: hover) and (pointer: fine)').matches
  )

  const handleRequestPush = async () => setPushStatus(await requestPushPermission())

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ tasks, lists }, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: `todolist-azlan-backup-${new Date().toISOString().slice(0, 10)}.json`,
    })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 lg:px-6 lg:py-8">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
      >
        Personalise
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08 }}
        className="mb-6 text-sm text-slate-400"
      >
        Make To-DoList by Azlan entirely yours.
      </motion.p>

      {/* ── Account ─────────────────────────────────────────────────────────── */}
      {user && (
        <>
          <SectionLabel>Account</SectionLabel>
          <Card>
            <div className="flex items-center gap-4 px-4 py-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${ACCENT_PALETTES[accent].shades[400]}, ${ACCENT_PALETTES[accent].shades[600]})` }}
              >
                {(user.full_name ?? user.email)[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{user.full_name ?? 'Azlan'}</p>
                <p className="truncate text-sm text-slate-400">{user.email}</p>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ── Theme ───────────────────────────────────────────────────────────── */}
      <SectionLabel>Theme</SectionLabel>
      <Card>
        <div className="flex gap-2 p-3">
          {THEMES.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                'flex flex-1 flex-col items-center gap-2 rounded-xl py-3.5 text-xs font-semibold transition-all duration-200',
                theme === value
                  ? 'text-white scale-[1.02] shadow-brand'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
              style={theme === value ? {
                background: `linear-gradient(135deg, ${ACCENT_PALETTES[accent].shades[500]}, ${ACCENT_PALETTES[accent].shades[700]})`,
              } : {}}
              aria-pressed={theme === value}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </Card>

      {/* ── Accent Color ────────────────────────────────────────────────────── */}
      <SectionLabel>Accent Color</SectionLabel>
      <Card>
        <div className="p-4">
          <div className="grid grid-cols-5 gap-3">
            {(Object.keys(ACCENT_PALETTES) as AccentPalette[]).map((key) => {
              const p      = ACCENT_PALETTES[key]
              const active = accent === key
              return (
                <button
                  key={key}
                  onClick={() => setAccent(key)}
                  aria-label={`${p.label} accent`}
                  aria-pressed={active}
                  className={cn(
                    'group relative flex flex-col items-center gap-1.5 rounded-2xl py-3 transition-all duration-200',
                    active
                      ? 'ring-2 ring-offset-2 scale-[1.07]'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:scale-105'
                  )}
                  style={active ? { '--tw-ring-color': p.shades[500] } as React.CSSProperties : {}}
                >
                  {/* Colour dot — shows actual shade */}
                  <span
                    className="h-9 w-9 rounded-full shadow-md transition-transform group-hover:scale-105"
                    style={{
                      background: `linear-gradient(145deg, ${p.shades[400]}, ${p.shades[600]})`,
                    }}
                  />
                  <span className="text-[10px] font-semibold leading-tight text-slate-500 dark:text-slate-400">
                    {p.label}
                  </span>
                  {active && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-md"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" style={{ color: p.shades[500] }} />
                    </motion.span>
                  )}
                </button>
              )
            })}
          </div>
          {/* Live colour preview bar */}
          <div className="mt-4 h-2 w-full rounded-full overflow-hidden flex">
            {(['50','100','200','300','400','500','600','700','800','900','950'] as const).map((shade) => (
              <div
                key={shade}
                className="flex-1 transition-colors duration-500"
                style={{ backgroundColor: ACCENT_PALETTES[accent].shades[shade as unknown as keyof typeof ACCENT_PALETTES[typeof accent]['shades']] }}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">Every button, badge, and highlight updates instantly.</p>
        </div>
      </Card>

      {/* ── Font Family ─────────────────────────────────────────────────────── */}
      <SectionLabel>Font</SectionLabel>
      <Card>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {(Object.keys(FONT_FAMILIES) as FontFamily[]).map((key) => {
            const f      = FONT_FAMILIES[key]
            const active = fontFamily === key
            return (
              <button
                key={key}
                onClick={() => setFontFamily(key)}
                aria-pressed={active}
                className={cn(
                  'flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors',
                  active
                    ? 'bg-brand-50 dark:bg-brand-950/40'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                )}
              >
                <div className="flex flex-col gap-0.5">
                  {/* Preview text rendered IN that font — this is the key differentiator */}
                  <span
                    className="text-base font-semibold text-slate-800 dark:text-slate-100"
                    style={{ fontFamily: f.stack }}
                  >
                    {f.preview}
                  </span>
                  <span className="text-xs text-slate-400">{f.description}</span>
                </div>
                {active && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex h-5 w-5 items-center justify-center rounded-full"
                    style={{ backgroundColor: ACCENT_PALETTES[accent].shades[500] }}
                  >
                    <svg className="h-3 w-3 text-white" viewBox="0 0 12 9" fill="none" aria-hidden>
                      <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                )}
              </button>
            )
          })}
        </div>
        <div className="border-t border-slate-100 dark:border-slate-700/50 px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30">
          <p className="text-xs text-slate-400">
            Currently:{' '}
            <span
              className="font-semibold text-slate-600 dark:text-slate-300"
              style={{ fontFamily: FONT_FAMILIES[fontFamily].stack }}
            >
              {FONT_FAMILIES[fontFamily].label} — The quick brown fox jumps over the lazy dog
            </span>
          </p>
        </div>
      </Card>

      {/* ── Text Size ───────────────────────────────────────────────────────── */}
      <SectionLabel>Text Size</SectionLabel>
      <Card>
        <div className="grid grid-cols-4 gap-2 p-3">
          {(Object.keys(FONT_SIZES) as FontSize[]).map((key) => {
            const f      = FONT_SIZES[key]
            const active = fontSize === key
            const previewClass = { sm: 'text-xs', md: 'text-sm', lg: 'text-base', xl: 'text-xl' }[key]
            return (
              <button
                key={key}
                onClick={() => setFontSize(key)}
                aria-pressed={active}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl py-4 border-2 transition-all duration-200',
                  active
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                    : 'border-transparent bg-slate-50 dark:bg-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600'
                )}
              >
                <span className={cn('font-bold tabular-nums text-slate-700 dark:text-slate-200', previewClass)}>Aa</span>
                <span className="text-[10px] font-semibold text-slate-400">{f.label}</span>
              </button>
            )
          })}
        </div>
        <div className="border-t border-slate-100 dark:border-slate-700/50 px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/30">
          <p className="text-xs text-slate-400">{FONT_SIZES[fontSize].description}</p>
        </div>
      </Card>

      {/* ── Background ──────────────────────────────────────────────────────── */}
      <SectionLabel>Background Style</SectionLabel>
      <Card>
        <div className="grid grid-cols-5 gap-2 p-3">
          {(Object.keys(BACKGROUND_STYLES) as BackgroundStyle[]).map((key) => {
            const b      = BACKGROUND_STYLES[key]
            const active = backgroundStyle === key
            const preview: Record<BackgroundStyle, string> = {
              clean:  'bg-white dark:bg-slate-800',
              dots:   'bg-[radial-gradient(circle,rgba(100,116,139,0.4)_1px,transparent_1px)] bg-[size:8px_8px]',
              grid:   'bg-[linear-gradient(rgba(100,116,139,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.25)_1px,transparent_1px)] bg-[size:10px_10px]',
              aurora: 'bg-gradient-to-br from-brand-100 to-slate-100 dark:from-brand-950 dark:to-slate-900',
              mesh:   'bg-gradient-to-br from-brand-50 via-white to-sky-50 dark:from-brand-950 dark:via-slate-900 dark:to-slate-800',
            }
            return (
              <button
                key={key}
                onClick={() => setBackgroundStyle(key)}
                aria-pressed={active}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl p-2 border-2 transition-all duration-200',
                  active
                    ? 'border-brand-500 scale-[1.04]'
                    : 'border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:scale-[1.02]'
                )}
              >
                <div className={cn('h-12 w-full rounded-lg overflow-hidden', preview[key], 'border border-slate-200 dark:border-slate-700')} />
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{b.label}</span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* ── Density ─────────────────────────────────────────────────────────── */}
      <SectionLabel>Task Density</SectionLabel>
      <Card>
        <div className="grid grid-cols-2 gap-3 p-3">
          {(['comfortable', 'compact'] as Density[]).map((d) => {
            const active = density === d
            return (
              <button
                key={d}
                onClick={() => setDensity(d)}
                aria-pressed={active}
                className={cn(
                  'flex flex-col gap-3 rounded-xl p-3.5 border-2 transition-all duration-200 text-left',
                  active
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                    : 'border-transparent bg-slate-50 dark:bg-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600'
                )}
              >
                <div className="flex items-center gap-2">
                  {d === 'comfortable'
                    ? <LayoutList className={cn('h-4 w-4', active ? 'text-brand-500' : 'text-slate-400')} />
                    : <AlignJustify className={cn('h-4 w-4', active ? 'text-brand-500' : 'text-slate-400')} />
                  }
                  <span className={cn('text-sm font-semibold capitalize', active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-700 dark:text-slate-200')}>
                    {d}
                  </span>
                </div>
                {/* Visual preview bars */}
                <div className={cn('flex flex-col', d === 'compact' ? 'gap-0.5' : 'gap-1.5')}>
                  {[85, 68, 52].map((w, i) => (
                    <div
                      key={i}
                      className={cn('rounded-full', d === 'compact' ? 'h-1.5' : 'h-2.5',
                        active ? 'bg-brand-200 dark:bg-brand-800' : 'bg-slate-200 dark:bg-slate-600'
                      )}
                      style={{ width: `${w}%` }}
                    />
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* ── Experience ──────────────────────────────────────────────────────── */}
      <SectionLabel>Experience</SectionLabel>
      <Card>
        {[
          {
            on: soundEnabled,
            toggle: () => setSoundEnabled(!soundEnabled),
            IconOn: Volume2, IconOff: VolumeX,
            label: 'Completion Sounds',
            desc: soundEnabled ? 'Satisfying chime on task complete' : 'Silent — no audio feedback',
          },
          {
            on: reducedMotion,
            toggle: () => setReducedMotion(!reducedMotion),
            IconOn: ZapOff, IconOff: Zap,
            label: 'Reduce Motion',
            desc: reducedMotion ? 'All animations disabled' : 'Full animations enabled',
          },
        ].map(({ on, toggle, IconOn, IconOff, label, desc }, i) => (
          <div key={i} className={cn('flex items-center justify-between px-4 py-4', i > 0 && 'border-t border-slate-100 dark:border-slate-700/50')}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700/60">
                {on
                  ? <IconOn  className="h-4 w-4 text-brand-500" />
                  : <IconOff className="h-4 w-4 text-slate-400" />
                }
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
            </div>
            <Toggle on={on} onToggle={toggle} />
          </div>
        ))}
      </Card>

      {/* ── Cursor Style (desktop / fine-pointer only) ───────────────────────── */}
      {isDesktop && (
        <>
          <SectionLabel>Cursor Style</SectionLabel>
          <Card>
            <div className="grid grid-cols-3 gap-2 p-3">
              {(Object.keys(CURSOR_STYLES) as CursorStyle[]).map((key) => {
                const c      = CURSOR_STYLES[key]
                const active = cursorStyle === key
                return (
                  <button
                    key={key}
                    onClick={() => setCursorStyle(key)}
                    aria-pressed={active}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl py-4 border-2 transition-all duration-200',
                      active
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 scale-[1.03]'
                        : 'border-transparent bg-slate-50 dark:bg-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600 hover:scale-[1.02]'
                    )}
                  >
                    <span
                      className="text-2xl leading-none select-none"
                      style={{ color: active ? ACCENT_PALETTES[accent].shades[500] : undefined }}
                    >
                      {c.preview}
                    </span>
                    <span className={cn(
                      'text-[10px] font-semibold leading-tight',
                      active
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-slate-500 dark:text-slate-400'
                    )}>
                      {c.label}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="border-t border-slate-100 dark:border-slate-700/50 px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/30">
              <p className="text-xs text-slate-400">{CURSOR_STYLES[cursorStyle].description}</p>
            </div>
          </Card>
        </>
      )}

      {/* ── Notifications ───────────────────────────────────────────────────── */}
      <SectionLabel>Notifications</SectionLabel>
      <Card>
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700/60">
              {pushStatus === 'granted'
                ? <Bell    className="h-4 w-4 text-brand-500" />
                : <BellOff className="h-4 w-4 text-slate-400" />
              }
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Push Reminders</p>
              <p className="text-xs text-slate-400">
                {pushStatus === 'granted' ? 'Reminders active' : pushStatus === 'denied' ? 'Blocked in browser' : 'Tap to enable'}
              </p>
            </div>
          </div>
          {pushStatus === 'granted'
            ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            : pushStatus !== 'denied' && (
              <button
                onClick={() => void handleRequestPush()}
                className="rounded-xl px-3.5 py-1.5 text-xs font-bold text-white transition-colors"
                style={{ backgroundColor: ACCENT_PALETTES[accent].shades[500] }}
              >
                Enable
              </button>
            )
          }
        </div>
      </Card>

      {/* ── Install ─────────────────────────────────────────────────────────── */}
      {!isInstalled && (
        <>
          <SectionLabel>App</SectionLabel>
          <Card>
            <button
              onClick={installPrompt ? () => void install() : undefined}
              disabled={!installPrompt}
              className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors disabled:opacity-50"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: ACCENT_PALETTES[accent].shades[500] }}
              >
                <Download className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Install To-DoList by Azlan</p>
                <p className="text-xs text-slate-400">Add to home screen — works offline</p>
              </div>
            </button>
          </Card>
        </>
      )}

      {/* ── Data ────────────────────────────────────────────────────────────── */}
      <SectionLabel>Data</SectionLabel>
      <Card>
        <button
          onClick={handleExport}
          className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700/60">
            <Database className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Export Backup</p>
            <p className="text-xs text-slate-400">{tasks.length} tasks · {lists.length} lists · JSON</p>
          </div>
        </button>
      </Card>

      {/* ── Sign out ────────────────────────────────────────────────────────── */}
      <SectionLabel>Account</SectionLabel>
      <Card>
        <button
          onClick={() => void (async () => { setSigningOut(true); await signOut() })()}
          disabled={signingOut}
          className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/30">
            <LogOut className="h-4 w-4 text-rose-500" />
          </div>
          <span className="text-sm font-semibold text-rose-500">
            {signingOut ? 'Signing out…' : 'Sign out'}
          </span>
        </button>
      </Card>

      <div className="mt-8 flex flex-col items-center gap-1">
        <div
          className="h-1 w-12 rounded-full"
          style={{ background: `linear-gradient(90deg, ${ACCENT_PALETTES[accent].shades[400]}, ${ACCENT_PALETTES[accent].shades[600]})` }}
        />
        <p className="mt-2 text-xs font-medium text-slate-300 dark:text-slate-600">
          To-DoList by Azlan · v1.0.0
        </p>
        <div className="flex items-center gap-1.5">
          <Type className="h-3 w-3 text-slate-300 dark:text-slate-600" />
          <p className="text-xs text-slate-300 dark:text-slate-600" style={{ fontFamily: FONT_FAMILIES[fontFamily].stack }}>
            {FONT_FAMILIES[fontFamily].label}
          </p>
        </div>
      </div>
    </div>
  )
}
