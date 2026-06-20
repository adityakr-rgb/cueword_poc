# Cueword × Edge — Two-Dev Task Split (Coach dev ‖ Student dev)

**Audit-grounded** division of the production build between **two developers** working in parallel:

- **Track C — Coach dev** — owns `apps/coach`, the DB/migrations/RLS/views, the AI service, the admin app, tutor-stats.
- **Track S — Student dev** — owns `apps/student`, the shared live-class engine (`packages/core/src/lib/session.ts`), content migration, student-facing AI capture.

Written 2026-06-18 from a file-by-file audit of the actual code (not the older `BUILD_PLAN.md` /
`PRODUCTION_TIMELINE.md`, which predate the recent work and overstate some "done" items). This doc
**supersedes** the split in `PRODUCTION_TIMELINE.md`.

---

## 0. The real starting line (what the code actually is *today*)

The audit corrected several assumptions in the older docs. Build on these facts, not the docs:

| Area | Actual state today | Implication for the split |
|---|---|---|
| **Live-class engine** (`session.ts` sync, `LiveClass`/`LessonCanvas`/`StageCard`/`QuestionView`, 8 question types, `CoachPlaybook`, driver/take-over, answer mirroring) | ✅ **Real & production-wired** | Don't rebuild. Harden + multi-session only. |
| **All 9 coach screens + 6 student screens** | ✅ **Fully-built UI shells** on `coachData.ts` / `studentData.ts` / `storyLib.ts` mock | Work = swap mock→DB via a query layer, **not** building screens. |
| **`zoom-notify`** (coach → Zoom chat on open-story/answer) | ✅ **Shipped**, graceful-degrades w/o `ZOOM_ACCOUNT_ID` (`apps/coach/app/api/zoom-notify/route.ts`, `lib/zoomNotify.ts`) | Done. Coach dev just needs creds wired in env. |
| **Speaking capture** (`SpeakRecorder`, core + self-serve `/story`) | ⚠️ **Real `MediaRecorder`**, but the blob is **never uploaded/persisted** | Student dev: add Storage upload + `submissions` write. |
| **`@supabase/ssr`** + `supabase/server.ts` + `dal.ts` (`verifySession`/`getCurrentProfile`/`requireRole`) | ⚠️ **Installed & written, but UNUSED** by any app | Auth wiring is a wiring job, not a from-scratch job. |
| **Browser client** (`supabase/client.ts`) | ❌ still `createClient` + `persistSession:false` | Must become `createBrowserClient` (cookie session) for real auth. |
| **`proxy.ts` (Next 16 middleware replacement) / server actions / login** | ❌ none exist; login is client-side `validateLogin` vs `poc.config.json` + `localStorage` | Greenfield auth-client wiring (Student dev owns, both apps). |
| **Story content** | ❌ Live class runs from **bundled** `GRADE_STORIES` (3 stories: K/G3/G6, `stories.ts`); student self-serve runs from **bundled** `storyLib.ts` (12 stories). `stories.content` jsonb is **null/empty**. `fetchStoryContent` is DB-first w/ bundled fallback. `seed:content` script **exists** (`packages/core/scripts/seed-story-content.mts`) but isn't run. | Content migration is a real task; the pipeline is half-built. |
| **`StoryKey`** | ❌ still a 3-value union `"K"\|"G3"\|"G6"` (`types.ts:8`); `BAND`/`CL_KID` still hardcoded (`lesson.ts`). The `STORIES_SCALING_PLAN.md` refactor is **NOT done**. | Decouple-from-3-stories refactor is still pending (Student dev). |
| **Multi-session** | ❌ Hardcoded `SESSION_ID` (`config.ts:29`, `useActiveSession.tsx`, both `/live`); `AUTO_STORY` (`student/app/live/page.tsx:19`) | The centerpiece refactor (Student dev owns `session.ts`). |
| **Marking persistence** | ❌ `marking/[id]` score chips / feedback / assign-homework are **local-state only** (no save) | Coach dev wires server actions + DB writes. |
| **DB schema** | `0001_init` **applied** (7 tables, permissive RLS). `0002_production_schema` **written, NOT applied** (additive 13 tables, still permissive). No `0003` RLS / `0004` views / `0005` stats exist. | Coach dev owns all migrations. **See §1 — the DB target is the open decision.** |
| **Real AI** | ❌ none — `@anthropic-ai/sdk` not installed; `ai_score` columns defined but never written | Coach dev owns the service; Student dev owns capture/UI. |
| **Admin app / tutor-stats** | ❌ none (`apps/admin` absent) | Coach dev (greenfield). |

