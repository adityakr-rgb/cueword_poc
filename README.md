# Cueword — Live Class POC (two apps)

A real-time **1:1 live class** shared between a **Student app** and a **Coach app** that deploy to
two separate domains but talk to one Supabase backend. The headline moment: **the student opens a
story and the same story instantly appears on the coach's screen**, then both step through the
lesson (Listen → Read → Speak → Write) in sync, with a coach-only playbook.

The dashboards around the live class are faithful ports of the Cueword student & coach designs; the
**only dynamic thing** is the live class + its sync. The two video tiles in the live class are
replaced by a **"Place your Zoom window here"** placeholder — the real 1:1 video runs in Zoom
alongside the synced class.

Stack: **Next.js 16 (App Router, Turbopack) + React 19 + TypeScript + Supabase (Postgres +
Realtime)**, deployed to **Vercel**.

## Monorepo layout (npm workspaces)

```
apps/student/      → student.cueword.com  (Vercel project A · dev :3100)  — student design + /live
apps/coach/        → coach.cueword.com    (Vercel project B · dev :3200)  — coach design (9 screens) + /live
packages/core/     → @cueword/core — the shared layer (consumed via transpilePackages)
  src/lib/         session.ts (ALL Supabase + Realtime) · lesson.ts · stories.ts · types.ts ·
                   auth.ts (JSON-config login) · config.ts · supabase/client.ts
  src/components/  LiveClass · LessonCanvas · ClassPeople (Zoom placeholder) · CoachPlaybook ·
                   TopBar · StorySlate · useActiveSession · …
  src/styles/      prototype-base.css · prototype-class.css (the shared live-class CSS)
  src/config/      poc.config.json  ← hardcoded creds + Zoom link + the seeded session id
supabase/          migrations/0001_init.sql · seed.sql  (shared DB)
tests/  e2e/        Vitest (unit + gated integration) · Playwright (cross-app magic moment)
```

## Logins (POC auth — no server, no DB)

Auth is a pure client-side check against **`packages/core/src/config/poc.config.json`**. Each app is
single-role (the student app only accepts the student login; the coach app only the coach login).
Edit that one JSON file to change credentials, display names, or the Zoom link.

| App     | Username | Password   | Shows as     |
| ------- | -------- | ---------- | ------------ |
| Coach   | `liza`   | `liza123`  | Liza Reyes   |
| Student | `maya`   | `maya123`  | Maya         |

> This gates identity/UX only; data access is anon (permissive RLS). Fine for a single-pair demo.

## The demo flow

Run both apps and put them side by side (use a **desktop-width** window — the live class needs
≥ 940px).

1. **Coach** (`coach` app, log in as `maya`) → **Go to live class** → **Start class** → "waiting for
   the student to open a story".
2. **Student** (`student` app, log in as `aanya`) → **Join class** → tap a story on the slate.
   ✨ **It opens live on the coach's screen, and the student drives** (ticks answers, navigates).
3. Step **Listen → Read → Speak → Write** — every Next/Back syncs; the student's answers reflect on
   the coach screen; the coach-only playbook shows nudges/answer/rubric. The coach can **Take over**.
4. Both live views show the **"Place your Zoom window here"** placeholder; **Join Zoom** opens the
   real link (from the JSON config) in a new tab.

## Quick start

```bash
export PATH="$HOME/.local/node/bin:$PATH"   # if node isn't already on PATH
npm install                  # at the repo root — links @cueword/core into both apps
# add apps/student/.env.local and apps/coach/.env.local (see .env.local.example in each):
#   NEXT_PUBLIC_SUPABASE_URL=...
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=...        (same project for BOTH apps)
npm run dev:student          # → http://localhost:3100
npm run dev:coach            # → http://localhost:3200
```

Supabase: the schema + the single seeded session live in `supabase/migrations/0001_init.sql` +
`supabase/seed.sql`. Both apps subscribe to the one row whose id is `config.session.id`.

## Design principles

- **Sync the pointer, not the content.** Realtime only carries `{ story_key, current_step, phase,
  driver, status }` on the `class_sessions` row; the lesson content renders client-side from
  `packages/core/src/lib/stories.ts`. Tiny payloads, instant re-render.
- **One job per file.** All DB reads/writes/subscriptions live in `packages/core/src/lib/session.ts`
  — no component talks to Supabase directly. Pure lesson logic is in `lesson.ts` (unit-tested).
- **Shared core, separate shells.** The live class + sync are shared via `@cueword/core`; each app is
  a static design shell that mounts the shared `<LiveClass>` at `/live`. Editing a dashboard = editing
  one app; editing creds/Zoom = editing one JSON file.

## Testing

- `npm test` — Vitest unit tests (lesson + session logic, config/auth). Always runs.
- `npm run test:int` — gated integration test against a live Supabase (proves Realtime sync on the
  seeded row). Skips unless the Supabase env is set.
- `npm run test:e2e` — Playwright; drives the **student app (:3100) + coach app (:3200)** together and
  asserts the cross-domain magic moment, driver semantics, and the Zoom placeholder. First run:
  `npx playwright install chromium`.
- Gates before any deploy: `npm run build` (both apps) · `npm run lint` · `npm test`.

## Deploy

See **[DEPLOY.md](DEPLOY.md)** — two Vercel projects (one per account) from this one repo, Root
Directory `apps/student` / `apps/coach`, identical Supabase env vars on both, two domains.
