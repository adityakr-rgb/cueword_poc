# Cueword — New Database Design

**One database, additive.** The tutored live-class product is added *alongside* the existing
self-learn consumer app, in the **same production Supabase project**, joined at `auth.users`.

> **Hard rule — the app database is production with real data.**
> The 14 existing app tables are **frozen**: not renamed, not re-typed, not dropped, no columns
> changed. Everything below is **additive only** (new tables + new nullable links). If a concept
> collides with an app table, we add a new table — we never touch the live one.

- **Total: 52 tables** = **14 existing (unchanged)** + **38 new (additive)**.
- Decision record: see the project memory note `cueword-db-merge-decision`.
- The new tables are the hardened curriculum architecture from `supabase/0001_production_schema.sql`,
  adapted for living in the production project (one rename + one bridge — see [The two seams](#the-two-seams)).

---

## Zone A — existing self-learn app (UNCHANGED, do not modify)

A B2C self-learn product: every user is a child. AI-generated stories, ELO/XP progression, daily
sessions, trials/companions. **Left exactly as-is.**

| Table | Purpose |
| ----- | ------- |
| `users` | Child accounts (`id` → `auth.users`). name, age, grade 3–10, companion, parent_pin, trial_*, parental_consent_*, device_id |
| `skill_profiles` | Per-`(user, skill)` self-learn progression: elo_rating, xp_level, total_xp, current_level_slug/order, unit/item index, learning_level |
| `sessions` | Daily self-learn session: date, completed, xp_earned, content_selections |
| `activity_results` | Per-activity result inside a session: skill, score, max_score, response, content_id |
| `streaks` | Daily streak state: current/longest, freeze_* |
| `content` | Self-learn content items + draft→in_review→approved→live→retired review pipeline; level_slug, unit_index, difficulty |
| `stories` | **AI-generation cache** — `manifest_hash`, `storyline`, `content_refs`, `model`. **NOT** authored curriculum (see seams) |
| `parent_otps` | OTP codes for the parent gate |
| `experiment_events` | A/B experiment event log |
| `rate_limits` | Per-user function rate limiting |
| `push_tokens` | Push-notification device tokens |
| `studio_profiles` | Content-studio staff (reviewer / admin) for the self-learn content pipeline |
| `deleted_trials` | Trial-deletion tracking by device_id |
| `app_config` | min_app_version + params |

---

## Zone B — new tutored live-class product (ADDITIVE)

A tutored product: admin / coach / parent / student roles, an authored curriculum hierarchy, live-class
realtime sync, coach marking, and a decoupled mastery engine. **5 skills:** `listen · read · vocab · speak · write`.

The model in one picture:

```
stages (10) → terms (3/stage) → levels (8/term) → class_stories (10/level)
   → story_sections (listen·read·speak·write) → questions (+ question_keys)

TWO SURFACES        STORY   = story_attempts · question_answers · submissions
                    WORKOUT = workout_items (SRS) · workout_reviews · practice_responses

MASTERY (two tracks)  level ACCESS (points + per-skill stars)  vs  BELT credit (retention)
                      math lives in app/edge functions; DB stores state + engine_params
```

### B1 · Identity (role-aware layer over `auth.users`)

| Table | Key columns | Notes |
| ----- | ----------- | ----- |
| `profiles` | `id` → auth.users, `role` (admin/coach/student/parent), full_name, email, timezone, status | The role spine the app's `users` lacks — **where admin & coach accounts live** |
| `coaches` | `profile_id`, type, capacity, zoom_link, meta | Tutor detail |
| `parents` | `profile_id`, comms_prefs | Parent accounts |
| `students` | `profile_id`, grade, learning_mode (tutored/self_learn), parent_id, placement_stage_id, entry_term_id, current_level_id, eval_result_id, **`app_user_id` → `users.id` (nullable)** | The bridge to the self-learn app — see seams |

### B2 · Enrollment & onboarding

| Table | Key columns |
| ----- | ----------- |
| `eval_results` | student_id, grade, placement_stage_id, placement_term_id, per_skill_levels, report_url, evaluator_id |
| `enrollments` | student_id, coach_id, term_id, plan, status, start_date · unique (student, term) |
| `consent_records` | parent_id, student_id, type (coppa/recording/data_processing), granted_at, revoked_at |

### B3 · Curriculum hierarchy (admin-authored)

| Table | Key columns |
| ----- | ----------- |
| `stages` | number (1–10), belt, band, skill_anchor, pilot_grade |
| `terms` | stage_id, number (1–3), name · unique (stage, number) |
| `levels` | term_id, number_in_term (1–8), number_in_stage, lo, skill_register |
| `class_stories` | level_id, ord (1–10), key, title, theme, cover_emoji, scene, status · unique (level, ord) — **the renamed authored-story table** |

### B4 · Story content

| Table | Key columns |
| ----- | ----------- |
| `story_sections` | class_story_id, phase (listen/read/speak/write), content · unique (story, phase) |
| `questions` | section_id, type (8 types), skill (listen/read/vocab), rung, stem, hint, data (no answer) |
| `question_keys` | question_id (pk), correct · **RLS: coach/admin only — students never read answers** |
| `story_vocab` | class_story_id, word, definition, examples, is_top (top-3 seed the workout) |
| `teacher_tips` | class_story_id, phase, step_ref, tip_text |
| `practice_pack` | level_id, kind (micro_passage/micro_clip/production_prompt/sentence_surgery), skill, content |

### B5 · Live class (realtime sync spine)

| Table | Key columns |
| ----- | ----------- |
| `class_sessions` | enrollment_id, student_id, coach_id, class_story_id, scheduled_at, zoom_link, status, driver, current_step, current_phase, current_question_id · **realtime** |
| `session_events` | session_id, actor_id, actor_role, type (open_story/step/answer/phase/note), payload · **realtime** |
| `attendance` | student_id, session_id, status (present/late/absent/excused/scheduled) · unique (session, student) |

### B6 · Student work — the STORY surface

| Table | Key columns |
| ----- | ----------- |
| `story_attempts` | student_id, class_story_id, session_id (null = self-learn), accuracy, points_awarded, per_skill_scores, last_step |
| `question_answers` | attempt_id, student_id, question_id, answer, is_correct · unique (attempt, question) · **scored service-side** |
| `submissions` | student_id, origin (story/workout), section_id / practice_pack_id, skill (speak/write), body, content_url, score, tutor_feedback, marked_by, status |
| `ai_evaluations` | submission_id, status, result, model_used, tokens_in/out, cost_cents |
| `artifacts` | student_id, submission_id, type, content_url, title — the "My Works" portfolio |

### B7 · Workout / practice surface

| Table | Key columns |
| ----- | ----------- |
| `workout_items` | student_id, type (vocab/recall), source_class_story_id, payload, srs_state, ladder_step, due_at, matured · **SRS, service-managed** |
| `workout_reviews` | workout_item_id, student_id, correct, resulting_state, reviewed_at |
| `practice_responses` | student_id, practice_pack_id, skill, answer, score |

### B8 · Mastery engine state (all service-written)

| Table | Key columns |
| ----- | ----------- |
| `level_access` | student_id, level_id, points (0–Y), latched, stars (per-skill), status · unique (student, level) — **ACCESS track** |
| `belt_credit` | student_id, level_id, retained_pct, credited, credited_at · unique (student, level) — **BELT track** |
| `skill_trackers` | student_id, skill, rating, status (locked/unlocked/practised/mastered) · unique (student, skill) — 5 rows/student |

### B9 · Remediation & comms

| Table | Key columns |
| ----- | ----------- |
| `gap_packs` | skill_anchor, title, pdf_url |
| `gap_pack_assignments` | student_id, gap_pack_id, assigned_by, status · unique (student, pack) |
| `parent_comms` | student_id, coach_id, channel (whatsapp/email/sms), template, note, sent_at |

### B10 · Config + operational (added beyond the 36-table spec)

| Table | Key columns |
| ----- | ----------- |
| `engine_params` | key (pk), value, description — every "calibrate in pilot" number (Y, bar, SRS ladders) |
| `homework` | student_id, assigned_by, skill, title, type, class_story_id, submission_id, due_date, status |
| `notifications` | recipient_id, type, title, body, link, read |
| `audit_log` | actor_id, action, entity_type, entity_id, summary, diff — append-only (COPPA) |

---

## The two seams

These are the only two places the new product touches the old one. Everything else is fully independent.

### 1. `stories` is not shared — it's renamed in the new product

| | App (Zone A) | Tutored (Zone B) |
| --- | --- | --- |
| Table | `stories` | `class_stories` |
| Meaning | AI-generation cache | Hand-authored curriculum story |
| Shape | manifest_hash, storyline, content_refs, model | level_id, ord, title, scene, status + sections/questions/vocab/tips |
| Action | **untouched** | **new table** |

The app's `stories` keeps its name and data. The tutored authored stories live in `class_stories`,
and every dependent table (`story_sections`, `story_vocab`, `teacher_tips`, `story_attempts`,
`workout_items.source_class_story_id`, `class_sessions.class_story_id`, `homework.class_story_id`)
points there.

### 2. Identity bridge — `students.app_user_id` → `users.id` (nullable)

- A tutored student who is *also* a self-learn kid: link via `app_user_id`. Both can share one
  `auth.users.id`, but the explicit FK handles the case where a student is provisioned as a fresh
  auth user yet is the same human.
- A tutored-only student: `app_user_id` stays `null`.
- The app's `users` table is never written by the tutored product — the link is read-only from its side.

---

## Who writes what

| Role | Auth | Writes (new tables) |
| ---- | ---- | ------------------- |
| **Admin** | service role | all curriculum content, stages/levels/class_stories, accounts, enrollments |
| **Coach** | authenticated | session position, marks submissions, skill_trackers, attendance, parent_comms — own active students |
| **Student** | authenticated | own submissions, practice_responses, own class_session; raw work only |
| **Parent** | authenticated | read-only: own child's progress, sessions, marked work, comms |
| **Engine (edge fns)** | service role | story_attempts, question_answers, workout_items/reviews, level_access, belt_credit, skill_trackers, ai_evaluations |

> **Scores are never trusted from the client.** Auto-scored answers, attempts, SRS state and all
> mastery tables are written by service-role edge functions only. A guard trigger strips
> coach/score fields off student-inserted `submissions`. `question_keys` are coach/admin-only.

---

## RLS

- RLS + role-scoped policies are added **only on the 38 new tables**. The 14 app tables keep
  their existing policies, untouched.
- Helpers (SECURITY DEFINER, STABLE): `is_admin()`, `is_coach_of(student)`, `is_parent_of(student)`,
  `can_view_student(student)` = self ∨ admin ∨ active coach ∨ parent.
- Curriculum/content is readable by any authenticated user — except `question_keys`.
- `class_sessions` + `session_events` are on the realtime publication.

---

## Mastery engine

The engine math (Y=100, bar=80, SRS Leitner ladder, belt retention thresholds) lives in app/edge
functions — **not** in DB triggers — so every parameter calibrates during the pilot. The DB stores
state tables + the `engine_params` config table.

---

## Open micro-decisions (don't change the architecture)

1. **Table name** — `class_stories` (used here) vs `curriculum_stories` (the name the POC project used).
2. **Backfill?** — create a `profiles`/`students` row for every existing `users` kid, or only for
   actual tutored participants. Recommendation: **only tutored participants** (the bridge handles overlap).
3. **`studio_profiles` vs `profiles.role='admin'`** — keep the self-learn content staff table separate,
   or unify under profiles. Recommendation: **keep separate** for the pilot.

---

## How to apply

This is an **additive migration against the production app project** (not the POC project). It needs:
1. Access to the production Supabase project connected to tooling.
2. The migration SQL (rename → `class_stories`, identity layer, `app_user_id` bridge, the remaining
   new tables, RLS on new tables only). To be authored from `supabase/0001_production_schema.sql`
   with the two seam-edits applied, then adversarially validated before it touches live data.
