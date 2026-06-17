# Cueword — 7-Day Production Build Plan (deep)

Granular, codebase-grounded breakdown of the 7-day build. Estimates are **engineering-hours** (focused build time); the 7 "days" are workstream phases compressed into wall-clock by running independent tasks as a **parallel multi-agent workflow**. Scope = **limited pilot + rebuilt Admin panel + third-party tutor-stats dashboard, Zoom-link kept, real Claude AI** (breadth-to-staging).

**Legend:** ✅ already shipped (Day-1 session) · ⏳ remaining · 🔒 hard external dependency · ⚡ parallel fan-out point.

**Status anchor:** `prod/7day-build` branch. Schema migration `0002` live on Supabase (21 tables), row types wired into `@cueword/core`, auth core (`@supabase/ssr` + `supabase/server.ts` + `dal.ts`) written. 26 unit tests + both apps `tsc` green.

---

## DAY 1 — Auth · RLS · schema · staging  (Phase 0 + 1.0)

**Goal:** real identity + real data isolation + the full table surface, on a staging environment. Nothing else is safe to build on until this lands.

| # | Task | Files / targets | Hrs | Verify |
|---|------|-----------------|----:|--------|
| 1.1 ✅ | Schema expansion — 14 new tables + extend profiles/class_sessions/stories | `supabase/migrations/0002_production_schema.sql` | 6 | `list_tables` → 21 tables ✓ |
| 1.2 ✅ | Row types (no `any`, hand-authored to match codebase) | `packages/core/src/lib/types.ts` | 2 | `tsc --noEmit` both apps = 0 ✓ |
| 1.3 ✅ | Auth core: `@supabase/ssr`, cookie server client, DAL | `supabase/server.ts`, `dal.ts` | 3 | installed ✓ |
| 1.4 ⏳ | Browser client → `createBrowserClient` (shares cookie session, drops `persistSession:false`) | `supabase/client.ts` | 1.5 | session survives reload |
| 1.5 ⏳ | `proxy.ts` per app (Next 16 — NOT middleware): refresh session + optimistic redirects | `apps/coach/proxy.ts`, `apps/student/proxy.ts` | 2 | logged-out `/` → `/login` |
| 1.6 ⏳ | Login: Server Action `signInWithPassword` + form w/ `useActionState` error states | `apps/*/app/login/page.tsx`, `app/actions/auth.ts` | 3 | real login for a seeded user |
| 1.7 ⏳ | Logout Server Action `signOut()` + wire existing buttons | `apps/*/components/Shell.tsx`, auth action | 1 | logout clears session |
| 1.8 ⏳ | Retire `localStorage` auth — identity from session/DAL, not "first of role" | `lib/auth.ts`, both Shells, gated layouts | 3 | identity = signed-in user |
| 1.9 ⏳ | Provision Supabase Auth users for pilot profiles + link `auth_user_id` | Auth admin API / SQL | 2 | each role logs in |
| 1.10 ⏳ | **Migration `0003` — auth-scoped RLS** (replace all permissive policies). SQL helpers `current_profile_id()`, `current_role()`. Student=own rows; coach=roster; admin=all; notifications=recipient | `supabase/migrations/0003_rls.sql` | 5 | see 1.11 |
| 1.11 ⏳ | RLS integration tests — cross-tenant denial + coach-roster access | `tests/integration/rls.test.ts` | 2 | student A can't read student B |
| 1.12 ⏳ | Staging env — Supabase branch/project + `.env.staging` + env separation | env config, Supabase branch | 2.5 | staging DB reachable |
| 1.13 ⏳ | Gate: build both apps · lint · unit + integration | — | 1 | all green |

**Exit:** a seeded coach/student/admin each log in with real credentials; RLS provably isolates tenants; staging DB stands up; CI gate green. **Subtotal ≈ 34h (~11 done).**

---

## DAY 2 — Student app fully on real data  (Phase 1·student)

**Goal:** every student screen reads/writes Supabase; `studentData.ts` mock retired for dynamic data.

