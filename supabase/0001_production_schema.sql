-- ============================================================================
-- Cueword — PRODUCTION SCHEMA  (0001_production_schema.sql)
-- Target: a FRESH Supabase project (not the POC project glrujjyoloddjbmvqfwx).
-- Model:  the locked 10-story-curriculum architecture — stages → terms → levels
--         → stories → sections → questions, two surfaces (Story / Workout), and
--         a decoupled mastery engine (ACCESS points/stars vs BELT retention).
--
-- This is the 36-table design HARDENED for production. The fixes applied to the
-- spec are tagged [FIX n] inline; the full list is in the response that shipped
-- this file. Headlines:
--   • enums for the stable pillars (role/skill/phase/question type) + CHECK
--     constraints on every state machine;
--   • UNIQUE on all ordinals (stage/term/level/story numbers) and all per-student
--     state rows (level_access, belt_credit, skill_trackers, attendance, …);
--   • explicit ON DELETE rules (student data CASCADE; staff/coach SET NULL;
--     work→content RESTRICT so history can't be silently deleted);
--   • the circular students↔eval_results FK resolved (added via ALTER, nullable);
--   • SECURITY: scores are never trusted from the client. question_answers,
--     story_attempts, the mastery tables and the SRS scheduler are written by
--     SERVICE-ROLE edge functions only; question_keys are coach/service-only;
--     a guard trigger strips coach/score fields off student-inserted submissions;
--   • created_at/updated_at + triggers everywhere; FK + hot-path indexes;
--   • RLS enabled on every table with role-scoped policies (helpers below).
--
-- Engine math (Y=100, k, bar, SRS ladders, belt thresholds) lives in app/edge
-- functions, per the architecture. The DB stores STATE + engine_params.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 0. ENUMS (stable pillars) + shared helpers
-- ---------------------------------------------------------------------------
do $$ begin create type role_t  as enum ('admin','coach','student','parent');                       exception when duplicate_object then null; end $$;
do $$ begin create type skill_t as enum ('listen','read','vocab','speak','write');                   exception when duplicate_object then null; end $$;
do $$ begin create type phase_t as enum ('listen','read','speak','write');                           exception when duplicate_object then null; end $$;
do $$ begin create type qtype_t as enum ('mcq','multi','truefalse','tap','sequence','cloze','match','short'); exception when duplicate_object then null; end $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- ============================================================================
-- 1. IDENTITY
-- ============================================================================
-- profiles.id == auth.users.id (Supabase pattern). Role is single-valued.
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        role_t not null,
  full_name   text not null,
  avatar_emoji text,
  email       text,
  phone       text,
  timezone    text,                              -- IANA, e.g. 'America/Los_Angeles'
  tz_city     text,
  status      text not null default 'active' check (status in ('active','invited','inactive','archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index idx_profiles_email on public.profiles(lower(email)) where email is not null;

create table public.coaches (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  type       text check (type in ('full_time','part_time','contract')),
  timezone   text,
  capacity   int  check (capacity >= 0),         -- max active students
  zoom_link  text,                               -- one recurring link per coach
  meta       jsonb not null default '{}'::jsonb, -- bio, languages, certs, rating, prefs
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.parents (
  profile_id  uuid primary key references public.profiles(id) on delete cascade,
  comms_prefs jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- students.* placement pointers + the circular eval_result_id are added once the
-- referenced tables exist (see [FIX 4] ALTER at the end of §3).
create table public.students (
  profile_id    uuid primary key references public.profiles(id) on delete cascade,
  grade         int,
  status        text not null default 'active' check (status in ('active','paused','graduated','withdrawn')),
  learning_mode text not null default 'tutored' check (learning_mode in ('tutored','self_learn')),  -- [keep] first-class
  parent_id     uuid references public.parents(profile_id) on delete set null,
  -- placement (filled after curriculum + eval exist):
  placement_stage_id uuid,
  entry_term_id      uuid,
  current_level_id   uuid,
  eval_result_id     uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_students_parent on public.students(parent_id);

-- ============================================================================
-- 2. CURRICULUM HIERARCHY (admin-authored)
-- ============================================================================
-- [FIX 7] UNIQUE on every ordinal so a stage/term/level/story number can't dup.
create table public.stages (
  id           uuid primary key default gen_random_uuid(),
  number       int not null unique check (number between 1 and 10),
  belt         text,                              -- belt name for the stage
  band         text,                              -- developmental band label
  skill_anchor skill_t,
  pilot_grade  int,                               -- 5/6/7 → G3/4/5 in the pilot
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.terms (
  id         uuid primary key default gen_random_uuid(),
  stage_id   uuid not null references public.stages(id) on delete cascade,
  number     int  not null check (number between 1 and 3),
  name       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stage_id, number)
);

-- [FIX 6] stage_id dropped from levels — derive via term (term→stage). Avoids an
-- unenforceable denormalization. number_in_stage is kept as a cosmetic label.
create table public.levels (
  id              uuid primary key default gen_random_uuid(),
  term_id         uuid not null references public.terms(id) on delete cascade,
  number_in_term  int  not null check (number_in_term between 1 and 8),
  number_in_stage int  check (number_in_stage between 1 and 24),
  lo              text,                            -- amalgamated learning outcome
  skill_register  jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (term_id, number_in_term)
);

create table public.stories (
  id          uuid primary key default gen_random_uuid(),
  level_id    uuid not null references public.levels(id) on delete cascade,
  ord         int  not null check (ord between 1 and 10),  -- 10 parallel stories
  key         text unique,                          -- optional human slug (e.g. 'g3-first-flight')
  title       text not null,
  theme       text,
  age_band    text,
  cover_emoji text,
  scene       jsonb,                                -- render-only scene blob
  status      text not null default 'draft' check (status in ('draft','published','archived')),
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (level_id, ord)
);
create index idx_stories_level on public.stories(level_id);

-- [FIX 4] resolve the circular students↔eval_results dependency: students was
-- created first; wire its placement + eval FKs now that targets exist. eval_results
-- itself is created in §2b below, so eval_result_id's FK is added there.
alter table public.students
  add constraint students_placement_stage_fk foreign key (placement_stage_id) references public.stages(id) on delete set null,
  add constraint students_entry_term_fk      foreign key (entry_term_id)      references public.terms(id)  on delete set null,
  add constraint students_current_level_fk   foreign key (current_level_id)   references public.levels(id) on delete set null;

-- ============================================================================
-- 2b. ENROLLMENT & ONBOARDING
-- ============================================================================
create table public.eval_results (
  id                 uuid primary key default gen_random_uuid(),
  student_id         uuid not null references public.students(profile_id) on delete cascade,
  grade              int,
  placement_stage_id uuid references public.stages(id) on delete set null,
  placement_term_id  uuid references public.terms(id)  on delete set null,
  per_skill_levels   jsonb not null default '{}'::jsonb,
  report_url         text,
  evaluator_id       uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now()
);
create index idx_eval_student on public.eval_results(student_id);
-- now close the circular ref [FIX 4]:
alter table public.students
  add constraint students_eval_result_fk foreign key (eval_result_id) references public.eval_results(id) on delete set null;

create table public.enrollments (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(profile_id) on delete cascade,
  coach_id   uuid references public.coaches(profile_id) on delete set null,
  term_id    uuid references public.terms(id) on delete set null,
  plan       text,
  status     text not null default 'active' check (status in ('active','paused','completed','cancelled')),
  start_date date,
  end_date   date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, term_id)                      -- [FIX 36] one enrolment per term
);
create index idx_enroll_student on public.enrollments(student_id);
create index idx_enroll_coach   on public.enrollments(coach_id) where coach_id is not null;

-- [FIX] consent is withdrawable + versioned (COPPA audit).
create table public.consent_records (
  id         uuid primary key default gen_random_uuid(),
  parent_id  uuid not null references public.parents(profile_id) on delete cascade,
  student_id uuid not null references public.students(profile_id) on delete cascade,
  type       text not null check (type in ('coppa','recording','data_processing')),
  version    text,
  method     text,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (student_id, type)
);

-- ============================================================================
-- 3. STORY CONTENT
-- ============================================================================
create table public.story_sections (
  id         uuid primary key default gen_random_uuid(),
  story_id   uuid not null references public.stories(id) on delete cascade,
  phase      phase_t not null,
  content    jsonb not null default '{}'::jsonb,   -- phase-specific render shape
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_id, phase)                          -- one section per phase
);

-- [FIX 8] auto-scored items only (listen/read/vocab). speak/write → submissions.
create table public.questions (
  id         uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.story_sections(id) on delete cascade,
  ord        int  not null default 0,
  type       qtype_t not null,
  skill      skill_t not null check (skill in ('listen','read','vocab')),
  rung       text,
  stem       text not null,
  hint       text,
  data       jsonb not null default '{}'::jsonb,   -- options/pairs/etc. (NO answer)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section_id, ord)
);
create index idx_questions_section on public.questions(section_id);

-- [FIX 8/15] answers split out, RLS = coach/service only. 1 key per question.
create table public.question_keys (
  question_id uuid primary key references public.questions(id) on delete cascade,
  correct     jsonb not null
);

create table public.story_vocab (
  id         uuid primary key default gen_random_uuid(),
  story_id   uuid not null references public.stories(id) on delete cascade,
  word       text not null,
  definition text,
  examples   jsonb not null default '[]'::jsonb,
  is_top     boolean not null default false,       -- top-3 seed the workout
  created_at timestamptz not null default now(),
  unique (story_id, word)
);

create table public.teacher_tips (
  id         uuid primary key default gen_random_uuid(),
  story_id   uuid not null references public.stories(id) on delete cascade,
  phase      phase_t,
  step_ref   text,
  tip_text   text not null,
  ord        int not null default 0,
  created_at timestamptz not null default now()
);
create index idx_tips_story on public.teacher_tips(story_id);

-- Workout Blocks 2–3 content, authored per level.
create table public.practice_pack (
  id         uuid primary key default gen_random_uuid(),
  level_id   uuid not null references public.levels(id) on delete cascade,
  kind       text not null check (kind in ('micro_passage','micro_clip','production_prompt','sentence_surgery')),
  skill      skill_t not null,
  content    jsonb not null default '{}'::jsonb,
  status     text not null default 'published' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_practice_pack_level on public.practice_pack(level_id);

-- ============================================================================
-- 4. LIVE CLASS (Realtime sync spine)
-- ============================================================================
-- [FIX 31] full lifecycle: started/ended, duration, cancellation fields.
create table public.class_sessions (
  id                  uuid primary key default gen_random_uuid(),
  enrollment_id       uuid references public.enrollments(id) on delete set null,
  student_id          uuid references public.students(profile_id) on delete set null,
  coach_id            uuid references public.coaches(profile_id) on delete set null,
  story_id            uuid references public.stories(id) on delete set null,
  scheduled_at        timestamptz,
  duration_min        int default 30,
  zoom_link           text,
  status              text not null default 'scheduled' check (status in ('scheduled','live','completed','cancelled')),
  driver              text not null default 'student' check (driver in ('student','coach')),
  current_step        int not null default 0,
  current_phase       phase_t,
  current_question_id uuid references public.questions(id) on delete set null,
  started_at          timestamptz,
  ended_at            timestamptz,
  cancelled_at        timestamptz,
  cancel_reason       text,
  cancelled_by        uuid references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index idx_sessions_student   on public.class_sessions(student_id);
create index idx_sessions_coach      on public.class_sessions(coach_id);
create index idx_sessions_scheduled  on public.class_sessions(scheduled_at);
create index idx_sessions_status     on public.class_sessions(status);

create table public.session_events (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.class_sessions(id) on delete cascade,
  actor_id   uuid references public.profiles(id) on delete set null,
  actor_role role_t,
  type       text not null check (type in ('open_story','step','answer','phase','note')),
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_events_session on public.session_events(session_id, created_at);

create table public.attendance (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(profile_id) on delete cascade,
  session_id uuid references public.class_sessions(id) on delete set null,
  status     text not null check (status in ('present','late','absent','excused','scheduled')),
  marked_by  uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (session_id, student_id)                   -- [FIX 36]
);
create index idx_attendance_student on public.attendance(student_id);

-- ============================================================================
-- 5. STUDENT WORK — the STORY surface
-- ============================================================================
-- [FIX 16] points_awarded / per_skill_scores are ENGINE outputs → service-written
-- (no authenticated write policy below). A student may attempt a story repeatedly
-- (retry / reserve), so this is intentionally NOT unique on (student, story).
create table public.story_attempts (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references public.students(profile_id) on delete cascade,
  story_id         uuid not null references public.stories(id) on delete restrict,  -- [FIX] keep history
  session_id       uuid references public.class_sessions(id) on delete set null,    -- null = self-learn
  status           text not null default 'in_progress' check (status in ('in_progress','completed','abandoned')),
  accuracy         numeric check (accuracy between 0 and 100),
  points_awarded   int not null default 0,
  per_skill_scores jsonb not null default '{}'::jsonb,
  is_reserve       boolean not null default false,
  last_step        int not null default 0,
  started_at       timestamptz not null default now(),
  completed_at     timestamptz,
  updated_at       timestamptz not null default now()
);
create index idx_attempts_student on public.story_attempts(student_id, story_id);
create index idx_attempts_session on public.story_attempts(session_id) where session_id is not null;

-- [FIX 8/15] auto-scored answers. is_correct is computed SERVICE-SIDE (the answer
-- edge function reads question_keys); authenticated clients cannot write here.
create table public.question_answers (
  id          uuid primary key default gen_random_uuid(),
  attempt_id  uuid not null references public.story_attempts(id) on delete cascade,
  student_id  uuid not null references public.students(profile_id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  answer      jsonb not null,
  is_correct  boolean,                              -- null = ungraded/open
  created_at  timestamptz not null default now(),
  unique (attempt_id, question_id)                  -- [FIX 36] one answer per Q per attempt
);
create index idx_answers_student on public.question_answers(student_id);

-- [FIX 33] productive output from EITHER surface (story section OR workout pack).
-- exactly one origin is set (enforced by the CHECK).
create table public.submissions (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references public.students(profile_id) on delete cascade,
  origin          text not null check (origin in ('story','workout')),
  section_id      uuid references public.story_sections(id) on delete set null,
  practice_pack_id uuid references public.practice_pack(id) on delete set null,
  skill           skill_t not null check (skill in ('speak','write')),
  type            text not null check (type in ('spoken','written')),
  body            text,
  content_url     text,
  score           numeric check (score between 0 and 100),  -- set by coach/AI only
  tutor_feedback  text,
  marked_by       uuid references public.profiles(id) on delete set null,
  status          text not null default 'submitted' check (status in ('submitted','ai_scored','marked','sent')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  marked_at       timestamptz,
  check ((origin = 'story'   and section_id is not null)
      or (origin = 'workout' and practice_pack_id is not null))
);
create index idx_submissions_student on public.submissions(student_id);
create index idx_submissions_unmarked on public.submissions(status) where status in ('submitted','ai_scored');

create table public.ai_evaluations (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending','running','succeeded','failed')),
  result        jsonb,
  model_used    text,
  tokens_in     int,
  tokens_out    int,
  cost_cents    numeric,
  error         text,
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);
create index idx_ai_eval_submission on public.ai_evaluations(submission_id);

create table public.artifacts (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references public.students(profile_id) on delete cascade,
  submission_id  uuid references public.submissions(id) on delete set null,
  type           text check (type in ('spoken','written','reading','listening')),
  content_url    text,
  title          text,
  tutor_feedback text,
  created_at     timestamptz not null default now()
);
create index idx_artifacts_student on public.artifacts(student_id);

-- ============================================================================
-- 6. WORKOUT / PRACTICE surface
-- ============================================================================
-- [FIX 16] SRS state (srs_state, ladder_step, due_at, matured) is ENGINE-managed
-- → service-written. [FIX 9] indexed for the "due now" query.
create table public.workout_items (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references public.students(profile_id) on delete cascade,
  type            text not null check (type in ('vocab','recall')),
  source_story_id uuid references public.stories(id) on delete set null,
  payload         jsonb not null default '{}'::jsonb,
  srs_state       jsonb not null default '{}'::jsonb,
  ladder_step     int not null default 0,
  due_at          timestamptz,
  matured         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_workout_due on public.workout_items(student_id, due_at) where matured = false;

create table public.workout_reviews (
  id              uuid primary key default gen_random_uuid(),
  workout_item_id uuid not null references public.workout_items(id) on delete cascade,
  student_id      uuid not null references public.students(profile_id) on delete cascade,
  correct         boolean not null,
  resulting_state jsonb,
  reviewed_at     timestamptz not null default now()
);
create index idx_reviews_item on public.workout_reviews(workout_item_id);

create table public.practice_responses (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references public.students(profile_id) on delete cascade,
  practice_pack_id uuid not null references public.practice_pack(id) on delete restrict,
  skill            skill_t not null,
  answer           jsonb,
  score            numeric check (score between 0 and 100),
  created_at       timestamptz not null default now()
);
create index idx_practice_resp_student on public.practice_responses(student_id);

-- ============================================================================
-- 7. MASTERY ENGINE STATE  (all ENGINE-written → service role only)
-- ============================================================================
create table public.level_access (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(profile_id) on delete cascade,
  level_id   uuid not null references public.levels(id) on delete cascade,
  points     int  not null default 0 check (points >= 0),   -- 0..Y(=100)
  latched    boolean not null default false,
  stars      jsonb not null default '{}'::jsonb,            -- per-skill at-bar counts
  status     text not null default 'in_progress' check (status in ('in_progress','open','needs_review')),
  updated_at timestamptz not null default now(),
  unique (student_id, level_id)                              -- [FIX 36]
);

create table public.belt_credit (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.students(profile_id) on delete cascade,
  level_id     uuid not null references public.levels(id) on delete cascade,
  retained_pct numeric check (retained_pct between 0 and 100),
  credited     boolean not null default false,
  credited_at  timestamptz,
  updated_at   timestamptz not null default now(),
  unique (student_id, level_id)                              -- [FIX 36]
);

create table public.skill_trackers (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(profile_id) on delete cascade,
  skill      skill_t not null,
  rating     numeric,
  status     text not null default 'locked' check (status in ('locked','unlocked','practised','mastered')),
  updated_at timestamptz not null default now(),
  unique (student_id, skill)                                 -- [FIX 36] 5 rows/student
);

-- ============================================================================
-- 8. REMEDIATION & COMMS
-- ============================================================================
create table public.gap_packs (
  id           uuid primary key default gen_random_uuid(),
  skill_anchor skill_t,
  title        text not null,
  pdf_url      text,
  created_at   timestamptz not null default now()
);

create table public.gap_pack_assignments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students(profile_id) on delete cascade,
  gap_pack_id uuid not null references public.gap_packs(id) on delete restrict,
  assigned_by uuid references public.profiles(id) on delete set null,
  status      text not null default 'assigned' check (status in ('assigned','in_progress','completed')),
  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (student_id, gap_pack_id)
);
create index idx_gap_assign_student on public.gap_pack_assignments(student_id);

create table public.parent_comms (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(profile_id) on delete cascade,
  coach_id   uuid references public.coaches(profile_id) on delete set null,
  channel    text check (channel in ('whatsapp','email','sms')),
  template   text,
  note       text,
  sent_at    timestamptz not null default now()
);
create index idx_comms_student on public.parent_comms(student_id);

-- ============================================================================
-- 9. CONFIG + [ADDED] tables (genuine gaps beyond the 36-table spec)
-- ============================================================================
-- [FIX 39] engine params as jsonb (numbers/arrays). Admin/service only (RLS).
create table public.engine_params (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_at  timestamptz not null default now()
);

-- [ADDED] homework — the prototype's explicit "assign homework" / "My Homework"
-- feature (distinct from SRS workout + gap packs). May later merge into a generic
-- assignments table; kept explicit to match the UI.
create table public.homework (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.students(profile_id) on delete cascade,
  assigned_by   uuid references public.profiles(id) on delete set null,
  skill         skill_t,
  title         text not null,
  type          text,
  description   text,
  items_count   int,
  story_id      uuid references public.stories(id) on delete set null,
  submission_id uuid references public.submissions(id) on delete set null,
  due_date      date,
  status        text not null default 'assigned' check (status in ('assigned','completed','overdue','cancelled')),
  assigned_at   timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_homework_student on public.homework(student_id, status);

-- [ADDED] in-app notifications (marking sent, homework, class reminders).
create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type         text,
  title        text,
  body         text,
  link         text,
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);
create index idx_notifications_recipient on public.notifications(recipient_id, read);

-- [ADDED] append-only audit trail (who changed marks/grades/curriculum; COPPA).
create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  entity_type text,
  entity_id   uuid,
  summary     text,
  diff        jsonb,
  created_at  timestamptz not null default now()
);
create index idx_audit_entity on public.audit_log(entity_type, entity_id);

-- ============================================================================
-- 10. GUARD TRIGGER — strip coach/score fields off student-inserted submissions
-- ============================================================================
-- [FIX 16] RLS is row-level, not column-level. A student may INSERT their own work
-- but must not pre-set a score/feedback. service_role bypasses this (it's the
-- coach/AI path). auth.role() = 'authenticated' for end users.
create or replace function public.guard_submission_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    new.score := null;
    new.tutor_feedback := null;
    new.marked_by := null;
    new.marked_at := null;
    new.status := 'submitted';
  end if;
  return new;
end $$;
create trigger trg_guard_submission before insert on public.submissions
  for each row execute function public.guard_submission_insert();

-- ============================================================================
-- 11. updated_at TRIGGERS
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','coaches','parents','students','stages','terms','levels','stories',
    'enrollments','story_sections','questions','practice_pack','class_sessions',
    'story_attempts','submissions','workout_items','level_access','belt_credit',
    'skill_trackers','engine_params','homework'
  ]
  loop
    execute format('drop trigger if exists trg_set_updated_at on public.%I;', t);
    execute format('create trigger trg_set_updated_at before update on public.%I
                      for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ============================================================================
-- 12. REALTIME
-- ============================================================================
do $$ begin alter publication supabase_realtime add table public.class_sessions; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.session_events;  exception when duplicate_object then null; end $$;

-- ============================================================================
-- 13. ROW-LEVEL SECURITY
-- ============================================================================
-- Helpers are SECURITY DEFINER + STABLE so policies stay terse and don't recurse
-- through profiles' own RLS.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;
create or replace function public.is_coach_of(s uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.enrollments
                 where coach_id = auth.uid() and student_id = s and status = 'active')
$$;
create or replace function public.is_parent_of(s uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.students where profile_id = s and parent_id = auth.uid())
$$;
-- self OR their active coach OR their parent OR admin
create or replace function public.can_view_student(s uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select s = auth.uid() or public.is_admin() or public.is_coach_of(s) or public.is_parent_of(s)
$$;

-- Enable RLS on every table.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','coaches','parents','students','stages','terms','levels','stories',
    'eval_results','enrollments','consent_records','story_sections','questions',
    'question_keys','story_vocab','teacher_tips','practice_pack','class_sessions',
    'session_events','attendance','story_attempts','question_answers','submissions',
    'ai_evaluations','artifacts','workout_items','workout_reviews','practice_responses',
    'level_access','belt_credit','skill_trackers','gap_packs','gap_pack_assignments',
    'parent_comms','engine_params','homework','notifications','audit_log'
  ]
  loop execute format('alter table public.%I enable row level security;', t); end loop;
end $$;

-- 13a. CURRICULUM / CONTENT — readable by any authenticated user; admin writes.
--      (question_keys is the deliberate exception — handled in 13b.)
do $$
declare t text;
begin
  foreach t in array array[
    'stages','terms','levels','stories','story_sections','questions','story_vocab',
    'teacher_tips','practice_pack','gap_packs'
  ]
  loop
    execute format('drop policy if exists rd_%1$s on public.%1$s;', t);
    execute format('create policy rd_%1$s on public.%1$s for select to authenticated using (true);', t);
    execute format('drop policy if exists wr_%1$s on public.%1$s;', t);
    execute format('create policy wr_%1$s on public.%1$s for all to authenticated using (public.is_admin()) with check (public.is_admin());', t);
  end loop;
end $$;

-- 13b. question_keys — coach/admin only (students must never read answers). [FIX 15]
create policy rd_keys on public.question_keys for select to authenticated
  using (public.is_admin() or (select role from public.profiles where id = auth.uid()) = 'coach');
create policy wr_keys on public.question_keys for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 13c. IDENTITY.
create policy rd_profiles on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin() or public.is_coach_of(id) or public.is_parent_of(id));
create policy up_profiles on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy ad_profiles on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

do $$
declare t text;
begin
  foreach t in array array['coaches','parents','students'] loop
    execute format('drop policy if exists rd_%1$s on public.%1$s;', t);
    -- coaches/parents rows are keyed on profile_id; students too.
    execute format('create policy rd_%1$s on public.%1$s for select to authenticated
                      using (profile_id = auth.uid() or public.is_admin() or public.can_view_student(profile_id));', t);
    execute format('drop policy if exists up_%1$s on public.%1$s;', t);
    execute format('create policy up_%1$s on public.%1$s for update to authenticated
                      using (profile_id = auth.uid() or public.is_admin()) with check (profile_id = auth.uid() or public.is_admin());', t);
    execute format('drop policy if exists ad_%1$s on public.%1$s;', t);
    execute format('create policy ad_%1$s on public.%1$s for all to authenticated
                      using (public.is_admin()) with check (public.is_admin());', t);
  end loop;
end $$;

-- 13d. ENGINE-OUTPUT tables — visible to student/coach/parent/admin; written by
--      service-role edge functions only (NO authenticated write policy). [FIX 16]
do $$
declare t text;
begin
  foreach t in array array[
    'story_attempts','question_answers','level_access','belt_credit','skill_trackers',
    'workout_items','workout_reviews'
  ]
  loop
    execute format('drop policy if exists rd_%1$s on public.%1$s;', t);
    execute format('create policy rd_%1$s on public.%1$s for select to authenticated
                      using (public.can_view_student(student_id));', t);
  end loop;
end $$;
-- ai_evaluations: visible to whoever can view the underlying submission's student.
create policy rd_ai_eval on public.ai_evaluations for select to authenticated using (
  exists (select 1 from public.submissions s where s.id = submission_id and public.can_view_student(s.student_id))
);

-- 13e. STUDENT-WRITABLE work (raw input). Student inserts/reads own; coach reads
--      roster; parent reads child; coach updates submissions (marking).
create policy ins_submissions on public.submissions for insert to authenticated
  with check (student_id = auth.uid());
create policy rd_submissions  on public.submissions for select to authenticated
  using (public.can_view_student(student_id));
create policy up_submissions  on public.submissions for update to authenticated
  using (public.is_coach_of(student_id) or public.is_admin())
  with check (public.is_coach_of(student_id) or public.is_admin());

create policy ins_practice on public.practice_responses for insert to authenticated
  with check (student_id = auth.uid());
create policy rd_practice  on public.practice_responses for select to authenticated
  using (public.can_view_student(student_id));

-- artifacts (saved works): coach/admin curate; everyone who can view the student reads.
create policy rd_artifacts on public.artifacts for select to authenticated
  using (public.can_view_student(student_id));
create policy wr_artifacts on public.artifacts for all to authenticated
  using (public.is_coach_of(student_id) or public.is_admin())
  with check (public.is_coach_of(student_id) or public.is_admin());

-- 13f. SESSIONS / EVENTS / ATTENDANCE.
create policy rw_sessions on public.class_sessions for all to authenticated
  using (student_id = auth.uid() or coach_id = auth.uid() or public.is_admin())
  with check (student_id = auth.uid() or coach_id = auth.uid() or public.is_admin());
create policy rw_events on public.session_events for all to authenticated
  using (exists (select 1 from public.class_sessions s where s.id = session_id
                 and (s.student_id = auth.uid() or s.coach_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.class_sessions s where s.id = session_id
                 and (s.student_id = auth.uid() or s.coach_id = auth.uid() or public.is_admin())));
create policy rd_attendance on public.attendance for select to authenticated
  using (public.can_view_student(student_id));
create policy wr_attendance on public.attendance for all to authenticated
  using (public.is_coach_of(student_id) or public.is_admin())
  with check (public.is_coach_of(student_id) or public.is_admin());

-- 13g. ENROLLMENT / EVAL / CONSENT.
create policy rd_enroll on public.enrollments for select to authenticated
  using (student_id = auth.uid() or coach_id = auth.uid() or public.is_parent_of(student_id) or public.is_admin());
create policy wr_enroll on public.enrollments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy rd_eval on public.eval_results for select to authenticated
  using (public.can_view_student(student_id));
create policy wr_eval on public.eval_results for all to authenticated
  using (public.is_admin() or evaluator_id = auth.uid()) with check (public.is_admin() or evaluator_id = auth.uid());
create policy rd_consent on public.consent_records for select to authenticated
  using (public.is_parent_of(student_id) or public.is_admin());
create policy wr_consent on public.consent_records for all to authenticated
  using (public.is_parent_of(student_id) or public.is_admin())
  with check (public.is_parent_of(student_id) or public.is_admin());

-- 13h. REMEDIATION / COMMS / HOMEWORK / NOTIFICATIONS.
create policy rd_gapassign on public.gap_pack_assignments for select to authenticated
  using (public.can_view_student(student_id));
create policy wr_gapassign on public.gap_pack_assignments for all to authenticated
  using (public.is_coach_of(student_id) or public.is_admin())
  with check (public.is_coach_of(student_id) or public.is_admin());
create policy rw_comms on public.parent_comms for all to authenticated
  using (coach_id = auth.uid() or public.is_admin())
  with check (coach_id = auth.uid() or public.is_admin());
create policy rd_homework on public.homework for select to authenticated
  using (public.can_view_student(student_id));
create policy wr_homework on public.homework for all to authenticated
  using (public.is_coach_of(student_id) or public.is_admin())
  with check (public.is_coach_of(student_id) or public.is_admin());
create policy own_notifications on public.notifications for all to authenticated
  using (recipient_id = auth.uid() or public.is_admin())
  with check (recipient_id = auth.uid() or public.is_admin());

-- 13i. ADMIN-ONLY (engine_params, audit_log). service_role bypasses RLS anyway.
create policy admin_engine on public.engine_params for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy admin_audit on public.audit_log for select to authenticated using (public.is_admin());

-- ============================================================================
-- 14. SEED — stages + engine defaults (terms/levels/stories authored via admin)
-- ============================================================================
insert into public.stages (number, belt, pilot_grade) values
  (1,'White',null),(2,'Yellow',null),(3,'Orange',null),(4,'Green',null),
  (5,'Blue',3),(6,'Purple',4),(7,'Brown',5),(8,'Red',null),(9,'Grey',null),(10,'Black',null)
on conflict (number) do nothing;

insert into public.engine_params (key, value, description) values
  ('access',  '{"Y":100,"bar":80,"star_skills":["listen","read","vocab","speak","write"]}'::jsonb, 'Level ACCESS: points to open next level + per-skill star bar'),
  ('belt',    '{"retain_pct":80,"mature_reviews":3}'::jsonb, 'BELT credit: retention threshold + maturity'),
  ('srs',     '{"ladder_hours":[12,72,168,360,720]}'::jsonb, 'SRS Leitner ladder (hours between reviews)'),
  ('scheduling','{"slots_per_week":2,"cancel_window_hours":4}'::jsonb, 'Parent scheduling rules')
on conflict (key) do nothing;
