# Coach Side — Step-by-Step Build Guide (for the agent)

> **What this is.** A detailed, ordered to-do list for the **Coach-side** developer/agent to take the
> Cueword live-class app from POC to pilot. It describes **what to build and why** at each step — the
> *idea*, the files to touch, the sub-steps, and how to know it's done. **No code here on purpose** —
> you (the agent) decide the implementation; this is the spec to implement against.
>
> Companion docs: [TWO_DEV_TASK_SPLIT.md](TWO_DEV_TASK_SPLIT.md) (the big picture + ownership),
> [Coach_Dev_Spec.docx](Coach_Dev_Spec.docx) (endpoint reference). The student side is in
> [STUDENT_BUILD_STEPS.md](STUDENT_BUILD_STEPS.md).

---

## How to use this file

- Work **top to bottom**. Each step lists what it **depends on** — don't start a step until its deps are met.
- Each step uses this shape: **Idea** (what/why) · **Touch** (files/areas) · **Do** (sub-steps) · **Done when** (acceptance).
- **🔗 = sync point.** At each, merge your branch into the shared integration branch and hand off anything the Student dev is waiting on. **One repo, track-named branches, PRs into the integration branch** — see [TWO_DEV_TASK_SPLIT.md](TWO_DEV_TASK_SPLIT.md) §2.5 for the repo/branch model.
- Through Day 7, verify locally with `npm run dev:coach` (port 3200) + the preview tools. **Day 8 deploys it** — the goal is deployment-ready, then live.

## Ground rules (read before you write anything)

1. **This is NOT the Next.js you know.** Before writing ANY Next.js code, read the relevant guide under `node_modules/next/dist/docs/`. Key facts: middleware is renamed to **Proxy** (`proxy.ts`, not `middleware.ts`); `cookies()` from `next/headers` is **async**; auth uses `@supabase/ssr`.
2. **Your ownership.** You own `apps/coach`, **all** `supabase/migrations/*` + seeds + views, the shared AI service `packages/core/src/lib/ai/claude.ts`, the new `apps/admin`, and tutor-stats.
3. **Do NOT touch** (Student dev owns): `packages/core/src/lib/session.ts`, `useActiveSession.tsx`, `useStoryContent.tsx`, and the auth client wiring (`supabase/client.ts`). Consume what they publish; request changes at a 🔗.
4. **`packages/core/src/lib/types.ts` is shared** — announce in the team channel before editing; land row-type additions at a 🔗.
5. **Additive only on the DB.** Never rename/drop/retype existing columns. New tables + new nullable columns only.

## Where you're starting from (current state — don't re-do these)

- The **live-class engine and the coach `/live` console are real** and work. Don't rebuild them.
- **All 9 coach screens are fully-built UI** rendering mock data from `apps/coach/data/coachData.ts`. Your job is to **swap mock → real DB**, not build screens.
- The **`zoom-notify`** feature (coach → Zoom chat on open-story/answer) is **already shipped** and graceful-degrades.
- **Marking does NOT persist** — in `apps/coach/app/(shell)/marking/[id]/page.tsx`, the score chips, feedback box, and assign-homework form are local React state with no save. You will wire persistence.
- **Auth is fake** (client-side `localStorage` vs `poc.config.json`), **RLS is permissive** (anon can read/write everything), **there is no AI** and **no admin app**.
- **Zoom link ownership:** the per-session Zoom link is **entered by the Admin** when scheduling (`class_sessions.zoom_link`). The coach side only **reads and opens** it — never creates or auto-generates it.

---

# DAY 1 — Foundation: real database, auth-scoped security, provisioning

**Goal of the day:** a real, secured database that the rest of the build stands on. Nothing real-data is safe until this lands.

### Step 1.1 — Decide and stand up the working database
- **Idea:** Pick the single database everything will use. The decided direction is the **additive design** that layers the tutored product onto the existing app DB (see [NEW_DB_SCHEMA.md](NEW_DB_SCHEMA.md)) — but production access may be blocked, so use a **staging clone** to start.
- **Touch:** Supabase project settings; `supabase/prod_app/0001_tutored_additive.sql` (the target migration).
- **Do:**
  1. Confirm with the human: production-Supabase access **or** approval to use a staging clone now (cut over later).
  2. Stand up the staging Supabase project.
  3. Decide the naming seam now so query names don't churn later: the authored stories table is `class_stories` (renamed from the app's `stories`), and `students.app_user_id` bridges to the app's users.
