# Backend — Dev S Work Guide (Student · Curriculum · Live-sync · Work · Mastery domains)

> **Read first:** [BACKEND_REPO_STRUCTURE.md](BACKEND_REPO_STRUCTURE.md) (repo layout + conflict-free
> ownership). This is **your** end-to-end work for the new **Supabase-native backend repo**
> (`cueword-tutored-backend`, its own GitHub repo). Dev C's half: [BACKEND_STEPS_DEV_C.md](BACKEND_STEPS_DEV_C.md).
>
> **No frontend here.** Steps are **concrete spec** — exact tables, columns, and function logic — but
> not literal code (you/your AI write the SQL & TypeScript). Format: **Idea · Touch · Do · Done when.**
> 🔗 = sync with Dev C.

## Your domains
**Curriculum/content · Live-class realtime sync · Student work (story surface) · Workout/SRS · Mastery engine · Audio storage.**

| | You own |
|---|---|
| **Tables (RLS + seeds)** | `stages`, `terms`, `levels`, `class_stories`, `story_sections`, `questions`, `question_keys`, `story_vocab`, `teacher_tips`, `practice_pack`, `class_sessions`, `session_events`, `story_attempts`, `question_answers`, `submissions`, `ai_evaluations`, `artifacts`, `workout_items`, `workout_reviews`, `practice_responses`, `level_access`, `belt_credit`, `skill_trackers`, `engine_params` |
| **Edge Functions** | `score-submission`, `grade-answer`, `mastery-engine`, `srs-review` |
| **Reuse (don't build)** | `transcribe-audio`, `evaluate-writing`, `evaluate-speaking`, `generate-tts` (live in the self-learn project — replicate into the demo when needed, call by slug) |
| **Storage** | the submission-audio bucket + policies |

## Ground truth you're starting from
- **Stack = Supabase-native** (Postgres + Auth + Realtime + Storage; logic = Deno Edge Functions). **AI = OpenAI** (gpt-4o-mini / Whisper / tts-1) — **reuse the deployed functions; do not build scorers.** **No Anthropic/Claude.**
- **Tutored tables already exist** in the demo project (from the prod SQL / [NEW_DB_SCHEMA.md](NEW_DB_SCHEMA.md)). You write **RLS + functions + content seed + contract against existing tables — not the schema.**
- **THE HARD RULE:** *scores are never trusted from the client.* `question_answers.is_correct`, `story_attempts`, all mastery + SRS tables, and `submissions.score`/`ai_score` are **written only by your service-role functions.** `question_keys` are **coach/admin-readable only — students never read answers.**
- **`profiles.id = auth.users.id`**, so `current_profile_id()` = `auth.uid()`. Dev C ships the RLS helpers (`0009_rls_helpers.sql`) — you **consume** them.
- The 4 evaluators (`transcribe-audio`, `evaluate-writing`, `evaluate-speaking`, `generate-tts`) live in the **self-learn project** (a different project). **Replicate them into the demo project when needed (user-managed)** and call by slug; set `OPENAI_API_KEY` + a `rate_limits` table on the demo when you do. Deploy your own functions per-function.
- **Read before coding:** the Supabase Edge Functions + Realtime + Storage + RLS guides. Functions are **Deno**, not Node.

## Conflict-free commit rules (recap)
1. Edit only **your** function folders + **your** domain migrations. 2. Never edit a shipped/another dev's migration — add a new timestamped one. 3. RLS policies live **inside your domain's migration** (no shared RLS file). 4. `_shared/` + `packages/contract/` = announce before editing (CODEOWNERS = both). 5. Branches → PRs → integration branch.

## Your folder structure (✎ = you create · ⤷ = shared, coordinate · ▢ = generated/baseline)

```
cueword-tutored-backend/
├── supabase/
│   ├── config.toml                              ⤷ repo setup (Phase 0, with Dev C)
│   ├── migrations/
│   │   ├── <ts>_remote_schema.sql               ▢ baseline from `supabase db pull`
│   │   ├── <ts>_curriculum_rls.sql              ✎ stages..class_stories..questions + question_keys (COACH-ONLY)
│   │   ├── <ts>_live_class_rls.sql              ✎ class_sessions · session_events + REALTIME publication
│   │   ├── <ts>_work_rls.sql                    ✎ story_attempts · question_answers · submissions · ai_evaluations · artifacts + guard trigger
│   │   ├── <ts>_workout_rls.sql                 ✎ workout_items · workout_reviews · practice_responses
│   │   ├── <ts>_mastery_rls.sql                 ✎ level_access · belt_credit · skill_trackers · engine_params (service-write only)
│   │   └── 0011_storage.sql                     ✎ submission-audio bucket + storage policies
│   ├── functions/
│   │   ├── _shared/                             ⤷ shared lib (coordinate): openai · supabaseAdmin · auth · rateLimit · cors · errors
│   │   ├── grade-answer/index.ts                ✎ auto-score question_answers + roll up story_attempts
│   │   ├── score-submission/index.ts            ✎ transcribe→evaluate (REUSE)→write ai_score + ai_evaluations
│   │   ├── mastery-engine/index.ts              ✎ level_access + belt_credit + skill_trackers
│   │   └── srs-review/index.ts                  ✎ workout_items Leitner ladder
│   ├── seeds/{catalog,curriculum}.sql           ✎
│   └── tests/{rls_curriculum_test,rls_work_test}.sql  ✎
├── scripts/{seed-content.ts,gen-types.sh}       ✎ / ⤷
├── packages/contract/src/{domain.ts,ai.ts}      ✎   (functions.ts = ⤷ shared)
└── docs/ENGINE.md                                ✎ mastery/SRS params + math
```

> **Do NOT touch** (Dev C owns): identity/enrollment/ops migrations, the RLS-helpers + `views` migrations, `functions/{provision-user,schedule-session,notify,mark-assist,coach-playbook,reset-pilot}/`, `seeds/pilot.sql`. The existing **9 deployed functions** (incl. the `evaluate-*` you reuse) live in the self-learn app's repo — **call them, never copy them here.**

---

# PHASE 0 — Repo + foundation (shared; Dev C LEADS, you consume + own storage)

### Step 0.1 — Repo + link + baseline — 🔗 with Dev C
- **Idea:** Same linked repo; capture the live schema so migrations match reality.
- **Do:** With Dev C: `supabase init`, `supabase link --project-ref <demo-ref>`, `supabase db pull` (baseline). Open the baseline and **confirm your tables exist**: `stages, terms, levels, class_stories, story_sections, questions, question_keys, story_vocab, teacher_tips, practice_pack, class_sessions, session_events, story_attempts, question_answers, submissions, ai_evaluations, artifacts, workout_items, workout_reviews, practice_responses, level_access, belt_credit, skill_trackers, engine_params`. Any missing vs [NEW_DB_SCHEMA.md](NEW_DB_SCHEMA.md) → small additive `CREATE TABLE IF NOT EXISTS` migration.
- **Done when:** `supabase db diff` is clean; your tables confirmed.

### Step 0.2 — Consume the RLS helpers — 🔗
- **Do:** Use Dev C's `current_profile_id()`, `is_admin()`, `is_coach_of(student)`, `is_parent_of(student)`, `can_view_student(student)` (from `0009_rls_helpers.sql`) in all your policies. Don't redefine them.
- **Done when:** your policies compile referencing the helpers.

### Step 0.3 — Realtime + Storage foundation (`<ts>_live_class_rls.sql` + `0011_storage.sql`)
- **Do:**
  - Add `class_sessions` + `session_events` to the realtime publication: `ALTER PUBLICATION supabase_realtime ADD TABLE public.class_sessions, public.session_events;`.
  - Create a private Storage bucket `submissions-audio`; storage policies: a student may `INSERT` objects under their own `student_id/` path; the owning student + their coach (`is_coach_of`) + admin may `SELECT`; no public read. App fetches via signed URLs.
- **Done when:** Realtime fires on those tables; only owner/coach can fetch an audio object.

> **🔗 Phase-0 sync:** confirm helpers + baseline with Dev C; agree the `submissions.ai_score` jsonb shape and the `engine_params` keys (Y, bar, ladder, belt thresholds).

---

# PHASE 1 — RLS on your domain tables (one migration per group; policies inline)

> `ENABLE ROW LEVEL SECURITY` on each table, then add the policies. "service-role" = your Edge Functions (bypass RLS); notes below are for `authenticated`.

### Step 1.1 — Curriculum RLS (`<ts>_curriculum_rls.sql`) — answers hidden!
- **Touch:** `stages`, `terms`, `levels`, `class_stories`, `story_sections`, `questions`, `story_vocab`, `teacher_tips`, `practice_pack`, **`question_keys`**.
- **Do — exact policies:**
  - `stages`, `terms`, `levels`, `class_stories`, `story_sections`, `questions`, `story_vocab`, `practice_pack` — SELECT: **any `authenticated`** (curriculum is shared/readable). INSERT/UPDATE/DELETE: `is_admin()` (authoring is admin/service).
  - **`question_keys`** — SELECT: **`current_role() IN ('coach','admin')` ONLY** (this is the critical one — `questions.data` carries no answer; the answer lives here). INSERT/UPDATE: `is_admin()`.
  - **`teacher_tips`** — SELECT: `current_role() IN ('coach','admin')`. INSERT/UPDATE: `is_admin()`.
- **Done when:** `rls_curriculum_test.sql` proves a student can SELECT a `questions` row but gets **zero rows** from `question_keys`.

### Step 1.2 — Live-class RLS (`<ts>_live_class_rls.sql`)
- **Touch:** `class_sessions`, `session_events`.
- **Do — exact policies:**
  - **`class_sessions`** — SELECT: `student_id = current_profile_id() OR coach_id = current_profile_id() OR is_admin()`. UPDATE (sync fields `current_step`/`current_phase`/`current_question_id`/`status`/`driver`): the **student when `driver='student'`**, the **coach when `driver='coach'`**, or admin. INSERT: `is_admin()` / service-role (Dev C's `schedule-session` creates them — coordinate that service-role insert is allowed).
  - **`session_events`** — SELECT: caller is the session's student or coach (`EXISTS class_sessions cs WHERE cs.id = session_id AND (cs.student_id = current_profile_id() OR cs.coach_id = current_profile_id())`) `OR is_admin()`. INSERT: same participant check, with `actor_id = current_profile_id()`. **No UPDATE/DELETE** (append-only stream).
- **Done when:** a non-participant gets zero rows from a session and cannot insert an event into it.

### Step 1.3 — Work RLS + guard trigger (`<ts>_work_rls.sql`)
- **Touch:** `story_attempts`, `question_answers`, `submissions`, `ai_evaluations`, `artifacts`.
- **Do — exact policies:**
  - **`submissions`** — SELECT: `student_id = current_profile_id() OR is_coach_of(student_id) OR is_admin()`. INSERT: `student_id = current_profile_id()` (student submits **raw** `body`/`content_url`/`skill`/`origin` only). UPDATE: split — the **student** may update only their raw fields before marking; the **coach** (`is_coach_of`) may update `tutor_feedback`/`marked_by`/`status` (coach marking). `score`/`ai_score` are **never** client-written (see trigger).
  - **Guard trigger** on `submissions` (BEFORE INSERT/UPDATE, for non-service callers): null out / reject changes to `score`, `ai_score`, `marked_by` on student inserts — so a student can't self-grade. (Coaches may set `tutor_feedback`/`status`; the engine sets `score`/`ai_score`.)
  - **`question_answers`** — SELECT: `student_id = current_profile_id() OR is_coach_of(student_id) OR is_admin()`. INSERT: `student_id = current_profile_id()` but **`is_correct` must be NULL on insert** (a trigger forces it null; `grade-answer` sets it). UPDATE: service-role only.
  - **`story_attempts`** — SELECT: `can_view_student(student_id)`. INSERT/UPDATE: **service-role only** (rolled up by `grade-answer`/`score-submission`).
  - **`ai_evaluations`** — SELECT: `is_coach_of(submission.student_id) OR student owns OR is_admin()`. INSERT/UPDATE: **service-role only** (`score-submission`).
  - **`artifacts`** — SELECT: `can_view_student(student_id)`. INSERT: `student_id = current_profile_id()` or service-role.
- **Done when:** `rls_work_test.sql` proves a student-inserted `submission` with a `score` has it **stripped**, and a client `UPDATE story_attempts` fails.

### Step 1.4 — Workout + mastery RLS (`<ts>_workout_rls.sql`, `<ts>_mastery_rls.sql`)
- **Touch:** `workout_items`, `workout_reviews`, `practice_responses`, `level_access`, `belt_credit`, `skill_trackers`, `engine_params`.
- **Do — exact policies:**
  - **`workout_items`** — SELECT: `student_id = current_profile_id() OR is_coach_of(student_id) OR is_admin()`. INSERT/UPDATE (`srs_state`/`ladder_step`/`due_at`/`matured`): **service-role only** (`srs-review`).
  - **`workout_reviews`** — SELECT: owner/coach/admin. INSERT: `student_id = current_profile_id()` (the raw review result); the ladder math is service-side.
  - **`practice_responses`** — SELECT: owner/coach/admin. INSERT: `student_id = current_profile_id()`; `score` set service-side.
  - **`level_access`**, **`belt_credit`**, **`skill_trackers`** — SELECT: `can_view_student(student_id)`. INSERT/UPDATE: **service-role only** (`mastery-engine`).
  - **`engine_params`** — SELECT: any `authenticated` (read tunables). INSERT/UPDATE: `is_admin()`.
- **Done when:** a client write to any mastery/SRS table is rejected; reads are correctly scoped.

---

# PHASE 2 — Your Edge Functions (logic outlines; all service-role writers)

> Each: `Deno.serve`, `OPTIONS`+`POST`; service-role client (`_shared/supabaseAdmin.ts`); verify caller (`_shared/auth.ts`); reuse the `rate_limits` pattern.

### Step 2.1 — `grade-answer` (auto-score; client never sees the key)
- **Touch:** `functions/grade-answer/`.
- **Do — logic flow:**
  1. Auth: caller must own the attempt (`student_id = current_profile_id()`) or be its coach.
  2. Input `{ attempt_id, answers: [{ question_id, answer }] }`.
  3. For each: load `question_keys.correct` (service-role can read it), compare against `answer` per the question `type` (mcq/multi/truefalse/tap/sequence/cloze/match/short — match logic per type), set `question_answers.is_correct` (UPSERT on `(attempt_id, question_id)`).
  4. Roll up `story_attempts`: recompute `accuracy` (correct/total), `points_awarded`, `per_skill_scores`, `last_step`.
  5. Return the per-question results + the rolled-up attempt. (Optionally trigger `mastery-engine`.)
- **Done when:** answers are scored server-side; the client never receives `question_keys` and never sets `is_correct`.

### Step 2.2 — `score-submission` (the reuse hub for speak/write)
- **Touch:** `functions/score-submission/`.
- **Do — logic flow:**
  1. Auth: caller owns the submission or is its coach.
  2. Input `{ submission_id }`. Load the `submissions` row (`skill`, `body`, `content_url`, `student_id`, `section_id`) + the student's `grade` + the section's `prompt`/`nudge`/`sampleAnswer`.
  3. **If `skill = 'speak'`** (audio in `content_url`): fetch the audio (signed URL), call existing **`transcribe-audio`** (multipart `file`) → `{ text }`; then call existing **`evaluate-speaking`** with `{ grade, prompt, nudge, sampleAnswer, transcription: text }`.
     **If `skill = 'write'`:** call existing **`evaluate-writing`** with `{ grade, prompt, nudge, response: body }`.
  4. **Persist** (service-role): write the returned rubric into `submissions.ai_score` (jsonb) and `submissions.score` (the `total`); set `status = 'ai_scored'`; insert `ai_evaluations { submission_id, status:'done', result: rubric, model_used:'gpt-4o-mini'|'whisper-1', tokens_in/out, cost_cents }`.
  5. Return the rubric.
- **Done when:** a raw speak/write submission ends with a persisted rubric (writing `/40`, speaking `/50`) sourced from the existing evaluators + an `ai_evaluations` row.

### Step 2.3 — `mastery-engine` (ACCESS + BELT + skill trackers)
- **Touch:** `functions/mastery-engine/`; reads `engine_params`.
- **Do — logic flow:**
  1. Input `{ student_id, level_id, trigger: 'attempt'|'review' }`. Auth: service-role / coach / owner.
  2. Read tunables from `engine_params` (`Y` points-to-pass, `bar` per-skill star threshold, belt retention threshold).
  3. **ACCESS track** — recompute `level_access { student_id, level_id }`: add `points` from the latest `story_attempts.points_awarded`; set per-skill `stars` when a skill's score ≥ `bar`; set `status='passed'`/`latched` when `points ≥ Y` and all 5 stars earned.
  4. **BELT track** — recompute `belt_credit { student_id, level_id }`: `retained_pct` from matured `workout_items` retention; set `credited=true` when ≥ threshold.
  5. **`skill_trackers`** — update each of the 5 skills' `status` (locked→unlocked→practised→mastered) + `rating`.
  6. UPSERT all three (unique on `(student, level)` / `(student, skill)`).
- **Done when:** finishing work advances the right mastery state exactly per the `engine_params` values (change a param → behavior changes, no code edit).

### Step 2.4 — `srs-review` (workout spaced repetition)
- **Touch:** `functions/srs-review/`.
- **Do — logic flow:**
  1. Input `{ workout_item_id, correct }`. Auth: owner / service.
  2. Insert `workout_reviews { workout_item_id, student_id, correct, resulting_state, reviewed_at }`.
  3. Update `workout_items`: on `correct` → advance `ladder_step` and push `due_at` per the Leitner intervals in `engine_params`; mark `matured` at the top rung. On wrong → reset `ladder_step`, set a short `due_at`.
- **Done when:** a correct review climbs the ladder + extends `due_at`; a wrong one resets it.

---

# PHASE 3 — Content migration, contract, tests

### Step 3.1 — Catalog + curriculum content seed
- **Touch:** `supabase/seeds/catalog.sql`, `curriculum.sql`; `scripts/seed-content.ts`.
- **Do:**
  - `catalog.sql`: seed `engine_params` defaults (`Y=100`, `bar=80`, the Leitner ladder, belt thresholds) + any skill/belt/genre catalogs.
  - `seed-content.ts`: read the authored source stories and INSERT into `class_stories` (level_id, ord, key, title, theme, cover_emoji, scene, status) → `story_sections` (one per phase: listen/read/speak/write, `content` jsonb) → `questions` (type, skill, rung, stem, hint, `data` — **no answer**) → **`question_keys`** (the `correct` value) → `story_vocab` (word, definition, examples, is_top). Coordinate the `class_stories` shape with Dev C (their assignment/scheduling reads it).
- **Done when:** a full level of stories is queryable with sections, questions, coach-only keys, and vocab.

### Step 3.2 — Your contract types
- **Touch:** `packages/contract/src/domain.ts`, `ai.ts`, `functions.ts`.
- **Do:**
  - `domain.ts`: hand-author `Story`, the `Question` union (8 types: mcq/multi/truefalse/tap/sequence/cloze/match/short), `RenderState` (`{ storyKey, stepIndex, phase, status, driver }`), `Role`.
  - `ai.ts`: the **real** OpenAI rubric shapes — `WritingScore { grammar, structure, vocab, conventions, total/40, xpDelta, summary, feedback:{<crit>:{description, examples:[{original,improved,tip}]}} }` and `SpeakingScore { …, fluency, relevance, total/50 }`.
  - `functions.ts`: request/response types for `grade-answer`, `score-submission`, `mastery-engine`, `srs-review`.
- **Done when:** `packages/contract` compiles; a frontend could import these.

### Step 3.3 — pgTAP tests
- **Touch:** `supabase/tests/rls_curriculum_test.sql`, `rls_work_test.sql`.
- **Do:** Prove (a) a student gets **zero rows** from `question_keys`; (b) a student-inserted `submission` has `score`/`ai_score` **stripped** by the guard trigger; (c) a client `UPDATE` on `story_attempts`/`level_access`/`workout_items` **fails**; (d) a non-participant can't read a `class_session` or insert a `session_event`.
- **Done when:** `supabase test db` is green for your domains.

> **🔗 Phase-3 sync with Dev C:** a `class_sessions` row Dev C's `schedule-session` created runs your live sync; a submission a student makes is scored by `score-submission` and visible to the coach Dev C provisioned.

---

# PHASE 4 — Deploy & integrate (ship your half)

### Step 4.1 — Confirm secrets (you mostly reuse)
- **Do:** When you replicate the evaluators into the demo project, set `OPENAI_API_KEY` on the **demo** project (it's not there by default — it lives in the self-learn project) and create the `rate_limits` table. `score-submission` itself needs no new secret.
- **Done when:** `supabase secrets list` on the demo shows `OPENAI_API_KEY`; the replicated evaluators respond.

### Step 4.2 — Apply migrations (after the helpers)
- **Do:** `supabase db push` (or CI), coordinating order with Dev C (helpers `0009` → your `_rls` migrations → `0011_storage`). Re-run pgTAP — especially the `question_keys`-hidden + self-grade-blocked tests.
- **Done when:** the project has your RLS + realtime publication + storage bucket; tests green.

### Step 4.3 — Deploy your functions (per-function)
- **Do:** `supabase functions deploy grade-answer score-submission mastery-engine srs-review`. Confirm `score-submission` can `functions.invoke('transcribe-audio'|'evaluate-writing'|'evaluate-speaking')`. `supabase functions list` → existing 9 unchanged.
- **Done when:** your 4 are ACTIVE; the 9 untouched.

### Step 4.4 — Content + verification
- **Do:** Run `seed-content.ts` against the project; confirm a full level of `class_stories` (+ sections/coach-only keys/vocab) is queryable; confirm adding a new story is **data-only** (no code change).
- **Done when:** stories render from the DB; adding one is data-only.

### Step 4.5 — Student-loop smoke on the live project
- **Do:** A student submits speak/write → `score-submission` persists a rubric (`/40`,`/50`) via the existing evaluators; `grade-answer` scores MCQs server-side (client never sees the key); `mastery-engine` advances `level_access`/`skill_trackers`; `srs-review` updates a `workout_items.due_at`; Realtime fires on `session_events`.
- **Done when:** all your critical paths pass against the live project.

> **🔗 Phase-4 joint smoke (with Dev C):** **Dev C provisions → schedules a session → a student submits → your `score-submission` scores it → the provisioned coach sees the marked work.** Your half is shipped.

---

## Definition of done (Dev S)
- [ ] RLS on curriculum/live/work/workout/mastery tables, proven by pgTAP — **`question_keys` hidden from students; client can't self-grade.**
- [ ] `grade-answer` + `score-submission` (reusing the existing evaluators/transcription) write scores server-side into `question_answers`/`story_attempts`/`submissions.ai_score`/`ai_evaluations`.
- [ ] `mastery-engine` + `srs-review` advance `level_access`/`belt_credit`/`skill_trackers`/`workout_items` from `engine_params`.
- [ ] `class_sessions` + `session_events` on Realtime; audio Storage bucket + policies live.
- [ ] Authored stories seeded into `class_stories` + sections/questions/keys/vocab.
- [ ] Domain model + function I/O in `@cueword/contract`.
- [ ] **Deployed:** RLS + realtime + storage pushed; your 4 functions ACTIVE (reusing the existing evaluators) with the existing 9 untouched; content seeded; student-loop smoke + joint smoke pass on the live project.
