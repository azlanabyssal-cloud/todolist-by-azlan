import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useStore } from '@/store'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import CommandPalette from '@/components/CommandPalette'
import TaskModal from '@/components/TaskModal'
import PomodoroWidget from '@/components/PomodoroWidget'

interface LayoutProps {
  children: React.ReactNode
}

// Track cursor position for desktop glow effect
function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!ref.current) return
      ref.current.style.setProperty('--cx', `${e.clientX}px`)
      ref.current.style.setProperty('--cy', `${e.clientY}px`)
    }
    window.addEventListener('mousemove', move, { passive: true })
    return () => window.removeEventListener('mousemove', move)
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: 'radial-gradient(600px circle at var(--cx, -9999px) var(--cy, -9999px), rgba(99,102,241,0.06) 0%, transparent 60%)',
      }}
    />
  )
}

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 10, scale: 0.995 },
  animate: { opacity: 1, y: 0,  scale: 1 },
  exit:    { opacity: 0, y: -6, scale: 0.998 },
}

export default function Layout({ children }: LayoutProps) {
  const toggleSidebar     = useStore((s) => s.toggleSidebar)
  const setCmdPaletteOpen = useStore((s) => s.setCmdPaletteOpen)
  const quickAddOpen      = useStore((s) => s.quickAddOpen)
  const setQuickAddOpen   = useStore((s) => s.setQuickAddOpen)
  const pomodoroOpen      = useStore((s) => s.pomodoroOpen)
  const pomodoroTaskTitle = useStore((s) => s.pomodoroTaskTitle)
  const closePomodoro     = useStore((s) => s.closePomodoro)
  const location          = useLocation()

  // Global keyboard shortcuts — N for new task, CMD+K for palette
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const inInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdPaletteOpen(true)
        return
      }

      if (!inInput && e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setQuickAddOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setCmdPaletteOpen, setQuickAddOpen])

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-bg-light dark:bg-bg-dark">
      {/* Desktop cursor glow */}
      <CursorGlow />

      {/* Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0 relative z-10">
        <Sidebar />
      </div>
      <div className="lg:hidden">
        <Sidebar />
      </div>

      {/* Main area */}
      <main className="relative flex flex-1 flex-col overflow-hidden z-10">
        {/* Mobile header */}
        <header className="flex items-center gap-3 border-b border-slate-100/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl px-4 py-3 lg:hidden safe-top">
          <motion.button
            onClick={toggleSidebar}
            className="btn-ghost !p-2 -ml-2 ripple"
            aria-label="Open navigation"
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Menu className="h-5 w-5" />
          </motion.button>
          <div className="flex items-center gap-2.5">
            <motion.div
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 shadow-brand"
              whileHover={{ rotate: 5, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <span className="text-xs font-black text-white">Z</span>
            </motion.div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">To-DoList by Azlan</span>
          </div>
        </header>

        {/* Page content with route transition */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={PAGE_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: [0.34, 1.1, 0.64, 1] }}
            className="flex-1 overflow-y-auto scroll-container pb-20 lg:pb-0"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <MobileNav />

      {/* Global quick-add modal — reachable via N key from any route */}
      <TaskModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        defaultListId={null}
      />

      {/* CMD+K command palette */}
      <CommandPalette />

      {/* Pomodoro timer — persists across all routes */}
      <AnimatePresence>
        {pomodoroOpen && (
          <PomodoroWidget
            taskTitle={pomodoroTaskTitle}
            onClose={closePomodoro}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
