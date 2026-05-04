import { create } from 'zustand'
import type {
  Task, List, Tag, UserProfile, Theme, View, PendingOperation, TaskCreateInput, TaskUpdateInput, AccentPalette,
  FontSize, Density, FontFamily, BackgroundStyle, CursorStyle,
} from '@/types'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  setLocalTask, setLocalTasks, removeLocalTask,
  setLocalList, setLocalLists, removeLocalList,
  setLocalTags, addPendingOp, removePendingOp,
  setLastSync,
} from '@/lib/db'
import { sanitizeText } from '@/lib/sanitize'
import { nanoid } from '@/lib/nanoid'

interface AppStore {
  // Auth
  user: UserProfile | null
  authLoading: boolean

  // Data
  tasks: Task[]
  lists: List[]
  tags: Tag[]
  dataLoading: boolean

  // UI
  theme: Theme
  accent: AccentPalette
  fontFamily: FontFamily
  backgroundStyle: BackgroundStyle
  fontSize: FontSize
  density: Density
  soundEnabled: boolean
  reducedMotion: boolean
  cursorStyle: CursorStyle
  view: View

  sidebarOpen: boolean
  selectedListId: string | null
  openTaskId: string | null
  quickAddOpen: boolean
  cmdPaletteOpen: boolean
  pomodoroOpen: boolean
  pomodoroTaskTitle: string | null

  // Sync
  pendingOps: PendingOperation[]
  isOnline: boolean
  lastSync: number | null

  // Auth actions
  setUser: (user: UserProfile | null) => void
  setAuthLoading: (v: boolean) => void
  signOut: () => Promise<void>

  // Data actions
  setTasks: (tasks: Task[]) => void
  setLists: (lists: List[]) => void
  setTags: (tags: Tag[]) => void
  setDataLoading: (v: boolean) => void

  // Task CRUD
  addTask: (input: TaskCreateInput) => Promise<Task>
  updateTask: (id: string, input: TaskUpdateInput) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  pinToToday: (id: string, pinned: boolean) => Promise<void>
  reorderTask: (id: string, newPosition: number, listId: string | null) => Promise<void>

  // List CRUD
  addList: (title: string, color?: string, icon?: string) => Promise<List>
  updateList: (id: string, updates: Partial<Pick<List, 'title' | 'color' | 'icon'>>) => Promise<void>
  deleteList: (id: string) => Promise<void>

  // Tag CRUD
  addTag: (name: string, color: string) => Promise<Tag>

  // UI actions
  setTheme: (theme: Theme) => void
  setAccent: (accent: AccentPalette) => void
  setFontFamily: (v: FontFamily) => void
  setBackgroundStyle: (v: BackgroundStyle) => void
  setFontSize: (v: FontSize) => void
  setDensity: (v: Density) => void
  setSoundEnabled: (v: boolean) => void
  setReducedMotion: (v: boolean) => void
  setCursorStyle: (v: CursorStyle) => void
  setView: (view: View) => void
  toggleSidebar: () => void
  setSelectedListId: (id: string | null) => void
  setOpenTaskId: (id: string | null) => void
  setQuickAddOpen: (v: boolean) => void
  setCmdPaletteOpen: (v: boolean) => void
  openPomodoro: (taskTitle?: string) => void
  closePomodoro: () => void

  // Sync
  setOnline: (online: boolean) => void
  addPendingOp: (op: PendingOperation) => void
  removePendingOp: (id: string) => void
  setLastSync: (ts: number) => void

  // Realtime handlers
  handleTaskChange: (eventType: string, task: Task) => void
  handleListChange: (eventType: string, list: List) => void
}

