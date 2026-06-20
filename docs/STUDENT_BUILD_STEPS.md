# Student Side — Step-by-Step Build Guide (for the agent)

> **What this is.** A detailed, ordered to-do list for the **Student-side** developer/agent to take the
> Cueword live-class app from POC to pilot. It describes **what to build and why** at each step — the
> *idea*, the files to touch, the sub-steps, and how to know it's done. **No code here on purpose** —
> you (the agent) decide the implementation; this is the spec to implement against.
>
> Companion docs: [TWO_DEV_TASK_SPLIT.md](TWO_DEV_TASK_SPLIT.md) (the big picture + ownership),
> [Student_Dev_Spec.docx](Student_Dev_Spec.docx) (endpoint reference). The coach side is in
> [COACH_BUILD_STEPS.md](COACH_BUILD_STEPS.md).

---

## How to use this file

- Work **top to bottom**. Each step lists what it **depends on** — don't start a step until its deps are met.
- Each step uses this shape: **Idea** (what/why) · **Touch** (files/areas) · **Do** (sub-steps) · **Done when** (acceptance).
- **🔗 = sync point.** At each, merge your branch into the shared integration branch and hand off anything the Coach dev is waiting on. **One repo, track-named branches, PRs into the integration branch** — see [TWO_DEV_TASK_SPLIT.md](TWO_DEV_TASK_SPLIT.md) §2.5 for the repo/branch model.
- Through Day 7, verify locally with `npm run dev:student` (port 3100) + the preview tools. **Day 8 deploys it** — the goal is deployment-ready, then live.

## Ground rules (read before you write anything)

1. **This is NOT the Next.js you know.** Before writing ANY Next.js code, read the relevant guide under `node_modules/next/dist/docs/`. Key facts: middleware is renamed to **Proxy** (`proxy.ts`, not `middleware.ts`); `cookies()` from `next/headers` is **async**; auth uses `@supabase/ssr` (already installed).
2. **Your ownership.** You own `apps/student`, the shared **live-class engine** (`packages/core/src/lib/session.ts`, `useActiveSession.tsx`, `useStoryContent.tsx`), the **auth client wiring for BOTH apps** (`supabase/client.ts`, login/logout actions, `proxy.ts`), the **content migration** (`stories.ts` + the seed script), and the student-facing AI capture/UI.
3. **Do NOT touch** (Coach dev owns): `supabase/migrations/*` + seeds + views, and `packages/core/src/lib/ai/claude.ts`. Request schema columns/tables at a 🔗; call the AI service via its published functions.
4. **`packages/core/src/lib/types.ts` is shared** — announce before editing; your main change there is making the story key a free string. Land it at a 🔗.
5. **On Day 4 you own `session.ts`** — the coach console depends on it. **Publish the new hook signature first, then refactor internals**, so you never block the Coach dev.

## Where you're starting from (current state — don't re-do these)

- The **live-class engine and the student `/live` page work**. The magic moment fires today. Don't rebuild it; you're making it multi-session.
- **All 6 student screens are fully-built UI** rendering mock data from `apps/student/data/studentData.ts` (and `storyLib.ts` for stories). Your job is **swap mock → real DB**, not build screens.
- **`SpeakRecorder` already does real microphone capture** (both in the live class and the self-serve story) — **but the audio is never uploaded or saved.** Persisting it is your Day-5 job. The Write step is a local stub too.
- **Auth is fake** — client-side `localStorage` vs `poc.config.json`. The server pieces (`supabase/server.ts`, `dal.ts`) and `@supabase/ssr` are **already installed/written but unused**. Auth is a **wiring** job, not from scratch.
- **The browser Supabase client** (`supabase/client.ts`) uses a non-cookie client with `persistSession:false` — it must become the cookie client.
- **Story content is bundled, not in the DB** — the live class runs from `GRADE_STORIES` (3 stories in `packages/core/src/lib/stories.ts`); the self-serve player runs from `storyLib.ts` (12 stories in `apps/student/data/`). The story key is a fixed 3-value union and the live page hardcodes `AUTO_STORY`. A `seed:content` script exists but the DB content is empty.
- **Zoom link:** the per-session Zoom link is **entered by the Admin** when scheduling (`class_sessions.zoom_link`). The student Join seam should open **that** link, not the static config link.

