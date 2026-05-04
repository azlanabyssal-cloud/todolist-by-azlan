import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Sun, AlertCircle, ChevronDown, Plus, Flame, Trophy } from 'lucide-react'
import { useStore, selectTodayTasks, selectOverdueTasks } from '@/store'
import { useStreak } from '@/hooks/useStreak'
import { ACCENT_PALETTES } from '@/types'
import TaskItem from '@/components/TaskItem'
import TaskModal from '@/components/TaskModal'
import EmptyState from '@/components/EmptyState'
import type { Task } from '@/types'

function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct    = total === 0 ? 0 : Math.round((done / total) * 100)
  const r      = 30
  const circ   = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <div className="relative flex h-[72px] w-[72px] items-center justify-center">
      <svg className="-rotate-90" width={72} height={72} aria-hidden>
        {/* Track */}
        <circle
          cx={36} cy={36} r={r}
          fill="none" strokeWidth={5}
          className="stroke-slate-100 dark:stroke-slate-800"
        />
        {/* Progress */}
        <motion.circle
          cx={36} cy={36} r={r}
          fill="none" strokeWidth={5}
          strokeLinecap="round"
          className="stroke-brand-500"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.34, 1.1, 0.64, 1] }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-base font-black tabular-nums text-slate-800 dark:text-slate-100 leading-none">
          {pct}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">pct</span>
      </div>
    </div>
  )
}

export default function Today() {
  const todayTasks   = useStore(selectTodayTasks)
  const overdueTasks = useStore(selectOverdueTasks)
  const tasks        = useStore((s) => s.tasks)
  const accent       = useStore((s) => s.accent)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [addingTask, setAddingTask]   = useState(false)
  const [overdueOpen, setOverdueOpen] = useState(true)

  const todayStr = format(new Date(), 'EEEE, MMMM d')
  const hour     = new Date().getHours()
  const greeting =
    hour < 5  ? 'Good night' :
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
                'Good evening'

  const todayCompleted = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10)
    return tasks.filter(
      (t) =>
        t.completed &&
        t.parent_task_id === null &&
        (t.pinned_to_today || t.due_date?.slice(0, 10) === todayIso)
    ).length
  }, [tasks])

  const todayTotal = todayTasks.length + todayCompleted
  const allDone    = todayTotal > 0 && todayTasks.length === 0
  const streak     = useStreak(todayCompleted)
  const palette    = ACCENT_PALETTES[accent]

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:px-8 lg:py-8">

      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.34, 1.1, 0.64, 1] }}
        className="mb-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              {todayStr}
            </p>
            {/* Gradient greeting text */}
            <h1
              className="text-3xl font-black tracking-tight leading-tight"
              style={{
                background: `linear-gradient(135deg, ${palette.shades[600]}, ${palette.shades[400]})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {greeting}
            </h1>
          </div>
          <ProgressRing done={todayCompleted} total={todayTotal} />
        </div>

        {/* Stats pills */}
        <div className="mt-5 flex flex-wrap gap-2">
          <StatPill
            value={todayTotal}
            label="tasks today"
            color={palette.shades[500]}
            bg={palette.shades[50]}
            textColor={palette.shades[700]}
          />
          {todayCompleted > 0 && (
            <StatPill value={todayCompleted} label="done" color="#10b981" bg="#ecfdf5" textColor="#065f46" />
          )}
          {overdueTasks.length > 0 && (
            <StatPill value={overdueTasks.length} label="overdue" color="#f43f5e" bg="#fff1f2" textColor="#be123c" />
          )}
          {streak.current > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
              style={{ background: '#fffbeb', color: '#b45309' }}
            >
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              {streak.current} day streak
              {streak.current >= 7 && <Trophy className="h-3 w-3 text-amber-500" />}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Overdue ─────────────────────────────────────────────────────── */}
      {overdueTasks.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-6"
          aria-label="Overdue tasks"
        >
          <button
            onClick={() => setOverdueOpen((v) => !v)}
            className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400 hover:text-rose-600 transition-colors"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            Overdue · {overdueTasks.length}
            <motion.span
              animate={{ rotate: overdueOpen ? 0 : -90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </motion.span>
          </button>
          <AnimatePresence>
            {overdueOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {overdueTasks.map((task) => (
                  <TaskItem key={task.id} task={task} onEdit={setEditingTask} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      )}

      {/* ── My Day ──────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.13 }}
        aria-label="Today's tasks"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            My Day
          </h2>
          <button
            onClick={() => setAddingTask(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
            aria-label="Add task"
          >
            <Plus className="h-3.5 w-3.5" />
            Add task
          </button>
        </div>

        {todayTasks.length === 0 && todayCompleted === 0 ? (
          <EmptyState
            icon={<Sun className="h-10 w-10" />}
            title="Your day is clear"
            subtitle="Add tasks to focus on today, or star tasks from your lists."
            action={
              <button onClick={() => setAddingTask(true)} className="btn-primary">
                <Plus className="h-4 w-4" />
                Plan my day
              </button>
            }
          />
        ) : (
          <div>
            {todayTasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <TaskItem task={task} onEdit={setEditingTask} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {todayTasks.length > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setAddingTask(true)}
            className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-brand transition-colors lg:bottom-8 lg:right-8"
            style={{ background: `linear-gradient(135deg, ${palette.shades[500]}, ${palette.shades[700]})` }}
            aria-label="Add task"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>

      <TaskModal open={!!editingTask} task={editingTask} onClose={() => setEditingTask(null)} />
      <TaskModal open={addingTask}    onClose={() => setAddingTask(false)} defaultListId={null} />

      {/* ── Day-complete celebration ─────────────────────────────────────── */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 24 }}
            className="fixed bottom-28 left-1/2 z-30 -translate-x-1/2 lg:bottom-10"
          >
            <div className="flex items-center gap-4 rounded-2xl px-6 py-4 shadow-elevated text-white"
              style={{ background: `linear-gradient(135deg, #10b981, #059669)` }}
            >
              <span className="text-2xl">🎉</span>
              <div>
                <p className="text-sm font-black">Day complete!</p>
                <p className="text-xs opacity-80">{todayCompleted} task{todayCompleted !== 1 ? 's' : ''} crushed today</p>
              </div>
              <Trophy className="h-6 w-6 opacity-80" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatPill({
  value, label, color, bg, textColor,
}: {
  value: number; label: string; color: string; bg: string; textColor: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
      style={{ backgroundColor: bg, color: textColor }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span style={{ color }}>{value}</span>
      <span>{label}</span>
    </motion.div>
  )
}
