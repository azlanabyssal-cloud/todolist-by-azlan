export type Priority = 0 | 1 | 2 | 3

export const PRIORITY_LABELS: Record<Priority, string> = {
  0: 'None',
  1: 'Low',
  2: 'Medium',
  3: 'High',
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  0: 'text-slate-400',
  1: 'text-blue-500',
  2: 'text-amber-500',
  3: 'text-rose-500',
}

export const PRIORITY_BG: Record<Priority, string> = {
  0: 'bg-slate-100 dark:bg-slate-800',
  1: 'bg-blue-50 dark:bg-blue-900/30',
  2: 'bg-amber-50 dark:bg-amber-900/30',
  3: 'bg-rose-50 dark:bg-rose-900/30',
}

export interface Tag {
  id: string
  owner_id: string
  name: string
  color: string
  created_at: string
}

export interface List {
  id: string
  owner_id: string
  title: string
  color: string
  icon: string
  is_shared: boolean
  task_count?: number
  completed_count?: number
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  list_id: string | null
  parent_task_id: string | null
  owner_id: string
  title: string
  description: string | null
  due_date: string | null
  reminder_at: string | null
  priority: Priority
  completed: boolean
  completed_at: string | null
  is_recurring: boolean
  recurrence_rule: string | null
  position: number
  pinned_to_today: boolean
  created_at: string
  updated_at: string
  tags?: Tag[]
  subtasks?: Task[]
}

export interface TaskCreateInput {
  title: string
  description?: string
  due_date?: string
  reminder_at?: string
  priority?: Priority
  list_id?: string
  parent_task_id?: string
  is_recurring?: boolean
  recurrence_rule?: string
  pinned_to_today?: boolean
  tags?: string[]
}

export interface TaskUpdateInput extends Partial<TaskCreateInput> {
  completed?: boolean
}

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface ListShare {
  id: string
  list_id: string
  user_id: string
  role: 'viewer' | 'member' | 'admin'
  created_at: string
}

export type View = 'list' | 'board' | 'calendar'
export type Theme = 'light' | 'dark' | 'system'

// Accent palette — full shade maps, injected as CSS variables at runtime
export type AccentPalette =
  | 'indigo' | 'violet' | 'rose' | 'teal' | 'amber' | 'sky'
  | 'emerald' | 'pink' | 'orange' | 'cyan'

export type AccentShades = {
  50: string; 100: string; 200: string; 300: string; 400: string
  500: string; 600: string; 700: string; 800: string; 900: string; 950: string
}

