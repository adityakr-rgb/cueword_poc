# Cueword — Live Class POC

A real-time **1:1 live class synced across three dashboards** — Admin, Child (student), and Coach.
The headline moment: **the child opens a story and the same story instantly appears on the coach's
screen**, then all three step through the lesson (Listen → Read → Speak → Write) in sync, with a
coach-only playbook.

Built on the production-intended stack: **Next.js (App Router, React, TS) + Supabase (Postgres +
Realtime)**, deployable to **Vercel**. The lesson UI is ported verbatim from the Cueword Story
Prototype.

## Logins (POC auth)

Open `/login` and sign in. The **admin generates IDs + passwords** for coaches & students from the
console. Seeded demo accounts:

| Role    | Username | Password   |
| ------- | -------- | ---------- |
| Admin   | `admin`  | `admin123` |
| Coach   | `maya`   | `maya123`  |
| Student | `aanya`  | `aanya123` |

Credentials are verified server-side (`/api/login`, scrypt hashes) and the identity is stored
client-side. Data access is still anon (permissive RLS) — this gates **identity/UX, not data
security**. Production → Supabase Auth.

## The demo flow

Open each role in its own window (the landing page links to `/login`).

1. **Coach** (log in as `maya`) — **Start class**.
2. **Student** (log in as `aanya`) — tap a story on the slate. ✨ **It opens live on the coach's
   screen, and the student drives** (ticks answers, navigates).
3. Step **Listen → Read → Speak → Write** — every Next/Back syncs; the student's answers reflect on
   the coach screen; the coach-only playbook shows nudges/answer/rubric. The coach can **Take over**
   if needed.
4. **Admin** (log in as `admin`) — generate more logins, link student↔coach, schedule classes with a
   Zoom link & story.

## Quick start

1. **Create a Supabase project** (free tier is fine). From **Settings → API** copy the project URL,
   the `anon` public key, and the `service_role` key.
2. **Add `.env.local`** (see `.env.local.example`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
3. **Create the schema + seed.** In the Supabase **SQL editor**, run
   `supabase/migrations/0001_init.sql` then `supabase/seed.sql`.
   (Or, with the Supabase CLI + Docker: `supabase start && supabase db reset`.)
4. **Run it:** `npm run dev` → open `http://localhost:3000` and launch the three dashboards (they
   open in new tabs). For the live demo, put them in three side-by-side windows.

## Project structure

```
app/            page.tsx (launcher) · admin/ · student/ · coach/ · api/admin (service-role writes)
components/      LessonCanvas, CoachPlaybook, StageCard, QuestionView, VocabGame, ClassPeople,
                 StorySlate, TopBar, LiveClass (shared shell), useActiveSession (the live hook)
lib/            types.ts · stories.ts (content) · lesson.ts (pure logic) · session.ts (ALL DB +
                 Realtime) · admin.ts · supabase/{client,server}.ts
styles/         prototype-base.css + prototype-class.css (verbatim) → imported in app/layout.tsx
supabase/       migrations/0001_init.sql · seed.sql
tests/          unit/ (Vitest) · integration/ (Vitest + live Supabase, gated)
e2e/            magic-moment.spec.ts (Playwright, 3 contexts, gated)
```

**Design principles**

- **Sync the pointer, not the content.** Realtime only carries `{ story_key, current_step, phase,
driver, status }` on the `class_sessions` row; the heavy lesson content is rendered client-side
  from `lib/stories.ts`. Tiny payloads, instant re-render.
- **One job per file.** All DB reads/writes/subscriptions live in `lib/session.ts` — no component
  talks to Supabase directly. Pure lesson logic is in `lib/lesson.ts` (fully unit-tested).
- **One shared canvas** (`LessonCanvas` via `LiveClass`) used by both student and coach; a prop
  toggles the coach playbook.

**Common change — add a story:** add an entry to `GRADE_STORIES` in `lib/stories.ts` and a row to
the `stories` table (key + metadata). Everything else (steps, questions, playbook) is derived.

## Testing

- `npm test` — Vitest unit tests (pure lesson + session logic). Integration tests skip unless
  Supabase env is set.
- `npm run test:e2e` — Playwright. Drives three browser contexts and asserts the magic moment
  (child opens story → coach renders it) + lockstep stepping. Needs a running app + seeded Supabase.
  First run: `npx playwright install chromium`.
- `npm run test:all` — both. Also: `npm run lint`, `npm run format`.

Integration + E2E are **gated on env** so they skip cleanly in CI without a project. Run them
against a local Supabase (Docker) or a dev cloud project with the seed applied.

## Deploy to Vercel

1. Push to GitHub and import into Vercel (framework auto-detected as Next.js).
2. Add the three env vars in **Vercel → Settings → Environment Variables** (same as `.env.local`;
   keep `SUPABASE_SERVICE_ROLE_KEY` un-prefixed so it stays server-only).
3. Apply `supabase/migrations` + `seed` to the **cloud** Supabase project the deploy points at.
4. Deploy, then open `/admin`, `/student`, `/coach` on the live URL in three windows.

Realtime works unchanged on Vercel — the browser connects directly to Supabase's websocket.
