import { memo, useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, isToday, isPast, parseISO } from 'date-fns'
import { Calendar, ChevronRight, Flag, Star, Timer, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useStore } from '@/store'
import { playComplete, playUndo } from '@/lib/sound'
import type { Task } from '@/types'
import { PRIORITY_COLORS } from '@/types'

// Priority left-border colours — draws the eye, sets visual hierarchy
const PRIORITY_BORDER: Record<0|1|2|3, string> = {
  0: 'border-l-transparent',
  1: 'border-l-blue-400',
  2: 'border-l-amber-400',
  3: 'border-l-rose-500',
}

interface TaskItemProps {
  task: Task
  onEdit: (task: Task) => void
}

const TaskItem = memo(function TaskItem({ task, onEdit }: TaskItemProps) {
  const { toggleTask, deleteTask, pinToToday, openPomodoro } = useStore()
  const [removing, setRemoving] = useState(false)
  const [hovered, setHovered]   = useState(false)

  // ── Touch swipe-to-delete ─────────────────────────────────────────────────
  const touchStartX   = useRef(0)
  const touchCurrentX = useRef(0)
  const [swipeX, setSwipeX]       = useState(0)
  const isSwipingRef              = useRef(false)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    isSwipingRef.current = false
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current
    touchCurrentX.current = dx
    if (Math.abs(dx) > 8) isSwipingRef.current = true
    if (dx < 0) setSwipeX(Math.max(dx, -80))
  }, [])

  const onTouchEnd = useCallback(() => {
    if (touchCurrentX.current < -60) {
      setRemoving(true)
      setTimeout(() => void deleteTask(task.id), 300)
    } else {
      setSwipeX(0)
    }
  }, [deleteTask, task.id])

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (task.completed) playUndo(); else playComplete()
    void toggleTask(task.id)
  }, [toggleTask, task.id, task.completed])

  const handleClick = useCallback(() => {
    if (isSwipingRef.current) return
    onEdit(task)
  }, [onEdit, task])

  const dueDate    = task.due_date ? parseISO(task.due_date) : null
  const isOverdue  = dueDate && isPast(dueDate) && !isToday(dueDate) && !task.completed
  const overdueDays = isOverdue ? Math.floor((Date.now() - dueDate.getTime()) / 86_400_000) : 0
  const priority   = task.priority as 0|1|2|3

  return (
    <AnimatePresence>
      {!removing && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative overflow-hidden mb-1.5"
        >
          {/* Swipe-to-delete reveal */}
          <div
            className="absolute inset-y-0 right-0 flex items-center justify-end rounded-2xl bg-rose-500 px-5"
            aria-hidden
          >
            <Trash2 className="h-5 w-5 text-white" />
          </div>

          <motion.div
            style={{ x: swipeX }}
            animate={{ x: swipeX }}
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            onClick={handleClick}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            role="button"
            tabIndex={0}
            aria-label={`Task: ${task.title}`}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick() }}
            className={cn(
              // Structure
              'relative flex items-start gap-3 rounded-2xl border-l-[3px] px-3.5 py-3 no-select cursor-pointer',
              // Colors
              'bg-white dark:bg-slate-800/70',
              'border border-slate-100/80 dark:border-slate-700/40',
              // Priority left border — the visual anchor
              PRIORITY_BORDER[priority],
              // Hover
              'hover:shadow-[0_2px_16px_-4px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_2px_16px_-4px_rgba(0,0,0,0.4)]',
              'hover:border-slate-200 dark:hover:border-slate-600/60',
              'transition-all duration-150 ease-out',
              'active:scale-[0.988]',
              // Completed
              task.completed && 'opacity-40',
              // Overdue
              isOverdue && 'border-t-rose-200/60 dark:border-t-rose-900/40',
            )}
          >
            {/* Checkbox */}
            <button
              onClick={handleToggle}
              className="mt-0.5 shrink-0 focus:outline-none"
              aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
            >
              <motion.div
                animate={task.completed ? 'checked' : 'unchecked'}
                variants={{
                  unchecked: { scale: 1 },
                  checked:   { scale: [1, 1.35, 0.9, 1] },
                }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={cn(
                  'flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 transition-all duration-200',
                  task.completed
                    ? 'border-brand-500 bg-brand-500'
                    : 'border-slate-300 dark:border-slate-600 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30'
                )}
              >
                <AnimatePresence>
                  {task.completed && (
                    <motion.svg
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      exit={{ pathLength: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      viewBox="0 0 12 9"
                      fill="none"
                      className="h-3 w-3"
                      aria-hidden
                    >
                      <motion.path
                        d="M1 4L4.5 7.5L11 1"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </motion.svg>
                  )}
                </AnimatePresence>
              </motion.div>
            </button>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className={cn(
                'text-sm font-medium leading-snug',
                task.completed
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-800 dark:text-slate-100'
              )}>
                {task.title}
              </p>

              {/* Metadata row */}
              {(dueDate || (task.tags && task.tags.length > 0) || (task.subtasks && task.subtasks.length > 0)) && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {dueDate && (
                    <span className={cn(
                      'flex items-center gap-1 text-xs font-medium',
                      isOverdue && overdueDays >= 4
                        ? 'text-rose-600 dark:text-rose-400 animate-pulse font-bold'
                        : isOverdue
                        ? 'text-rose-500'
                        : isToday(dueDate)
                        ? 'text-brand-500 font-semibold'
                        : 'text-slate-400 dark:text-slate-500'
                    )}>
                      <Calendar className="h-3 w-3" />
                      {isOverdue
                        ? overdueDays === 1 ? '1 day overdue' : `${overdueDays}d overdue`
                        : isToday(dueDate)
                        ? 'Today'
                        : format(dueDate, 'MMM d')}
                    </span>
                  )}

                  {task.tags && task.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide"
                      style={{ backgroundColor: tag.color + '22', color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}

                  {task.subtasks && task.subtasks.length > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-slate-400">
                      <ChevronRight className="h-3 w-3" />
                      {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions — always visible on mobile, fade-in on desktop hover */}
            <div className={cn(
              'flex shrink-0 items-center gap-0.5 transition-opacity duration-150',
              'opacity-100 lg:opacity-0',
              hovered && 'lg:opacity-100'
            )}>
              {!task.completed && (
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={(e) => { e.stopPropagation(); openPomodoro(task.title) }}
                  className="rounded-xl p-1.5 text-slate-300 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                  aria-label="Focus with Pomodoro"
                >
                  <Timer className="h-4 w-4" />
                </motion.button>
              )}

              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={(e) => { e.stopPropagation(); void pinToToday(task.id, !task.pinned_to_today) }}
                className={cn(
                  'rounded-xl p-1.5 transition-colors',
                  task.pinned_to_today
                    ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                    : 'text-slate-300 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                )}
                aria-label={task.pinned_to_today ? 'Unpin from today' : 'Pin to today'}
              >
                <Star className="h-4 w-4" fill={task.pinned_to_today ? 'currentColor' : 'none'} />
              </motion.button>

              {task.priority > 0 && (
                <Flag
                  className={cn('h-3.5 w-3.5 ml-0.5', PRIORITY_COLORS[task.priority])}
                  aria-hidden
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

export default TaskItem
