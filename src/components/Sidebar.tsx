import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun, Inbox, FolderOpen, Calendar, Settings, Plus, WifiOff, X,
  CheckSquare,
} from 'lucide-react'
import { useStore } from '@/store'
import { cn } from '@/lib/cn'
import { ACCENT_PALETTES } from '@/types'

const NAV_ITEMS = [
  { to: '/today',    Icon: Sun,        label: 'Today'    },
  { to: '/inbox',    Icon: Inbox,      label: 'Inbox'    },
  { to: '/projects', Icon: FolderOpen, label: 'Projects' },
  { to: '/calendar', Icon: Calendar,   label: 'Calendar' },
]

export default function Sidebar() {
  const {
    lists, user, tasks, isOnline, pendingOps,
    sidebarOpen, toggleSidebar, addList, accent,
  } = useStore()

  const [addingList, setAddingList]   = useState(false)
  const [newListName, setNewListName] = useState('')

  const inboxCount = tasks.filter((t) => !t.completed && !t.list_id && !t.parent_task_id).length
  const todayCount = (() => {
    const today = new Date().toISOString().slice(0, 10)
    return tasks.filter(
      (t) => !t.completed && !t.parent_task_id &&
             (t.pinned_to_today || t.due_date?.slice(0, 10) === today)
    ).length
  })()

  const handleAddList = async () => {
    if (!newListName.trim()) return
    await addList(newListName.trim())
    setNewListName('')
    setAddingList(false)
  }

  const palette = ACCENT_PALETTES[accent]

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col',
          'bg-white/95 dark:bg-[#0d0d10]/95 backdrop-blur-2xl',
          'border-r border-slate-100/80 dark:border-slate-800/60',
          'lg:relative lg:translate-x-0 lg:z-0 lg:bg-white dark:lg:bg-[#0d0d10]'
        )}
      >
        {/* ── Branding ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 pt-6 pb-2">
          <div className="flex items-center gap-3">
            {/* Logo mark — gradient circle with icon */}
            <div
              className="flex h-9 w-9 items-center justify-center rounded-2xl shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${palette.shades[400]}, ${palette.shades[700]})`,
              }}
            >
              <CheckSquare className="h-4.5 w-4.5 text-white" strokeWidth={2.5} aria-hidden />
            </div>
            <div>
              <p className="text-[13px] font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
                To-DoList
              </p>
              <p className="text-[10px] font-semibold leading-tight tracking-wider text-slate-400 uppercase">
                by Azlan
              </p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* ── User card ──────────────────────────────────────────────────── */}
        {user && (
          <div className="mx-3 mt-3 mb-1">
            <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50">
              {/* Avatar with accent gradient */}
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${palette.shades[400]}, ${palette.shades[600]})`,
                }}
              >
                {(user.full_name ?? user.email)[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                  {user.full_name ?? 'Azlan'}
                </p>
                <p className="truncate text-[10px] text-slate-400 leading-tight">
                  {user.email === 'guest@local' ? 'Guest mode' : user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation ─────────────────────────────────────────────────── */}
        <nav className="mt-3 flex-1 overflow-y-auto px-3" aria-label="Main navigation">
          <div className="space-y-0.5">
            {NAV_ITEMS.map(({ to, Icon, label }) => {
              const badge = to === '/inbox' ? inboxCount : to === '/today' ? todayCount : 0
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                  className={({ isActive }) => cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200'
                  )}
                >
                  {({ isActive }) => (
                    <>
                      {/* Active left-indicator bar */}
                      {isActive && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full"
                          style={{ backgroundColor: palette.shades[500] }}
                          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                        />
                      )}
                      <Icon
                        className={cn('h-[18px] w-[18px] shrink-0 transition-colors', isActive && 'text-brand-500')}
                        aria-hidden
                      />
                      <span className="flex-1">{label}</span>
                      {badge > 0 && (
                        <span
                          className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                          style={{ backgroundColor: palette.shades[500] }}
                        >
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>

          {/* ── Lists ──────────────────────────────────────────────────── */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between px-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                My Lists
              </span>
              <button
                onClick={() => setAddingList(true)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-brand-500 transition-colors"
                aria-label="Create list"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <AnimatePresence>
              {addingList && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-2 px-1"
                >
                  <input
                    autoFocus
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter')  void handleAddList()
                      if (e.key === 'Escape') setAddingList(false)
                    }}
                    placeholder="List name…"
                    className="input-base text-sm"
                    maxLength={100}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-0.5">
              {lists.length === 0 && !addingList && (
                <p className="px-3 py-2 text-xs text-slate-400">
                  No lists yet — create one above.
                </p>
              )}
              {lists.map((list) => {
                const count = tasks.filter((t) => t.list_id === list.id && !t.completed && !t.parent_task_id).length
                return (
                  <NavLink
                    key={list.id}
                    to={`/projects?list=${list.id}`}
                    onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                    className={({ isActive }) => cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-150',
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm"
                      style={{ backgroundColor: list.color }}
                    />
                    <span className="flex-1 truncate">{list.title}</span>
                    {count > 0 && (
                      <span className="text-[11px] font-semibold text-slate-400">{count}</span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        </nav>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 p-3 space-y-0.5">
          {/* Sync indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5">
            {isOnline ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-slate-400">
                  {pendingOps.length > 0 ? `Syncing ${pendingOps.length} changes…` : 'All synced'}
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Offline</span>
              </>
            )}
          </div>

          <NavLink
            to="/settings"
            onClick={() => window.innerWidth < 1024 && toggleSidebar()}
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
              isActive
                ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
            )}
          >
            <Settings className="h-[18px] w-[18px]" aria-hidden />
            Settings
          </NavLink>
        </div>
      </motion.aside>
    </>
  )
}