- **Depends on:** the human's go/no-go on DB access.
- **Done when:** a staging project exists and is reachable from the apps' env.

### Step 1.2 — Apply the additive production schema
- **Idea:** Create the full table surface (identity, curriculum, live class, submissions, attendance, homework, comms, stats, notifications, audit) on the staging DB.
- **Touch:** `supabase/prod_app/0001_tutored_additive.sql` (or the `0002` additive set as a fallback).
- **Do:** Apply the additive migration. Confirm the table count matches the design. Leave RLS permissive **for now** (you replace it in 1.3) so you don't lock yourself out mid-build.
- **Depends on:** 1.1.
- **Done when:** listing tables shows the full surface; the existing live demo still works (additive = nothing broke).

### Step 1.3 — Write the auth-scoped RLS migration (`0003`)
- **Idea:** Replace the permissive "anon can do anything" policies with real, role-aware row security so a student can only see their own data and a coach only their roster.
- **Touch:** `supabase/migrations/0003_rls.sql`.
- **Do:**
  1. Add SQL helper functions: "who am I" (`current_profile_id`), "what role am I" (`current_role`), `is_admin`, `is_coach_of(student)`, `is_parent_of(student)`, and a combined `can_view_student(student)` = self OR admin OR active coach OR parent.
  2. For every table, add policies: students read/write **own** rows; coaches read their **roster** + write coaching data (session position, marks, attendance, comms); admin = all; notifications = recipient only.
  3. Keep curriculum/content readable by any authenticated user **except** the answer keys (coach/admin only).
  4. Keep the realtime publication on the live-class tables.
- **Depends on:** 1.2, and the Student dev's auth wiring landing so a real session exists to test against (coordinate at the 🔗).
- **Done when:** the migration applies cleanly and the tests in 1.6 pass.

### Step 1.4 — Provision Supabase Auth users for the pilot
- **Idea:** Create real login identities for the seeded coach/student/admin and link them to their profile rows.
- **Touch:** Supabase Auth admin API (server-side, service-role); a small provisioning script or SQL.
- **Do:** Create auth users for the pilot profiles; set their profile's `auth_user_id` (and `students.app_user_id` where relevant). Don't log passwords anywhere.
- **Depends on:** 1.2.
- **Done when:** each seeded role can log in with real credentials once the Student dev's login is wired.

### Step 1.5 — Seed shared identities (profiles + enrollments)
- **Idea:** Both apps need the same people to exist. You own this shared seed.
- **Touch:** `supabase/seed/` (a coach + small roster + their enrollments).
- **Do:** Insert a coach, a handful of students, and the enrollments pairing them. Agree the exact shape with the Student dev (they map their `studentData.ts` against it).
- **Depends on:** 1.2.
- **Done when:** both apps see the same identities.

### Step 1.6 — RLS integration tests
- **Idea:** Prove the security actually isolates tenants — this is the gate for everything after.
- **Touch:** `tests/integration/rls.test.ts`.
- **Do:** Write tests that (a) a student cannot read another student's rows, (b) a coach can read their roster but not another coach's students, (c) answer keys are hidden from students.
- **Depends on:** 1.3, 1.4.
- **Done when:** the suite is green.

> **🔗 Day-1 sync.** Merge RLS + auth. Both apps log in as real users; cross-tenant denial proven. **Agree two things with the Student dev:** the `queries/*` convention and the exact seed shape for Days 2–3.

---

# DAY 2 — Coach app onto real data (begin)

**Goal:** the foundational query layer + the first half of the 9 screens reading real data.

### Step 2.1 — Build the coach query layer
- **Idea:** One file holds every typed, RLS-scoped read/write the coach screens use — replacing direct reads of `coachData.ts`.
- **Touch:** `packages/core/src/lib/queries/coach.ts` (new).
- **Do:** Create functions, one per screen need: dashboard bundle, tasks inbox, roster list, student detail, schedule, attendance, curriculum, marking queue, single submission, comms, profile. Each takes the coach/student id and returns exactly the shape the screen renders. Follow the same convention the Student dev agreed at the 🔗.
- **Depends on:** Day-1 🔗.
- **Done when:** a scratch call returns real rows for the seeded coach.

