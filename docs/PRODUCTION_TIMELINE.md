# Cueword × Edge — 7-Day Production Plan · TWO PARALLEL TRACKS

Two people build in parallel — **Track S** owns the **Student side**, **Track C** owns the
**Coach side** — each driving Claude Code. Audit-grounded; every task names **current → target**,
**files**, and **verify**. **Deployment is NOT counted** in the 7 days (separate step after).

- **Start:** Thu **2026-06-18** · **Holiday:** Sun **2026-06-21** · **Finish:** Thu **2026-06-25**
- **Milestone:** 🟦 every feature on real data + real auth, tested & verified locally, **deploy-ready** — **Thu Jun 25**
- **Scope = FULL** (admin + AI + multi-session + tutor-stats). Fast-follow: COPPA/GDPR-K consent +
  legal, pen-test, pilot/UAT, DNS cutover, real Zoom auto-create, deployment.

Companion to [BUILD_PLAN.md](BUILD_PLAN.md) and [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md).

---

## The real starting line (from a code audit)

| Area | State today |
|---|---|
| Live-class engine (`session.ts` sync, lesson UI, 8 question types, playbook) | ✅ production-ready |
| Row types for all 21 tables (`types.ts`) · server-auth scaffolding (`dal.ts`, `server.ts`) | ✅ types done · ⚠️ scaffolding not wired |
| Schema `0001`+`0002` (21 tables) applied · RLS | ✅ done · ❌ permissive |
| Auth | ❌ client-side `localStorage` vs hardcoded JSON |
| Live class | ⚠️ watches ONE fixed `SESSION_ID` — no multi-session |
| Student app | ❌ 6/7 screens on `studentData.ts` mock |
| Coach app | ❌ 9/11 screens on `coachData.ts` mock; marking doesn't save |
| Stories/content | ❌ hardcoded (3 in core + 12 in student app); DB `content` empty |
| Real AI · Admin app · `0003`/`0004`/`0005` migrations | ❌ none / removed / not created |

---

## Who owns what (ownership split)

