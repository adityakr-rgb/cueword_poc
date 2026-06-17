# Cueword × Edge — Live-Class POC: Full Project Overview

> A single document describing the whole idea, the product, the architecture, and every
> feature of this proof-of-concept. For setup/run instructions see [README.md](../README.md);
> for shipping see [DEPLOY.md](../DEPLOY.md). This file is the "what and why."

---

## 1. The one-line idea

A **real-time 1:1 live reading class**, split into two separately-deployed web apps — a
**Student app** and a **Coach app** — that run on two different domains but share **one
Supabase backend**, so anything one person does shows up on the other's screen instantly.

It is a POC built to demo to a manager. The thing it is built to prove is **the magic
moment** plus a **complete, synchronized lesson** with a coach-only teaching aid.

---

## 2. The headline moment ("the magic moment")

> The student opens a story, and **the same story instantly appears on the coach's screen** —
> then both step through the entire lesson in lock-step.

Concretely:

1. The **coach** opens the live class and presses **Start class** → their screen says
   *"Waiting for the student to open a story."*
2. The **student** taps **Join class** → Zoom opens in a new tab and they land directly in
   the live lesson on a configured story.
3. ✨ That story **appears live on the coach's screen** within a moment, and the lesson begins.
4. From there, **every** Next/Back, every answer the student ticks, and every phase change is
   mirrored to the coach in real time — with a **coach-only playbook** (nudges, the correct
   answer, the rubric) visible only on the coach side.

This is the entire point of the POC: prove that two apps on two domains can share one synced
live experience with tiny, instant updates.

---

## 3. Who's in the class

A single fixed pair (this is a one-pair demo, not a multi-tenant product):

| Role    | App         | Login            | Shows as     | Drives the lesson?                         |
| ------- | ----------- | ---------------- | ------------ | ------------------------------------------ |
| Coach   | `apps/coach`  | `liza` / `liza123` | **Liza Reyes** | Observes by default; can **Take over**     |
| Student | `apps/student`| `maya` / `maya123` | **Maya**       | **Yes** — ticks answers and navigates       |

Credentials, display names, the Zoom link, and the synced session id all live in **one file**:
`packages/core/src/config/poc.config.json`.

---

## 4. The product surface (what each app contains)

Both apps are faithful ports of the real Cueword student & coach designs. The dashboards
around the class are **static design shells**; the **only dynamic, networked thing** is the
live class and its sync.

### Student app (`apps/student` → `student.cueword.com`, dev `:3100`)

A warm, gold-themed student space. Sidebar navigation:

| Screen          | Route          | What it is                                            |
| --------------- | -------------- | ----------------------------------------------------- |
| **Home**        | `/`            | Dashboard; "Join class" entry into the live lesson    |
| **My Stories**  | `/lessons`     | The library of reading stories                        |
| **My Workouts** | `/workouts`    | Skill practice                                        |
| **Schedule**    | `/schedule`    | Upcoming sessions                                     |
| **My Progress** | `/progress`    | Skill mastery view                                    |
| **My Portfolio**| `/works`       | Saved work                                            |
| **Story (self-serve)** | `/story/[id]` | A student can read/answer a story on their own  |
| **Live class**  | `/live`        | **The synced live lesson** (the dynamic seam)         |
| **Login**       | `/login`       | Single-role login (student only)                      |

### Coach app (`apps/coach` → `coach.cueword.com`, dev `:3200`)

A cooler, professional coaching console (9 screens). Icon-rail navigation + contextual
sidebar + a Manila-time clock with a "students in US time" reminder:

| Screen           | Route             | What it is                                          |
| ---------------- | ----------------- | --------------------------------------------------- |
| **Dashboard**    | `/`               | Today's sessions + a live hero when class is on     |
| **Roster**       | `/roster`, `/roster/[id]` | All students; per-student detail            |
| **Schedule**     | `/schedule`       | This week's sessions + week stats                   |
| **Attendance**   | `/attendance`     | Attendance rates, flags below 95%                   |
| **Curriculum**   | `/curriculum`     | Curriculum browser                                  |
| **Marking**      | `/marking`, `/marking/[id]` | Submission queue + per-item marking (AI-assisted tag) |
| **Comms**        | `/comms`          | Parent communication log                            |
| **Profile**      | `/profile`        | Account / preferences / settings                    |
| **Live class**   | `/live`           | **The synced live console** with the coach playbook |
| **Login**        | `/login`          | Single-role login (coach only)                      |

