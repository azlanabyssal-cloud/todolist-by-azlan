import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isToday, isSameDay, format, addMonths, subMonths, parseISO, isPast,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react'
import { useStore } from '@/store'
import { cn } from '@/lib/cn'
import type { CalendarDay, Task } from '@/types'
import TaskItem from '@/components/TaskItem'
import TaskModal from '@/components/TaskModal'
import EmptyState from '@/components/EmptyState'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Calendar() {
  const tasks = useStore((s) => s.tasks)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [editingTask, setEditingTask]   = useState<Task | null>(null)

  const calendarDays = useMemo<CalendarDay[]>(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd   = endOfMonth(currentMonth)
    const gridStart  = startOfWeek(monthStart)
    const gridEnd    = endOfWeek(monthEnd)
    const days       = eachDayOfInterval({ start: gridStart, end: gridEnd })

    return days.map((date) => ({
      date,
      isCurrentMonth: isSameMonth(date, currentMonth),
      isToday: isToday(date),
      isPast: isPast(date) && !isToday(date),
      tasks: tasks.filter(
        (t) => t.due_date && isSameDay(parseISO(t.due_date), date) && !t.parent_task_id
      ),
    }))
  }, [currentMonth, tasks])

  const selectedDayTasks = useMemo(
    () => tasks.filter(
      (t) => t.due_date && isSameDay(parseISO(t.due_date), selectedDate) && !t.parent_task_id
    ),
    [tasks, selectedDate]
  )

  return (
    <div className="flex h-full flex-col overflow-hidden lg:flex-row">
      {/* Calendar grid */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Month navigation */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-4 lg:px-6"
        >
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {format(currentMonth, 'MMMM yyyy')}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              className="btn-ghost !p-2"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()) }}
              className="btn-ghost px-3 py-1.5 text-sm"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              className="btn-ghost !p-2"
              aria-label="Next month"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </motion.div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 px-4 lg:px-6">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2 text-center text-2xs font-semibold uppercase tracking-wider text-slate-400">
              {day}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <motion.div
          key={format(currentMonth, 'yyyy-MM')}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="grid flex-1 auto-rows-fr grid-cols-7 overflow-hidden px-4 py-2 lg:px-6"
        >
          {calendarDays.map((day) => {
            const isSelected = isSameDay(day.date, selectedDate)
            const pending    = day.tasks.filter((t) => !t.completed)
            const done       = day.tasks.filter((t) => t.completed)

            return (
              <button
                key={day.date.toISOString()}
                onClick={() => setSelectedDate(day.date)}
                className={cn(
                  'relative flex flex-col gap-0.5 rounded-xl p-1 text-left transition-all',
                  'min-h-[56px] lg:min-h-[72px]',
                  !day.isCurrentMonth && 'opacity-30',
                  isSelected && 'bg-brand-50 dark:bg-brand-950 ring-1 ring-brand-300 dark:ring-brand-700',
                  !isSelected && 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                )}
                aria-label={`${format(day.date, 'EEEE, MMMM d')}${day.tasks.length > 0 ? `, ${day.tasks.length} task${day.tasks.length !== 1 ? 's' : ''}` : ''}`}
                aria-pressed={isSelected}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium',
                    day.isToday
                      ? 'bg-brand-500 text-white font-bold'
                      : isSelected
                      ? 'text-brand-600 dark:text-brand-400'
                      : day.isPast
                      ? 'text-slate-400 dark:text-slate-500'
                      : 'text-slate-700 dark:text-slate-200'
                  )}
                >
                  {format(day.date, 'd')}
                </span>

                {/* Task dots */}
                {(pending.length > 0 || done.length > 0) && (
                  <div className="flex flex-wrap gap-0.5 px-0.5">
                    {pending.slice(0, 3).map((t) => (
                      <span
                        key={t.id}
                        className="h-1.5 w-1.5 rounded-full bg-brand-400"
                        aria-hidden
                      />
                    ))}
                    {done.length > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                    )}
                    {pending.length > 3 && (
                      <span className="text-2xs leading-none text-slate-400">+{pending.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </motion.div>
      </div>

      {/* Selected day panel */}
      <AnimatePresence mode="wait">
        <motion.aside
          key={selectedDate.toISOString().slice(0, 10)}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="border-t border-slate-100 dark:border-slate-800 lg:border-t-0 lg:border-l lg:w-80 overflow-y-auto scroll-container"
        >
          <div className="p-4 lg:p-5">
            <h2 className="mb-4 font-semibold text-slate-800 dark:text-slate-100">
              {isToday(selectedDate)
                ? 'Today'
                : format(selectedDate, 'EEEE, MMMM d')}
              {selectedDayTasks.length > 0 && (
                <span className="ml-2 text-sm font-normal text-slate-400">
                  {selectedDayTasks.length} task{selectedDayTasks.length !== 1 && 's'}
                </span>
              )}
            </h2>

            {selectedDayTasks.length === 0 ? (
              <EmptyState
                icon={<CalIcon className="h-6 w-6" />}
                title="No tasks"
                subtitle={`Nothing scheduled for ${format(selectedDate, 'MMM d')}.`}
              />
            ) : (
              <div className="space-y-1">
                {selectedDayTasks.map((task) => (
                  <TaskItem key={task.id} task={task} onEdit={setEditingTask} />
                ))}
              </div>
            )}
          </div>
        </motion.aside>
      </AnimatePresence>

      <TaskModal open={editingTask !== null} task={editingTask} onClose={() => setEditingTask(null)} />
    </div>
  )
}
