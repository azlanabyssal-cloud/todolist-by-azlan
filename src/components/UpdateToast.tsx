import { motion } from 'framer-motion'
import { RefreshCw, X } from 'lucide-react'
import { useState } from 'react'

interface UpdateToastProps {
  onUpdate: () => void
}

export default function UpdateToast({ onUpdate }: UpdateToastProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 lg:bottom-6"
    >
      <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3 shadow-elevated">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900">
          <RefreshCw className="h-4 w-4 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">New version available</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Reload to get the latest features</p>
        </div>
        <div className="ml-2 flex items-center gap-2">
          <button
            onClick={onUpdate}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Reload
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Dismiss update notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
