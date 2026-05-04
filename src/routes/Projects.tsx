import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderOpen, Plus, Trash2, Check } from 'lucide-react'
import { useStore } from '@/store'
import TaskList from '@/components/TaskList'
import TaskModal from '@/components/TaskModal'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/ui/Modal'
import type { Task } from '@/types'

const LIST_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
  '#10b981', '#06b6d4', '#3b82f6', '#64748b', '#f97316',
]

function ListCard({ listId, onSelect }: { listId: string; onSelect: (id: string) => void }) {
  const lists = useStore((s) => s.lists)
  const tasks = useStore((s) => s.tasks)
  const list  = lists.find((l) => l.id === listId)
  if (!list) return null

  const listTasks = tasks.filter((t) => t.list_id === listId && !t.parent_task_id)
  const done      = listTasks.filter((t) => t.completed).length
  const pct       = listTasks.length === 0 ? 0 : Math.round((done / listTasks.length) * 100)

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(listId)}
      className="card group relative flex flex-col gap-4 p-5 text-left transition-shadow hover:shadow-elevated"
      aria-label={`Open list: ${list.title}`}
    >
      {/* Color band */}
      <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: list.color + '30' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: list.color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        />
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div
            className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl text-lg"
            style={{ backgroundColor: list.color + '20' }}
            aria-hidden
          >
            {list.icon === 'list' ? '📋' : list.icon}
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">{list.title}</h3>
          <p className="mt-0.5 text-sm text-slate-400">
            {listTasks.filter((t) => !t.completed).length} remaining
          </p>
        </div>
        <span className="text-sm font-bold tabular-nums" style={{ color: list.color }}>
          {pct}%
        </span>
      </div>
    </motion.button>
  )
}

function NewListModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addList } = useStore()
  const [name, setName]     = useState('')
  const [color, setColor]   = useState(LIST_COLORS[0])
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    if (!name.trim() || saving) return
    setSaving(true)
    await addList(name.trim(), color)
    setName('')
    setSaving(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="New List" size="sm">
      <div className="space-y-4 p-5 pb-8">
        <input
          autoFocus
          type="text"
          placeholder="List name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate() }}
          className="input-base"
          maxLength={100}
        />
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Color</p>
          <div className="flex flex-wrap gap-2">
            {LIST_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="relative h-7 w-7 rounded-full transition-transform hover:scale-110 active:scale-95"
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
                aria-pressed={color === c}
              >
                {color === c && (
                  <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-white" />
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-ghost text-sm">Cancel</button>
          <button onClick={() => void handleCreate()} disabled={!name.trim() || saving} className="btn-primary text-sm">
            {saving ? 'Creating…' : 'Create list'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function Projects() {
  const [searchParams]    = useSearchParams()
  const focusedListId     = searchParams.get('list')

  const { lists, tasks, deleteList }   = useStore()
  const [selectedId, setSelectedId]    = useState<string | null>(focusedListId)
  const [newListOpen, setNewListOpen]  = useState(false)
  const [editingTask, setEditingTask]  = useState<Task | null>(null)

  useEffect(() => {
    setSelectedId(focusedListId)
  }, [focusedListId])

  const selectedList = useMemo(
    () => lists.find((l) => l.id === selectedId),
    [lists, selectedId]
  )

  const selectedTasks = useMemo(
    () => tasks.filter((t) => t.list_id === selectedId),
    [tasks, selectedId]
  )

  if (selectedList) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 lg:px-6 lg:py-8">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button
            onClick={() => setSelectedId(null)}
            className="mb-4 flex items-center gap-1.5 text-sm text-slate-400 hover:text-brand-500 transition-colors"
          >
            ← Back to Projects
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-lg"
                style={{ backgroundColor: selectedList.color + '20' }}
              >
                📋
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedList.title}</h1>
                <p className="text-sm text-slate-400">
                  {selectedTasks.filter((t) => !t.completed && !t.parent_task_id).length} remaining
                </p>
              </div>
            </div>

            <button
              onClick={() => { void deleteList(selectedList.id); setSelectedId(null) }}
              className="btn-ghost !text-rose-500 hover:!bg-rose-50 dark:hover:!bg-rose-900/20"
              aria-label="Delete list"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        <TaskList
          tasks={selectedTasks}
          emptyIcon={<FolderOpen className="h-8 w-8" />}
          emptyTitle="List is empty"
          emptySubtitle="Add your first task to this list."
          defaultListId={selectedList.id}
        />

        <TaskModal open={editingTask !== null} task={editingTask} onClose={() => setEditingTask(null)} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6 lg:py-8">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Projects</h1>
            <p className="mt-0.5 text-sm text-slate-400">{lists.length} list{lists.length !== 1 && 's'}</p>
          </div>
          <button onClick={() => setNewListOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            New List
          </button>
        </div>
      </motion.div>

      {lists.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-8 w-8" />}
          title="No lists yet"
          subtitle="Create a list to organise your tasks by project, area, or goal."
          action={
            <button onClick={() => setNewListOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4" />
              Create first list
            </button>
          }
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2"
        >
          <AnimatePresence>
            {lists.map((list) => (
              <ListCard key={list.id} listId={list.id} onSelect={setSelectedId} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <NewListModal open={newListOpen} onClose={() => setNewListOpen(false)} />
    </div>
  )
}
