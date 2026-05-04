import { motion } from 'framer-motion'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  action?: React.ReactNode
}

export default function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
    >
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-950 dark:to-brand-900 shadow-card">
        <span className="text-brand-500 dark:text-brand-400">{icon}</span>
      </div>
      <h3 className="mb-1.5 text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      <p className="mb-6 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>
      {action}
    </motion.div>
  )
}
