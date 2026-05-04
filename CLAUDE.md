# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install all dependencies
npm run dev          # start dev server (http://localhost:5173)
npm run build        # type-check + production build → dist/
npm run preview      # serve the production build locally
npm run type-check   # run tsc without emitting (CI check)
npm run generate-icons  # generate PWA PNGs from public/pwa-icon.svg
```

## Environment Setup

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Run `supabase/migrations/001_initial.sql` in the Supabase SQL Editor to create all tables, RLS policies, and triggers.

## Architecture

**Stack:** React 18 + Vite 5 + vite-plugin-pwa (injectManifest) + Workbox + Tailwind CSS + Zustand + React Router v6 + Supabase.

**State layer (`src/store/index.ts`):** Single Zustand store with `subscribeWithSelector`. All mutations hit the local store and IndexedDB immediately (optimistic), then sync to Supabase. Failed mutations are queued as `PendingOperation` items and drained when back online.

**Offline strategy:**
1. On load — read IndexedDB (instant, works offline)
2. If online — fetch fresh from Supabase and overwrite
3. On mutation — write to Zustand + IndexedDB immediately; `supabase.from().insert/update/delete()` in background
4. On failure — push a `PendingOperation` to IndexedDB sync queue
5. On reconnect — drain the queue in `useSync.ts`

**Service Worker (`src/sw.ts`):** Full custom Workbox SW (injectManifest mode). Strategies: `CacheFirst` for static assets/fonts, `StaleWhileRevalidate` for Supabase REST, `NetworkFirst` for auth + navigation. Background sync via `BackgroundSyncPlugin`. Push notification handlers included.

**Data persistence:** IndexedDB via `idb-keyval` (5 named stores in `src/lib/db.ts`). No sensitive data in `localStorage` — only the `theme` preference. Supabase Auth tokens use Supabase's own localStorage under its namespace (JWT, not secret data).

**Routing:** All routes are lazy-loaded via `React.lazy`. The router guard in `App.tsx` redirects unauthenticated users to `/auth`. After login, Supabase's `onAuthStateChange` triggers the redirect.

**Security:** All user input passes through `sanitizeText()` (DOMPurify, strips all HTML). CSP and security headers are in `vercel.json`. Supabase RLS policies ensure users only access their own data.

**Tailwind:** Custom design tokens in `tailwind.config.ts` — `brand` (Indigo), `surface`, `bg` colours; `card`, `glass`, `task-item`, `btn-primary`, `btn-ghost`, `input-base` component classes in `src/index.css`.

## Key Files

| File | Role |
|------|------|
| `src/store/index.ts` | Single source of truth; all CRUD actions live here |
| `src/lib/db.ts` | IndexedDB read/write via idb-keyval |
| `src/lib/supabase.ts` | Supabase client, typed Database schema, realtime subscriptions |
| `src/hooks/useSync.ts` | Initial data fetch, realtime subscriptions, pending-op drain |
| `src/sw.ts` | Custom Workbox service worker (caching, push, background sync) |
| `vite.config.ts` | Vite + vite-plugin-pwa with full PWA manifest and workbox config |
| `vercel.json` | SPA rewrite + all PWA/security HTTP headers |

## Icon Generation

After editing `public/pwa-icon.svg`, regenerate all PNG sizes:

```bash
npm run generate-icons
```

This uses `@vite-pwa/assets-generator` with the `minimal-2023` preset to produce all required sizes (64, 96, 192, 512, maskable-512) into `public/icons/`.

## Deployment

Push to GitHub and connect to Vercel. Set the two env vars in Vercel's project settings. The `vercel.json` handles SPA routing and all PWA headers automatically. The deployed URL is the Chrome install link.