> Most dashboard data on both apps is **mock data** (`data/studentData.ts`, `data/coachData.ts`,
> `data/storyLib.ts`) — it exists to make the demo look real. The live class is the only screen
> backed by the live database.

---

## 5. The synced lesson (what happens inside `/live`)

A lesson is built from a story and walks through four phases — **Listen → Read → Speak → Write** —
plus warm-up and wrap. `buildSteps()` (in `packages/core/src/lib/lesson.ts`) expands a story into
an ordered step list:

```
cover → listen → (Listen questions…) → read → (Read questions…) → game → speak → write → ending → complete
```

Phase budget shown in-UI: Listen 5m · Read 8m · Speak 6m · Write 5m.

**Question types supported** (each renders its own interaction): `mcq`, `multi` (choose all),
`truefalse`, `tap` (tap the word), `sequence` (put in order), `cloze` (fill the blank), `match`,
`short` (write it).

**The three stories** (seeded; content lives client-side in `lib/stories.ts`):

| Key  | Grade   | Title                       | Theme                          |
| ---- | ------- | --------------------------- | ------------------------------ |
| `K`  | Grade K | Pip the Lost Penguin        | Animals · Antarctica           |
| `G3` | Grade 3 | The First Flight            | Nonfiction · The Story of Flight |
| `G6` | Grade 6 | What Killed the Dinosaurs?  | Nonfiction · Science Detective |

The configured demo story is **`G3` — The First Flight**.

### The shared live UI (`<LiveClass>`)

A dark "class shell" used by **both** apps:

- **TopBar** — story title, a **Zoom link** button, leave/logout actions.
- **ClassPeople** — instead of two video tiles, a single **"Place your Zoom window here"**
  placeholder. The real 1:1 video runs in **Zoom** in a separate window; **Join Zoom** opens
  the configured link in a new tab. (No real video is implemented — this is a deliberate POC
  simplification.)
- **LessonCanvas** — the actual lesson content/question for the current step; the driver sees
  interactive controls (Next/Back, tick answers), the observer sees it update live.
- **CoachPlaybook** (coach only — `showPlaybook`) — for each question shows the learning
  **outcome**, a **teaching move**, graduated **nudges**, the **correct answer**, and a rubric.
  The student never sees this.

### Who drives

The **student drives** the lesson by default (`driver = 'student'`): they tick answers and press
Next/Back, and every action syncs to the coach. The coach can press **Take over** to grab the
driver role (and **Give control back**). The student's picks are **mirrored visually** onto the
coach's screen — the same question view lights up green/red as the student answers.

---

## 6. Architecture

### Monorepo (npm workspaces)

```
apps/student/       → student.cueword.com   (Vercel project A · dev :3100)
apps/coach/         → coach.cueword.com     (Vercel project B · dev :3200)
packages/core/      → @cueword/core — shared layer (consumed via transpilePackages; ships TS source)
  src/lib/          session.ts · lesson.ts · stories.ts · types.ts · auth.ts · config.ts · supabase/client.ts
  src/components/    LiveClass · LessonCanvas · ClassPeople · CoachPlaybook · QuestionView · TopBar ·
                     StorySlate · StageCard · Scene · VocabGame · useActiveSession · SetupNotice · …
  src/styles/        prototype-base.css · prototype-class.css (shared live-class CSS)
  src/config/        poc.config.json  ← creds + Zoom link + seeded session id
supabase/           migrations/0001_init.sql · seed.sql  (one shared DB)
tests/ · e2e/        Vitest (unit + gated integration) · Playwright (cross-app magic moment)
```

