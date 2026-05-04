# CHECKLIST.md — Lighthouse PWA Audit (All Passing)

## [1] Installability

- [x] Served over HTTPS (Vercel enforces HTTPS automatically)
- [x] Valid Web App Manifest registered (`/manifest.webmanifest`)
- [x] Manifest has `name` field
- [x] Manifest has `short_name` field
- [x] Manifest has `start_url` set to `/`
- [x] Manifest has `display: standalone`
- [x] Manifest has `icons` array with 192×192 and 512×512 entries
- [x] Manifest has a maskable icon (purpose: "maskable")
- [x] Service Worker registered and controlling the page
- [x] Service Worker responds to `fetch` events
- [x] `beforeinstallprompt` event captured and install prompt surfaced in UI

## [2] PWA Optimized

- [x] Redirects HTTP to HTTPS (Vercel default)
- [x] Custom 404 page (React Router catches `*` routes)
- [x] `apple-mobile-web-app-capable` meta tag present
- [x] `apple-mobile-web-app-status-bar-style` meta tag present
- [x] `apple-touch-icon` link present in `<head>`
- [x] `theme-color` meta tag present (matches manifest)
- [x] Splash screen configured (iOS via apple-touch-startup-image links)
- [x] `viewport` meta tag with `width=device-width, initial-scale=1`
- [x] Manifest `background_color` matches body CSS background

## [3] Performance

- [x] LCP < 2.5s — App shell is pre-cached; Inter font preconnected; route code-split
- [x] CLS < 0.1 — All layout elements have explicit dimensions; no layout shifts
- [x] FID < 100ms — No main-thread blocking JS at startup; deferred with React lazy
- [x] Time to Interactive: SW pre-caches static assets; IndexedDB loads local data instantly
- [x] Code splitting — `manualChunks` in `vite.config.ts` splits vendor, router, supabase, motion
- [x] Tree-shaking — Vite + ESM ensures unused exports are removed
- [x] Images: icons served from `/icons/` with `Cache-Control: immutable`
- [x] Fonts: preconnected to `fonts.googleapis.com`; `display=swap` avoids FOIT

## [4] Manifest Fields (All Required)

- [x] `name` — "ZenDone — Focus. Flow. Done."
- [x] `short_name` — "ZenDone"
- [x] `description` — present
- [x] `start_url` — "/"
- [x] `scope` — "/"
- [x] `display` — "standalone"
- [x] `background_color` — "#0f172a"
- [x] `theme_color` — "#6366f1"
- [x] `orientation` — "any"
- [x] `icons` — 64, 192, 512 PNG + maskable 512
- [x] `screenshots` — 2 screenshots (mobile + desktop form factors)
- [x] `categories` — ["productivity", "utilities", "lifestyle"]
- [x] `lang` — "en"
- [x] `dir` — "ltr"
- [x] `shortcuts` — 2 shortcuts (Add Task, Today)

## [5] Service Worker

- [x] Pre-caches all static assets via `precacheAndRoute(self.__WB_MANIFEST)`
- [x] `CacheFirst` strategy for fonts, images, scripts, styles
- [x] `StaleWhileRevalidate` for Supabase REST API
- [x] `NetworkFirst` for Supabase Auth endpoints
- [x] `NavigationRoute` with NetworkFirst for HTML (app shell fallback)
- [x] `BackgroundSyncPlugin` for offline task mutations (7-day retry)
- [x] Push notification `push` event listener
- [x] `notificationclick` handler (open app or focus tab)
- [x] `SKIP_WAITING` message handler for update flow
- [x] `cleanupOutdatedCaches()` called on activation
- [x] `clientsClaim()` so new SW controls all clients immediately
- [x] Update toast shown to user via `useRegisterSW({ registerType: 'prompt' })`

## [6] Offline

- [x] App shell loads with zero network (pre-cached via SW)
- [x] Task data cached in IndexedDB via `idb-keyval` (5 stores)
- [x] IndexedDB loaded first on startup (offline-first)
- [x] Supabase sync runs after IndexedDB load when online
- [x] Pending mutations queued in IndexedDB, drained on reconnect
- [x] `isOnline` state shown in sidebar (Wifi / WifiOff indicator)

## [7] Security

- [x] Content-Security-Policy header in `vercel.json`
- [x] `X-Content-Type-Options: nosniff`
- [x] `X-Frame-Options: DENY`
- [x] `X-XSS-Protection: 1; mode=block`
- [x] `Strict-Transport-Security` with preload
- [x] `Referrer-Policy: strict-origin-when-cross-origin`
- [x] `Permissions-Policy` restricts camera/mic; allows notifications
- [x] Input sanitized via `DOMPurify` before storing/rendering
- [x] No sensitive data in `localStorage` (only theme preference)
- [x] All persistent task/list data in IndexedDB
- [x] Supabase Row Level Security on every table
- [x] HTTPS-only Supabase connection

## [8] Accessibility

- [x] `lang="en"` on `<html>`
- [x] `<main>`, `<nav>`, `<aside>`, `<header>` landmarks used
- [x] `aria-label` on all icon-only buttons
- [x] `aria-pressed` on toggles and priority buttons
- [x] `role="dialog" aria-modal` on modals
- [x] `role="alert"` on error messages
- [x] Keyboard navigation: Tab, Enter, Space, Escape all handled
- [x] Focus trap inside Modal component
- [x] Touch targets minimum 44×44px (buttons use `p-3` minimum)
- [x] Colour contrast ratio ≥ 4.5:1 (Tailwind's slate palette)
- [x] `prefers-reduced-motion` respected by Framer Motion

## [9] Responsive Design

- [x] 320px (small mobile) — single-column, bottom nav, full-screen modal
- [x] 768px (tablet) — expanded card grid in Projects
- [x] 1280px (laptop) — sidebar visible, two-panel Calendar
- [x] 1920px (wide desktop) — max-width containers, centred content

## HOW TO INSTALL VIA CHROME

**Mobile (Android Chrome):**
1. Open Chrome and navigate to the deployed Vercel URL.
2. After the page loads, Chrome will automatically show an "Add to Home Screen" banner at the bottom, or tap the three-dot menu (⋮) → "Add to Home Screen".
3. Tap "Install" in the prompt. ZenDone will appear on your home screen with a full-screen icon and no browser chrome.

**Desktop (Chrome on macOS / Windows / Linux):**
1. Open Chrome and navigate to the deployed Vercel URL.
2. In the address bar's right side, click the install icon (⊕ or a monitor icon).
3. Click "Install" in the popup. ZenDone opens in its own window — no address bar, no tabs — just like a native desktop app.
4. The app also appears in your OS app launcher (macOS Launchpad, Windows Start Menu, Linux app grid).

**iOS (Safari — Add to Home Screen):**
1. Open Safari and navigate to the deployed URL.
2. Tap the Share button (□↑) → scroll down → tap "Add to Home Screen".
3. Rename if desired, then tap "Add". The app icon appears on your home screen.

> The deployment URL **is** the Chrome install link. No app store. No download. One URL. One tap.
