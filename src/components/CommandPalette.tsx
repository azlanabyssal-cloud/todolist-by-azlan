import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Sun, Inbox, FolderOpen, Calendar, Settings, Plus, CheckSquare,
} from 'lucide-react'
import { useStore } from '@/store'
import { cn } from '@/lib/cn'

type ResultItem = {
  id: string
  label: string
  hint?: string
  icon: React.ElementType
  dot?: string
  onSelect: () => void
}

export default function CommandPalette() {
  const { cmdPaletteOpen, setCmdPaletteOpen, setQuickAddOpen, tasks, lists } = useStore()
  const [query, setQuery] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const close = useCallback(() => setCmdPaletteOpen(false), [setCmdPaletteOpen])

  useEffect(() => {
    if (cmdPaletteOpen) {
      setQuery('')
      setIdx(0)
      // tick to let AnimatePresence mount the input first
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [cmdPaletteOpen])

  const FIXED: ResultItem[] = useMemo(() => [
    {
      id: 'new',
      label: 'New Task',
      hint: 'N',
      icon: Plus,
      onSelect: () => { close(); setQuickAddOpen(true) },
    },
    { id: 'today',    label: 'Go to Today',    hint: '⌘1', icon: Sun,        onSelect: () => { close(); navigate('/today')    } },
    { id: 'inbox',    label: 'Go to Inbox',    hint: '⌘2', icon: Inbox,      onSelect: () => { close(); navigate('/inbox')    } },
    { id: 'projects', label: 'Go to Projects', hint: '⌘3', icon: FolderOpen, onSelect: () => { close(); navigate('/projects') } },
    { id: 'calendar', label: 'Go to Calendar', hint: '⌘4', icon: Calendar,   onSelect: () => { close(); navigate('/calendar') } },
    { id: 'settings', label: 'Settings',                   icon: Settings,   onSelect: () => { close(); navigate('/settings') } },
  ], [close, navigate, setQuickAddOpen])

  const taskItems: ResultItem[] = useMemo(() => {
    if (query.length < 2) return []
    const q = query.toLowerCase()
    return tasks
      .filter((t) => !t.completed && t.title.toLowerCase().includes(q))
      .slice(0, 5)
      .map((t) => ({
        id: `task-${t.id}`,
        label: t.title,
        hint: t.due_date ? t.due_date.slice(5) : undefined,
        icon: CheckSquare,
        onSelect: () => { close() },
      }))
  }, [query, tasks, close])

  const listItems: ResultItem[] = useMemo(() => {
    if (query.length < 2) return []
    const q = query.toLowerCase()
    return lists
      .filter((l) => l.title.toLowerCase().includes(q))
      .slice(0, 3)
      .map((l) => ({
        id: `list-${l.id}`,
        label: l.title,
        icon: FolderOpen,
        dot: l.color,
        onSelect: () => { close(); navigate(`/projects?list=${l.id}`) },
      }))
  }, [query, lists, close, navigate])

  const fixedVisible = useMemo(() =>
    query
      ? FIXED.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
      : FIXED,
    [query, FIXED]
  )

  const allItems = useMemo(
    () => [...fixedVisible, ...taskItems, ...listItems],
    [fixedVisible, taskItems, listItems]
  )

  // clamp idx when list changes
  useEffect(() => {
    setIdx((i) => Math.min(i, Math.max(0, allItems.length - 1)))
  }, [allItems.length])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIdx((i) => Math.min(i + 1, allItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      allItems[idx]?.onSelect()
    } else if (e.key === 'Escape') {
      close()
    }
  }

  const showTaskSection  = taskItems.length > 0
  const showListSection  = listItems.length > 0
  const fixedOffset      = 0
  const taskOffset       = fixedVisible.length
  const listOffset       = taskOffset + taskItems.length

  return (
    <AnimatePresence>
      {cmdPaletteOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.18, ease: [0.34, 1.1, 0.64, 1] }}
            className="fixed left-1/2 top-[18%] z-50 w-full max-w-lg -translate-x-1/2 px-4"
            role="dialog"
            aria-modal
            aria-label="Command palette"
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl shadow-elevated">
              {/* Input */}
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 px-4 py-3.5">
                <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setIdx(0) }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command or search…"
                  className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                  aria-label="Search"
                  autoComplete="off"
                  spellCheck={false}
                />
                <kbd className="hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-2xs font-medium text-slate-400 sm:block">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto overscroll-contain p-2">
                {/* Fixed actions */}
                {fixedVisible.length > 0 && (
                  <div>
                    {!query && (
                      <p className="px-3 pb-1 pt-1.5 text-2xs font-semibold uppercase tracking-wider text-slate-400">
                        Quick Actions
                      </p>
                    )}
                    {fixedVisible.map((item, i) => {
                      const Icon = item.icon
                      const globalIdx = fixedOffset + i
                      return (
                        <button
                          key={item.id}
                          onClick={item.onSelect}
                          onMouseEnter={() => setIdx(globalIdx)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-left transition-colors',
                            idx === globalIdx
                              ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                          <span className="flex-1 font-medium">{item.label}</span>
                          {item.hint && (
                            <kbd className="text-2xs text-slate-400 dark:text-slate-500">{item.hint}</kbd>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Tasks */}
                {showTaskSection && (
                  <div className="mt-1">
                    <p className="px-3 pb-1 pt-1.5 text-2xs font-semibold uppercase tracking-wider text-slate-400">
                      Tasks
                    </p>
                    {taskItems.map((item, i) => {
                      const Icon = item.icon
                      const globalIdx = taskOffset + i
                      return (
                        <button
                          key={item.id}
                          onClick={item.onSelect}
                          onMouseEnter={() => setIdx(globalIdx)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-left transition-colors',
                            idx === globalIdx
                              ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.hint && (
                            <span className="text-2xs text-slate-400">{item.hint}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Lists */}
                {showListSection && (
                  <div className="mt-1">
                    <p className="px-3 pb-1 pt-1.5 text-2xs font-semibold uppercase tracking-wider text-slate-400">
                      Lists
                    </p>
                    {listItems.map((item, i) => {
                      const Icon = item.icon
                      const globalIdx = listOffset + i
                      return (
                        <button
                          key={item.id}
                          onClick={item.onSelect}
                          onMouseEnter={() => setIdx(globalIdx)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-left transition-colors',
                            idx === globalIdx
                              ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          )}
                        >
                          {item.dot ? (
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: item.dot }}
                              aria-hidden
                            />
                          ) : (
                            <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                          )}
                          <span className="flex-1 truncate font-medium">{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {allItems.length === 0 && query && (
                  <p className="px-3 py-10 text-center text-sm text-slate-400">
                    No results for &ldquo;{query}&rdquo;
                  </p>
                )}
              </div>

              {/* Footer hint */}
              <div className="flex items-center gap-4 border-t border-slate-100 dark:border-slate-800 px-4 py-2.5">
                <span className="text-2xs text-slate-400">↑↓ navigate</span>
                <span className="text-2xs text-slate-400">↵ select</span>
                <span className="text-2xs text-slate-400">esc close</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