---

# DAY 1 — Foundation: real auth (you wire it for BOTH apps)

**Goal of the day:** real Supabase Auth with a cookie session in both apps, replacing the fake localStorage login. Nothing real-data is safe until this lands.

### Step 1.1 — Switch the browser client to a cookie session
- **Idea:** The app must use a browser client that shares the auth cookie session (so login survives reloads and the server can read it), instead of the current anon, non-persisting client.
- **Touch:** `packages/core/src/lib/supabase/client.ts`.
- **Do:** Replace the current client factory with the `@supabase/ssr` browser client (cookie-based). Drop the `persistSession:false` behavior. Keep the "is Supabase configured" guard.
- **Depends on:** nothing.
- **Done when:** a logged-in session survives a page reload.

### Step 1.2 — Add the Proxy to both apps
- **Idea:** Next 16's middleware replacement refreshes the session on each request and bounces logged-out users to login.
- **Touch:** `apps/student/proxy.ts` and `apps/coach/proxy.ts` (you create both — it's shared plumbing).
- **Do:** First read the Proxy guide under `node_modules/next/dist/docs/`. Add a `proxy.ts` per app that refreshes the Supabase session and does an **optimistic** redirect of logged-out visitors from gated routes to `/login`. Keep it cookie-only (no DB calls — it runs on every prefetch).
- **Depends on:** 1.1.
- **Done when:** hitting a gated route while logged out redirects to `/login` in both apps.

### Step 1.3 — Login as a Server Action
- **Idea:** Real sign-in against Supabase Auth, with proper error states, replacing `validateLogin`.
- **Touch:** `apps/student/app/actions/auth.ts` and `apps/coach/app/actions/auth.ts` (new); the two `app/login/page.tsx` forms.
- **Do:** A `signIn` server action that signs in with email + password and reports errors back to the form (so the form can show "wrong password" etc.). Wire each app's login form to it. Each app stays single-role.
- **Depends on:** 1.1; the Coach dev's provisioned auth users (Day-1) to test against.
- **Done when:** a real seeded user logs in on each app.

### Step 1.4 — Logout as a Server Action
- **Idea:** Real sign-out wired to the existing logout buttons.
- **Touch:** `app/actions/auth.ts` (both apps); the logout buttons in `apps/student/components/Shell.tsx` and `apps/coach/components/Shell.tsx`.
- **Do:** A `signOut` action that ends the session and redirects to `/login`. Wire both Shells.
- **Depends on:** 1.3.
- **Done when:** logout clears the session in both apps.

### Step 1.5 — Retire the localStorage identity
- **Idea:** Identity should come from the real session, not "the first user of this role" in a JSON file.
- **Touch:** `packages/core/src/lib/auth.ts`; both Shells; the gated layouts.
- **Do:** Read the signed-in identity from the session / the server DAL (`dal.getCurrentProfile`, already written). Keep the `useCurrentUser` shape if it's cheap so screens don't all change. Remove the `poc.config.json` credential check path.
- **Depends on:** 1.3.
- **Done when:** the displayed identity is the actual signed-in user, not a hardcoded one.

> **🔗 Day-1 sync.** Merge auth; both apps log in as real users. **Agree two things with the Coach dev:** the `queries/*` convention and the exact seed shape for Days 2–3 (they own the seed; you map your mock against it).

---

# DAY 2 — Student app onto real data (begin)

**Goal:** the foundational query layer + the first screens on real data.

### Step 2.1 — Build the student query layer
- **Idea:** One file holds every typed, RLS-scoped read/write the student screens use — replacing direct reads of `studentData.ts`.
- **Touch:** `packages/core/src/lib/queries/student.ts` (new).
- **Do:** Create functions, one per screen need: home bundle, story library, workouts, record-a-drill-attempt, submit-a-coach-drill, schedule, cancel-a-class, progress, portfolio. Follow the convention agreed with the Coach dev at the 🔗.
- **Depends on:** Day-1 🔗.
- **Done when:** a scratch call returns real rows for the seeded student.

### Step 2.2 — Student pilot seed
- **Idea:** Map the existing mock (`studentData.ts`) onto the real tables so the screens have believable data.
- **Touch:** `supabase/seed/student.sql` (coordinate with the Coach dev, who owns the seed folder).
- **Do:** Map the ~24 mock entities to tables: skills/levels → progress, stats → student stats, milestones, vocab, portfolio, workouts, and schedule → class sessions.
- **Depends on:** Day-1 seed shape.
- **Done when:** the seed loads and the screens below show plausible data.

### Step 2.3 — Home on real data
- **Idea:** The launch pad shows the real next class, skills, vocab warmup, flagged items, workouts preview, and resume cards.
- **Touch:** `apps/student/app/(shell)/page.tsx`.
- **Do:** Replace mock reads with `queries/student.ts`. Keep the Join-class seam (the cosmetic NetCheck modal → opens Zoom + navigates `/live`), but make it open the **session's `zoom_link` (admin-assigned)**, not the static config link.
- **Depends on:** 2.1, 2.2.
- **Done when:** the home screen renders real rows and Join opens the session's link.

### Step 2.4 — My Stories on real data
- **Idea:** The term/level/story library with real lock and progress state.
- **Touch:** `apps/student/app/(shell)/lessons/page.tsx`.
- **Do:** Read the curriculum hierarchy + the student's assignments + progress. Compute term/level lock state and per-story status (completed / continue / upcoming / locked) from the DB.
- **Depends on:** 2.1.
- **Done when:** locked/done states are correct for the seeded student.

### Step 2.5 — My Workouts on real data (with real flagging)
- **Idea:** Self-paced practice that **persists** — and, crucially, a wrong answer is **flagged to the coach** (today it only lives in browser memory).
- **Touch:** `apps/student/app/(shell)/workouts/page.tsx`; `queries/student.ts`.
- **Do:** The auto-scored DrillRunner writes each attempt (drill attempts table); a **wrong answer creates a flagged-item row** the coach can see. The coach-reviewed CoachDrill (speaking/writing) creates a submission in "awaiting" state for the coach's marking queue.
- **Depends on:** 2.1.
- **Done when:** completing a drill persists, and a wrong answer shows up flagged on the coach side (verify at the 🔗).

> **🔗 Day-2 sync.** Request any missing columns from the Coach dev; keep the `queries/*` pattern identical across both files.

---

# DAY 3 — Student app onto real data (finish)

**Goal:** the remaining screens on real data; zero mock left.

### Step 3.1 — Schedule on real data
- **Idea:** The weekly calendar with the 2-classes-per-week cap and the 4-hour cancellation rule.
- **Touch:** `apps/student/app/(shell)/schedule/page.tsx`.
- **Do:** Read `class_sessions`. Enforce the 2/week cap (filled/empty dots). The parent cancellation works only **4h+ before start** (otherwise the button is "Locked"); cancelling writes a cancelled timestamp and frees the weekly slot. Convert times to the student's US timezone.
- **Depends on:** 2.1.
- **Done when:** cancelling is locked under 4h and frees a slot above it.

### Step 3.2 — My Progress on real data
- **Idea:** The belt/level/KPI dashboard from real stats.
- **Touch:** `apps/student/app/(shell)/progress/page.tsx`.
- **Do:** Read student stats (belt, points, KPIs), milestones, and coach feedback. The belt-progress ring reflects the real percentage.
- **Depends on:** 2.1.
- **Done when:** the belt ring shows the real percentage and KPIs match the seed.

### Step 3.3 — My Portfolio on real data
- **Idea:** Saved work, filterable, from the DB.
- **Touch:** `apps/student/app/(shell)/works/page.tsx`.
- **Do:** Read portfolio items / artifacts. Keep the filters, the modals, and the (cosmetic) audio player; feed them real items.
- **Depends on:** 2.1.
- **Done when:** items come from the DB.

### Step 3.4 — Remove the mock
- **Idea:** Prove the app is fully real.
- **Touch:** `apps/student` (grep for `studentData`).
- **Do:** Remove all dynamic imports of `studentData.ts`. Keep it only as fixtures if anything still references it.
- **Depends on:** 3.1–3.3.
- **Done when:** **zero dynamic `studentData.ts` imports remain.**

> **🔗 Day-3 sync.** Cross-check end-to-end: a piece of work you submit shows up in the coach's marking queue.

---

# DAY 4 — Multi-session engine (the centerpiece — you own `session.ts`)

**Goal:** the live class works for real, concurrent classes — each user joins **their** session, running **their** assigned story, surviving network drops. **Publish the new hook signature by midday so the coach console isn't blocked.**

### Step 4.1 — Resolve the session per user
- **Idea:** Stop hardcoding one session id. Find the right session for the logged-in person.
- **Touch:** `packages/core/src/lib/session.ts`.
- **Do:** Add helpers to list a user's sessions and resolve their current/active one (per enrollment). Stop treating the single seeded session id as the source of truth.
- **Depends on:** Day-1 auth (a real identity to resolve from).
- **Done when:** two different enrollments resolve to two different sessions.

### Step 4.2 — Parameterize the hook + publish the signature (midday handoff)
- **Idea:** The hook the screens use must take a session id.
- **Touch:** `packages/core/src/components/useActiveSession.tsx`; student `/live` page consumes it.
- **Do:** Change the hook to accept a session id and subscribe to *that* row. **By midday, publish the new signature to the Coach dev** (they rebuild the coach console on it), then continue refactoring internals.
- **Depends on:** 4.1.
- **Done when:** the Coach dev confirms the signature; the student page works with it.

### Step 4.3 — Run the session's assigned story (not a constant)
- **Idea:** Today the student `/live` page auto-opens `AUTO_STORY` (always the same story). It must open the story **assigned to this session**.
- **Touch:** `apps/student/app/live/page.tsx`; routing from Home/Schedule.
- **Do:** Replace the `AUTO_STORY` constant with the story the session carries (its assigned story id/key). Support joining a specific session via `/live?session=<id>`.
- **Depends on:** 4.1.
- **Done when:** different sessions open different stories; the magic moment still fires to the coach.

### Step 4.4 — Decouple from the fixed 3 stories
- **Idea:** The code assumes exactly 3 stories (K/G3/G6). Make it handle any number from the DB.
- **Touch:** `packages/core/src/lib/types.ts` (story key → free string), `packages/core/src/lib/lesson.ts` (replace the per-key BAND/CL_KID maps with a function deriving "who drives" from the story's grade), and the two components that read the per-key map (`LessonCanvas`, `CoachPlaybook`).
- **Do:** Make the story key a free string. Replace the hardcoded grade→driver maps with a derive-from-grade function (K–2 coach-led, 3+ student-led). Update the two components to use it. Announce the `types.ts` change first.
- **Depends on:** 4.3.
- **Done when:** a brand-new DB story (new key/grade) runs the lesson with **zero code change** — that's the acceptance test.

### Step 4.5 — Realtime resilience
- **Idea:** A real class can't break when the network blips or someone reloads mid-lesson.
- **Touch:** `packages/core/src/lib/session.ts` (the subscriptions).
- **Do:** Handle reconnect, presence, late-join hydration (a joiner gets the current state), mid-lesson refresh, and channel errors.
- **Depends on:** 4.2.
- **Done when:** killing and restoring the network leaves the lesson state intact on both sides.

### Step 4.6 — Bound the activity stream
- **Idea:** The activity log (`session_events`) is read unbounded — the demo already hit 154 rows. Don't let it grow unbounded in the read path.
- **Touch:** `packages/core/src/lib/session.ts`; DB indexes (request from the Coach dev).
- **Do:** Paginate / cursor the event reads; add the supporting indexes (ask the Coach dev to add them in a migration).
- **Depends on:** 4.2.
- **Done when:** event reads are paginated and fast.

### Step 4.7 — Multi-session E2E (co-write with Coach dev)
- **Idea:** Prove two pairs can hold independent classes at once.
- **Touch:** `e2e/multi-session.spec.ts`.
- **Do:** Together, drive two student↔coach pairs simultaneously and assert no cross-talk.
- **Depends on:** 4.2.
- **Done when:** the test passes for two concurrent pairs.

> **🔗 Day-4 sync.** You ship `useActiveSession(sessionId)` at midday; co-write the multi-session E2E. **Only you edit `session.ts` today.**

---

# DAY 5 — Student-facing AI: capture + feedback 🔑 needs `ANTHROPIC_API_KEY`

**Goal:** speak/write work is actually captured, stored, and gets real feedback. **You build the routes + UI; they call the Coach dev's shared AI service.**

### Step 5.1 — Upload captured audio to storage
- **Idea:** `SpeakRecorder` already records — but the audio is thrown away. Save it.
- **Touch:** `apps/student/app/api/uploads/speech/route.ts` (new); the speak step in the live class and self-serve story.
- **Do:** A route that takes the recorded audio (plus session/section context), uploads it to a Supabase Storage bucket (signed URLs + storage security so only the owner/coach can fetch), and creates the submission row. Agree the bucket + path convention with the Coach dev.
- **Depends on:** Day-1 auth; the Coach dev's Storage convention (Day-5 handoff).
- **Done when:** audio uploads and only the owner/coach can fetch it.

### Step 5.2 — Writing feedback
- **Idea:** A written submission gets a real rubric.
- **Touch:** `apps/student/app/api/ai/writing/route.ts` (new); the write step UI.
- **Do:** A route that sends the text to the Coach dev's `scoreWriting` service, saves the returned score on the submission, and renders the real rubric (overall + per-criterion + feedback).
- **Depends on:** the Coach dev's published AI interface (Day-5 handoff).
- **Done when:** a real rubric shows for a sample written piece.

### Step 5.3 — Speaking feedback
- **Idea:** Spoken work gets a rubric from its transcript.
- **Touch:** `apps/student/app/api/ai/speaking/route.ts` (new); the speak step UI.
- **Do:** A route that takes the stored audio, gets a transcript (real transcription if a provider key exists; otherwise stub the transcript), sends it to `scoreSpeaking`, saves the score, and renders the rubric.
- **Depends on:** 5.1; the AI interface.
- **Done when:** audio → score works end-to-end (with a stubbed transcript if needed).

### Step 5.4 — Wire the self-serve story
- **Idea:** The at-home `/story/[id]` player has the same speak/write steps, currently stubs.
- **Touch:** `apps/student/app/story/[id]/page.tsx`.
- **Do:** Point its speak/write steps at the same upload + AI routes so self-serve submissions persist and get feedback.
- **Depends on:** 5.1–5.3.
- **Done when:** a self-serve submission persists and shows feedback.

> **🔗 Day-5 sync.** Build against the Coach dev's published AI interface + score shape; confirm the Storage bucket/path.

---

# DAY 6 — Content migration (the crunch day)

**Goal:** every story lives in the DB; the code no longer carries story content. **Protect the seam with the Coach dev's admin app — they assign stories from your migrated content.**

### Step 6.1 — Push all stories into the DB
- **Idea:** Move the 15 bundled stories (3 in the core `GRADE_STORIES` + 12 in the student `storyLib.ts`) into the database so they can be authored/assigned without code edits.
- **Touch:** `packages/core/scripts/seed-story-content.mts` (extend the existing script).
- **Do:** Extend the script to push every bundled story into the content table(s): the full story object plus its sections, questions, answer keys, and vocab. Run it against staging.
- **Depends on:** the schema's content tables (from the Coach dev's migration).
- **Done when:** the DB carries all 15 stories with their content intact.

### Step 6.2 — Make the DB the only runtime source
- **Idea:** Stop falling back to bundled content at runtime.
- **Touch:** `packages/core/src/lib/session.ts` (the story fetch), `packages/core/src/lib/stories.ts`.
- **Do:** Remove the "fall back to the bundled story" branch from the content fetch; add a "list stories" helper for the catalog. Demote the bundled `GRADE_STORIES` to **test fixtures only** (don't ship it in the app bundle).
- **Depends on:** 6.1.
- **Done when:** the live class and self-serve both render story content **from the DB**.

### Step 6.3 — Wire the screens to DB content
- **Idea:** The story library and the self-serve player should read DB content.
- **Touch:** `apps/student/app/(shell)/lessons/page.tsx`, `apps/student/app/story/[id]/page.tsx`.
- **Do:** Point both at the DB content (via the fetch/list helpers) instead of the local `storyLib.ts`.
- **Depends on:** 6.2.
- **Done when:** lessons render from the DB in both the live class and self-serve.

### Step 6.4 — Acceptance: a brand-new story with no code change
- **Idea:** Prove the decoupling really worked.
- **Touch:** none (DB only).
- **Do:** Add a 4th story (a new key/grade) **in the DB only** and run a class on it.
- **Depends on:** 6.3, and the Day-4 decoupling (Step 4.4).
- **Done when:** the new story runs the full lesson + the coach playbook with **zero code change**.

> **🔗 Day-6 sync.** **First thing:** agree the story / `class_stories` row shape with the Coach dev — their admin story-assignment reads your migrated content. This is the day most likely to slip; protect this seam.

---

# DAY 7 — Polish, tests, hardening (no deploy)

**Goal:** harden every student surface and prove it end-to-end.

### Step 7.1 — States everywhere
- **Idea:** No raw spinners or blank screens; kids and parents shouldn't see confusing states.
- **Touch:** all student screens + the self-serve story.
- **Do:** Add loading skeletons, empty states, and error boundaries with friendly copy.
- **Done when:** every screen has a sensible loading/empty/error state.

### Step 7.2 — Accessibility + device fit
- **Idea:** Students may be on tablets; the experience must be keyboard- and touch-friendly.
- **Touch:** all student screens; the live class.
- **Do:** Keyboard nav, focus, ARIA, contrast; check the live class and lesson controls are touch-friendly and responsive (the live class needs a desktop-ish width — confirm the breakpoint behavior).
- **Done when:** axe is clean on the main flows and the lesson works on a tablet width.

### Step 7.3 — Timezone correctness
- **Idea:** Times shown to the student are in their US timezone.
- **Touch:** schedule, home, live.
- **Do:** Store UTC; render in the student's timezone. Verify against the coach's Manila time where both are shown.
- **Done when:** times match per user.

### Step 7.4 — Student + live-class E2E
- **Idea:** Automate the critical paths.
- **Touch:** `e2e/`.
- **Do:** Cover login, the magic moment, the full lesson, multi-session, and a persisted speak/write submission.
- **Done when:** the suites are green.

### Step 7.5 — Student notifications
- **Idea:** The student sees in-app notifications (class soon, feedback ready).
- **Touch:** the notifications read path; reminder emails where useful.
- **Do:** Surface in-app notifications (the coach writes them when sending feedback); add email reminders for upcoming classes.
- **Done when:** a notification appears when the coach sends feedback.

> **🔗 Day-7 sync.** Joint smoke of the whole flow with the Coach dev: **admin provisions → coach schedules (with Zoom link) → student joins → live class → coach marks → AI feedback.** Now it's deploy-ready — Day 8 ships it.

---

# DAY 8 — Deployment (make it live)

**Goal:** the student app runs on its real domain against the production database, with real login working under HTTPS. **You own the student-app deployment and the local build gate** (the Coach dev owns the Supabase cutover + secrets). Per [DEPLOY.md](../DEPLOY.md), this is a monorepo → **one Vercel project per app** (Root Directory = `apps/student`); `@cueword/core` is shared, not deployed on its own.

### Step 8.1 — Local build gate (reproduce the Vercel build)
- **Idea:** The best way to know the deploy will succeed is to build everything locally first.
- **Touch:** repo root.
- **Do:** From the root, build **all** apps (student, coach, admin), then lint, then run the unit + integration + E2E suites. Never push red.
- **Depends on:** Day-7 green.
- **Done when:** the full build + test suite is green locally.

### Step 8.2 — Create the student Vercel project
- **Idea:** One Vercel project for the student app from the monorepo.
- **Touch:** Vercel; `apps/student/vercel.json`.
- **Do:** Import the repo with **Root Directory = `apps/student`**. Leave build/install at defaults (the workspace auto-detects; if `@cueword/core` isn't found, enable "Include files outside the Root Directory"). Add the domain `student.cueword.com` + its CNAME.
- **Depends on:** 8.1.
- **Done when:** the student app builds and resolves `@cueword/core` on Vercel.

### Step 8.3 — Student environment variables
- **Idea:** Production env for the student app — same Supabase project as everyone else.
- **Touch:** Vercel env settings (student project).
- **Do:** Set `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the **same production** project) under Production (+ Preview). If the student app's AI routes run from here, set `ANTHROPIC_API_KEY` (server-only). The audio Storage bucket must exist (the Coach dev creates it at 8.1). **No service-role key in the student app.** Redeploy after changes (`NEXT_PUBLIC_*` are build-time inlined).
- **Depends on:** 8.2.
- **Done when:** the student env is set and redeployed.

### Step 8.4 — Verify auth & session on the real domain (the production gotcha)
- **Idea:** Cookie auth + the Proxy behave differently under HTTPS on `student.cueword.com` than on localhost. This is the most common deploy break.
- **Touch:** the deployed student app; coordinate the Supabase Auth site/redirect URLs with the Coach dev (they own Supabase settings — see Coach 8.1).
- **Do:** Confirm login **persists across reloads** on the live domain; the Proxy redirects logged-out users; signed Storage URLs resolve. If login bounces, check that `student.cueword.com` is in Supabase Auth's allowed URLs and the cookie settings are correct under HTTPS.
- **Depends on:** 8.3 + Coach 8.1.
- **Done when:** real login + session work on `student.cueword.com`.

### Step 8.5 — Student smoke on the live URL
- **Idea:** Prove the student paths work in production.
- **Touch:** the deployed student URL.
- **Do:** Log in as a real student. The **magic moment** fires to the live coach. The full lesson runs. A speak/write submission uploads to Storage and gets feedback. Multi-session holds (your own session, not someone else's).
- **Depends on:** 8.4.
- **Done when:** the student critical paths pass on the live URL.

> **🔗 Day-8 sync (joint production smoke).** With the Coach dev, run the whole flow **on the live domains**: admin provisions → coach schedules (Zoom link) → student joins on `student.cueword.com` → live class → coach marks on `coach.cueword.com` → AI feedback → student sees it. **That is "deployed and shipped."**

**Deployment external deps (queue early):** Vercel access (the student app's account per DEPLOY.md), DNS control of `student.cueword.com`, and `ANTHROPIC_API_KEY` if the student app runs AI. The production Supabase project + its Auth URL settings are the Coach dev's to provide.

---

## Definition of done (Student track)

- [ ] Both apps log in with real Supabase Auth (cookie session, proxy); localStorage auth retired.
- [ ] All 6 student screens read/write real data; zero dynamic `studentData.ts` imports.
- [ ] `session.ts` runs multi-session; two pairs hold independent live classes; survives network drops.
- [ ] A brand-new DB story runs with zero code change (story key decoupled from the fixed 3).
- [ ] Speak/Write capture uploads to Storage and gets real AI feedback (live class + self-serve).
- [ ] All 15 stories served from the DB; bundled content demoted to fixtures.
- [ ] Student + live-class E2E green; joint end-to-end smoke passes.
- [ ] **Deployed:** student app live on `student.cueword.com` against production Supabase; real login/session works under HTTPS; student smoke (magic moment, lesson, submission, multi-session) passes on the live URL.
