import { get, set, del, keys, createStore } from 'idb-keyval'
import type { Task, List, Tag, PendingOperation } from '@/types'

const taskStore  = createStore('zendone-tasks', 'tasks')
const listStore  = createStore('zendone-lists', 'lists')
const tagStore   = createStore('zendone-tags', 'tags')
const syncStore  = createStore('zendone-sync', 'pending-ops')

// ── Tasks ────────────────────────────────────────────────────────────────────

export async function getLocalTasks(): Promise<Task[]> {
  const allKeys = await keys<string>(taskStore)
  const tasks = await Promise.all(allKeys.map((k) => get<Task>(k, taskStore)))
  return tasks.filter((t): t is Task => t !== undefined)
}

export async function setLocalTask(task: Task): Promise<void> {
  await set(task.id, task, taskStore)
}

export async function setLocalTasks(tasks: Task[]): Promise<void> {
  await Promise.all(tasks.map((t) => set(t.id, t, taskStore)))
}

export async function removeLocalTask(id: string): Promise<void> {
  await del(id, taskStore)
}

// ── Lists ────────────────────────────────────────────────────────────────────

export async function getLocalLists(): Promise<List[]> {
  const allKeys = await keys<string>(listStore)
  const lists = await Promise.all(allKeys.map((k) => get<List>(k, listStore)))
  return lists.filter((l): l is List => l !== undefined)
}

export async function setLocalList(list: List): Promise<void> {
  await set(list.id, list, listStore)
}

export async function setLocalLists(lists: List[]): Promise<void> {
  await Promise.all(lists.map((l) => set(l.id, l, listStore)))
}

export async function removeLocalList(id: string): Promise<void> {
  await del(id, listStore)
}

// ── Tags ─────────────────────────────────────────────────────────────────────

export async function getLocalTags(): Promise<Tag[]> {
  const allKeys = await keys<string>(tagStore)
  const tags = await Promise.all(allKeys.map((k) => get<Tag>(k, tagStore)))
  return tags.filter((t): t is Tag => t !== undefined)
}

export async function setLocalTags(tags: Tag[]): Promise<void> {
  await Promise.all(tags.map((t) => set(t.id, t, tagStore)))
}

// ── Pending Sync Operations ───────────────────────────────────────────────────

export async function getPendingOps(): Promise<PendingOperation[]> {
  const allKeys = await keys<string>(syncStore)
  const ops = await Promise.all(allKeys.map((k) => get<PendingOperation>(k, syncStore)))
  return ops
    .filter((op): op is PendingOperation => op !== undefined)
    .sort((a, b) => a.created_at - b.created_at)
}

export async function addPendingOp(op: PendingOperation): Promise<void> {
  await set(op.id, op, syncStore)
}

export async function removePendingOp(id: string): Promise<void> {
  await del(id, syncStore)
}

export async function updatePendingOpRetries(id: string): Promise<void> {
  const op = await get<PendingOperation>(id, syncStore)
  if (op) {
    await set(id, { ...op, retries: op.retries + 1 }, syncStore)
  }
}

// ── Meta ─────────────────────────────────────────────────────────────────────

const metaStore = createStore('zendone-meta', 'meta')

export async function setLastSync(timestamp: number): Promise<void> {
  await set('last_sync', timestamp, metaStore)
}

export async function getLastSync(): Promise<number | null> {
  const v = await get<number>('last_sync', metaStore)
  return v ?? null
}