Each app is a thin design **shell** that mounts the shared `<LiveClass>` at `/live`. Editing a
dashboard = editing one app. Editing creds/Zoom = editing one JSON file. Editing the sync = editing
`packages/core`.

### Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Supabase** — Postgres + **Realtime** (the sync wire)
- **Vercel** — two projects (often two accounts) deploying from one repo
- **Vitest** (unit + integration) and **Playwright** (cross-app E2E)

---

## 7. How the sync actually works — "sync the pointer, not the content"

The central design idea. Realtime carries only a tiny **pointer**, never lesson content.

- The shared state is **one row** in `class_sessions` (the row whose id = `config.session.id`).
- Both apps subscribe to that single row via Supabase Realtime (`subscribeSession`).
- The synced fields are just: **`story_key`, `current_step`, `current_phase`, `driver`,
  `status`** — that's the whole "render state."
- The heavy lesson content (transcripts, passages, questions) is **not** in the DB; it renders
  client-side from `lib/stories.ts` keyed by `story_key`. Payloads stay tiny; re-render is instant.
- A second stream, `session_events` (INSERT-only), carries the **activity log**: `open_story`,
  `step`, `answer`, `phase`, `note`. The coach subscribes to it so the student's **answers**
  reflect on the coach screen.

**All Supabase access lives in exactly one file** — `packages/core/src/lib/session.ts`. No
component talks to Supabase directly. The key operations:

| Function              | What it does                                                        |
| --------------------- | ------------------------------------------------------------------- |
| `getSession(id)`      | Read the one session row                                            |
| `subscribeSession`    | Realtime: watch the row → pushes render-state changes               |
| `subscribeSessionEvents` | Realtime: watch the activity stream (answers, notes)             |
| `openStory(...)`      | **The magic moment** — set story_key, step 0, phase Listen, status live |
| `setStep(...)`        | Move the lesson forward/back; logs a `step` event                   |
| `logAnswer(...)`      | Record the student's pick (mirrored to the coach)                   |
| `startClass` / `endClass` | Flip status live ↔ completed (start can restart a finished class) |
| `setDriver(...)`      | Coach takes over / hands control back                               |

`useActiveSession()` is the React hook every screen uses: it loads the one configured session and
keeps it live. The coach Shell owns a single subscription and shares it via context (Supabase
rejects a second `postgres_changes` callback on the same topic).

---

## 8. Data model (Supabase / Postgres)

Defined in `supabase/migrations/0001_init.sql`. Tables:

- **`profiles`** — people (role admin/student/coach, name, avatar, grade, timezone). *Legacy in the
  two-app POC; kept only so the session row's foreign keys resolve.*
- **`enrollments`** — student ↔ coach pairing + plan.
- **`stories`** — story catalog (key `K`/`G3`/`G6`, title, theme, cover).
- **`assignments`** — which stories a student has.
- **`class_sessions`** — ⭐ **the sync spine.** Holds `story_key`, `current_step`,
  `current_phase`, `driver`, `status`, `zoom_link`, scheduling. Watched by Realtime.
- **`session_events`** — the activity stream (open_story / step / answer / phase / note). Watched
  by Realtime (INSERT).
- **`progress`** — per-skill mastery.

**Realtime publication** is enabled on `class_sessions` and `session_events`.

**RLS:** Row Level Security is ON but with **permissive policies** (`anon` may read/write
everything) so the demo needs no real auth. The migration explicitly notes this and what the
production replacement would be (student sees own sessions, coach sees roster, etc.).

The **seed** (`supabase/seed.sql`) inserts the 3 profiles, 3 stories, 1 enrollment, 3 assignments,
and — critically — **the one `class_sessions` row** whose id is
`55555555-5555-5555-5555-555555555555` (must equal `config.session.id`). To reset the demo, set
that row back to `status='scheduled', story_key=null`.

---

## 9. Authentication (POC)

