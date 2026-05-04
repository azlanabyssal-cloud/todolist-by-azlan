import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useSync } from '@/hooks/useSync'
import { usePWA } from '@/hooks/usePWA'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useStore } from '@/store'
import { ACCENT_PALETTES, FONT_FAMILIES } from '@/types'
import Layout from '@/components/Layout'
import UpdateToast from '@/components/UpdateToast'
import SplashScreen from '@/components/SplashScreen'
import TouchTrail from '@/components/TouchTrail'
import CustomCursor from '@/components/CustomCursor'

const Today     = lazy(() => import('@/routes/Today'))
const Inbox     = lazy(() => import('@/routes/Inbox'))
const Projects  = lazy(() => import('@/routes/Projects'))
const Calendar  = lazy(() => import('@/routes/Calendar'))
const Settings  = lazy(() => import('@/routes/Settings'))
const Auth      = lazy(() => import('@/routes/Auth'))

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
    </div>
  )
}

function AppRoutes() {
  const { user, authLoading } = useAuth()
  useSync()
  useKeyboardShortcuts()

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-light dark:bg-bg-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-3 border-brand-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading To-DoList by Azlan…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"          element={<Navigate to="/today" replace />} />
          <Route path="/today"     element={<Today />} />
          <Route path="/inbox"     element={<Inbox />} />
          <Route path="/projects"  element={<Projects />} />
          <Route path="/calendar"  element={<Calendar />} />
          <Route path="/settings"  element={<Settings />} />
          <Route path="/auth"      element={<Navigate to="/today" replace />} />
          <Route path="*"          element={<Navigate to="/today" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

function ThemeSync() {
  const theme           = useStore((s) => s.theme)
  const accent          = useStore((s) => s.accent)
  const fontFamily      = useStore((s) => s.fontFamily)
  const backgroundStyle = useStore((s) => s.backgroundStyle)
  const fontSize        = useStore((s) => s.fontSize)
  const density         = useStore((s) => s.density)
  const reducedMotion   = useStore((s) => s.reducedMotion)
  const cursorStyle     = useStore((s) => s.cursorStyle)

  // Dark mode
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = (e: MediaQueryListEvent) => root.classList.toggle('dark', e.matches)
      mq.addEventListener('change', listener)
      return () => mq.removeEventListener('change', listener)
    }
  }, [theme])

  // Accent color — inject all 11 shades as CSS variables so every brand-* class updates live
  useEffect(() => {
    const root = document.documentElement
    const { shades } = ACCENT_PALETTES[accent]
    root.style.setProperty('--brand-50',  shades[50])
    root.style.setProperty('--brand-100', shades[100])
    root.style.setProperty('--brand-200', shades[200])
    root.style.setProperty('--brand-300', shades[300])
    root.style.setProperty('--brand-400', shades[400])
    root.style.setProperty('--brand-500', shades[500])
    root.style.setProperty('--brand-600', shades[600])
    root.style.setProperty('--brand-700', shades[700])
    root.style.setProperty('--brand-800', shades[800])
    root.style.setProperty('--brand-900', shades[900])
    root.style.setProperty('--brand-950', shades[950])
  }, [accent])

  // Font family — inject CSS variable, entire app re-renders in new font instantly
  useEffect(() => {
    document.documentElement.style.setProperty('--app-font', FONT_FAMILIES[fontFamily].stack)
  }, [fontFamily])

  // Background style
  useEffect(() => {
    document.documentElement.setAttribute('data-bg', backgroundStyle)
  }, [backgroundStyle])

  // Font scale
  useEffect(() => {
    document.documentElement.setAttribute('data-font', fontSize)
  }, [fontSize])

  // Density
  useEffect(() => {
    document.documentElement.setAttribute('data-density', density)
  }, [density])

  // Reduced motion
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion)
  }, [reducedMotion])

  // Cursor style — propagate to html attribute for CSS hooks
  useEffect(() => {
    document.documentElement.setAttribute('data-cursor', cursorStyle)
  }, [cursorStyle])

  return null
}

export default function App() {
  const { needRefresh, updateServiceWorker } = usePWA()
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem('splashShown') === 'true'
  )

  const handleSplashComplete = () => {
    sessionStorage.setItem('splashShown', 'true')
    setSplashDone(true)
  }

  return (
    <BrowserRouter>
      <ThemeSync />

      {/* Cinematic intro — shown once per browser session */}
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}

      <AnimatePresence mode="wait">
        <AppRoutes />
      </AnimatePresence>

      {/* Global overlays */}
      <TouchTrail />
      <CustomCursor />

      {needRefresh && (
        <UpdateToast onUpdate={() => updateServiceWorker(true)} />
      )}

      <Toaster
        position="bottom-center"
        gutter={8}
        toastOptions={{
          duration: 3000,
          className: '!bg-slate-900 !text-white dark:!bg-slate-100 dark:!text-slate-900 !rounded-xl !shadow-elevated !text-sm !font-medium',
        }}
      />
    </BrowserRouter>
  )
}
