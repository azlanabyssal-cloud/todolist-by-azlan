import { useEffect, useState } from 'react'
import { Flag, Calendar, AlignLeft, List as ListIcon, Tag, RotateCcw, Trash2, Sparkles } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { useStore } from '@/store'
import { cn } from '@/lib/cn'
import { parseNaturalDate } from '@/lib/nlpDate'
import type { Task, Priority, TaskCreateInput } from '@/types'
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/types'

interface TaskModalProps {
  task?: Task | null
  defaultListId?: string | null
  open: boolean
  onClose: () => void
}

const PRIORITIES: Priority[] = [0, 1, 2, 3]

const RECURRENCE_OPTIONS = [
  { value: 'FREQ=DAILY', label: 'Daily' },
  { value: 'FREQ=WEEKLY', label: 'Weekly' },
  { value: 'FREQ=MONTHLY', label: 'Monthly' },
  { value: 'FREQ=YEARLY', label: 'Yearly' },
]

export default function TaskModal({ task, defaultListId, open, onClose }: TaskModalProps) {
  const { lists, tags, addTask, updateTask, deleteTask } = useStore()

  const [title, setTitle]           = useState('')
  const [description, setDesc]      = useState('')
  const [dueDate, setDueDate]       = useState('')
  const [priority, setPriority]     = useState<Priority>(0)
  const [listId, setListId]         = useState<string | null>(null)
  const [selectedTags, setTags]     = useState<string[]>([])
  const [isRecurring, setRecurring] = useState(false)
  const [rule, setRule]             = useState('FREQ=DAILY')
  const [saving, setSaving]         = useState(false)
  const [nlpLabel, setNlpLabel]     = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? '')
      setDesc(task?.description ?? '')
      setDueDate(task?.due_date?.slice(0, 10) ?? '')
      setPriority(task?.priority ?? 0)
      setListId(task?.list_id ?? defaultListId ?? null)
      setTags(task?.tags?.map((t) => t.id) ?? [])
      setRecurring(task?.is_recurring ?? false)
      setRule(task?.recurrence_rule ?? 'FREQ=DAILY')
      setNlpLabel(null)
    }
  }, [open, task, defaultListId])

  const isValid = title.trim().length > 0

  const handleSave = async () => {
    if (!isValid || saving) return
    setSaving(true)

    const input: TaskCreateInput = {
      title,
      description: description || undefined,
      due_date: dueDate || undefined,
      priority,
      list_id: listId ?? undefined,
      is_recurring: isRecurring,
      recurrence_rule: isRecurring ? rule : undefined,
    }

    try {
      if (task) {
        await updateTask(task.id, input)
      } else {
        await addTask(input)
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!task) return
    await deleteTask(task.id)
    onClose()
  }

  const toggleTag = (tagId: string) => {
    setTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Edit Task' : 'New Task'} size="md">
      <div className="space-y-4 p-5 pb-8">
        {/* Title — with live natural language date detection (Todoist architecture) */}
        <div className="space-y-1.5">
          <input
            autoFocus
            type="text"
            placeholder="What needs to be done? (try 'call John tomorrow')"
            value={title}
            onChange={(e) => {
              const raw = e.target.value
              // Only parse NLP when editing a new task (not editing existing)
              if (!task) {
                const { date, label, cleaned } = parseNaturalDate(raw)
                if (date && label) {
                  setDueDate(date)
                  setNlpLabel(label)
                  setTitle(cleaned)
                  return
                }
                setNlpLabel(null)
              }
              setTitle(raw)
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) void handleSave() }}
            className="input-base text-base font-medium placeholder:font-normal placeholder:text-xs"
            aria-label="Task title"
            maxLength={500}
          />
          {/* NLP detection badge */}
          {nlpLabel && !task && (
            <div className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400">
              <Sparkles className="h-3 w-3" aria-hidden />
              <span>Date detected: <strong>{nlpLabel}</strong></span>
              <button
                type="button"
                onClick={() => { setDueDate(''); setNlpLabel(null) }}
                className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                aria-label="Remove detected date"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="flex items-start gap-3">
          <AlignLeft className="mt-2.5 h-4 w-4 shrink-0 text-slate-400" />
          <textarea
            placeholder="Add notes…"
            value={description}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            className="input-base resize-none"
            aria-label="Task description"
            maxLength={2000}
          />
        </div>

        {/* Due date */}
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="input-base"
            aria-label="Due date"
          />
        </div>

        {/* Priority */}
        <div className="flex items-center gap-3">
          <Flag className="h-4 w-4 shrink-0 text-slate-400" />
          <div className="flex gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  priority === p
                    ? cn('bg-brand-500 text-white shadow-brand')
                    : cn('bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700', PRIORITY_COLORS[p])
                )}
                aria-pressed={priority === p}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {lists.length > 0 && (
          <div className="flex items-center gap-3">
            <ListIcon className="h-4 w-4 shrink-0 text-slate-400" />
            <select
              value={listId ?? ''}
              onChange={(e) => setListId(e.target.value || null)}
              className="input-base"
              aria-label="Select list"
            >
              <option value="">Inbox (no list)</option>
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex items-start gap-3">
            <Tag className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-all',
                    selectedTags.includes(tag.id)
                      ? 'ring-2 ring-offset-1 ring-current opacity-100'
                      : 'opacity-60 hover:opacity-80'
                  )}
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  aria-pressed={selectedTags.includes(tag.id)}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recurring */}
        <div className="flex items-center gap-3">
          <RotateCcw className="h-4 w-4 shrink-0 text-slate-400" />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="h-4 w-4 rounded accent-brand-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">Recurring task</span>
          </label>
          {isRecurring && (
            <select
              value={rule}
              onChange={(e) => setRule(e.target.value)}
              className="input-base ml-2 max-w-[120px]"
              aria-label="Recurrence frequency"
            >
              {RECURRENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          {task ? (
            <button
              onClick={() => void handleDelete()}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
              aria-label="Delete task"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn-ghost text-sm">
              Cancel
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={!isValid || saving}
              className="btn-primary text-sm"
            >
              {saving ? 'Saving…' : task ? 'Save changes' : 'Add task'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