**Foundational (sequential, before fan-out):**
| # | Task | Files | Hrs |
|---|------|-------|----:|
| 2.0a | Student query layer — typed reads/writes per screen | `packages/core/src/lib/queries/student.ts` | 4 |
| 2.0b | Pilot seed: map `studentData.ts` 24 entities → tables (skills/levels→progress, stats→student_stats, milestones, vocab, portfolio, workouts, schedule→class_sessions) | `supabase/seed/student.sql` | 4 |

**Per-screen (⚡fan-out — one agent each):**
| # | Screen (route) | Real sources | Hrs | Verify |
|---|----------------|--------------|----:|--------|
| 2.1 | Home `(shell)/page` | next class (`class_sessions`), skills (`progress`), vocab warmup (`student_vocab`), flagged (`flagged_items`), workouts preview, resume (`drill_attempts`); Join→`/live` seam | 4 | renders real rows |
| 2.2 | My Stories `lessons` | `curriculum_stories` + `assignments` + `stories`; level/term lock state + progress | 4 | locked/done states correct |
| 2.3 | My Workouts `workouts` | DrillRunner→`drill_attempts` (+ wrong→`flagged_items`); CoachDrill→`submissions(awaiting)` | 5 | completing a drill persists + flags |
| 2.4 | Schedule `schedule` | `class_sessions`; 2/week cap; cancel 4h-rule→`cancelled_at`; tz convert | 4 | cancel locks <4h |
| 2.5 | My Progress `progress` | `student_stats` (belt/points/KPIs), `milestones`, feedback (`submissions.coach_feedback`) | 4 | belt ring = real % |
| 2.6 | My Portfolio `works` | `portfolio_items` (filter, modals, audio player) | 3 | items from DB |

**Exit:** zero dynamic `studentData.ts` imports; loading/empty states; preview-verified. (`/story/[id]` self-serve player → Day 5 for audio+AI.) **Subtotal ≈ 32h.**

---

## DAY 3 — Coach app fully on real data  (Phase 1·coach)

**Goal:** all 9 coach screens on real data; `coachData.ts` mock retired.

**Foundational:**
| # | Task | Files | Hrs |
|---|------|-------|----:|
| 3.0a | Coach query layer (roster, sessions, submissions, attendance, homework, comms, curriculum) | `lib/queries/coach.ts` | 4 |
| 3.0b | Attendance/KPI SQL views (rates, present/late/absent, accuracy) | `supabase/migrations/0004_views.sql` | 2 |
| 3.0c | Pilot seed: coach + small roster, enrollments, today's sessions, submissions, attendance log, comms, homework | `supabase/seed/coach.sql` | 4 |

**Per-screen (⚡fan-out):**
| # | Screen | Real sources | Hrs |
|---|--------|--------------|----:|
| 3.1 | Dashboard `(shell)/page` | live hero (real session via `useLiveSession`), time-gated Join, KPI cards, today's sessions, **tasks inbox** (merge submissions+homework, priority-ordered) | 5 |
| 3.2 | Roster `roster` + `/[id]` | list + grade groups; detail: skill table (+ app-sync), session history, homework | 5 |
| 3.3 | Schedule `schedule` | week grid (`class_sessions`), NOW line, live callout | 4 |
| 3.4 | Attendance `attendance` | rates/heatmap (`attendance` + view), <95% flags | 4 |
| 3.5 | Curriculum `curriculum` | `curriculum_stories` (3T×8L), Teach-now→`/live` | 4 |
| 3.6 | Marking `marking` + `/[id]` | queue (`submissions`); item: audio/body, score chips (editable), Send feedback→`coach_feedback`+`sent`+notify, Assign homework | 6 |
| 3.7 | Comms `comms` | `comms_log` + `comms_templates` | 3 |
| 3.8 | Profile `profile` | `coach_meta` prefs/identity | 3 |

**Exit:** coach app on real data; tasks inbox + marking persist; preview-verified. **Subtotal ≈ 38h.**

---

## DAY 4 — Live class hardened  (Phase 2)

**Goal:** production-grade sync; many concurrent classes; survives drops.