export const useStore = create<AppStore>()((set, get) => ({
    // ── Initial state ─────────────────────────────────────────────────────────
    user: null,
    authLoading: true,
    tasks: [],
    lists: [],
    tags: [],
    dataLoading: false,
    theme: (localStorage.getItem('theme') as Theme) ?? 'system',
    accent: (localStorage.getItem('accent') as AccentPalette) ?? 'indigo',
    fontFamily: (localStorage.getItem('fontFamily') as FontFamily) ?? 'inter',
    backgroundStyle: (localStorage.getItem('backgroundStyle') as BackgroundStyle) ?? 'clean',
    fontSize: (localStorage.getItem('fontSize') as FontSize) ?? 'md',
    density: (localStorage.getItem('density') as Density) ?? 'comfortable',
    soundEnabled: localStorage.getItem('soundEnabled') !== 'false',
    reducedMotion: localStorage.getItem('reducedMotion') === 'true',
    cursorStyle: (localStorage.getItem('cursorStyle') as CursorStyle) ?? 'default',
    view: 'list',
    sidebarOpen: window.innerWidth >= 1024,
    selectedListId: null,
    openTaskId: null,
    quickAddOpen: false,
    cmdPaletteOpen: false,
    pomodoroOpen: false,
    pomodoroTaskTitle: null,
    pendingOps: [],
    isOnline: navigator.onLine,
    lastSync: null,

    // ── Auth ──────────────────────────────────────────────────────────────────
    setUser: (user) => set({ user }),
    setAuthLoading: (authLoading) => set({ authLoading }),
    signOut: async () => {
      if (isSupabaseConfigured) await supabase.auth.signOut()
      set({ user: null, tasks: [], lists: [], tags: [] })
    },

    // ── Data setters ──────────────────────────────────────────────────────────
    setTasks: (tasks) => {
      set({ tasks })
      void setLocalTasks(tasks)
    },
    setLists: (lists) => {
      set({ lists })
      void setLocalLists(lists)
    },
    setTags: (tags) => {
      set({ tags })
      void setLocalTags(tags)
    },
    setDataLoading: (dataLoading) => set({ dataLoading }),

    // ── Task CRUD ─────────────────────────────────────────────────────────────
    addTask: async (input) => {
      const { user, tasks } = get()
      if (!user) throw new Error('Not authenticated')

      const newTask: Task = {
        id: nanoid(),
        owner_id: user.id,
        list_id: input.list_id ?? null,
        parent_task_id: input.parent_task_id ?? null,
        title: sanitizeText(input.title),
        description: input.description ? sanitizeText(input.description) : null,
        due_date: input.due_date ?? null,
        reminder_at: input.reminder_at ?? null,
        priority: input.priority ?? 0,
        completed: false,
        completed_at: null,
        is_recurring: input.is_recurring ?? false,
        recurrence_rule: input.recurrence_rule ?? null,
        position: tasks.length,
        pinned_to_today: input.pinned_to_today ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      set((s) => ({ tasks: [newTask, ...s.tasks] }))
      void setLocalTask(newTask)

      if (isSupabaseConfigured) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.from('tasks').insert({ ...newTask, tags: undefined, subtasks: undefined } as any)
        if (error) {
          const op: PendingOperation = {
            id: nanoid(), type: 'create', table: 'tasks',
            payload: newTask as unknown as Record<string, unknown>,
            created_at: Date.now(), retries: 0,
          }
          get().addPendingOp(op)
        }
      }

      return newTask
    },

    updateTask: async (id, input) => {
      const updates: Partial<Task> = {
        ...(input.title !== undefined && { title: sanitizeText(input.title) }),
        ...(input.description !== undefined && { description: input.description ? sanitizeText(input.description) : null }),
        ...(input.due_date !== undefined && { due_date: input.due_date }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.list_id !== undefined && { list_id: input.list_id }),
        ...(input.completed !== undefined && {
          completed: input.completed,
          completed_at: input.completed ? new Date().toISOString() : null,
        }),
        ...(input.pinned_to_today !== undefined && { pinned_to_today: input.pinned_to_today }),
        updated_at: new Date().toISOString(),
      }

      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }))

      const updated = get().tasks.find((t) => t.id === id)
      if (updated) void setLocalTask(updated)

      if (isSupabaseConfigured) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.from('tasks').update(updates as any).eq('id', id)
        if (error) {
          const op: PendingOperation = {
            id: nanoid(), type: 'update', table: 'tasks',
            payload: { id, ...updates } as Record<string, unknown>,
            created_at: Date.now(), retries: 0,
          }
          get().addPendingOp(op)
        }
      }
    },

    toggleTask: async (id) => {
      const task = get().tasks.find((t) => t.id === id)
      if (!task) return
      await get().updateTask(id, { completed: !task.completed })
    },

    deleteTask: async (id) => {
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
      void removeLocalTask(id)

      if (isSupabaseConfigured) {
        const { error } = await supabase.from('tasks').delete().eq('id', id)
        if (error) {
          const op: PendingOperation = {
            id: nanoid(), type: 'delete', table: 'tasks',
            payload: { id }, created_at: Date.now(), retries: 0,
          }
          get().addPendingOp(op)
        }
      }
    },

    pinToToday: async (id, pinned) => {
      await get().updateTask(id, { pinned_to_today: pinned })
    },

    reorderTask: async (id, newPosition, listId) => {
      set((s) => {
        const tasks = [...s.tasks]
        const idx = tasks.findIndex((t) => t.id === id)
        if (idx === -1) return s
        tasks[idx] = { ...tasks[idx], position: newPosition }
        return { tasks: tasks.sort((a, b) => a.position - b.position) }
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (isSupabaseConfigured)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from('tasks').update({ position: newPosition, list_id: listId } as any).eq('id', id)
    },

    // ── List CRUD ─────────────────────────────────────────────────────────────
    addList: async (title, color = '#6366f1', icon = 'list') => {
      const { user } = get()
      if (!user) throw new Error('Not authenticated')

      const newList: List = {
        id: nanoid(),
        owner_id: user.id,
        title: sanitizeText(title),
        color,
        icon,
        is_shared: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      set((s) => ({ lists: [...s.lists, newList] }))
      void setLocalList(newList)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (isSupabaseConfigured) await supabase.from('lists').insert(newList as any)

      return newList
    },

    updateList: async (id, updates) => {
      const sanitized = {
        ...(updates.title && { title: sanitizeText(updates.title) }),
        ...(updates.color && { color: updates.color }),
        ...(updates.icon && { icon: updates.icon }),
        updated_at: new Date().toISOString(),
      }

      set((s) => ({
        lists: s.lists.map((l) => (l.id === id ? { ...l, ...sanitized } : l)),
      }))

      const updated = get().lists.find((l) => l.id === id)
      if (updated) void setLocalList(updated)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (isSupabaseConfigured) await supabase.from('lists').update(sanitized as any).eq('id', id)
    },

    deleteList: async (id) => {
      set((s) => ({
        lists: s.lists.filter((l) => l.id !== id),
        tasks: s.tasks.filter((t) => t.list_id !== id),
      }))
      void removeLocalList(id)
      if (isSupabaseConfigured) await supabase.from('lists').delete().eq('id', id)
    },

    // ── Tags ──────────────────────────────────────────────────────────────────
    addTag: async (name, color) => {
      const { user } = get()
      if (!user) throw new Error('Not authenticated')

      const newTag: Tag = {
        id: nanoid(),
        owner_id: user.id,
        name: sanitizeText(name),
        color,
        created_at: new Date().toISOString(),
      }

      set((s) => ({ tags: [...s.tags, newTag] }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (isSupabaseConfigured) await supabase.from('tags').insert(newTag as any)
      return newTag
    },

    // ── UI ────────────────────────────────────────────────────────────────────
    setTheme: (theme) => {
      localStorage.setItem('theme', theme)
      set({ theme })
    },
    setAccent: (accent) => {
      localStorage.setItem('accent', accent)
      set({ accent })
    },
    setFontFamily: (fontFamily) => {
      localStorage.setItem('fontFamily', fontFamily)
      set({ fontFamily })
    },
    setBackgroundStyle: (backgroundStyle) => {
      localStorage.setItem('backgroundStyle', backgroundStyle)
      set({ backgroundStyle })
    },
    setFontSize: (fontSize) => {
      localStorage.setItem('fontSize', fontSize)
      set({ fontSize })
    },
    setDensity: (density) => {
      localStorage.setItem('density', density)
      set({ density })
    },
    setSoundEnabled: (soundEnabled) => {
      localStorage.setItem('soundEnabled', String(soundEnabled))
      set({ soundEnabled })
    },
    setReducedMotion: (reducedMotion) => {
      localStorage.setItem('reducedMotion', String(reducedMotion))
      set({ reducedMotion })
    },
    setCursorStyle: (cursorStyle) => {
      localStorage.setItem('cursorStyle', cursorStyle)
      set({ cursorStyle })
    },
    setView: (view) => set({ view }),
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    setSelectedListId: (selectedListId) => set({ selectedListId }),
    setOpenTaskId: (openTaskId) => set({ openTaskId }),
    setQuickAddOpen: (quickAddOpen) => set({ quickAddOpen }),
    setCmdPaletteOpen: (cmdPaletteOpen) => set({ cmdPaletteOpen }),
    openPomodoro: (taskTitle) => set({ pomodoroOpen: true, pomodoroTaskTitle: taskTitle ?? null }),
    closePomodoro: () => set({ pomodoroOpen: false, pomodoroTaskTitle: null }),

    // ── Sync ──────────────────────────────────────────────────────────────────
    setOnline: (isOnline) => set({ isOnline }),
    addPendingOp: (op) => {
      set((s) => ({ pendingOps: [...s.pendingOps, op] }))
      void addPendingOp(op)
    },
    removePendingOp: (id) => {
      set((s) => ({ pendingOps: s.pendingOps.filter((op) => op.id !== id) }))
      void removePendingOp(id)
    },
    setLastSync: (ts) => {
      set({ lastSync: ts })
      void setLastSync(ts)
    },

    // ── Realtime handlers ─────────────────────────────────────────────────────
    handleTaskChange: (eventType, task) => {
      if (eventType === 'INSERT') {
        set((s) => {
          if (s.tasks.some((t) => t.id === task.id)) return s
          return { tasks: [task, ...s.tasks] }
        })
        void setLocalTask(task)
      } else if (eventType === 'UPDATE') {
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === task.id ? task : t)) }))
        void setLocalTask(task)
      } else if (eventType === 'DELETE') {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== task.id) }))
        void removeLocalTask(task.id)
      }
    },

    handleListChange: (eventType, list) => {
      if (eventType === 'INSERT') {
        set((s) => ({ lists: [...s.lists, list] }))
        void setLocalList(list)
      } else if (eventType === 'UPDATE') {
        set((s) => ({ lists: s.lists.map((l) => (l.id === list.id ? list : l)) }))
        void setLocalList(list)
      } else if (eventType === 'DELETE') {
        set((s) => ({ lists: s.lists.filter((l) => l.id !== list.id) }))
        void removeLocalList(list.id)
      }
    },
  }))

// ── Derived selectors (memoised via reference equality) ───────────────────────

export const selectTasksByList = (listId: string | null) =>
  (s: AppStore) =>
    s.tasks
      .filter((t) => t.list_id === listId && t.parent_task_id === null)
      .sort((a, b) => a.position - b.position)

export const selectTodayTasks = (s: AppStore) => {
  const todayStr = new Date().toISOString().slice(0, 10)
  return s.tasks.filter(
    (t) =>
      !t.completed &&
      t.parent_task_id === null &&
      (t.pinned_to_today || (t.due_date && t.due_date.slice(0, 10) === todayStr))
  )
}

export const selectOverdueTasks = (s: AppStore) => {
  const todayStr = new Date().toISOString().slice(0, 10)
  return s.tasks.filter(
    (t) =>
      !t.completed &&
      t.parent_task_id === null &&
      t.due_date !== null &&
      t.due_date.slice(0, 10) < todayStr
  )
}

export const selectInboxTasks = (s: AppStore) =>
  s.tasks.filter((t) => t.list_id === null && t.parent_task_id === null && !t.completed)

export const selectSubtasks = (parentId: string) =>
  (s: AppStore) => s.tasks.filter((t) => t.parent_task_id === parentId)