| Track S — Student side | Track C — Coach side |
|---|---|
| Auth **client wiring** (both apps' login/logout/proxy/clients) | Auth **RLS + staging + user provisioning** |
| Student app (6 screens) + `queries/student.ts` + student seed | Coach app (9 screens) + `queries/coach.ts` + KPI views + coach seed |
| **Live-class core sync engine** (`session.ts`, `useActiveSession`) + student `/live` | Coach `/live` console + per-session Zoom + session creation |
| Student AI: capture (MediaRecorder→Storage) + writing/speaking UI | **AI service** (`lib/ai/claude.ts`) + marking-assist + eval/safety/cost |
| **Content migration** (15 stories → `stories.content`) + self-serve story | **Admin app** (provisioning/scheduling/assignment) + **tutor-stats** |
| Student polish + student/live E2E + student notifications | Coach+admin polish + observability + coach/admin E2E |

**Coordination rules (avoid merge conflicts):**
1. `apps/student` (S) vs `apps/coach` (C) — independent, edit freely.
2. **Shared zones need a single owner per day:** `packages/core/session.ts` → **S** (live-class). `supabase/migrations/000x` → **C** (RLS/views/stats); **content migration** → **S**. `types.ts` → coordinate before editing.
3. Merge to a shared integration branch **at every 🔗 sync point** (end of each day minimum).

---

## Feature → day → owner

### ⭐ Live class & real-time sync (the core)
| Piece | Owner | Day |
|---|---|---|
| RLS on `class_sessions`/`session_events` (who can join) | C | Day 1 |
| **Multi-session** refactor (drop fixed `SESSION_ID`) | S | Day 4 |
| Realtime resilience (reconnect, presence, late-join, refresh) | S | Day 4 |
| `session_events` perf (pagination/cursor) | S | Day 4 |
| Student `/live` + join routing (`/live?session=`) | S | Day 4 |
| Coach `/live` console + driver/take-over edges | C | Day 4 |
| Per-session Zoom (+ auto-create) | C | Day 4 |
| Speak/Write capture + AI feedback inside the lesson | S (UI) + C (service) | Day 5 |
| Lesson content rendered from DB | S | Day 6 |
| Multi-session E2E + join→magic-moment→complete funnel | S + C | Day 4 / 7 |

### Everything else
| Feature | Owner | Day |
|---|---|---|
| Real auth + RLS isolation | S (client) + C (RLS) | Day 1 |
| Student dashboards (6) | S | Day 2–3 |
| Coach dashboards (9) + marking saves | C | Day 2–3 |
| AI service + writing/speaking/marking + safety | C (service) + S (student UI) | Day 5 |
| Admin app (provisioning/scheduling/assignment) | C | Day 6 |
| Content migration (15 stories → DB) | S | Day 6 |
| Tutor-stats dashboard + export | C | Day 6–7 |
| Notifications (in-app + email) | S + C | Day 7 |

---

## DAY 1 — Thu Jun 18 · Foundation (auth + RLS) — both tracks on the spine
| Track S (Student side) | Track C (Coach side) |
|---|---|
| `createBrowserClient` cookie session (`client.ts`) | **Migration `0003`** auth-scoped RLS + `current_profile_id()`/`current_role()` |
| `proxy.ts` per app (Next 16, not middleware) | RLS integration tests (cross-tenant denial, coach-roster) |
| Login/logout Server Actions (both apps) | Provision Supabase Auth users + link `profiles.auth_user_id` |
| Retire `localStorage` identity → from DAL/session | Staging Supabase branch + `.env.staging` + shared seed (profiles/enrollments) |

**🔗 Sync (end of day):** merge auth + RLS; both apps log in as real seeded users; student A can't read student B. Agree the `lib/queries/*` convention + seed shape for Days 2–3. **Nothing real-data proceeds until this lands.**

## DAY 2 — Fri Jun 19 · Apps onto real data (begin) — fully parallel
| Track S | Track C |
|---|---|
| `queries/student.ts` + student seed | `queries/coach.ts` + KPI/attendance views (`0004`) + coach seed |
| Home → `class_sessions`/`progress`/`student_vocab`/`flagged_items` | Dashboard → live hero (real ✓), KPIs, today's sessions, tasks inbox |
| My Stories → `curriculum_stories`+`assignments` (structure/state) | Roster + `/[id]` → list + detail (skills, app-sync, history, homework) |
| My Workouts → `workouts`+`drill_attempts` (wrong→`flagged_items`) | Schedule → `class_sessions` week grid + NOW line |

**🔗 Sync:** query-layer pattern consistent; shared profiles/enrollments seed stable.

## DAY 3 — Fri… Sat Jun 20 · Apps onto real data (finish) — fully parallel
| Track S | Track C |
|---|---|
| Schedule → `class_sessions` (2/wk, 4h-cancel, tz) | Attendance → `attendance`+view, <95% flags |
| My Progress → `student_stats`, `milestones`, feedback | Curriculum → `curriculum_stories`, Teach-now→`/live` |
| My Portfolio → `portfolio_items` | **Marking + `/[id]` → persists** (feedback→`coach_feedback`+notify; homework→`homework`) |
| **Done:** zero `studentData.ts` imports | Comms → `comms_log`/`templates`; Profile → `coach_meta`. **Done:** zero `coachData.ts` imports |

**🔗 Sync:** both apps on real data; cross-check — coach sees a piece of work the student submitted.

## DAY 4 — Mon Jun 22 · Live class & sync (the centerpiece)
| Track S (owns `session.ts`) | Track C (coach console) |
|---|---|
| **Multi-session:** `session.ts`+`useActiveSession` resolve session per enrollment | Coach `/live` console on the new multi-session hook |
| Realtime resilience: reconnect, presence, late-join hydration, mid-lesson refresh | Driver / take-over edge cases (concurrent flips, observer lockout) |
| Bound `session_events` reads (pagination/cursor) + indexes | Per-session Zoom (`class_sessions.zoom_link` + optional auto-create route) |
| Student `/live` + `/live?session=` routing | Coach Dashboard/Schedule "join the right session" links |

**🔗 Sync:** S ships `useActiveSession(sessionId)` by **midday** → C consumes. Write the **multi-session cross-origin E2E** (two pairs) together. Only S edits `packages/core/session.ts` today.

## DAY 5 — Tue Jun 23 · Real AI (Claude) 🔑 `ANTHROPIC_API_KEY`
| Track S (student-facing AI) | Track C (AI service + coach) |
|---|---|
| Capture: real `MediaRecorder` → Supabase Storage (signed URLs + storage RLS) | **AI service** `lib/ai/claude.ts` (SDK, tool-use structured rubric) |
| Writing/speaking feedback UI → `submissions.ai_score` | Coach marking-assist (AI draft on submit — the "AI-ready" spark) |
| Wire self-serve story speak/write to the service | Eval harness + **kid-safety guardrails** + cost controls + PostHog LLM analytics |

**🔗 Sync:** C delivers the `claude.ts` interface + `ai_score` shape **early** → S builds against it.

## DAY 6 — Wed Jun 24 · Admin + content + stats (heaviest)
| Track S (content) | Track C (admin + stats) |
|---|---|
| **Content migration:** `GRADE_STORIES`(3)+`storyLib`(12) → `stories.content` JSONB + `curriculum_stories` | Scaffold `apps/admin` (admin auth + shell + `proxy.ts`) |
| Wire My Stories + self-serve `/story/[id]` to DB content | Manage people / enrollments / scheduling + Zoom assign / story assignment + audit log |
| Verify lessons render from DB (live class + self-serve) | Tutor-stats views (`0005`) + dashboard (charts/filters) + CSV/PDF export |

**🔗 Sync:** C owns `apps/admin` + migration `0005`; S owns content migration + `stories.content`. Admin's story-assignment reads S's migrated stories — agree the `stories` shape first.

## DAY 7 — Thu Jun 25 · Polish · tests · hardening (no deploy)
| Track S | Track C |
|---|---|
| Student + content polish (error/empty/loading, a11y, tz) | Coach + admin polish; tutor-stats dashboard finish |
| Student + live-class E2E (incl. multi-session) | Coach + admin E2E; observability (PostHog funnels, error tracking) |
| Student notifications (in-app + email) | Coach notifications |

**🔗 Sync:** full suite green (unit/integration/E2E); **joint smoke of the whole flow** — admin provisions → coach schedules → student joins → live class → marking → AI feedback. **Deploy-ready.**

---

## External dependencies — queue NOW
| Need | By | Blocks | Fallback |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Tue Jun 23 | Day 5 AI (both tracks) | keep AI mocked |
| Zoom API creds + DNS | Mon Jun 22 (opt) | Day 4 auto-Zoom (C) | static Zoom link |
| Vercel access | **after** Jun 25 | deployment (separate) | local/preview until then |

## Deployment — separate step, AFTER the 7 days (~half a day)
Vercel projects for all four surfaces from the monorepo, env vars, preview→staging, DNS, smoke. See
[DEPLOY.md](../DEPLOY.md). Until then everything is verified locally via `npm run dev:*` + preview.

## Honest risk + cut line (full scope, accepted)
Day 6 is the crunch for **both** tracks (admin app + content migration). Day 7 slack (deploy removed)
absorbs bleed. If still short, defer in order — all fast-follow: 1) tutor-stats dashboard (C),
2) speaking AI (ship writing only — S/C), 3) admin authoring UI (migrate via script — S), 4) per-session
Zoom auto-create (keep static link — C).

## Two-person sequential spine
`Day 1 auth+RLS (both)` → unblocks all real-data work · `Day 4 multi-session (S core)` → real classes ·
`Day 6 content (S)` ↔ `admin (C)` → fully-real, provisionable product.
