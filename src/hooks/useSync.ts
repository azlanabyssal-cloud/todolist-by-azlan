import { useEffect, useRef } from 'react'
import { useStore } from '@/store'
import { supabase, subscribeToTasks, subscribeToLists, isSupabaseConfigured } from '@/lib/supabase'
import {
  getLocalTasks, getLocalLists, getLocalTags, getPendingOps,
} from '@/lib/db'
import type { Task, List, PendingOperation } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useSync() {
  const {
    user,
    setTasks, setLists, setTags, setDataLoading,
    setOnline, setLastSync, handleTaskChange, handleListChange,
    pendingOps, removePendingOp,
  } = useStore()

  const taskChannel = useRef<RealtimeChannel | null>(null)
  const listChannel = useRef<RealtimeChannel | null>(null)

  // ── Online / offline detection ────────────────────────────────────────────
  useEffect(() => {
    const onOnline  = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [setOnline])

  // ── Initial data load ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return

    const loadData = async () => {
      setDataLoading(true)

      // Always load from IndexedDB first (instant, works offline + guest mode)
      const [localTasks, localLists, localTags] = await Promise.all([
        getLocalTasks(), getLocalLists(), getLocalTags(),
      ])
      if (localTasks.length > 0) setTasks(localTasks)
      if (localLists.length > 0) setLists(localLists)
      if (localTags.length > 0)  setTags(localTags)

      // Skip Supabase fetch in guest/demo mode
      if (!isSupabaseConfigured) {
        setDataLoading(false)
        return
      }

      if (navigator.onLine) {
        const [tasksRes, listsRes, tagsRes] = await Promise.all([
          supabase.from('tasks').select('*').eq('owner_id', user.id).order('position'),
          supabase.from('lists').select('*').eq('owner_id', user.id).order('created_at'),
          supabase.from('tags').select('*').eq('owner_id', user.id).order('name'),
        ])

        if (tasksRes.data) setTasks(tasksRes.data as Task[])
        if (listsRes.data) setLists(listsRes.data as List[])
        if (tagsRes.data)  setTags(tagsRes.data)
        setLastSync(Date.now())
      }

      setDataLoading(false)
    }

    void loadData()
  }, [user, setTasks, setLists, setTags, setDataLoading, setLastSync])

  // ── Realtime subscriptions (cloud mode only) ──────────────────────────────
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return

    taskChannel.current = subscribeToTasks(user.id, ({ eventType, new: newTask }) =>
      handleTaskChange(eventType, newTask)
    )
    listChannel.current = subscribeToLists(user.id, ({ eventType, new: newList }) =>
      handleListChange(eventType, newList)
    )

    return () => {
      void taskChannel.current?.unsubscribe()
      void listChannel.current?.unsubscribe()
    }
  }, [user, handleTaskChange, handleListChange])

  // ── Drain pending ops when back online (cloud mode only) ──────────────────
  useEffect(() => {
    if (!isSupabaseConfigured) return

    const drain = async () => {
      if (!navigator.onLine || pendingOps.length === 0) return
      const ops = await getPendingOps()
      for (const op of ops) {
        try {
          await processPendingOp(op)
          removePendingOp(op.id)
        } catch {
          // retry on next online event
        }
      }
      setLastSync(Date.now())
    }

    window.addEventListener('online', drain)
    return () => window.removeEventListener('online', drain)
  }, [pendingOps, removePendingOp, setLastSync])
}

async function processPendingOp(op: PendingOperation): Promise<void> {
  if (op.type === 'create') {
    await supabase.from(op.table).insert(op.payload)
  } else if (op.type === 'update') {
    const { id, ...rest } = op.payload as { id: string } & Record<string, unknown>
    await supabase.from(op.table).update(rest).eq('id', id)
  } else if (op.type === 'delete') {
    await supabase.from(op.table).delete().eq('id', (op.payload as { id: string }).id)
  }
}
