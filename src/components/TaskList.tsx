import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import TaskItem from '@/components/TaskItem'
import TaskModal from '@/components/TaskModal'
import EmptyState from '@/components/EmptyState'
import type { Task } from '@/types'

interface TaskListProps {
  tasks: Task[]
  emptyIcon: React.ReactNode
  emptyTitle: string
  emptySubtitle: string
  defaultListId?: string | null
  showCompletedToggle?: boolean
}

export default function TaskList({
  tasks,
  emptyIcon,
  emptyTitle,
  emptySubtitle,
  defaultListId,
  showCompletedToggle = true,
}: TaskListProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [addingTask, setAddingTask]   = useState(false)
  const [showDone, setShowDone]       = useState(false)

  const pending   = tasks.filter((t) => !t.completed && !t.parent_task_id)
  const completed = tasks.filter((t) => t.completed && !t.parent_task_id)

  return (
    <>
      {pending.length === 0 && completed.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          subtitle={emptySubtitle}
          action={
            <button onClick={() => setAddingTask(true)} className="btn-primary">
              <Plus className="h-4 w-4" />
              Add task
            </button>
          }
        />
      ) : (
        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {pending.map((task) => (
              <TaskItem key={task.id} task={task} onEdit={setEditingTask} />
            ))}
          </AnimatePresence>

          {showCompletedToggle && completed.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setShowDone((v) => !v)}
                className="mb-2 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showDone ? '▾' : '▸'} Completed ({completed.length})
              </button>

              {showDone && (
                <AnimatePresence initial={false}>
                  {completed.map((task) => (
                    <TaskItem key={task.id} task={task} onEdit={setEditingTask} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick-add FAB */}
      {(pending.length > 0 || completed.length > 0) && (
        <button
          onClick={() => setAddingTask(true)}
          className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-brand hover:bg-brand-600 active:scale-95 transition-all lg:bottom-8 lg:right-8"
          aria-label="Add new task"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <TaskModal
        open={editingTask !== null}
        task={editingTask}
        defaultListId={defaultListId}
        onClose={() => setEditingTask(null)}
      />
      <TaskModal
        open={addingTask}
        defaultListId={defaultListId}
        onClose={() => setAddingTask(false)}
      />
    </>
  )
}