**One-line summary:** the *engine* is done; the *product around it* is built-but-mock. The job is
(1) real auth + RLS, (2) every screen mock→DB, (3) multi-session, (4) real AI, (5) admin + content +
stats — split cleanly down the coach/student seam, with `packages/core` and `supabase/` as the only
contended zones.

---

## 1. ⚠️ The one decision to make before Day 1 — which database?

There are **four** schema targets on disk. This must be resolved before anyone writes a migration:

1. `supabase/migrations/0001_init.sql` — **applied** POC schema (7 tables, permissive).
2. `supabase/migrations/0002_production_schema.sql` — additive 13 tables, **written, not applied**, still permissive, in the **POC** project.
3. `supabase/0001_production_schema.sql` — an 837-line **greenfield multi-tenant** alternative (separate project, `org_id` everywhere). 
4. `supabase/prod_app/0001_tutored_additive.sql` — **862-line additive** migration: 38 new tables alongside the **14 frozen production self-learn app tables**, in the **production** Supabase project, with the `class_stories` rename + `students.app_user_id` bridge.

**The decided direction (per the `cueword-db-merge-decision` memory + `docs/NEW_DB_SCHEMA.md`)** is **#4**:
one production database, additive. **But it is blocked** — there is currently **no access to the
production Supabase project**.

