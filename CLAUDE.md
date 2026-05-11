# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # dev server on localhost:3000
npm run build      # tsc -b && vite build (TypeScript check + Vite bundle + SW generation)
npm run lint       # eslint
npm run preview    # preview production build locally

# Deploy to production (always run build first)
npm run build && npx vercel deploy --prod --yes

# Push to GitHub
git add . && git commit -m "..." && git push
```

TypeScript is strict (`noUnusedLocals`, `noUnusedParameters`) — build will fail on unused vars.

## Architecture

### Frontend (React PWA)
Single-page app with tab-based navigation (6 tabs). All state lives in `src/hooks/useAppState.ts` — one large hook that manages every piece of app data via `useState` + `localStorage`. No global store (Redux/Zustand/Context). All data is persisted per-day with daily reset logic for time-sensitive fields (water count, meal checks, med checks).

State is passed down as props from `App.tsx` to each section view. Sections are in `src/sections/`, each receives exactly what it needs from `useAppState`.

### Data
`src/data/menuData.ts` is the single source of truth for:
- `weekMenu` — 7-day meal plan (Lucide icons per meal)
- `exerciseSchedule` — weekly exercise routines with sets/reps
- `exerciseTips`, `medicalRecommendations`, `healthTips` — rotating tip arrays
- `notificationSchedule` — the push notification schedule (times + messages)

`api/_schedule.ts` duplicates `notificationSchedule` for server-side use (API functions can't import from `src/`). **Keep both in sync** when changing notification times or messages.

### PWA / Service Worker
`src/sw.ts` is the SW source (compiled by vite-plugin-pwa in `injectManifest` mode → outputs `dist/sw.js`). It handles:
- Workbox precaching (`precacheAndRoute(self.__WB_MANIFEST)`)
- `push` event — displays background notifications
- `notificationclick` — focuses or opens the app

### Background Notifications
Push notifications work even when the app is closed:
1. On app open, `src/hooks/useNotifications.ts` subscribes to Web Push (VAPID) and POSTs the subscription to `/api/subscribe`
2. `/api/subscribe` saves the subscription to a GitHub Gist (`GIST_ID` env var)
3. GitHub Actions (`.github/workflows/send-notifications.yml`) runs every 5 min and calls `/api/send-notifications`
4. That function reads the Gist, checks current Chile time against the schedule, and sends pushes via `web-push`

### Backend (Vercel Serverless)
Three functions in `api/`:
- `chat.ts` — proxy to OpenAI GPT-4o-mini with CORS, rate limiting (10 req/IP/min), input sanitization. System prompt with Rodolfo's medical profile is server-side only.
- `subscribe.ts` — saves push subscription + daily wakeUpTime to the Gist
- `send-notifications.ts` — called by cron; reads Gist, sends due push notifications, marks sent with idempotency keys in Gist

All API functions share CORS origins: `app-nine-chi-25.vercel.app` + localhost.

### Notification Offset
All notification times in `_schedule.ts` are relative to a base wake-up of `08:00`. If the user woke up at `09:00`, every notification shifts +60 min. The offset is computed in both the client (`useNotifications.ts`) and server (`send-notifications.ts`), stored daily as `wakeup_YYYY-MM-DD` in the Gist.

## Environment Variables

All already configured in Vercel. Required for full functionality:

| Var | Used in |
|-----|---------|
| `OPENAI_API_KEY` | `api/chat.ts` |
| `VITE_VAPID_PUBLIC_KEY` | Frontend bundle (build-time) + `api/subscribe.ts` |
| `VAPID_PRIVATE_KEY` | `api/send-notifications.ts` |
| `CRON_SECRET` | `api/send-notifications.ts` (auth) |
| `GITHUB_TOKEN` | `api/subscribe.ts`, `api/send-notifications.ts` |
| `GIST_ID` | `api/subscribe.ts`, `api/send-notifications.ts` |

`VITE_VAPID_PUBLIC_KEY` is embedded at build time into the JS bundle. If changed, rebuild and redeploy.

## Key Conventions

- **Path alias:** `@/` maps to `src/` everywhere
- **Icons:** Lucide React only
- **Styling:** Tailwind utility classes with inline `style={{}}` for dynamic values; brand color `#1B6B5B` (teal)
- **API imports:** Use `.js` extension for relative imports in `api/` files (e.g., `from "./_schedule.js"`) — Vercel uses `moduleResolution: node16`
- **No tests:** No test framework configured