### Step 2.2 — KPI & attendance SQL views (`0004`)
- **Idea:** Pre-compute the aggregates the dashboard and attendance pages need so screens don't do N+1 queries.
- **Touch:** `supabase/migrations/0004_views.sql`.
- **Do:** Create views for coach load (students, sessions today, items to mark), attendance rates (present/late/absent per student and period), and accuracy. The query layer reads these.
- **Depends on:** 1.2.
- **Done when:** the views return correct numbers against the seed.

### Step 2.3 — Coach pilot seed
- **Idea:** Realistic data so the screens look real and the demo is convincing.
- **Touch:** `supabase/seed/coach.sql`.
- **Do:** Seed today's sessions, a few submissions (some awaiting marking), an attendance log, comms touches, and homework rows for the roster.
- **Depends on:** 1.2, 1.5.
- **Done when:** the seed loads and the screens below show plausible data.

### Step 2.4 — Dashboard on real data
- **Idea:** The landing screen shows real KPIs, today's sessions, and the prioritized tasks inbox.
- **Touch:** `apps/coach/app/(shell)/page.tsx`.
- **Do:** Replace mock reads with `queries/coach.ts`. KPI cards (total students, sessions today, items to mark, attendance %). Today's sessions panel. **Tasks inbox** = merge submissions + homework into one priority-ordered list (overdue → to-mark → to-assign → assigned → completed). The live hero is **already real** (it reads the live session via the Shell context) — leave it. Keep the time-gated Join behavior.
- **Depends on:** 2.1, 2.2, 2.3.
- **Done when:** numbers match the seed; tasks inbox rows deep-link correctly (marking → `/marking/[id]`, homework → `/roster/[id]`).