**Recommendation (proceed without blocking):** Coach dev stands up a **staging Supabase project** and
applies the `prod_app` additive migration (#4) there as the working target now; cut over to the real
production project the moment access lands. This unblocks both tracks on Day 1 while keeping the final
DB design correct. (If staging-of-the-additive-design proves heavy, fall back to applying `0002` on the
POC project for the pilot and treat the additive merge as the post-pilot step — but the `class_stories`
/ `app_user_id` seam should be decided **now** so query-layer names don't churn.)

> **Action for the human (queue today):** grant production-Supabase access **or** bless the staging
> clone. Everything real-data depends on this.

---

## 2. Ownership model & the coordination contract

The apps are conflict-free by construction (`apps/coach` vs `apps/student`). **All merge risk lives in
two shared zones** — `packages/core` and `supabase/`. The contract:

| Shared zone | Single owner | Rule |
|---|---|---|
| `packages/core/src/lib/session.ts` + `useActiveSession.tsx` + `useStoryContent.tsx` (the sync engine) | **Student dev** | Only S edits these. C consumes the published interface. S ships interface changes at the 🔗 sync point, not mid-day. |
| `packages/core/src/lib/supabase/{client,server}.ts` + `dal.ts` (auth plumbing) | **Student dev** (client wiring) | C reviews; both apps depend on it, so land it at Day-1 🔗. |
| `supabase/migrations/000x` (RLS, views, stats) | **Coach dev** | Only C writes migrations. S requests columns/tables via the 🔗 sync; C adds them. |
| `packages/core/src/lib/types.ts` | **Coordinate** | Either may edit, but **announce in the shared channel before editing** and land at a 🔗 sync. Most churn here is C's row types + S's `StoryKey = string`. |
| `packages/core/src/lib/stories.ts` + content seed | **Student dev** | Owns content migration. |
| `packages/core/src/components/*` (LiveClass family) | **Student dev** (engine) for `LiveClass`/`LessonCanvas`/`StageCard`/`QuestionView`; **Coach dev** for `CoachPlaybook` | These rarely collide; the playbook is coach-only. |
| `poc.config.json` / `lib/config.ts` | **Student dev** (it gates the live engine) | Retired as auth/multi-session land. |

**Process rules**
1. Work on `apps/student` (S) and `apps/coach` (C) freely — never blocks the other.
2. Touch a shared-zone file **only if you own it**; otherwise file a request at the next 🔗 sync.
3. **Merge to a shared integration branch at every 🔗 sync point** (minimum: end of each day).
4. `types.ts` edits are announced first. Keep it import-clean (no `any`, no app-only imports).

---

## 2.5 · Repository & branch model — ONE repo, both devs contribute

**Decision: a single shared repo. Do NOT create a second repo per dev.**

This is already an **npm-workspaces monorepo** (`apps/*`, `packages/*`) on GitHub at
`adityakr-rgb/cueword_poc` (default branch `poc/two-app-split`). Both apps import the shared
`@cueword/core` package via the workspace link; splitting into two repos would break that (you'd have
to publish the package or use submodules — needless overhead for a 2-dev, ~50-user pilot). Vercel also
deploys **every** app from this **one** repo by setting a different **Root Directory** per project
(`apps/student`, `apps/coach`, `apps/admin`) — even across two Vercel accounts (see [DEPLOY.md](../DEPLOY.md) §1).

**How the two devs collaborate in the one repo:**

1. **Access.** Add the second dev as a **Collaborator** on the repo (GitHub → Settings → Collaborators), or move the repo into a GitHub **org**. They clone the same repo.
2. **Integration branch.** Pick one long-lived merge target — promote `main` or cut `prod/pilot` from the current tip (so the planning docs come along). This is what every 🔗 sync merges into. **Protect it:** require a PR + 1 review before merge.
3. **Track-named feature branches.** Coach dev: `coach/day1-rls`, `coach/day3-marking`, … · Student dev: `student/day1-auth`, `student/day4-multisession`, …
4. **PRs into the integration branch, merged at each 🔗** (end of each day minimum). The path-based ownership above means the two devs almost never edit the same file, so conflicts are rare.
5. **`CODEOWNERS` (recommended)** to enforce the ownership table mechanically — auto-routes reviews and guards the shared zones: `session.ts`/`useActiveSession*`/`supabase/client.ts` → **Student**; `supabase/**` + `lib/ai/**` → **Coach**; `apps/coach/**` → **Coach**; `apps/student/**` → **Student**; `lib/types.ts` → **both** (forces the "announce before editing" rule into a required dual review).

> **Flow in one line:** one repo → one protected integration branch → each dev on track-named branches → PRs merged at the daily 🔗 → Vercel builds each app from its Root Directory.

---

## 3. The sequential spine (what gates what)

```
Day 1  Auth + RLS + staging DB  ── (both tracks build this together) ──┐
          │  nothing real-data is safe until this lands                │
          ▼                                                            │
Day 2–3  Every screen mock → DB  (S: 6 student screens · C: 9 coach)   │  fully parallel
          │                                                            │
          ▼                                                            │
Day 4  Multi-session refactor  (S owns session.ts; C consumes by noon) │  S is the long pole
          │  real concurrent classes                                   │
          ▼                                                            │
Day 5  Real AI  (C: service + marking-assist · S: capture + UI)        │  C delivers interface early
          │                                                            │
          ▼                                                            │
Day 6  Admin + content + stats  (C: admin app + stats · S: content)    │  the crunch day
          │                                                            │
          ▼                                                            │
Day 7  Polish · tests · hardening  (both)                              │
          │                                                            │
          ▼                                                            │
Day 8  Deployment  (C: Supabase cutover + coach/admin/stats + secrets; │  ship to live domains
       S: student app + auth-on-domain) → joint production smoke       │
```

Dates (from `PRODUCTION_TIMELINE.md`): **Start Thu Jun 18 · Holiday Sun Jun 21 · Day-7 finish Thu Jun 25**,
then **Day 8 = deployment** (~half a day). Deployment is now **in scope** — the goal is shipped, not just locally verified.

---

## 4. Day-by-day split

Each task names **what → files → verify**. 🔗 = mandatory merge/handoff. 🔒 = external dependency.

### DAY 1 (Thu Jun 18) — Foundation: real auth + RLS + staging DB
*Both tracks on the spine. Nothing real-data proceeds until the 🔗 lands.*

| Track S — Student dev | Track C — Coach dev |
|---|---|
| **Browser client → cookie session.** Rewrite `supabase/client.ts` from `createClient`(`persistSession:false`) to `createBrowserClient` (`@supabase/ssr`, already installed). *Verify:* session survives reload. | **Decide + apply schema (§1).** Stand up staging Supabase; apply the `prod_app` additive migration (or `0002` fallback). *Verify:* `list_tables` shows the full surface. |
| **`proxy.ts` per app** (Next 16 — **not** middleware; read `node_modules/next/dist/docs/`). Refresh session + optimistic redirect of logged-out `/` → `/login`, both apps. *Verify:* logged-out hit on `/` redirects. | **Migration `0003` — auth-scoped RLS.** Replace permissive policies. SQL helpers `is_admin()`, `is_coach_of(student)`, `can_view_student()`, `current_profile_id()`. Student=own rows; coach=roster; admin=all. *Verify:* see RLS tests. |
| **Login/logout Server Actions** (`app/actions/auth.ts`, both apps): `signInWithPassword` + form with `useActionState` error states; `signOut()` wired to existing Shell logout buttons. *Verify:* real login for a seeded user. | **RLS integration tests** (`tests/integration/rls.test.ts`): cross-tenant denial + coach-roster access. *Verify:* student A cannot read student B. |
| **Retire `localStorage` auth.** Identity from session/DAL (`dal.ts.getCurrentProfile`), not "first of role". Update both Shells + gated layouts; keep `useCurrentUser` API shape if cheap. *Verify:* identity = signed-in user. | **Provision Auth users** for pilot profiles; link `profiles.auth_user_id` (or `students.app_user_id` per §1 seam). Seed shared `profiles`/`enrollments`. *Verify:* each role logs in. |

**🔗 Day-1 sync (end of day):** merge auth + RLS to integration branch. Both apps log in as real seeded
users; cross-tenant denial proven. **Agree the `lib/queries/*` convention + the seed shape** for Days 2–3.

---

### DAY 2 (Fri Jun 19) — Apps onto real data (begin) — fully parallel
*Foundational query layer first, then per-screen.*

| Track S — Student dev | Track C — Coach dev |
|---|---|
| **`packages/core/src/lib/queries/student.ts`** — typed reads/writes per screen. **Student pilot seed** mapping `studentData.ts` → tables. | **`packages/core/src/lib/queries/coach.ts`** + **KPI/attendance SQL views** (`0004_views.sql`). **Coach pilot seed** (roster, today's sessions, submissions, attendance, comms, homework). |
| **Home** (`(shell)/page.tsx`) → next class (`class_sessions`), skills (`progress`), vocab warmup, flagged items, workouts preview, resume. Keep the NetCheck→Zoom+`/live` seam, opening the **session's `zoom_link` (admin-assigned)** rather than the static config link. *Verify:* renders real rows; Join opens the session's link. | **Dashboard** (`(shell)/page.tsx`) → live hero (already real via `useLiveSession` ✓), time-gated Join, KPI cards, today's sessions, **tasks inbox** (merge submissions+homework, priority-ordered). *Verify:* real KPIs. |
| **My Stories** (`lessons`) → `curriculum_stories`/`class_stories` + `assignments` + stories; level/term lock + progress. *Verify:* locked/done states correct. | **Roster** (`roster` + `/[id]`) → list + grade groups; detail: skill table (+ app-sync col), session history, homework. *Verify:* detail loads from DB. |
| **My Workouts** (`workouts`) → DrillRunner writes `drill_attempts`; **wrong answer → `flagged_items`** (currently only in-memory); CoachDrill → `submissions(awaiting)`. *Verify:* a wrong drill answer shows up flagged in the DB. | **Schedule** (`schedule`) → `class_sessions` week grid + NOW line + live callout. *Verify:* real sessions render in the grid. |

**🔗 Day-2 sync:** query-layer pattern consistent across both `queries/*` files; shared profiles/enrollments seed stable; C confirms any columns S needs exist in the migration.

---

### DAY 3 (Sat Jun 20) — Apps onto real data (finish) — fully parallel
*Sun Jun 21 is the holiday — plan around it.*

| Track S — Student dev | Track C — Coach dev |
|---|---|
| **Schedule** (`schedule`) → `class_sessions` (2/week cap, 4h-cancel rule → `cancelled_at`, tz convert). *Verify:* cancel locks <4h before start. | **Attendance** (`attendance`) → `attendance` table + view; period toggle actually filters; <95% flags. *Verify:* rates match seed; toggle changes aggregates. |
| **My Progress** (`progress`) → `student_stats` (belt/points/KPIs), `milestones`, feedback (`submissions.coach_feedback`). *Verify:* belt ring = real %. | **Curriculum** (`curriculum`) → `curriculum_stories`/`class_stories` (3T×8L), Teach-now → `/live`. *Verify:* per-student curriculum loads. |
| **My Portfolio** (`works`) → `portfolio_items` / `artifacts` (filter, modals, audio player). *Verify:* items from DB. | **Marking** (`marking` + `/[id]`) → queue from `submissions`; **persist** score chips + feedback (→ `coach_feedback` + status `sent` + notify) + assign-homework (→ `homework`). *Verify:* feedback survives reload + appears in student app. |
| **Done:** zero dynamic `studentData.ts` imports. | **Comms** → `comms_log`/`comms_templates`; **Profile** → `coach_meta`. **Done:** zero dynamic `coachData.ts` imports. |

**🔗 Day-3 sync:** both apps on real data. **Cross-check:** coach opens a submission the student actually
created (proves the seam end-to-end through RLS).

---

### DAY 4 (Mon Jun 22) — Live class & multi-session (the centerpiece)
*Student dev owns `session.ts` today; ships the new hook signature by **midday** so Coach dev can consume it.*

| Track S — Student dev (owns `session.ts`) | Track C — Coach dev (coach console) |
|---|---|
| **Multi-session refactor.** Stop watching fixed `SESSION_ID`. `useActiveSession(sessionId)` resolves the session **per logged-in user/enrollment**; `subscribeSession` keyed by that id. Drop `config.SESSION_ID` as the source of truth. *Verify:* two enrollments run independent classes at once. | **Coach `/live` console on the new hook.** Consume `useActiveSession(sessionId)`. Keep playbook, start/end, take-over. *Verify:* coach joins the *correct* session, not the seeded one. |
| **Story-from-session, not constant.** Replace `AUTO_STORY` (`student/app/live/page.tsx:19`) with the story assigned to *this* session (`class_sessions.story_id`/`story_key`). Do the `STORIES_SCALING_PLAN` refactor: `StoryKey = string`, delete `BAND`/`CL_KID` → `bandFor(story)`, update `LessonCanvas`/`CoachPlaybook`. *Verify:* a brand-new DB story runs with **zero** code change. | **Driver / take-over edge cases** — concurrent driver flips, observer lockout, answer races; persist driver across story changes (consider `coach_meta.default_driver`). *Verify:* no double-driver under contention. |
| **Realtime resilience** — reconnect, presence, late-join hydration, mid-lesson refresh, channel-error handling in `subscribeSession`/`subscribeSessionEvents`. *Verify:* kill+restore network, state intact. | **Open the admin-assigned Zoom link** — read `class_sessions.zoom_link` (the **Admin** enters the meeting URL when scheduling; coach does **not** create or auto-generate it) on the console + Join button. *Verify:* Join opens the session's admin-set link; missing link shows a clear "no link yet" state. |
| **Bound `session_events` reads** — the demo hit 154 rows; add pagination/cursor + indexes. **Join routing** `/live?session=…` from Home/Schedule. *Verify:* event reads paginated; student lands in own session. | **"Join the right session" links** from coach Dashboard/Schedule (→ `/live?session=`). *Verify:* clicking a session row joins that session. |

**🔗 Day-4 sync:** S publishes `useActiveSession(sessionId)` **by midday**; C rebases on it. Write the
**multi-session cross-origin E2E** (`e2e/multi-session.spec.ts`, two pairs) **together**. Only S edits
`session.ts` today.

---

### DAY 5 (Tue Jun 23) — Real AI (Claude) 🔒 `ANTHROPIC_API_KEY`
*Coach dev delivers the service interface + `ai_score` shape **early** so Student dev builds against it.*

| Track S — Student dev (student-facing AI) | Track C — Coach dev (AI service + coach) |
|---|---|
| **Real capture → Storage.** Wire `SpeakRecorder` blob (already records) → Supabase Storage; signed URLs + storage RLS (owner/coach only). *Verify:* audio uploads; only owner/coach can fetch. | **AI service** `packages/core/src/lib/ai/claude.ts` — Anthropic SDK (latest Claude), **tool-use structured output** for rubric JSON. *Verify:* typed score returns for a sample. |
| **Writing/speaking feedback UI** → Route Handler `app/api/ai/writing/route.ts` (+ speaking) → `submissions.ai_score`; render the real rubric. Wire self-serve `/story` speak/write to the same service. *Verify:* real rubric on a sample submission. | **Coach marking-assist** — AI draft on submit (the "AI-ready" spark in `marking/[id]`); coach edits → sends. *Verify:* draft pre-fills the feedback box. |
| (Speaking transcription 🔒 may need a 2nd provider key — stub the transcript if absent, keep the audio+score path.) | **Eval harness + kid-safety guardrails** (golden sets, LLM-as-judge, age-appropriate system prompt, PII filter, refusal handling) + **cost controls** (rate limit, cache, max-tokens) + PostHog LLM analytics. *Verify:* eval suite passes threshold; spend capped + tracked. |

**🔗 Day-5 sync:** C delivers `claude.ts` interface + `ai_score` shape first thing; S builds the UI
against it. Agree the Storage bucket + path convention.

---

### DAY 6 (Wed Jun 24) — Admin + content + stats (the crunch)
*Heaviest day for both. C builds the admin app + stats; S migrates content.*

| Track S — Student dev (content) | Track C — Coach dev (admin + stats) |
|---|---|
| **Content migration.** Run/extend `seed:content` (`packages/core/scripts/seed-story-content.mts`) to push `GRADE_STORIES` (3) + `storyLib.ts` (12) → `stories.content` / `class_stories` + `story_sections`/`questions`/`story_vocab`. *Verify:* DB carries all 15 stories. | **Scaffold `apps/admin`** — new app, admin-role auth + `proxy.ts` + shell (crib the removed admin from git history). *Verify:* admin logs in; non-admin blocked. |
| **Wire My Stories + self-serve `/story/[id]` to DB content** (drop bundled fallback as runtime source; keep bundled as test fixtures only). *Verify:* lessons render from DB in **both** live class and self-serve. | **Provisioning** — manage people (CRUD students/coaches/parents, invite = auth user + profile), enrollments (pair student↔coach + plan), scheduling = **create `class_sessions` + enter the per-session Zoom link** (`class_sessions.zoom_link`), story assignment/sequencing, audit log. *Verify:* admin provisions a full pilot pair (incl. its Zoom link) end-to-end. |
| **Acceptance test:** add a 4th story (new key/grade) **in the DB only** → it runs with no code change. | **Tutor-stats** — `0005_stats_views.sql` (hours taught, sessions, attendance, outcomes per tutor) + dashboard (charts/filters/date ranges) + CSV/PDF export + scoped read-only third-party access. *Verify:* stats render + export. |

**🔗 Day-6 sync:** C owns `apps/admin` + migration `0005`; S owns content + `stories`/`class_stories`
shape. Admin's story-assignment **reads S's migrated stories** — agree the `stories` row shape **first
thing**. This is the day most likely to slip — protect the seam.

---

### DAY 7 (Thu Jun 25) — Polish · tests · hardening

| Track S — Student dev | Track C — Coach dev |
|---|---|
| Student + content polish: error/empty/loading states, a11y (kids), timezone correctness. | Coach + admin polish; finish tutor-stats; observability (PostHog funnels join→magic-moment→complete, error tracking). |
| Student + live-class E2E (incl. multi-session); student notifications (in-app + email reminders). | Coach + admin E2E; coach notifications; Supabase alerts. |

**🔗 Day-7 sync:** full suite green (unit + integration + E2E). **Joint smoke of the whole flow:**
admin provisions → coach schedules → student joins → live class → marking → AI feedback. **Deploy-ready — Day 8 ships it.**

---

### DAY 8 — Deployment (ship to live domains)

Monorepo → **one Vercel project per app** (Root Directory set per app); `@cueword/core` is shared, not deployed on its own. See [DEPLOY.md](../DEPLOY.md). Full per-side steps: [COACH_BUILD_STEPS.md](COACH_BUILD_STEPS.md) §Day 8 · [STUDENT_BUILD_STEPS.md](STUDENT_BUILD_STEPS.md) §Day 8.

| Track S — Student dev | Track C — Coach dev |
|---|---|
| Local build gate (all apps build + lint + tests green). Create the **student** Vercel project (Root `apps/student`, domain `student.cueword.com`). | **Production Supabase cutover** — apply additive schema + `0003` RLS + `0004`/`0005` views to prod; realtime on; create Storage bucket + policies; add prod domains to Auth URLs. |
| Set student env (`NEXT_PUBLIC_*`, same prod project; `ANTHROPIC_API_KEY` if student runs AI; **no** service-role key). | Create the **coach + admin + stats** Vercel projects; set server-only secrets (`SUPABASE_SERVICE_ROLE_KEY` on admin, Zoom + `ANTHROPIC_API_KEY` on coach, email provider key). |
| Verify auth/session works under HTTPS on the real domain (cookie + Proxy + Auth redirect URLs). | Provision the real pilot cohort via the admin app; write the runbook + reset/seed; confirm prod telemetry. |
| Student smoke on the live URL (magic moment, lesson, submission, multi-session). | Coach + admin smoke on the live URLs (provision, marking persists + notifies, stats + export). |

**🔗 Day-8 sync (joint production smoke):** on the live domains — admin provisions → coach schedules (Zoom link) → student joins on `student.cueword.com` → live class → coach marks on `coach.cueword.com` → AI feedback → student sees it. **That is shipped.**

---

## 5. Feature → owner → day (quick index)

| Feature | Owner | Day |
|---|---|---|
| Browser cookie client + `proxy.ts` + login/logout actions + retire localStorage | **S** (both apps) | 1 |
| Auth-scoped RLS (`0003`) + RLS tests + Auth user provisioning + staging DB | **C** | 1 |
| `queries/student.ts` + student seed + 6 student screens mock→DB | **S** | 2–3 |
| `queries/coach.ts` + KPI views (`0004`) + coach seed + 9 coach screens mock→DB + **marking persists** | **C** | 2–3 |
| Multi-session refactor (`session.ts`, `useActiveSession`) + `StoryKey=string` + realtime resilience + event pagination + `/live?session=` | **S** | 4 |
| Coach `/live` on new hook + driver edges + open admin-assigned Zoom link + join-right-session links | **C** | 4 |
| Speak/Write capture→Storage + student AI feedback UI | **S** | 5 |
| AI service (`claude.ts`) + marking-assist + eval/safety/cost | **C** | 5 |
| Content migration (15 stories → DB) + wire stories to DB | **S** | 6 |
| Admin app (provision/schedule/assign stories + **enter per-session Zoom link**) + tutor-stats + `0005` | **C** | 6 |
| Student + live E2E + student notifications + polish | **S** | 7 |
| Coach + admin E2E + observability + coach notifications + polish | **C** | 7 |
| Deploy **student** app (Vercel, domain, env, auth-on-HTTPS, smoke) | **S** | 8 |
| **Production Supabase cutover** + deploy **coach/admin/stats** (secrets, provision cohort, runbook, smoke) | **C** | 8 |

---

## 6. External dependencies — queue NOW

| Need | By | Blocks | Fallback |
|---|---|---|---|
| **Production-Supabase access OR bless staging clone** (§1) | **Day 1** | *All* real-data work (both tracks) | Staging clone of the additive migration |
| `ANTHROPIC_API_KEY` | Tue Jun 23 | Day 5 AI (both) | keep AI mocked |
| Zoom API creds (`ZOOM_ACCOUNT_ID`) | optional | only the `zoom-notify` **chat** feature (C) — **not** the link | chat no-ops gracefully; the per-session **link is admin-entered, no Zoom API needed** |
| Transcription key (optional) | Tue Jun 23 | Speaking transcript (S) | stub transcript, keep audio+score |
| Vercel access (both accounts) | **Day 8** | deploying all apps | local `npm run dev:*` + preview until then |
| DNS control of the `cueword.com` zone | **Day 8** | domain cutover for all apps | Vercel preview URLs until then |
| Transactional email provider key (e.g. Resend) | **Day 8** (Day 6 to test invites) | admin invite emails | provision without the email; share creds manually |

---

## 7. Risk & cut line (full scope, accepted)

- **Day 6 is the crunch for both tracks** (admin app ‖ content migration). Day 7 absorbs bleed; **Day 8 is deployment** (~half a day) — keep it lean by setting up the Vercel projects + env early (they don't need finished features).
- If short, defer in this order — all fast-follow: 1) tutor-stats dashboard (C), 2) speaking AI (ship writing only — S/C), 3) admin authoring UI (migrate via the `seed:content` script — S), 4) the `zoom-notify` chat integration (the class still works without it — C). *(Per-session Zoom links are admin-entered, so there is no auto-create to cut.)*
- **Biggest single risk:** the §1 DB-access decision slipping. It gates *everything* on Days 2+. Resolve it on Day 1 or the whole spine shifts.
- **Second risk:** `session.ts` multi-session churn on Day 4 blocking the coach console. Mitigated by the **midday handoff** rule — S ships the hook signature first, refactors internals after.

---

*Grounded in a file-by-file audit of `apps/*`, `packages/core`, and `supabase/` on 2026-06-18. The
live-class engine is real; the work is real auth + every screen onto real data + multi-session + real AI
+ admin/content/stats, split down the coach/student seam with `packages/core` and `supabase/` as the only
contended zones.*
