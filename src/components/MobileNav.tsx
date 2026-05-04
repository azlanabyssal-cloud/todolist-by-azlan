import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sun, Inbox, FolderOpen, Calendar, Settings } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useStore } from '@/store'
import { ACCENT_PALETTES } from '@/types'

const NAV = [
  { to: '/today',    Icon: Sun,        label: 'Today'    },
  { to: '/inbox',    Icon: Inbox,      label: 'Inbox'    },
  { to: '/projects', Icon: FolderOpen, label: 'Projects' },
  { to: '/calendar', Icon: Calendar,   label: 'Calendar' },
  { to: '/settings', Icon: Settings,   label: 'Settings' },
]

export default function MobileNav() {
  const tasks  = useStore((s) => s.tasks)
  const accent = useStore((s) => s.accent)
  const inboxCount = tasks.filter((t) => !t.completed && !t.list_id && !t.parent_task_id).length
  const palette = ACCENT_PALETTES[accent]

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-20 flex border-t border-slate-100/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0d0d10]/95 backdrop-blur-2xl pb-safe-bottom lg:hidden"
      aria-label="Mobile navigation"
    >
      {NAV.map(({ to, Icon, label }) => {
        const showBadge = to === '/inbox' && inboxCount > 0
        return (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'relative flex flex-1 flex-col items-center gap-1 pt-2.5 pb-1 text-[10px] font-bold tracking-wide transition-colors duration-150',
              isActive
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
            )}
          >
            {({ isActive }) => (
              <>
                <span className="relative flex flex-col items-center">
                  {/* Pill background on active */}
                  {isActive && (
                    <motion.span
                      layoutId="mobile-nav-pill"
                      className="absolute -inset-x-3 -inset-y-1.5 rounded-full"
                      style={{ backgroundColor: palette.shades[50] }}
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  <span className="relative">
                    <Icon
                      className={cn(
                        'h-5 w-5 transition-transform duration-200',
                        isActive && 'scale-110'
                      )}
                      style={isActive ? { color: palette.shades[600] } : {}}
                      aria-hidden
                    />
                    {showBadge && (
                      <span
                        className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black text-white"
                        style={{ backgroundColor: palette.shades[500] }}
                      >
                        {inboxCount > 9 ? '9+' : inboxCount}
                      </span>
                    )}
                  </span>
                </span>
                <span className={cn('relative transition-colors', isActive && 'font-black')}
                  style={isActive ? { color: palette.shades[600] } : {}}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