### Step 2.5 — Roster list + detail on real data
- **Idea:** The coach's people list and the per-student deep-dive.
- **Touch:** `apps/coach/app/(shell)/roster/page.tsx`, `roster/[id]/page.tsx`.
- **Do:** List all students (grouped by grade in the sidebar). Detail page: skill-levels table with the "app sync" column (does the coach-side level match the student app's), session history with notes, homework table.
- **Depends on:** 2.1.
- **Done when:** the detail page loads entirely from the DB.

### Step 2.6 — Schedule on real data
- **Idea:** The week grid of sessions.
- **Touch:** `apps/coach/app/(shell)/schedule/page.tsx`.
- **Do:** Render the Mon–Sun grid from `class_sessions`, the "NOW" current-time line, and the live-now callout (→ `/live`).
- **Depends on:** 2.1.
- **Done when:** real sessions render in the right slots.

> **🔗 Day-2 sync.** Confirm with the Student dev that every column they need exists in the migration; keep the `queries/*` pattern identical across both files.

---

# DAY 3 — Coach app onto real data (finish) + marking persistence

**Goal:** the remaining screens on real data, and the big missing piece — **marking actually saves**.

### Step 3.1 — Attendance on real data (with a working period filter)
- **Idea:** Attendance rates + heatmap, and the period toggle must actually change the data (today it's cosmetic).
- **Touch:** `apps/coach/app/(shell)/attendance/page.tsx`.
- **Do:** Read rates/heatmap from the `attendance` table + the `0004` view. Make week/month/term return **different** aggregates. Flag students below 95% in the sidebar.
- **Depends on:** 2.2.
- **Done when:** rates match the seed and toggling the period changes the numbers.

### Step 3.2 — Curriculum on real data
- **Idea:** The 3-terms × 8-levels × stories browser per student.
- **Touch:** `apps/coach/app/(shell)/curriculum/page.tsx`.
- **Do:** Read the curriculum hierarchy (`class_stories` / `curriculum_stories`). Per-story action by status: Teach-now (→ `/live`) for current, Preview for done, Unlock for locked.
- **Depends on:** 2.1.
- **Done when:** the per-student curriculum loads from the DB.

### Step 3.3 — Marking queue + item on real data
- **Idea:** The list of work to grade and the per-item view.
- **Touch:** `apps/coach/app/(shell)/marking/page.tsx`, `marking/[id]/page.tsx`.
- **Do:** Queue reads `submissions`. The item view shows the work (audio player for spoken work, body for written), the AI score card, the feedback box, and the assign-homework form. (Persistence is the next steps.)
- **Depends on:** 2.1.
- **Done when:** the queue and a single item load from the DB.

### Step 3.4 — Persist scores
- **Idea:** The per-criterion score chips currently live only in React state. Save them.
- **Touch:** `apps/coach/app/actions/marking.ts` (new server action); `marking/[id]/page.tsx`.
- **Do:** A server action that takes a submission id + the scores and writes them to the submission. Wire the chips to call it.
- **Depends on:** 3.3.
- **Done when:** scores survive a page reload.

### Step 3.5 — Send feedback (+ notify the student)
- **Idea:** "Send feedback" currently just flips a label. Make it persist and notify.
- **Touch:** `apps/coach/app/actions/marking.ts`; `marking/[id]/page.tsx`.
- **Do:** A server action that writes the coach feedback, sets the submission status to "sent", and inserts a notification row for the student.
- **Depends on:** 3.3.
- **Done when:** feedback survives reload **and** appears in the student app (verify at the 🔗).

### Step 3.6 — Assign homework
- **Idea:** The assign-homework form is wireframe-complete but a no-op.
- **Touch:** `apps/coach/app/actions/homework.ts` (new); `marking/[id]/page.tsx` and `roster/[id]/page.tsx`.
- **Do:** A server action that inserts a homework row (skill, type, description, due date) for the student. Wire both entry points.
- **Depends on:** 3.3.
- **Done when:** an assigned homework row appears in the DB and on the student's side.

### Step 3.7 — Mark attendance & log comms
- **Idea:** Small but needed writes.
- **Touch:** `apps/coach/app/actions/attendance.ts`, `apps/coach/app/actions/comms.ts` (new).
- **Do:** `markAttendance` upserts a present/late/absent/excused row for a session+student. `logComm` inserts a parent-comms row (channel, template, note).
- **Depends on:** 3.1.
- **Done when:** both writes persist and show on their screens.

### Step 3.8 — Comms + Profile on real data
- **Idea:** The last two screens.
- **Touch:** `apps/coach/app/(shell)/comms/page.tsx`, `profile/page.tsx`.
- **Do:** Comms reads the comms log + templates. Profile reads the coach's settings/identity. Remove the final mock imports.
- **Depends on:** 2.1.
- **Done when:** **zero dynamic imports from `coachData.ts` remain** (grep to confirm; keep it only as fixtures if anything still references it).

> **🔗 Day-3 sync.** Cross-check end-to-end through RLS: open a submission the **student actually created** and confirm your feedback reaches them.

---

# DAY 4 — Coach `/live` console on multi-session + admin-assigned Zoom

**Goal:** the coach console works for real, concurrent classes — joining the *right* session, not the one seeded row. **The Student dev owns `session.ts`; you consume the hook they publish by midday.**

### Step 4.1 — Rebuild the console on the multi-session hook
- **Idea:** Today the console watches one fixed session. It must resolve and join the session for *this* coach/class.
- **Touch:** `apps/coach/app/live/page.tsx` (consume only — do **not** edit `session.ts`).
- **Do:** Switch to the parameterized `useActiveSession(sessionId)` the Student dev ships. Keep the playbook, start/end class, and answer-mirroring behavior.
- **Depends on:** Student dev's midday handoff of the hook signature.
- **Done when:** the coach joins the correct session, not the seeded one.

### Step 4.2 — Driver / take-over edge cases
- **Idea:** Make take-over robust under contention.
- **Touch:** `apps/coach/app/live/page.tsx` (+ request any helper from `session.ts` via the 🔗).
- **Do:** Handle concurrent driver flips, observer lockout, and answer races so there's never a "double driver". Decide and persist what happens to the driver when the story changes (consider a coach default).
- **Depends on:** 4.1.
- **Done when:** rapid take-over/hand-back never leaves both sides driving.

### Step 4.3 — Open the admin-assigned Zoom link
- **Idea:** The link is entered by the **Admin** at scheduling time. The coach just opens it. **No link creation here.**
- **Touch:** `apps/coach/app/live/page.tsx`, dashboard, schedule.
- **Do:** Read `class_sessions.zoom_link` and open it from the Join button. If the admin hasn't set a link yet, show a clear "no Zoom link yet" empty state instead of a dead button.
- **Depends on:** the schema's `zoom_link` column (exists).
- **Done when:** Join opens the session's admin-set link; a missing link is handled gracefully.

### Step 4.4 — "Join the right session" links
- **Idea:** From the dashboard/schedule, clicking a session should join *that* session.
- **Touch:** `apps/coach/app/(shell)/page.tsx`, `schedule/page.tsx`.
- **Do:** Make session rows link to `/live?session=<id>`.
- **Depends on:** 4.1.
- **Done when:** clicking a specific session row joins that session.

### Step 4.5 — Multi-session E2E (co-write with Student dev)
- **Idea:** Prove two pairs can hold independent classes at once.
- **Touch:** `e2e/multi-session.spec.ts`.
- **Do:** Together with the Student dev, drive two student↔coach pairs simultaneously and assert they don't bleed into each other.
- **Depends on:** 4.1.
- **Done when:** the test passes for two concurrent pairs.

> **🔗 Day-4 sync.** Rebase on the Student dev's hook at midday. Co-write the multi-session E2E. **Do not edit `session.ts`.**

---

# DAY 5 — AI service + coach marking-assist 🔑 needs `ANTHROPIC_API_KEY`

**Goal:** a real, safe, structured AI scoring service that **both** apps use, plus the coach's AI marking draft. **You own the service; publish its shape early so the Student dev can build against it.**

### Step 5.1 — Add the SDK and the service skeleton
- **Idea:** One shared module is the only place that talks to Claude.
- **Touch:** add `@anthropic-ai/sdk` (not currently installed); `packages/core/src/lib/ai/claude.ts` (new).
- **Do:** Create the service module with a single configured client (latest Claude model). Use **tool-use / structured output** so scores come back as validated JSON, never free text you have to parse.
- **Depends on:** the API key being available (until then, build against a mocked response).
- **Done when:** a sample call returns a typed score object.

### Step 5.2 — Writing scorer
- **Idea:** Score a written submission against a rubric.
- **Touch:** `ai/claude.ts`.
- **Do:** A function that takes the text + a rubric spec and returns `{ overall, criteria: [{name, score, comment}], feedback }`.
- **Depends on:** 5.1.
- **Done when:** a real rubric comes back for a sample piece.

### Step 5.3 — Speaking scorer
- **Idea:** Same, for spoken work (from a transcript).
- **Touch:** `ai/claude.ts`.
- **Do:** A function that takes a transcript + rubric and returns the same shape.
- **Depends on:** 5.1; transcription is the Student dev's capture path (a transcript may be stubbed if no transcription provider key).
- **Done when:** a rubric comes back from a sample transcript.

### Step 5.4 — Coach marking-assist
- **Idea:** The "AI-ready" spark on a submission should pre-fill an editable draft for the coach.
- **Touch:** `ai/claude.ts` (a `draftMarking` function); `apps/coach/app/api/ai/mark/route.ts` (new route handler); `marking/[id]/page.tsx`.
- **Do:** A route that takes a submission id, asks the service for a draft, and returns it. Pre-fill the coach's feedback box with the draft; the coach edits, then sends (your Day-3 sendFeedback).
- **Depends on:** 5.2/5.3.
- **Done when:** opening an AI-ready submission pre-fills a draft the coach can edit.

### Step 5.5 — Publish the interface to the Student dev (handoff)
- **Idea:** The student app calls the same service. Lock the contract early so they don't wait.
- **Touch:** the exported function signatures + the score JSON shape.
- **Do:** First thing on Day 5, share the function names, inputs, and the exact score object shape; agree the Supabase Storage bucket + path convention for audio.
- **Done when:** the Student dev confirms the contract.

### Step 5.6 — Eval harness + kid-safety guardrails
- **Idea:** Don't ship un-evaluated AI to children.
- **Touch:** `tests/ai/eval.ts`; prompt/config in `ai/`.
- **Do:** Build a golden set + an LLM-as-judge check for scoring consistency. Add a system prompt that enforces age-appropriate, no-PII output; filter outputs; handle refusals safely.
- **Depends on:** 5.2/5.3.
- **Done when:** the eval suite passes a set threshold.

### Step 5.7 — Cost controls + observability
- **Idea:** Cap spend and watch it.
- **Touch:** `ai/`; PostHog instrumentation.
- **Do:** Add rate limiting, response caching where safe, max-token bounds, and usage logging via PostHog LLM analytics.
- **Depends on:** 5.1.
- **Done when:** spend is capped and visible in PostHog.

> **🔗 Day-5 sync.** Confirm the Student dev is building against your published interface; agree the Storage bucket/path.

---

# DAY 6 — Admin app + tutor-stats (the crunch day)

**Goal:** an admin can provision a whole pilot pair end-to-end, and external tutor reporting exists. **Heavy day — protect the seam with the Student dev's content migration.**

### Step 6.1 — Scaffold the admin app
- **Idea:** A new single-role app for provisioning. The old admin lives in git history pre-split — crib from it.
- **Touch:** `apps/admin` (new app: shell, admin-role login, `proxy.ts`).
- **Do:** Scaffold the app mirroring the auth pattern the Student dev built on Day 1. Gate every route to admins.
- **Depends on:** Day-1 auth.
- **Done when:** an admin logs in; non-admins are blocked.

### Step 6.2 — Manage people / invite
- **Idea:** Create students, coaches, parents — each invite creates an auth user + a profile.
- **Touch:** `apps/admin` screens; `apps/admin/app/api/admin/users/route.ts` (server-only, service-role).
- **Do:** A route that creates the auth user, inserts the linked profile, and triggers an invite email (per the decided login model: the system generates a login email + password and emails the **parent's** contact address — see the project memory). Never log passwords.
- **Depends on:** 6.1.
- **Done when:** inviting a person creates a working login.

### Step 6.3 — Manage enrollments
- **Idea:** Pair a student with a coach and a plan.
- **Touch:** `apps/admin/app/actions/enrollments.ts`.
- **Do:** Create/update enrollment rows (student, coach, plan, status, start date).
- **Depends on:** 6.2.
- **Done when:** a pairing shows up for both the coach and the student.

### Step 6.4 — Scheduling + **enter the Zoom link**
- **Idea:** The admin creates class sessions **and types in the Zoom meeting URL** for each (this is where the link comes from).
- **Touch:** `apps/admin/app/actions/sessions.ts`; scheduling UI.
- **Do:** Create `class_sessions` rows (single + recurring slots). The form includes a **Zoom link field** that writes `class_sessions.zoom_link`. (The coach console from Day 4 just reads this.)
- **Depends on:** 6.3.
- **Done when:** a scheduled session carries the admin-entered Zoom link, and the coach/student can open it.

### Step 6.5 — Assign / sequence stories
- **Idea:** Decide which stories a student gets and in what order.
- **Touch:** `apps/admin/app/actions/assign.ts`.
- **Do:** Write assignment rows linking students to stories/curriculum slots. **This reads the Student dev's migrated stories** — agree the story row shape first thing (see the 🔗).
- **Depends on:** 6.4; the Student dev's content migration shape.
- **Done when:** an assigned story shows up in the student's "My Stories".

### Step 6.6 — Provisioning audit log
- **Idea:** Append-only record of who provisioned what (needed for compliance).
- **Touch:** an audit helper called on every admin mutation.
- **Do:** On each create/update, write an audit row (actor, action, entity, summary/diff). Never store secrets.
- **Depends on:** 6.2.
- **Done when:** every admin action leaves an audit trail.

### Step 6.7 — Tutor-stats views
- **Idea:** The numbers the external tutor report needs.
- **Touch:** `supabase/migrations/0005_stats_views.sql`.
- **Do:** Views for hours taught, sessions, attendance, outcomes, and rating **per tutor**.
- **Depends on:** real session/attendance data.
- **Done when:** the views return correct per-tutor numbers.

### Step 6.8 — Tutor-stats dashboard
- **Idea:** A readable dashboard over those views.
- **Touch:** the stats app/route + an endpoint like `apps/.../api/stats/tutors/route.ts`.
- **Do:** Charts, filters, and date ranges over the `0005` views.
- **Depends on:** 6.7.
- **Done when:** stats render with working filters.

### Step 6.9 — Export
- **Idea:** Let people take the data out.
- **Touch:** an export endpoint `.../api/stats/export/route.ts`.
- **Do:** CSV + PDF export of the current view.
- **Depends on:** 6.8.
- **Done when:** both formats download correctly.

### Step 6.10 — Scoped third-party access
- **Idea:** The external party should see **only** the stats, read-only.
- **Touch:** RLS/role + a scoped token.
- **Do:** A separate read-only role/token that exposes only the stats views.
- **Depends on:** 6.7.
- **Done when:** the scoped token can read stats and nothing else.

> **🔗 Day-6 sync.** **First thing:** agree the `stories` / `class_stories` row shape with the Student dev — your story-assignment reads their migrated content. This is the day most likely to slip; protect this seam.

---

# DAY 7 — Polish, tests, hardening (no deploy)

**Goal:** harden every coach + admin surface and prove it end-to-end.

### Step 7.1 — States everywhere
- **Idea:** No raw spinners or blank screens.
- **Touch:** all coach + admin screens.
- **Do:** Add loading skeletons, empty states, and error boundaries with human copy.
- **Done when:** every screen has a sensible loading/empty/error state.

### Step 7.2 — Timezone correctness
- **Idea:** Coach is in Manila; students are in the US. Times must be right for each.
- **Touch:** schedule, dashboard, live, attendance.
- **Do:** Store UTC; render in the viewer's timezone. Verify the coach sees Manila time and the converted student time where shown.
- **Done when:** times match per user.

### Step 7.3 — Accessibility
- **Idea:** Keyboard + screen-reader basics.
- **Touch:** all coach + admin screens.
- **Do:** Keyboard nav, focus management, ARIA labels, contrast. Run an axe check on the key flows.
- **Done when:** axe is clean on the main flows.

### Step 7.4 — Coach + admin E2E
- **Idea:** Automate the critical paths.
- **Touch:** `e2e/`.
- **Do:** Cover login, marking-saves-and-notifies, admin provisions a pair, and the coach live console.
- **Done when:** the suites are green.

### Step 7.5 — Observability
- **Idea:** See what's happening in the pilot.
- **Touch:** instrumentation across coach + admin.
- **Do:** PostHog funnels (join → magic-moment → complete), error tracking, Supabase alerts.
- **Done when:** events flow into PostHog.

### Step 7.6 — Coach notifications
- **Idea:** In-app notifications for the coach.
- **Touch:** the notifications read path + the writes you already added (e.g. on feedback).
- **Do:** Surface in-app notifications; add email reminders where useful.
- **Done when:** a notification fires and is visible.

> **🔗 Day-7 sync.** Joint smoke of the whole flow with the Student dev: **admin provisions → coach schedules (with Zoom link) → student joins → live class → coach marks → AI feedback.** Now it's deploy-ready — Day 8 ships it.

---

# DAY 8 — Deployment (make it live)

**Goal:** the production database is real and secured, and the coach + admin + tutor-stats apps run on real domains. **You own the backend cutover and the server-side secrets** (the risky bits); the Student dev deploys the student app. Per [DEPLOY.md](../DEPLOY.md), this is a monorepo → **one Vercel project per app** (Root Directory set per app); `@cueword/core` is shared, not deployed on its own.

### Step 8.1 — Production Supabase cutover
- **Idea:** Move from the staging clone to the real production database, with the full secured surface.
- **Touch:** the production Supabase project; `supabase/migrations/*`.
- **Do:** Apply the additive schema + `0003` auth-scoped RLS + `0004`/`0005` views to **production**. Turn on the realtime publication for the live-class tables (and submissions/notifications). Create the audio **Storage bucket + its access policies**. Confirm RLS is the **auth-scoped** set, **not** permissive. Add the production app domains to Supabase Auth's allowed **site/redirect URLs** (coordinate with the Student dev — their login needs this).
- **Depends on:** Day-7 green; production-Supabase access.
- **Done when:** prod has the full secured schema, realtime on, storage ready, and the prod domains are allowed in Auth.

### Step 8.2 — Provision the real pilot cohort via the admin app
- **Idea:** Create real pilot data through the admin UI (not by hand-editing SQL).
- **Touch:** the deployed admin app.
- **Do:** Provision the pilot coaches/students/parents, enrollments, scheduled sessions **with their Zoom links**, and story assignments. The audit log records it.
- **Depends on:** 8.1, and the admin app deployed (8.3).
- **Done when:** a real pilot pair exists in prod, created through the admin UI.

### Step 8.3 — Create the coach + admin (+ stats) Vercel projects
- **Idea:** One Vercel project per app, imported from the same repo. (DEPLOY.md already covers coach on its account; admin + stats likely sit on the same account.)
- **Touch:** Vercel; `apps/coach/vercel.json`, `apps/admin/vercel.json`.
- **Do:** Import the repo once per app with **Root Directory** = `apps/coach`, then `apps/admin`, then the stats app (or host stats as a route inside admin). Leave build/install at defaults (the workspace auto-detects; if a build can't find `@cueword/core`, enable "Include files outside the Root Directory"). Add domains (`coach.cueword.com`, an admin subdomain, a stats subdomain) + CNAMEs.
- **Depends on:** Day-7 green.
- **Done when:** each project builds and resolves `@cueword/core`.

### Step 8.4 — Server-side secrets & env (keep the dangerous keys server-only)
- **Idea:** Set production env per app; never leak secrets to the client bundle.
- **Touch:** Vercel env settings per project.
- **Do:** Set `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the **same production** project) on every app. On **admin**: `SUPABASE_SERVICE_ROLE_KEY` (server-only — **never** `NEXT_PUBLIC_`) + the transactional email provider key (for invites). On **coach**: the Zoom creds (`ZOOM_ACCOUNT_ID` + client id/secret, for the zoom-notify chat) + `ANTHROPIC_API_KEY` (for marking-assist). Keep **staging vs production** env separated. Remember `NEXT_PUBLIC_*` are inlined at build time — redeploy after any change.
- **Depends on:** 8.3.
- **Done when:** each app has exactly the env it needs and the client bundle contains **no** service-role/secret keys.

### Step 8.5 — Coach + admin smoke on the live URLs
- **Idea:** Prove it works in production, not just locally.
- **Touch:** the deployed coach + admin (+ stats) URLs.
- **Do:** Log in as a real coach and admin on the real domains. Provision a pair (admin). Mark a submission and confirm feedback **persists + notifies** the student. Confirm tutor-stats + export render. Confirm zoom-notify + AI marking-assist work (or degrade cleanly) with the prod creds.
- **Depends on:** 8.1–8.4.
- **Done when:** the coach + admin critical paths pass on the live URLs.

### Step 8.6 — Runbook + reset/seed + monitoring
- **Idea:** Make it operable for the pilot.
- **Touch:** `docs/` (a runbook); a reset/seed script.
- **Do:** Write a short runbook (env vars per app, how to provision, how to reset demo state, the monitoring board) and a one-command pilot reset/seed. Confirm the PostHog funnels + error tracking from Day 7 are reporting from production.
- **Depends on:** 8.5.
- **Done when:** a teammate can reset + re-provision from the runbook, and prod telemetry is flowing.

> **🔗 Day-8 sync (joint production smoke).** With the Student dev, run the whole flow **on the live domains**: admin provisions → coach schedules (Zoom link) → student joins on `student.cueword.com` → live class → coach marks on `coach.cueword.com` → AI feedback → student sees it. **That is "deployed and shipped."**

**Deployment external deps (queue early):** Vercel access (both accounts per DEPLOY.md), production-Supabase access, DNS control of the `cueword.com` zone, `ANTHROPIC_API_KEY`, Zoom creds, and a transactional email provider key (for admin invites).

---

## Definition of done (Coach track)

- [ ] All 9 coach screens read/write real data; zero dynamic `coachData.ts` imports.
- [ ] Marking persists: scores, feedback (with student notification), and homework survive reload.
- [ ] `0003` RLS proven by tests; auth users provisioned; staging DB stands up.
- [ ] Coach `/live` runs on multi-session and **opens the admin-assigned Zoom link**.
- [ ] AI service returns structured, evaluated, guardrailed scores; marking-assist drafts feedback.
- [ ] Admin app provisions a full pilot pair (including its Zoom link); tutor-stats dashboard + export live.
- [ ] Coach + admin E2E green; joint end-to-end smoke passes.
- [ ] **Deployed:** production Supabase cutover done (auth-scoped RLS, views, realtime, storage); coach + admin + stats apps live on their domains with server-only secrets; coach/admin smoke passes on the live URLs; runbook + reset/seed + prod telemetry in place.