Deliberately minimal — **no server, no DB login**. `lib/auth.ts` validates the typed
username/password purely client-side against `poc.config.json` (`validateLogin(role, …)`), then
stores the identity in `localStorage` (`useCurrentUser`). Each app is **single-role**: the student
app only accepts the student login, the coach app only the coach login. Every screen is gated →
unauthenticated users redirect to `/login`.

> This gates **identity/UX only** — data access is still anon via the permissive RLS. For a
> single-pair demo that is exactly the intended tradeoff, not a security model.

---

## 10. Key design principles (the "why it's built this way")

1. **Sync the pointer, not the content.** Realtime only moves
   `{ story_key, current_step, phase, driver, status }`; content renders client-side. Tiny
   payloads → instant re-render.
2. **One job per file.** All DB reads/writes/subscriptions live in `lib/session.ts`. Pure lesson
   logic (no DOM, no network) lives in `lib/lesson.ts` and is fully unit-tested. Strong types in
   `lib/types.ts` — no `any`.
3. **Shared core, separate shells.** The live class + sync ship once via `@cueword/core`; each app
   is a static design shell. Change creds/Zoom = one JSON file; change a dashboard = one app.
4. **POC simplifications, stated up front.** No real auth (JSON config), no real video (Zoom in a
   separate tab + a placeholder tile), one fixed session row.

---

## 11. The demo flow (end to end)

Run both apps side by side at **desktop width** (the live class needs ≥ 940px):

1. **Coach** (`coach` app, log in `liza`/`liza123`) → **Go to live class** → **Start class** →
   "waiting for the student to open a story."
2. **Student** (`student` app, log in `maya`/`maya123`) → **Join class** → Zoom opens; the student
   lands directly in the configured story. ✨ **It opens live on the coach's screen.**
3. Step **Listen → Read → Speak → Write** — every Next/Back syncs; the student's answers reflect on
   the coach screen; the coach-only playbook shows nudges / answer / rubric. The coach can **Take
   over**.
4. Both live views show the **"Place your Zoom window here"** placeholder; **Join Zoom** opens the
   real link (from the JSON config) in a new tab.

---

## 12. Testing

| Command            | What it covers                                                                 |
| ------------------ | ------------------------------------------------------------------------------ |
| `npm test`         | Vitest **unit** — lesson + session logic, config/auth. Always runs.            |
| `npm run test:int` | Vitest **integration** vs a live Supabase — proves Realtime sync on the seeded row. Skips without env. |
| `npm run test:e2e` | **Playwright** — drives student `:3100` + coach `:3200` together and asserts the cross-domain magic moment, driver semantics, and the Zoom placeholder. |

Pre-deploy gate: `npm run build` (both apps) · `npm run lint` · `npm test`.

---

## 13. Deployment

Two Vercel projects from this one repo (commonly on two different Vercel accounts):

- **Coach** project → Root Directory `apps/coach` → `coach.cueword.com`.
- **Student** project → Root Directory `apps/student` → `student.cueword.com`.
- **Same** `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` on **both** — pointing at
  the **same** Supabase project. That shared backend is what makes a change on one domain show up
  live on the other. (No service-role key needed; the admin app was removed.)

Full cross-account checklist (GitHub access grant, monorepo build settings, DNS CNAMEs) is in
[DEPLOY.md](../DEPLOY.md).

---

## 14. History / context (how it got here)

- Started as a **three-dashboard** app (Admin + Student + Coach) in a single Next.js project, with
  real DB-backed auth and an admin provisioning console.
- Restructured into the current **two-app monorepo** (`poc/two-app-split`): **Admin removed**, auth
  simplified to the JSON config, and the dashboards re-ported faithfully from the real Cueword
  student and coach designs (the coach console is a 9-screen port; the student app is the standalone
  student design).
- The student no longer picks a story from a slate — tapping **Join** opens Zoom and auto-opens the
  one configured story (`session.storyKey = "G3"`), dropping the student straight into the live
  lesson while still firing the magic-moment sync to the coach.

---

*Generated as a project overview. Source of truth for behavior is the code in `packages/core` and
the two apps; this document summarizes it.*