export const ACCENT_PALETTES: Record<AccentPalette, { label: string; shades: AccentShades }> = {
  indigo:  { label: 'Indigo',   shades: { 50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81',950:'#1e1b4b' } },
  violet:  { label: 'Violet',   shades: { 50:'#f5f3ff',100:'#ede9fe',200:'#ddd6fe',300:'#c4b5fd',400:'#a78bfa',500:'#8b5cf6',600:'#7c3aed',700:'#6d28d9',800:'#5b21b6',900:'#4c1d95',950:'#2e1065' } },
  rose:    { label: 'Rose',     shades: { 50:'#fff1f2',100:'#ffe4e6',200:'#fecdd3',300:'#fda4af',400:'#fb7185',500:'#f43f5e',600:'#e11d48',700:'#be123c',800:'#9f1239',900:'#881337',950:'#4c0519' } },
  teal:    { label: 'Teal',     shades: { 50:'#f0fdfa',100:'#ccfbf1',200:'#99f6e4',300:'#5eead4',400:'#2dd4bf',500:'#14b8a6',600:'#0d9488',700:'#0f766e',800:'#115e59',900:'#134e4a',950:'#042f2e' } },
  amber:   { label: 'Amber',    shades: { 50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309',800:'#92400e',900:'#78350f',950:'#451a03' } },
  sky:     { label: 'Sky',      shades: { 50:'#f0f9ff',100:'#e0f2fe',200:'#bae6fd',300:'#7dd3fc',400:'#38bdf8',500:'#0ea5e9',600:'#0284c7',700:'#0369a1',800:'#075985',900:'#0c4a6e',950:'#082f49' } },
  emerald: { label: 'Emerald',  shades: { 50:'#ecfdf5',100:'#d1fae5',200:'#a7f3d0',300:'#6ee7b7',400:'#34d399',500:'#10b981',600:'#059669',700:'#047857',800:'#065f46',900:'#064e3b',950:'#022c22' } },
  pink:    { label: 'Pink',     shades: { 50:'#fdf2f8',100:'#fce7f3',200:'#fbcfe8',300:'#f9a8d4',400:'#f472b6',500:'#ec4899',600:'#db2777',700:'#be185d',800:'#9d174d',900:'#831843',950:'#500724' } },
  orange:  { label: 'Orange',   shades: { 50:'#fff7ed',100:'#ffedd5',200:'#fed7aa',300:'#fdba74',400:'#fb923c',500:'#f97316',600:'#ea580c',700:'#c2410c',800:'#9a3412',900:'#7c2d12',950:'#431407' } },
  cyan:    { label: 'Cyan',     shades: { 50:'#ecfeff',100:'#cffafe',200:'#a5f3fc',300:'#67e8f9',400:'#22d3ee',500:'#06b6d4',600:'#0891b2',700:'#0e7490',800:'#155e75',900:'#164e63',950:'#083344' } },
}

export type FontFamily = 'inter' | 'poppins' | 'dm-sans' | 'nunito' | 'space-grotesk' | 'playfair'

export const FONT_FAMILIES: Record<FontFamily, { label: string; stack: string; preview: string; description: string }> = {
  'inter':        { label: 'Inter',         stack: "'Inter', ui-sans-serif, system-ui, sans-serif",         preview: 'Inter',         description: 'Clean & modern — the default' },
  'poppins':      { label: 'Poppins',       stack: "'Poppins', ui-sans-serif, system-ui, sans-serif",       preview: 'Poppins',       description: 'Rounded & friendly' },
  'dm-sans':      { label: 'DM Sans',       stack: "'DM Sans', ui-sans-serif, system-ui, sans-serif",       preview: 'DM Sans',       description: 'Geometric & professional' },
  'nunito':       { label: 'Nunito',        stack: "'Nunito', ui-sans-serif, system-ui, sans-serif",        preview: 'Nunito',        description: 'Soft, warm & approachable' },
  'space-grotesk':{ label: 'Space Grotesk', stack: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif", preview: 'Space Grotesk', description: 'Bold & distinctive tech feel' },
  'playfair':     { label: 'Playfair',      stack: "'Playfair Display', ui-serif, Georgia, serif",          preview: 'Playfair',      description: 'Elegant serif for classic taste' },
}

export type BackgroundStyle = 'clean' | 'dots' | 'grid' | 'aurora' | 'mesh'

export const BACKGROUND_STYLES: Record<BackgroundStyle, { label: string; description: string }> = {
  clean:  { label: 'Clean',  description: 'Pure flat background' },
  dots:   { label: 'Dots',   description: 'Subtle dot grid' },
  grid:   { label: 'Grid',   description: 'Fine line grid' },
  aurora: { label: 'Aurora', description: 'Soft gradient glow' },
  mesh:   { label: 'Mesh',   description: 'Coloured mesh gradient' },
}

export type FontSize = 'sm' | 'md' | 'lg' | 'xl'

export type Density = 'comfortable' | 'compact'

export const FONT_SIZES: Record<FontSize, { label: string; description: string }> = {
  sm: { label: 'Small',   description: 'Compact, more content visible' },
  md: { label: 'Medium',  description: 'Default size' },
  lg: { label: 'Large',   description: 'Comfortable reading' },
  xl: { label: 'X-Large', description: 'Maximum accessibility' },
}
export type CursorStyle = 'default' | 'dot' | 'neon' | 'crosshair' | 'star' | 'circle'

export const CURSOR_STYLES: Record<CursorStyle, { label: string; description: string; preview: string }> = {
  default:   { label: 'Default',   description: 'System cursor — classic OS pointer',        preview: '↖' },
  dot:       { label: 'Dot',       description: 'Minimal dot with lagged accent ring',        preview: '·' },
  neon:      { label: 'Neon',      description: 'Glowing accent-coloured cursor with halo',   preview: '⬤' },
  crosshair: { label: 'Crosshair', description: 'Precision cross with circular overlay',      preview: '⊕' },
  star:      { label: 'Star',      description: 'Diamond sparkle for expressive flair',       preview: '✦' },
  circle:    { label: 'Circle',    description: 'Elegant open ring — ultra minimal',          preview: '○' },
}

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface PendingOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  table: 'tasks' | 'lists' | 'tags'
  payload: Record<string, unknown>
  created_at: number
  retries: number
}

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isPast: boolean
  tasks: Task[]
}

export interface Stats {
  total: number
  completed: number
  overdue: number
  dueToday: number
}
