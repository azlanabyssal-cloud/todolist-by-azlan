import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store'

const CTRL_ROUTES: Record<string, string> = {
  '1': '/today',
  '2': '/inbox',
  '3': '/projects',
  '4': '/calendar',
  '5': '/settings',
}

export function useKeyboardShortcuts() {
  const navigate        = useNavigate()
  const setQuickAddOpen = useStore((s) => s.setQuickAddOpen)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const tag    = target.tagName.toLowerCase()
      const isEditing =
        tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable
      if (isEditing) return

      // Ctrl/Cmd + 1-5: navigate to section
      if (e.ctrlKey || e.metaKey) {
        const route = CTRL_ROUTES[e.key]
        if (route) { e.preventDefault(); navigate(route) }
        return
      }

      // q or a: open Quick Add (Todoist pattern — Q for Quick add, A for Add task)
      if (e.key === 'q' || e.key === 'a') {
        e.preventDefault()
        setQuickAddOpen(true)
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [navigate, setQuickAddOpen])
}
