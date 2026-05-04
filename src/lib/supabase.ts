import { createClient } from '@supabase/supabase-js'
import type { Task, List } from '@/types'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// True when real credentials are present — gates all network calls
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Client is always created; with placeholder values it simply fails network
// requests silently — the store's error-handler queues them as pending ops.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient<any>(
  supabaseUrl    || 'http://localhost:54321',
  supabaseAnonKey || 'guest-placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession:   true,
      detectSessionInUrl: true,
    },
    realtime: { params: { eventsPerSecond: 10 } },
  }
)

export type TaskChangeEvent = { eventType: string; new: Task; old: Partial<Task> }
export type ListChangeEvent = { eventType: string; new: List; old: Partial<List> }

function toTaskEvent(p: RealtimePostgresChangesPayload<Record<string, unknown>>): TaskChangeEvent {
  return { eventType: p.eventType, new: p.new as Task, old: p.old as Partial<Task> }
}

function toListEvent(p: RealtimePostgresChangesPayload<Record<string, unknown>>): ListChangeEvent {
  return { eventType: p.eventType, new: p.new as List, old: p.old as Partial<List> }
}

export function subscribeToTasks(userId: string, onChange: (e: TaskChangeEvent) => void) {
  return supabase
    .channel(`tasks:${userId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'tasks', filter: `owner_id=eq.${userId}` },
      (p: RealtimePostgresChangesPayload<Record<string, unknown>>) => onChange(toTaskEvent(p))
    )
    .subscribe()
}

export function subscribeToLists(userId: string, onChange: (e: ListChangeEvent) => void) {
  return supabase
    .channel(`lists:${userId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'lists', filter: `owner_id=eq.${userId}` },
      (p: RealtimePostgresChangesPayload<Record<string, unknown>>) => onChange(toListEvent(p))
    )
    .subscribe()
}
