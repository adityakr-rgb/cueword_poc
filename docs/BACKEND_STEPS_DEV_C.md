# Backend — Dev C Work Guide (Coach  · Comms · Ops domains)

> **Read first:** [BACKEND_REPO_STRUCTURE.md](BACKEND_REPO_STRUCTURE.md) (repo layout + conflict-free
> ownership). This is **your** end-to-end work for the new **Supabase-native backend repo**
> (`cueword-tutored-backend`, its own GitHub repo). Dev S's half: [BACKEND_STEPS_DEV_S.md](BACKEND_STEPS_DEV_S.md).
>
> **No frontend here.** Steps are **concrete spec** — exact tables, columns, and function logic — but
> not literal code (you/your AI write the SQL & TypeScript). Format: **Idea · Touch · Do · Done when.**
> 🔗 = sync with Dev S.

## Your domains
**Identity · Enrollment · Attendance · Comms · Ops  · Tutor-stats views.**

| | You own |
|---|---|
| **Tables (RLS + seeds)** | `profiles`, `coaches`, `parents`, `students`, `eval_results`, `enrollments`, `consent_records`, `attendance`, `homework`, `notifications`, `audit_log`, `parent_comms`, `gap_packs`, `gap_pack_assignments` |
| **Edge Functions** | `provision-user`, `schedule-session`, `notify`, `mark-assist`, `coach-playbook`, `reset-pilot` |
| **Reuse (don't build)** | `evaluate-writing` / `evaluate-speaking` for `mark-assist` (in the self-learn project — replicate into the demo when needed); the `parent-report` **Resend** pattern (for `notify` / invites) |
| **Views** | `0010_views.sql` — KPI / attendance / tutor-stats |

## Ground truth you're starting from
- **Stack = Supabase-native** (Postgres + Auth + Realtime + Storage; logic = Deno Edge Functions). **AI = OpenAI** (gpt-4o-mini / Whisper / tts-1). **Email = Resend.** **No Anthropic/Claude.**
- **Tutored tables already exist** in the demo project (from the prod SQL / [NEW_DB_SCHEMA.md](NEW_DB_SCHEMA.md)). You write **RLS + functions + seeds + contract against existing tables — not the schema.**
- **`auth.users` exists** (Supabase built-in). `profiles.id` **equals** the `auth.users.id` for that person — that's the spine for provisioning and for all `current_profile_id()` checks.
- **9 Edge Functions live in the self-learn project** (a different project). The `evaluate-*` you reuse for `mark-assist` get **replicated into the demo project when needed** (user-managed). Set `OPENAI_API_KEY` + `RESEND_API_KEY` on the **demo** project (they're not there by default). Deploy per-function.
- **Read before coding:** the Supabase Edge Functions + RLS guides. Functions are **Deno** (`Deno.serve`, `https://esm.sh/@supabase/supabase-js@2`), not Node.

## Conflict-free commit rules (recap)
1. Edit only **your** function folders + **your** domain migrations. 2. Never edit a shipped/another dev's migration — add a new timestamped one. 3. RLS policies live **inside your domain's migration** (no shared RLS file). 4. `_shared/` + `packages/contract/` = announce before editing (CODEOWNERS = both). 5. Branches → PRs → integration branch.

## Your folder structure (✎ = you create · ⤷ = shared, coordinate · ▢ = generated/baseline)

```
cueword-tutored-backend/
├── supabase/
│   ├── config.toml                              ⤷ repo setup (Phase 0, with Dev S)
│   ├── migrations/
│   │   ├── <ts>_remote_schema.sql               ▢ baseline from `supabase db pull` (tables already exist)
│   │   ├── 0009_rls_helpers.sql                 ✎ YOU author (is_admin/is_coach_of/can_view_student/…) — shared, then frozen
│   │   ├── <ts>_identity_rls.sql                ✎ profiles · coaches · parents · students policies
│   │   ├── <ts>_enrollment_rls.sql              ✎ eval_results · enrollments · consent_records policies
│   │   ├── <ts>_ops_rls.sql                     ✎ attendance · homework · notifications · audit_log · parent_comms · gap_packs policies
│   │   └── 0010_views.sql                       ✎ KPI · attendance · tutor-stats views
│   ├── functions/
│   │   ├── _shared/                             ⤷ shared lib (coordinate): supabaseAdmin · auth · email · match · cors · errors · validate
│   │   ├── provision-user/index.ts              ✎ admin invite → auth user + profile + email + audit
│   │   ├── schedule-session/index.ts            ✎ create class_sessions (+ admin-entered zoom_link)
│   │   ├── notify/index.ts                      ✎ notifications row + Resend email
│   │   ├── mark-assist/index.ts                 ✎ coach AI draft (reuses existing evaluate-*)
│   │   ├── coach-playbook/index.ts              ✎ read-only live aid: content + answer keys + student answers (coach/admin only)
│   │   └── reset-pilot/index.ts                 ✎ ops reset/seed
│   ├── seeds/pilot.sql                          ✎ coaches · students · parents · enrollments · sessions · attendance · comms
│   └── tests/{rls_identity_test,rls_ops_test}.sql  ✎
├── packages/contract/src/functions.ts           ⤷ add YOUR function I/O types (shared file, coordinate)
├── scripts/reset-pilot.sh                        ✎
└── docs/FUNCTIONS.md                             ✎ document your functions
```

> **Do NOT touch** (Dev S owns): curriculum/live/work/workout/mastery migrations, `functions/{score-submission,grade-answer,mastery-engine,srs-review}/`, `seeds/{catalog,curriculum}.sql`, `scripts/seed-content.ts`, `packages/contract/src/{domain,ai}.ts`. The existing **9 deployed functions** live in the self-learn app's repo — never here.

---

# PHASE 0 — Repo + foundation (shared; you LEAD the identity/auth parts)

### Step 0.1 — Stand up the repo & link the demo project — 🔗 do together
- **Idea:** One Supabase-native repo, pointed at the project that holds the tutored tables.
- **Touch:** repo root; `supabase/config.toml`; `deno.json`; `packages/contract`; `.github/`.
- **Do:**
  1. In the new GitHub repo: `supabase init` (creates `supabase/config.toml` + skeleton).
  2. `supabase link --project-ref <demo-project-ref>` (the project holding the tutored tables — **confirm which one with the human**; the ref connected to tooling currently holds the *self-learn* app).
  3. Add `deno.json` with an import map (`std/http`, `@supabase/supabase-js@2`) + `fmt`/`lint`/`test` tasks.
  4. Add the `packages/contract` workspace (empty `src/index.ts` for now).
  5. Add `.github/workflows/ci.yml` (lint + `supabase db lint` + pgTAP) and a `CODEOWNERS` (your function folders + `migrations/000{9},0010_*` + your `_rls` migrations + `seeds/pilot.sql` → you; `_shared/**` + `packages/contract/**` → both).
- **Done when:** `supabase db lint` runs against the linked project with no error.

### Step 0.2 — Baseline the existing schema (avoid drift) — 🔗
- **Idea:** Tables were created by raw SQL, not CLI migrations — capture them so the repo == reality.
- **Touch:** `supabase/migrations/<ts>_remote_schema.sql`.
- **Do:** Run `supabase db pull` → it writes one baseline migration of the live schema. Open it and **confirm your tables exist**: `profiles, coaches, parents, students, eval_results, enrollments, consent_records, attendance, homework, notifications, audit_log, parent_comms, gap_packs, gap_pack_assignments`. For any missing vs [NEW_DB_SCHEMA.md](NEW_DB_SCHEMA.md), write a small additive migration (`CREATE TABLE IF NOT EXISTS …`) — never alter existing columns.
- **Done when:** `supabase db diff` shows no difference between repo and project.

### Step 0.3 — RLS helper functions (you author; both consume) — 🔗
- **Idea:** The role-aware helpers every policy calls, in one migration created **once, then frozen**.
- **Touch:** `supabase/migrations/0009_rls_helpers.sql`.
- **Do:** Author these SQL functions, all `SECURITY DEFINER STABLE`, in schema `public` (or `auth`-adjacent):
  - `current_profile_id() → uuid` — returns `auth.uid()` (since `profiles.id = auth.users.id`).
  - `current_role() → text` — `SELECT role FROM profiles WHERE id = auth.uid()`.
  - `is_admin() → bool` — `current_role() = 'admin'`.
  - `is_coach_of(student uuid) → bool` — EXISTS an `enrollments` row where `coach_id = (the coach profile of auth.uid())` AND `student_id = student` AND `status = 'active'`.
  - `is_parent_of(student uuid) → bool` — EXISTS a `students` row where `id = student` AND `parent_id = (the parent profile of auth.uid())`.
  - `can_view_student(student uuid) → bool` — `student = current_profile_id() OR is_admin() OR is_coach_of(student) OR is_parent_of(student)`.
- **Done when:** the functions exist; a quick `SELECT can_view_student('…')` works. **🔗 Hand the signatures to Dev S.**

### Step 0.4 — Generate the contract DB types — 🔗
- **Idea:** The shared typed surface starts from the real schema.
- **Touch:** `packages/contract/src/database.types.ts`; `scripts/gen-types.sh`.
- **Do:** `supabase gen types typescript --linked > packages/contract/src/database.types.ts`. Commit `scripts/gen-types.sh` so it's repeatable.
- **Done when:** `packages/contract` compiles.

> **🔗 Phase-0 sync:** repo linked, schema baselined, helpers shipped, types generated. Agree the seed shape, the `notify` email-event names, and that Dev S references your helpers.

---

# PHASE 1 — RLS on your domain tables (one migration per group; policies inline)

> For every table: `ALTER TABLE … ENABLE ROW LEVEL SECURITY;` then add the named policies below. Use the `0009` helpers. "service-role" = the Edge Functions (they bypass RLS); these notes are for the `authenticated` role.

### Step 1.1 — Identity RLS (`<ts>_identity_rls.sql`)
- **Idea:** People rows are private; only the right roles read them; only admin/service writes them.
- **Touch:** `profiles`, `coaches`, `parents`, `students`.
- **Do — exact policies:**
  - **`profiles`** — SELECT: `id = current_profile_id() OR is_admin() OR can_view_student(id) OR id IN (the coaches/parents linked to a student the caller can view)`. Simplest safe rule: `id = current_profile_id() OR is_admin() OR can_view_student(id)`. INSERT/UPDATE/DELETE: `is_admin()` only (provisioning is service-role).
  - **`students`** — SELECT: `can_view_student(profile_id)`. UPDATE: `is_admin()` (+ service-role); **`app_user_id` is never written from here** (read-only bridge). INSERT/DELETE: `is_admin()`.
  - **`coaches`** — SELECT: `profile_id = current_profile_id() OR is_admin() OR EXISTS active enrollment linking the caller's student to this coach` (so a student/parent can see their coach's `full_name`/`zoom_link`). INSERT/UPDATE: `is_admin()`.
  - **`parents`** — SELECT: `profile_id = current_profile_id() OR is_admin()`. INSERT/UPDATE: `is_admin()`.
- **Done when:** `rls_identity_test.sql` (Step 3.3) proves: student A can't SELECT student B's `students` row; a coach can SELECT their roster's students but not another coach's.

### Step 1.2 — Enrollment & consent RLS (`<ts>_enrollment_rls.sql`)
- **Touch:** `eval_results`, `enrollments`, `consent_records`.
- **Do — exact policies:**
  - **`enrollments`** — SELECT: `can_view_student(student_id) OR is_admin()` (coach sees their enrollments via `is_coach_of`). INSERT/UPDATE: `is_admin()`.
  - **`eval_results`** — SELECT: `can_view_student(student_id)`. INSERT/UPDATE: `is_admin()` (evaluator is admin/service).
  - **`consent_records`** — SELECT: `is_parent_of(student_id) OR is_admin() OR can_view_student(student_id)`. INSERT/UPDATE: `is_parent_of(student_id) OR is_admin()` (parent grants/revokes consent).
- **Done when:** a coach sees only their enrollments; a parent reads/writes only their child's consent.

### Step 1.3 — Attendance / ops / comms RLS (`<ts>_ops_rls.sql`)
- **Touch:** `attendance`, `homework`, `notifications`, `audit_log`, `parent_comms`, `gap_packs`, `gap_pack_assignments`.
- **Do — exact policies:**
  - **`attendance`** — SELECT: `can_view_student(student_id)`. INSERT/UPDATE: `is_coach_of(student_id) OR is_admin()` (coach marks present/late/absent/excused).
  - **`homework`** — SELECT: `can_view_student(student_id)`. INSERT/UPDATE: `is_coach_of(student_id) OR is_admin()` (`assigned_by = current_profile_id()`).
  - **`notifications`** — SELECT/UPDATE(`read`): `recipient_id = current_profile_id()`. INSERT: service-role only (via `notify`).
  - **`audit_log`** — SELECT: `is_admin()`. INSERT: service-role only. **No UPDATE/DELETE** (append-only).
  - **`parent_comms`** — SELECT: `is_coach_of(student_id) OR is_parent_of(student_id) OR is_admin()`. INSERT: `is_coach_of(student_id) OR is_admin()` (`coach_id = current_profile_id()`).
  - **`gap_packs`** — SELECT: any `authenticated`. INSERT/UPDATE: `is_admin()`. **`gap_pack_assignments`** — SELECT: `can_view_student(student_id)`; INSERT/UPDATE: `is_coach_of(student_id) OR is_admin()`.
- **Done when:** a student reads only their own homework/notifications; `audit_log` rejects any client write.

---

# PHASE 2 — Your Edge Functions (logic outlines; service-role where they write protected data)

> Each function: `Deno.serve`, handle `OPTIONS` (CORS), `POST` only; build a service-role client from `SUPABASE_SERVICE_ROLE_KEY` (`_shared/supabaseAdmin.ts`); verify the caller via `_shared/auth.ts` (`supabase.auth.getUser(token)` → look up `profiles.role`); reuse the existing rate-limit pattern (`rate_limits` table).

### Step 2.1 — `provision-user` (admin invite)
- **Touch:** `functions/provision-user/`; `_shared/{supabaseAdmin,auth,email,validate}.ts`.
- **Do — logic flow:**
  1. **Auth:** verify JWT; require `current_role() = 'admin'` (else 403).
  2. **Validate** body `{ role: 'coach'|'student'|'parent', full_name, parent_email, grade?, coach_id?, plan?, timezone? }` (zod).
  3. **Generate** a login email (e.g. `student+<short-uuid>@login.cueword.internal` — a non-deliverable identity) + a strong random password.
  4. `supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { role } })` → `uid`.
  5. Insert `profiles { id: uid, role, full_name, email: <login email>, timezone, status: 'active' }`.
  6. Insert the role detail: `students { profile_id: uid, grade, learning_mode: 'tutored', parent_id }` **or** `coaches { profile_id: uid, type, capacity, zoom_link }` **or** `parents { profile_id: uid, comms_prefs }`.
  7. **Email the credentials to `parent_email`** (the real contact) via Resend (`_shared/email.ts`, same pattern as `parent-report`).
  8. Insert `audit_log { actor_id: current_profile_id(), action: 'provision_user', entity_type: 'profiles', entity_id: uid, summary, diff }`.
  9. Return `{ profileId: uid, role }`. **Never** return or log the password.
- **Done when:** the new person can log in; an `audit_log` row exists; the password was never logged.

### Step 2.2 — `schedule-session` (create sessions + admin Zoom link)
- **Touch:** `functions/schedule-session/`.
- **Do — logic flow:**
  1. Auth: require admin (or a coach scheduling their own — your call; pilot = admin).
  2. Validate `{ enrollment_id, class_story_id, scheduled_at, zoom_link, recurrence? }`.
  3. Resolve `student_id` + `coach_id` from the `enrollments` row.
  4. Insert `class_sessions { enrollment_id, student_id, coach_id, class_story_id, scheduled_at, zoom_link, status: 'scheduled', driver: 'student', current_step: 0 }`. For recurrence, insert one row per slot.
  5. Optionally pre-create an `attendance { session_id, student_id, status: 'scheduled' }` row.
  6. Audit it.
- **Note:** `class_sessions` **RLS belongs to Dev S** — coordinate at the 🔗 that admin/service can insert.
- **Done when:** a scheduled session carries its admin-entered `zoom_link` and resolves to the right student/coach.

### Step 2.3 — `mark-assist` (coach AI draft — REUSE the evaluator)
- **Touch:** `functions/mark-assist/`.
- **Do — logic flow:**
  1. Auth: require the caller is the submission's coach (`is_coach_of(submission.student_id)`) or admin.
  2. Load the `submissions` row + the related `story_sections`/prompt for context.
  3. **Call the existing function** by slug: `supabase.functions.invoke('evaluate-writing', { body: { grade, prompt, nudge, response: submission.body } })` for write, or `'evaluate-speaking'` (with the transcript) for speak. **Do not call OpenAI directly.**
  4. Shape its rubric (`grammar/structure/vocab/conventions[/fluency/relevance]`, `summary`, `feedback{…}`) into a coach-facing **draft** string/object.
  5. Return the draft. (The coach edits, then the coach app writes `submissions.tutor_feedback` — that write is gated by Dev S's submissions RLS.)
- **Done when:** opening a submission returns a usable draft sourced from the existing evaluator.

### Step 2.4 — `notify` (in-app + email)
- **Touch:** `functions/notify/`; `_shared/email.ts`.
- **Do — logic flow:**
  1. Validate `{ recipient_id, type, title, body, link?, email?: boolean }`.
  2. Insert `notifications { recipient_id, type, title, body, link, read: false }`.
  3. If `email` and the recipient/parent has a contact address → send via Resend.
  4. Rate-limit per recipient.
- **Done when:** a `notifications` row appears for the recipient; email sends when asked.

### Step 2.5 — `coach-playbook` (live coaching aid; coach/admin only)
- **Touch:** `functions/coach-playbook/`.
- **Do — logic flow:**
  1. Auth: caller must be the session's coach (`is_coach_of(session.student_id)`) or admin — **never** student/parent (the response embeds answer keys + teacher tips).
  2. Input `{ session_id }`. Load the `class_sessions` row (`current_phase`/`current_step`/`current_question_id`).
  3. Return the content matching the student's current position + the `question_keys` (answers) + `teacher_tips` + the student's recorded `question_answers` — so the coach can guide live as the student moves (the coach watches position via Realtime on `class_sessions.current_*`). Read-only.
- **Done when:** a coach gets the live playbook for the current step; a student/parent is denied.

### Step 2.6 — `reset-pilot` (ops)
- **Touch:** `functions/reset-pilot/`.
- **Do:** Admin-only. Truncate/restore the pilot rows (sessions back to `scheduled`, clear `session_events`, reset `level_access`/work for the pilot students) and re-run the seed. Audit it.
- **Done when:** one call returns the pilot to a known clean state.

---

# PHASE 3 — Views, seeds, contract, tests

### Step 3.1 — Reporting views (`0010_views.sql`)
- **Do — define these views (`security_invoker = on` so RLS applies):**
  - `v_coach_load` — per coach: count of active students, sessions today (`class_sessions` where `scheduled_at::date = today`), items to mark (`submissions` where `status = 'awaiting'`).
  - `v_attendance_rate` — per student & period: present/late/absent counts + rate from `attendance`.
  - `v_tutor_stats` — per coach: sessions held, hours taught (sum of session durations), attendance rate, outcomes (avg `story_attempts.accuracy` of their students).
- **Done when:** each view returns correct numbers against the seed.

### Step 3.2 — Identity / pilot seed (`seeds/pilot.sql`)
- **Do:** Insert 1–2 pilot coaches, ~4 students (+ their parents), `enrollments` pairing them, today's `class_sessions` (with `zoom_link`), a few `attendance` + `homework` + `parent_comms` rows. Coordinate IDs with Dev S's `catalog`/`curriculum` seed so FKs resolve.
- **Done when:** the coach-facing data looks real end-to-end.

### Step 3.3 — Your contract types + pgTAP tests
- **Touch:** `packages/contract/src/functions.ts`; `supabase/tests/rls_identity_test.sql`, `rls_ops_test.sql`.
- **Do:** Add request/response types for `provision-user`, `schedule-session`, `mark-assist`, `notify`. Write pgTAP (run as different `auth.uid()`s via `set local role / request.jwt.claims`): (a) student A can't read student B's `students`/`homework`/`notifications`; (b) a coach reads their roster, not another's; (c) `audit_log` insert from a non-service caller fails; (d) `notifications` visible to recipient only.
- **Done when:** `supabase test db` is green for your domains.

> **🔗 Phase-3 sync with Dev S:** a coach you provisioned can see a student's submission scored by Dev S's `score-submission`; your `schedule-session` writes a `class_sessions` row Dev S's live sync reads.

---

# PHASE 4 — Deploy & integrate (ship your half)

### Step 4.1 — Secrets
- **Do:** `supabase secrets set` on the **demo** project: `RESEND_API_KEY` (invite/notify emails) and `OPENAI_API_KEY` (for any replicated evaluator / `mark-assist`). These live in the self-learn project, **not** the demo — set them. **No Zoom creds needed** (no Zoom-notify feature). Nothing secret in the repo.
- **Done when:** `supabase secrets list` shows your keys.

### Step 4.2 — Apply migrations
- **Do:** `supabase db push` (or CI). Coordinate order with Dev S at the 🔗 (helpers `0009` → your `_rls` migrations → `0010_views`). Re-run pgTAP after push.
- **Done when:** the project has your RLS + views; tests green against it.

### Step 4.3 — Deploy your functions (per-function)
- **Do:** `supabase functions deploy provision-user schedule-session notify mark-assist coach-playbook reset-pilot`. Then `supabase functions list` and confirm the existing self-learn functions are unchanged.
- **Done when:** your 6 are ACTIVE; the 9 untouched.

### Step 4.4 — CI / deploy workflow
- **Do:** `.github/workflows/deploy.yml` pushes migrations + deploys **only this repo's** functions on merge to the integration branch; `ci.yml` runs lint + `supabase db lint` + pgTAP on PRs.
- **Done when:** a merge runs the pipeline green.

### Step 4.5 — Coach/admin smoke on the live project
- **Do:** `provision-user` → a real login + audit row; `schedule-session` → a session with the admin Zoom link; `notify` → a row + email; `mark-assist` → a draft from the existing evaluator; the 3 views return real numbers.
- **Done when:** all your critical paths pass against the live project.

> **🔗 Phase-4 joint smoke (with Dev S):** **you provision → schedule (Zoom link) → student submits → Dev S's `score-submission` scores it → the coach you provisioned sees the marked work.** Your half is shipped.

---

## Definition of done (Dev C)
- [ ] RLS on identity/enrollment/attendance/ops/comms tables, proven by pgTAP (cross-tenant denial; append-only audit).
- [ ] `provision-user` issues working logins + audit; `schedule-session` creates sessions with admin Zoom links.
- [ ] `mark-assist` reuses the existing evaluator; `coach-playbook` returns the live coaching aid (coach/admin only); `notify` writes + emails; `reset-pilot` works.
- [ ] `v_coach_load` / `v_attendance_rate` / `v_tutor_stats` return correct numbers.
- [ ] Your function I/O is in `@cueword/contract`; pilot seed loads.
- [ ] **Deployed:** secrets set; migrations pushed; your 6 functions ACTIVE with the existing 9 untouched; CI/deploy green; coach/admin smoke + joint smoke pass on the live project.
