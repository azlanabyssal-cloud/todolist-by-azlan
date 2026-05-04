import { useState } from 'react'
import { motion } from 'framer-motion'
import { Inbox as InboxIcon, Plus } from 'lucide-react'
import { useStore, selectInboxTasks } from '@/store'
import TaskList from '@/components/TaskList'
import TaskModal from '@/components/TaskModal'

export default function Inbox() {
  const inboxTasks  = useStore(selectInboxTasks)
  const allInbox    = useStore((s) => s.tasks.filter((t) => t.list_id === null && !t.parent_task_id))
  const [adding, setAdding] = useState(false)

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:px-6 lg:py-8">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <InboxIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Inbox</h1>
              <p className="text-sm text-slate-400">{inboxTasks.length} task{inboxTasks.length !== 1 && 's'}</p>
            </div>
          </div>
          <button
            onClick={() => setAdding(true)}
            className="btn-primary"
            aria-label="Add task to inbox"
          >
            <Plus className="h-4 w-4" />
            Add task
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <TaskList
          tasks={allInbox}
          emptyIcon={<InboxIcon className="h-8 w-8" />}
          emptyTitle="Inbox zero"
          emptySubtitle="Tasks without a list live here. Capture anything, then organise later."
          defaultListId={null}
        />
      </motion.div>

      <TaskModal open={adding} onClose={() => setAdding(false)} defaultListId={null} />
    </div>
  )
}