| # | Task | Files | Hrs | Verify |
|---|------|-------|----:|--------|
| 4.1 | **Multi-session** — stop watching fixed `SESSION_ID`; resolve the current session per logged-in user; create sessions from schedule | `session.ts`, `useActiveSession.tsx`, `config.ts`, both `/live` pages | 8 | 2 enrollments run independent classes at once |
| 4.2 | Join-the-right-session routing (`/live?session=…`) from Home/Schedule/Dashboard | student Home, coach Dashboard/Schedule | 3 | each lands in own session |
| 4.3 | Realtime resilience — reconnect, presence, late-join hydration, mid-lesson refresh, channel-error handling | `session.ts` subscriptions, `useActiveSession` | 8 | kill+restore network, state intact |
| 4.4 | Driver / take-over edge cases — concurrent driver flips, observer lockout, answer races | `LiveClass`, `LessonCanvas`, `session.ts` | 4 | no double-driver |
| 4.5 | Zoom auto-link — per-session link; 🔒 if Zoom API creds: Route Handler auto-creates + stores meeting; else configured link | `app/api/zoom/route.ts`, `class_sessions.zoom_link` | 6 | session has its own link |
| 4.6 | Perf — bound `session_events` reads (demo hit 154 rows), pagination, index/throughput check | `session.ts`, indexes | 3 | event reads paginated |
| 4.7 | Multi-session cross-origin E2E | `e2e/multi-session.spec.ts` | 3 | two pairs pass |

**Exit:** concurrent classes, resilient reconnect, per-session Zoom; E2E green. **Subtotal ≈ 35h.** 🔒 real Zoom auto-create needs your Zoom admin creds.

---

## DAY 5 — Real AI (Claude)  (Phase 3)  🔒 needs `ANTHROPIC_API_KEY`

**Goal:** real, safe, evaluated AI feedback + marking-assist.

| # | Task | Files | Hrs | Verify |
|---|------|-------|----:|--------|
| 5.1 | AI service — Anthropic SDK, latest Claude, **tool-use structured output** for rubric JSON | `packages/core/src/lib/ai/claude.ts` | 4 | typed score returns |
| 5.2 | Writing feedback — Route Handler text→Claude→`{overall,criteria[],feedback}`→`submissions.ai_score` | `app/api/ai/writing/route.ts`, write screens | 6 | real rubric on a sample |
| 5.3 | Speaking feedback — real `MediaRecorder` → Storage → transcription → Claude scoring | speak screens, `lib/ai/speech.ts` | 10 | audio→score end-to-end |
| 5.4 | Audio storage — Supabase Storage bucket + signed URLs + storage RLS | Storage policies | 4 | only owner/coach can fetch |
| 5.5 | Coach marking-assist — AI draft on submit (the "AI-ready" spark); coach edits→sends | marking item | 4 | draft pre-fills |
| 5.6 | **Eval harness + kid-safety** — golden sets, LLM-as-judge for consistency; system-prompt guardrails (age-appropriate, no PII), output filtering, refusal handling | `tests/ai/eval.ts`, prompts | 8 | eval suite passes threshold |
| 5.7 | Cost controls — rate limit, cache, max-tokens, usage logging via **PostHog LLM analytics** | `lib/ai/*`, PostHog | 5 | spend capped + tracked |

**Exit:** real AI on writing + speaking + marking, evaluated and guardrailed for children. **Subtotal ≈ 41h.** 🔒 speaking transcription may need a 2nd provider key (or stub).

---

## DAY 6 — Admin panel + tutor-stats dashboard  (Phases 4 + 5)

**Goal:** provision a whole pilot cohort end-to-end; external tutor reporting.

**Admin (new `apps/admin` — clean role separation; old admin in git history pre-split to crib):**
| # | Task | Files | Hrs |
|---|------|-------|----:|
| 6.1 | Scaffold `apps/admin` + admin-role auth + shell + `proxy.ts` | new app | 6 |
| 6.2 | Manage people — CRUD students/coaches/parents; invite (auth user + profile + email); credentials | admin screens, Auth admin API | 8 |
| 6.3 | Manage enrollments — pair student↔coach, plan, status | `enrollments` CRUD | 4 |
| 6.4 | Schedule + Zoom assign — create `class_sessions`, recurring slots | scheduling UI | 6 |
| 6.5 | Assign stories / sequence curriculum | `assignments`, `curriculum_stories` | 5 |
| 6.6 | **Content pipeline** — migrate hardcoded `GRADE_STORIES` (3) + `storyLib` (6) → `stories.content` JSONB; authoring/import UI | migration script + editor | 10 |
| 6.7 | Provisioning audit log | `notifications`/audit table | 3 |

**Tutor-stats (third-party):**
| # | Task | Files | Hrs |
|---|------|-------|----:|
| 6.8 | Metrics + SQL views/endpoints — hours taught, sessions, attendance, outcomes, rating, per-tutor | `0005_stats_views.sql` | 6 |
| 6.9 | Dashboard UI — charts, filters, date ranges | stats app/route | 8 |
| 6.10 | Scoped read-only third-party access (separate role/token) | RLS + access | 6 |
| 6.11 | Export CSV / PDF | export util | 4 |

**Exit:** admin provisions a real cohort start-to-finish; tutor-stats live + shareable. **Subtotal ≈ 66h (largest — heavy fan-out + content).**

---

## DAY 7 — Polish · tests · deploy  (Phases 6–7)

**Goal:** harden every surface, prove it, ship to staging.

| # | Task | Targets | Hrs | Verify |
|---|------|---------|----:|--------|
| 7.1 | Error / empty / loading states everywhere (skeletons, error boundaries, copy) | all screens | 8 | no raw spinners/blank |
| 7.2 | Timezone correctness end-to-end (store UTC, render local; coach Manila / students US) | schedule, dashboard, live | 5 | times match per user |
| 7.3 | A11y pass — keyboard, focus, ARIA, contrast (kids + parents) | all apps | 6 | axe clean on key flows |
| 7.4 | Notifications — in-app (`notifications`) + email reminders (class soon, feedback ready) | `lib/notify`, email provider | 6 | reminder fires |
| 7.5 | Test expansion — unit (new logic) + integration (RLS/auth/AI/multi-session) + E2E (incl. admin) | tests/, e2e/ | 12 | suites green |
| 7.6 | Observability — PostHog funnels (join→magic-moment→complete), error tracking, Supabase alerts | instrumentation | 5 | events flowing |
| 7.7 | **Deploy** — Vercel projects (student, coach, admin, tutor-stats) from monorepo, env vars, preview→staging; smoke | `vercel.json`, env | 8 | staging URLs live |
| 7.8 | Runbook + monitoring board + pilot reset/seed script | docs, scripts | 4 | one-command reset |

**Exit:** all four surfaces feature-complete on staging URLs, tests green, smoke-passed. **Subtotal ≈ 54h.** 🔒 deploy needs your Vercel access.

---

## Roll-up & honest accounting

| Day | Phase | Eng-hrs |
|----|-------|--------:|
| 1 | Foundations + schema | ~34 (~11 done) |
| 2 | Student on real data | ~32 |
| 3 | Coach on real data | ~38 |
| 4 | Live class hardened | ~35 |
| 5 | Real AI | ~41 |
| 6 | Admin + tutor-stats | ~66 |
| 7 | Polish + tests + deploy | ~54 |
| | **Core build** | **~300h** |
| | **+20% contingency** | **~360h** |

**Why ~360h, not the earlier ~900h?** The 900h was the *full* pilot including the non-code gates. Breadth-to-staging deliberately **defers** these to a fast-follow (they cannot fit 7 days and most aren't code):
- COPPA / GDPR-K compliance + parental-consent flows (legal sign-off)
- Professional pen-test + real-user UAT
- Full 3×8×10 story-library authoring (we wire the pipeline + migrate the existing 9 stories)
- Real Zoom auto-create + production DNS/domain cutover

**Parallelization:** the wall-clock "7 days" only works because Days 2, 3, 6 fan out per-screen across concurrent agents (a barrier-free pipeline), with Day-1 foundations and Day-4 multi-session as the sequential spine everything depends on.

**Hard-dependency timeline (queue these now):**
| Need | By | For |
|------|----|-----|
| `ANTHROPIC_API_KEY` | Day 5 | real AI |
| Vercel access | Day 7 | staging deploy |
| Zoom API creds + DNS | Day 4 / 7 | auto-Zoom + real domains |
| Transcription key (optional) | Day 5 | speaking feedback |
