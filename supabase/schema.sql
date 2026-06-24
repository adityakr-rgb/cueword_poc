-- ============================================================================
-- Cueword × Edge — CANONICAL DATABASE SCHEMA
-- ============================================================================
-- The complete, intended production data model. Every feature of the prototype
-- (student app, coach app, the synced live class) PLUS a full admin panel is
-- represented here. This is the single source of truth for the schema design.
--
-- RELATIONSHIP TO THE MIGRATIONS
--   The live DB is built incrementally via supabase/migrations/0001…000N.
--   THIS file is the consolidated, greenfield target — the picture the
--   migrations are converging toward. It is idempotent (create … if not exists)
--   so it can also bootstrap a fresh database. It is NOT auto-applied; treat it
--   as the design of record. To roll a piece into prod, lift it into the next
--   numbered migration.
--
-- DESIGN PRINCIPLES (built for a pilot that can grow into a platform)
--   1. MULTI-TENANT FROM DAY ONE. Every top-level entity carries org_id. One
--      seeded default org keeps single-tenant simple; adding a cohort/school is
--      just another organizations row — no reshaping.
--   2. RELATIONAL for anything queried/filtered/joined/reported on; JSONB only
--      for deeply-nested, render-only blobs (full story content, AI rubric,
--      gamification presentation).
--   3. CATALOG vs INSTANCE. Admin-extensible lists (skills, belts, plans,
--      genres, templates, workout categories) are tables, not hardcoded enums,
--      so the admin panel can grow them without a migration.
--   4. SMALL FIXED STATE MACHINES use text + CHECK (matches existing code);
--      open-ended vocabularies use catalog tables.
--   5. APPEND-ONLY EVENT LOGS (session_events, points_ledger, audit_log) for
--      auditability and replay; cached rollups (student_stats) for fast reads.
--   6. POLYMORPHIC SOFT LINKS (source_type, source_id) where one inbox/ledger
--      aggregates many origins — documented, indexed, no rigid FK.
--   7. UUID PKs, created_at/updated_at everywhere, FK indexes, RLS on by
--      default. New tables drop in by following the same conventions (see the
--      "ADDING A NEW TABLE" note at the very bottom).
-- ============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- 0. CONVENTIONS — shared helpers
-- ---------------------------------------------------------------------------

-- Auto-maintain updated_at on any table that has the column (wired in §22).
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- The default tenant. Single-tenant installs reference this; multi-tenant just
-- adds more organizations rows. org_id columns default to it so existing single
-- -tenant code keeps working untouched.
-- Default org id: 00000000-0000-0000-0000-000000000001

-- ============================================================================
-- 1. ORGANIZATIONS & MULTI-TENANCY (admin)
-- ============================================================================
create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique,
  timezone    text default 'Asia/Manila',
  locale      text default 'en',
  settings    jsonb not null default '{}'::jsonb,   -- branding, defaults, etc.
  status      text not null default 'active' check (status in ('active','suspended','archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================================
-- 2. IDENTITY — profiles, role-specific detail, guardians, auth linkage
-- ============================================================================
-- One row per human. Auth is Supabase Auth; profiles.auth_user_id links to it.
-- Role-specific attributes live in the *_details extension tables (kept thin;
-- dynamic stats live in student_stats).
create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null default '00000000-0000-0000-0000-000000000001'
                  references public.organizations(id) on delete cascade,
  auth_user_id  uuid references auth.users(id) on delete set null,
  role          text not null check (role in ('admin','coach','student','parent')),
  full_name     text not null,
  first_name    text,
  last_name     text,
  avatar_emoji  text,
  color         text,                  -- per-person accent used across the UI
  email         text,
  phone         text,
  timezone      text,                  -- IANA, e.g. 'America/Los_Angeles'
  tz_label      text,                  -- display, e.g. 'PST · UTC−8'
  tz_city       text,                  -- 'San Jose, CA'
  status        text not null default 'active' check (status in ('active','invited','inactive','archived')),
  last_seen_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index if not exists idx_profiles_auth  on public.profiles(auth_user_id) where auth_user_id is not null;
create unique index if not exists idx_profiles_email on public.profiles(org_id, lower(email)) where email is not null;
create index if not exists idx_profiles_org_role     on public.profiles(org_id, role);

-- Student-specific attributes (intrinsic; the coach/plan link is in enrollments,
-- denormalized here as a convenience pointer). The curriculum "position" pointer
-- (term/level/story) drives the story library + curriculum browser status.
create table if not exists public.student_details (
  profile_id        uuid primary key references public.profiles(id) on delete cascade,
  grade             int,
  enrolled_on       date,
  current_term      int default 1,
  current_level     int default 1,
  current_story     int default 1,    -- story number within the current level
  coins             int not null default 0,
  primary_coach_id  uuid references public.profiles(id) on delete set null,  -- source of truth = enrollments
  notes             text,
  meta              jsonb not null default '{}'::jsonb,
  updated_at        timestamptz not null default now()
);

-- Coach-specific attributes + preferences (Profile/Settings screen).
create table if not exists public.coach_details (
  profile_id     uuid primary key references public.profiles(id) on delete cascade,
  coach_code     text unique,                 -- 'CW-PH-0247'
  title          text,                         -- 'English Coach'
  location       text,
  bio            text,
  languages      text[] not null default '{}',
  grades         int[]  not null default '{}', -- grades they teach
  certs          text,
  joined_on      date,
  working_days   text,                         -- 'Mon – Sun'
  working_hours  text,                         -- '5:00 PM – 11:00 PM PH'
  default_zoom   text,
  rating         numeric(2,1),
  prefs          jsonb not null default '{}'::jsonb,  -- showStudentTz, autoFeedback, reminders, …
  updated_at     timestamptz not null default now()
);

-- Parents/guardians — comms target + future parent login. Many-to-many to
-- students (siblings share a guardian).
create table if not exists public.guardians (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null default '00000000-0000-0000-0000-000000000001'
                      references public.organizations(id) on delete cascade,
  profile_id        uuid references public.profiles(id) on delete set null,  -- set if the parent logs in
  full_name         text not null,
  relation          text,                       -- 'mother','father','guardian'
  email             text,
  phone             text,
  preferred_channel text check (preferred_channel in ('WhatsApp','Email','SMS')) default 'WhatsApp',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create table if not exists public.student_guardians (
  student_id  uuid not null references public.profiles(id) on delete cascade,
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  is_primary  boolean not null default true,
  primary key (student_id, guardian_id)
);

-- ============================================================================
-- 3. CATALOGS — admin-extensible reference data
-- ============================================================================

-- Subscription / enrolment plans (admin-managed). Drives weekly slot caps,
-- cancellation window, billing.
create table if not exists public.plans (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null default '00000000-0000-0000-0000-000000000001'
                        references public.organizations(id) on delete cascade,
  name                text not null,
  classes_per_week    int not null default 2,
  cancel_window_hours int not null default 4,
  price_cents         int,
  currency            text default 'USD',
  billing_period      text default 'month' check (billing_period in ('month','term','year','one_time')),
  active              boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- The 5 skills. reading/listening/writing/speaking are leveled "core"; vocab is
-- a cross-cutting daily warmup. Both apps map their skill keys to these.
create table if not exists public.skills (
  id     uuid primary key default gen_random_uuid(),
  key    text unique not null,        -- 'reading'|'listening'|'writing'|'speaking'|'vocab'
  label  text not null,
  short  text,
  kind   text not null default 'core' check (kind in ('core','crosscutting')),
  color  text,
  wash   text,
  icon   text,
  ord    int not null default 0
);

-- Belt ladder (gamification). points_required is the cumulative gate.
create table if not exists public.belts (
  id              uuid primary key default gen_random_uuid(),
  idx             int unique not null,    -- 0=White … 9=Black
  name            text not null,
  color           text,
  ink             text,
  points_required int not null default 0
);

-- Story genres (admin dropdown).
create table if not exists public.genres (
  id   uuid primary key default gen_random_uuid(),
  name text unique not null
);

-- Workout categories (Vocabulary / Comprehension / Expression). mode auto = the
-- app scores instantly; coach = the coach reviews open-ended work.
create table if not exists public.workout_categories (
  id    uuid primary key default gen_random_uuid(),
  key   text unique not null,          -- 'vocabulary'|'comprehension'|'expression'
  name  text not null,
  mode  text not null check (mode in ('auto','coach')),
  icon  text,
  color text,
  wash  text,
  blurb text,
  ord   int not null default 0
);

-- Parent-comms message templates.
create table if not exists public.comms_templates (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null default '00000000-0000-0000-0000-000000000001'
               references public.organizations(id) on delete cascade,
  key        text not null,
  label      text not null,
  body       text,
  ord        int not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, key)
);

-- Global/admin settings as typed key→JSONB (cancel window default, slots/week,
-- zoom automation toggle, feature copy, …).
create table if not exists public.app_settings (
  org_id     uuid not null default '00000000-0000-0000-0000-000000000001'
               references public.organizations(id) on delete cascade,
  key        text not null,
  value      jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (org_id, key)
);

-- Feature flags (gradual rollout; scalability).
create table if not exists public.feature_flags (
  org_id      uuid not null default '00000000-0000-0000-0000-000000000001'
                references public.organizations(id) on delete cascade,
  key         text not null,
  enabled     boolean not null default false,
  rollout     jsonb not null default '{}'::jsonb,   -- audience/percentage rules
  description text,
  updated_at  timestamptz not null default now(),
  primary key (org_id, key)
);

-- Third-party integrations (Zoom auto-create/record, Anthropic AI, WhatsApp/
-- Email providers). Secrets live in a vault; config/refs live here.
create table if not exists public.integrations (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null default '00000000-0000-0000-0000-000000000001'
               references public.organizations(id) on delete cascade,
  provider   text not null check (provider in ('zoom','anthropic','whatsapp','email','other')),
  scope      text not null default 'org' check (scope in ('org','coach')),
  owner_id   uuid references public.profiles(id) on delete cascade,  -- set when scope='coach'
  config     jsonb not null default '{}'::jsonb,
  enabled    boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 4. ENROLLMENT (student ↔ coach ↔ plan — source of truth)
-- ============================================================================
create table if not exists public.enrollments (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null default '00000000-0000-0000-0000-000000000001'
                     references public.organizations(id) on delete cascade,
  student_id       uuid not null references public.profiles(id) on delete cascade,
  coach_id         uuid references public.profiles(id) on delete set null,
  plan_id          uuid references public.plans(id) on delete set null,
  term             int,
  status           text not null default 'active' check (status in ('active','paused','completed','cancelled')),
  slots_per_week   int default 2,
  start_date       date,
  end_date         date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_enroll_student on public.enrollments(student_id);
create index if not exists idx_enroll_coach   on public.enrollments(coach_id);

-- ============================================================================
-- 5. CURRICULUM & CONTENT (admin-managed) — Terms → Levels → Stories
-- ============================================================================
-- A flexible hierarchy: term count, levels-per-term, and stories-per-level are
-- all data, not hardcoded — so the coach's "3×8×10" and the student app's
-- groupings both fit without reshaping.
create table if not exists public.curriculum_terms (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null default '00000000-0000-0000-0000-000000000001'
               references public.organizations(id) on delete cascade,
  idx        int not null,             -- 1,2,3
  name       text not null,            -- 'Term 1'
  subtitle   text,                     -- 'Foundations'
  ord        int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, idx)
);
create table if not exists public.curriculum_levels (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null default '00000000-0000-0000-0000-000000000001'
               references public.organizations(id) on delete cascade,
  term_id    uuid not null references public.curriculum_terms(id) on delete cascade,
  idx        int not null,             -- level number within the term
  title      text,                     -- 'Finding Meaning'
  unit       text,                     -- 'The Story of Flight'
  ord        int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (term_id, idx)
);

-- A Story is the lesson unit. The full renderable lesson (transcript, passage,
-- vocab, 8 question types, speak/write prompts) lives in `content` (JSONB,
-- exactly the Story shape the client renders). Queryable catalog fields are
-- columns. Legacy POC stories carry a short key (K/G3/G6).
create table if not exists public.stories (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null default '00000000-0000-0000-0000-000000000001'
                     references public.organizations(id) on delete cascade,
  level_id         uuid references public.curriculum_levels(id) on delete set null,
  n                int,                 -- order within the level
  key              text,                -- short legacy key 'K'|'G3'|'G6' (nullable)
  title            text not null,
  blurb            text,
  about            text,
  theme            text,
  theme_color      text,
  cover_emoji      text,
  scene_image_url  text,
  genre            text,
  duration         text,                -- '~30 min'
  steps            int,                 -- step count for the lesson flow
  points           int default 0,       -- points awarded on completion
  primary_skill_id uuid references public.skills(id) on delete set null,
  flow             jsonb not null default '{}'::jsonb,  -- { listen, read, speak, write } check counts
  content          jsonb,               -- the full Story object (render-only)
  status           text not null default 'draft' check (status in ('draft','published','archived')),
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create unique index if not exists idx_stories_key on public.stories(org_id, key) where key is not null;
create index if not exists idx_stories_level      on public.stories(level_id);

-- Secondary skills a story exercises (primary lives on stories.primary_skill_id).
create table if not exists public.story_skills (
  story_id uuid not null references public.stories(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  checks   int default 0,
  primary key (story_id, skill_id)
);

-- OPTIONAL per-story coach playbook notes (do/look/watch per step). The generic
-- rung→pedagogy maps stay in code; this table only exists if you want per-story
-- coaching text editable from the admin panel.
create table if not exists public.playbook_notes (
  id        uuid primary key default gen_random_uuid(),
  story_id  uuid not null references public.stories(id) on delete cascade,
  step_idx  int not null,
  phase     text,
  kind      text,                       -- 'cover'|'prompt'|'check'|'task'|'wrap'
  label     text,
  do_note   text,
  look_for  text,
  watch_for text,
  expects   text,
  ord       int not null default 0,
  unique (story_id, step_idx)
);

-- ============================================================================
-- 6. ASSIGNMENT (admin/coach assigns a story to a student)
-- ============================================================================
create table if not exists public.assignments (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default '00000000-0000-0000-0000-000000000001'
                references public.organizations(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  story_id    uuid not null references public.stories(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  status      text not null default 'assigned' check (status in ('assigned','inprogress','done')),
  assigned_at timestamptz not null default now(),
  due_at      timestamptz,
  updated_at  timestamptz not null default now(),
  unique (student_id, story_id)
);
create index if not exists idx_assign_student on public.assignments(student_id);

-- ============================================================================
-- 7. SCHEDULING & THE LIVE CLASS (the one realtime-synced surface)
-- ============================================================================
-- THE SYNC SPINE. Realtime carries only a tiny pointer on this row
-- {story_key, current_step, current_phase, driver, status}; heavy content is
-- rendered client-side from stories.content. student_id/coach_id/story_key are
-- denormalized so dashboards filter without joins. Also the scheduling row
-- (scheduled_at, zoom_link, cancellation).
create table if not exists public.class_sessions (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null default '00000000-0000-0000-0000-000000000001'
                      references public.organizations(id) on delete cascade,
  enrollment_id     uuid references public.enrollments(id) on delete set null,
  student_id        uuid references public.profiles(id) on delete set null,
  coach_id          uuid references public.profiles(id) on delete set null,
  story_id          uuid references public.stories(id) on delete set null,
  story_key         text,
  skill_id          uuid references public.skills(id) on delete set null,
  level_label       text,                 -- 'L3'
  lesson_title      text,
  -- scheduling
  scheduled_at      timestamptz,
  duration_min      int default 30,
  zoom_link         text,
  -- live sync state
  status            text not null default 'scheduled'
                      check (status in ('scheduled','live','completed','cancelled')),
  driver            text not null default 'student' check (driver in ('student','coach')),
  current_step      int not null default 0,
  current_phase     text,
  started_at        timestamptz,
  ended_at          timestamptz,
  -- cancellation / attendance
  cancelled_at      timestamptz,
  cancel_reason     text,
  cancelled_by      uuid references public.profiles(id) on delete set null,
  attendance_status text check (attendance_status in ('present','late','absent','scheduled')) default 'scheduled',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_sessions_student   on public.class_sessions(student_id);
create index if not exists idx_sessions_coach      on public.class_sessions(coach_id);
create index if not exists idx_sessions_status     on public.class_sessions(status);
create index if not exists idx_sessions_scheduled  on public.class_sessions(scheduled_at);

-- The activity stream (INSERT-only). open_story/step/answer/phase/note. The
-- coach subscribes to mirror the student's picks live.
create table if not exists public.session_events (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.class_sessions(id) on delete cascade,
  actor_id   uuid references public.profiles(id) on delete set null,
  actor_role text check (actor_role in ('admin','coach','student','parent')),
  type       text not null check (type in ('open_story','step','answer','phase','note')),
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_events_session on public.session_events(session_id, created_at);

-- Attendance record per session (coach Attendance screen + KPIs). One row per
-- (session, student).
create table if not exists public.attendance (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null default '00000000-0000-0000-0000-000000000001'
                     references public.organizations(id) on delete cascade,
  student_id       uuid not null references public.profiles(id) on delete cascade,
  session_id       uuid references public.class_sessions(id) on delete set null,
  coach_id         uuid references public.profiles(id) on delete set null,
  date             date not null,
  skill_id         uuid references public.skills(id) on delete set null,
  status           text not null check (status in ('present','late','absent','scheduled')),
  minutes_attended int,
  recorded_by      uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  unique (session_id, student_id)
);
create index if not exists idx_attendance_student on public.attendance(student_id, date);

-- ============================================================================
-- 8. HOMEWORK (coach assigns → student completes → optional submission)
-- ============================================================================
create table if not exists public.homework (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default '00000000-0000-0000-0000-000000000001'
                references public.organizations(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  skill_id    uuid references public.skills(id) on delete set null,
  title       text not null,            -- the task
  type        text,                     -- 'app drill','writing','reading',…
  description text,
  items_count int,
  assigned_at timestamptz not null default now(),
  due_date    date,
  status      text not null default 'assigned'
                check (status in ('toassign','assigned','completed','overdue')),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_homework_student on public.homework(student_id, status);

-- ============================================================================
-- 9. WORKOUTS & DRILLS (self-paced practice between classes)
-- ============================================================================
-- A workout = a drill. content holds the question set (render-only). auto mode
-- scores instantly; coach mode is open-ended (writing/speaking) for review.
create table if not exists public.workouts (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default '00000000-0000-0000-0000-000000000001'
                references public.organizations(id) on delete cascade,
  category_id uuid references public.workout_categories(id) on delete set null,
  title       text not null,
  skill_id    uuid references public.skills(id) on delete set null,
  level       int,
  items       int,
  mode        text not null default 'auto' check (mode in ('auto','coach')),
  kind        text check (kind in ('writing','speaking')),   -- for coach mode
  content     jsonb not null default '{}'::jsonb,            -- questions
  status      text not null default 'active' check (status in ('active','archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_workouts_category on public.workouts(category_id);

-- A student's attempt at a workout. Auto: score JSONB {correct,total} + flagged
-- count. Coach: body_text/transcript/audio + coach_feedback (the review loop).
create table if not exists public.drill_attempts (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null default '00000000-0000-0000-0000-000000000001'
                   references public.organizations(id) on delete cascade,
  student_id     uuid not null references public.profiles(id) on delete cascade,
  workout_id     uuid references public.workouts(id) on delete set null,
  status         text not null default 'todo' check (status in ('todo','done','awaiting','feedback')),
  score          jsonb,                 -- { correct, total }
  answers        jsonb,                 -- per-question responses (render-only)
  flagged        int not null default 0,
  body_text      text,                  -- coach-reviewed writing
  transcript     text,
  audio_url      text,
  coach_id       uuid references public.profiles(id) on delete set null,
  coach_feedback text,
  submitted_at   timestamptz,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_attempts_student on public.drill_attempts(student_id, status);

-- Wrong answers auto-pushed to the coach to revisit in class ("a mistake is
-- never a dead end"). source_attempt_id links back to the drill it came from.
create table if not exists public.flagged_items (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null default '00000000-0000-0000-0000-000000000001'
                         references public.organizations(id) on delete cascade,
  student_id           uuid not null references public.profiles(id) on delete cascade,
  skill_id             uuid references public.skills(id) on delete set null,
  title                text,
  item                 text,
  source               text,            -- 'Reading workout', …
  source_attempt_id    uuid references public.drill_attempts(id) on delete set null,
  resolved             boolean not null default false,
  resolved_in_session  uuid references public.class_sessions(id) on delete set null,
  created_at           timestamptz not null default now()
);
create index if not exists idx_flagged_student on public.flagged_items(student_id, resolved);

-- ============================================================================
-- 10. VOCABULARY — catalog words + per-student spaced-revision deck
-- ============================================================================
create table if not exists public.vocab_words (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null default '00000000-0000-0000-0000-000000000001'
               references public.organizations(id) on delete cascade,
  word       text not null,
  pos        text,                       -- part of speech
  meaning    text,
  example    text,
  story_id   uuid references public.stories(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_vocab_words_word on public.vocab_words(org_id, lower(word));

-- The student's Leitner deck (daily warmup + words added on story completion).
create table if not exists public.student_vocab (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null default '00000000-0000-0000-0000-000000000001'
                     references public.organizations(id) on delete cascade,
  student_id       uuid not null references public.profiles(id) on delete cascade,
  word             text not null,
  vocab_word_id    uuid references public.vocab_words(id) on delete set null,
  pos              text,
  meaning          text,
  example          text,
  box              int not null default 0,   -- Leitner box
  due_at           timestamptz,
  last_reviewed_at timestamptz,
  source           text,                      -- 'story:G3', 'warmup', …
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (student_id, word)
);
create index if not exists idx_student_vocab_due on public.student_vocab(student_id, due_at);

-- ============================================================================
-- 11. STORY PROGRESS (self-serve player + resume + curriculum status)
-- ============================================================================
-- One row per (student, story). Powers: the story library status badges, the
-- curriculum browser, "Pick up where you left off" (last_step/total_steps), and
-- completion (score, points, completed_at). mode distinguishes the at-home
-- player from the live class.
create table if not exists public.student_story_progress (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null default '00000000-0000-0000-0000-000000000001'
                  references public.organizations(id) on delete cascade,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  story_id      uuid not null references public.stories(id) on delete cascade,
  status        text not null default 'current' check (status in ('locked','current','inprogress','done')),
  mode          text check (mode in ('self','live')),
  last_step     int default 0,
  total_steps   int,
  score         jsonb,                  -- { correct, total }
  points_earned int default 0,
  started_at    timestamptz,
  completed_at  timestamptz,
  updated_at    timestamptz not null default now(),
  unique (student_id, story_id)
);
create index if not exists idx_story_progress_student on public.student_story_progress(student_id, status);

-- ============================================================================
-- 12. ASSESSMENT & MARKING (the coach inbox + AI assist)
-- ============================================================================
-- The unified "markable artifact" inbox. A submission may originate from a live
-- class, a homework task, a coach-mode workout, or the self-serve story player
-- (polymorphic source_type/source_id — indexed, no rigid FK). ai_score holds
-- the rubric blob; overall_score is duplicated as a column for reporting.
create table if not exists public.submissions (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null default '00000000-0000-0000-0000-000000000001'
                   references public.organizations(id) on delete cascade,
  student_id     uuid not null references public.profiles(id) on delete cascade,
  coach_id       uuid references public.profiles(id) on delete set null,
  source_type    text check (source_type in ('class','homework','workout','story')),
  source_id      uuid,
  skill_id       uuid references public.skills(id) on delete set null,
  level_label    text,
  type           text,                  -- 'Writing piece' | 'Spoken story' | …
  title          text,
  lesson_ref     text,
  body_text      text,
  transcript     text,
  audio_url      text,
  audio_duration text,
  ai_ready       boolean not null default false,
  ai_score       jsonb,                 -- { overall, criteria:[{name,score,max,note}], feedback }
  overall_score  numeric,               -- queryable copy of ai_score.overall / final mark
  coach_feedback text,
  status         text not null default 'awaiting' check (status in ('awaiting','marked','sent')),
  submitted_at   timestamptz not null default now(),
  marked_at      timestamptz,
  sent_at        timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_submissions_student on public.submissions(student_id);
create index if not exists idx_submissions_coach   on public.submissions(coach_id, status);
create index if not exists idx_submissions_source  on public.submissions(source_type, source_id);

-- Every AI call (speak/write feedback, coach marking-assist). Logged for
-- auditability + cost/token tracking (scalability). subject_* points at what it
-- scored (submission / drill_attempt / story_attempt).
create table if not exists public.ai_generations (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null default '00000000-0000-0000-0000-000000000001'
                 references public.organizations(id) on delete cascade,
  kind         text not null,           -- 'speak_feedback'|'write_feedback'|'marking_assist'|…
  subject_type text,                     -- 'submission'|'drill_attempt'|'story_progress'
  subject_id   uuid,
  model        text,                     -- 'claude-opus-4-8'
  status       text not null default 'pending' check (status in ('pending','succeeded','failed')),
  prompt       jsonb,
  output       jsonb,
  score        numeric,
  tokens_in    int,
  tokens_out   int,
  cost_cents   numeric,
  error        text,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_ai_subject on public.ai_generations(subject_type, subject_id);

-- ============================================================================
-- 13. PROGRESS & GAMIFICATION
-- ============================================================================
-- Per-skill standing (coach roster "skill levels & scores" + student "My Skill
-- Levels"). app_sync_level = the level the student's practice app has unlocked
-- (the coach's "App sync" column: synced / behind).
create table if not exists public.student_skill_levels (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null default '00000000-0000-0000-0000-000000000001'
                   references public.organizations(id) on delete cascade,
  student_id     uuid not null references public.profiles(id) on delete cascade,
  skill_id       uuid not null references public.skills(id) on delete cascade,
  level          int,
  status         text check (status in ('locked','unlocked','progress','mastered')),
  score          numeric,               -- 0–100
  app_sync_level int,
  updated_at     timestamptz not null default now(),
  unique (student_id, skill_id)
);

-- Cached KPI rollup (fast reads for Progress dashboard + coach KPIs). Authoritative
-- points come from points_ledger; this caches the sum + accuracy/counters.
create table if not exists public.student_stats (
  student_id       uuid primary key references public.profiles(id) on delete cascade,
  org_id           uuid not null default '00000000-0000-0000-0000-000000000001'
                     references public.organizations(id) on delete cascade,
  points           int not null default 0,
  belt_index       int not null default 0,
  belt_target      int,
  gate_target      int,
  classes_attended int not null default 0,
  stories_done     int not null default 0,
  workouts_done    int not null default 0,
  story_accuracy   numeric,
  workout_accuracy numeric,
  current_streak   int not null default 0,
  updated_at       timestamptz not null default now()
);

-- Append-only points log — every belt-point event (story finish, workout, class).
-- student_stats.points = sum(delta). Enables audit + recomputation.
create table if not exists public.points_ledger (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default '00000000-0000-0000-0000-000000000001'
                references public.organizations(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  delta       int not null,
  reason      text,
  source_type text,                      -- 'story'|'workout'|'class'|'bonus'
  source_id   uuid,
  created_at  timestamptz not null default now()
);
create index if not exists idx_points_student on public.points_ledger(student_id, created_at);

-- Term milestones timeline (Progress dashboard).
create table if not exists public.milestones (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null default '00000000-0000-0000-0000-000000000001'
               references public.organizations(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  label      text not null,
  date       date,
  done       boolean not null default false,
  ord        int,
  created_at timestamptz not null default now()
);
create index if not exists idx_milestones_student on public.milestones(student_id);

-- ============================================================================
-- 14. PORTFOLIO (saved class/at-home work — the student's gallery)
-- ============================================================================
create table if not exists public.portfolio_items (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default '00000000-0000-0000-0000-000000000001'
                references public.organizations(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  source_type text,                      -- 'class'|'workout'|'story'
  source_id   uuid,
  type        text check (type in ('spoken','reading','writing','listening')),
  title       text,
  topic       text,
  skill_id    uuid references public.skills(id) on delete set null,
  duration    text,
  words       int,
  excerpt     text,
  level       int,
  score       jsonb,                     -- { correct, total }
  questions   jsonb,                     -- [{ q, your, correct }]
  audio_url   text,
  coach_note  text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_portfolio_student on public.portfolio_items(student_id, type);

-- ============================================================================
-- 15. COMMUNICATIONS & NOTIFICATIONS
-- ============================================================================
-- Parent-comms log (coach Comms screen + "Message parent").
create table if not exists public.comms_log (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default '00000000-0000-0000-0000-000000000001'
                references public.organizations(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  guardian_id uuid references public.guardians(id) on delete set null,
  coach_id    uuid references public.profiles(id) on delete set null,
  method      text check (method in ('WhatsApp','Email','SMS')),
  template_id uuid references public.comms_templates(id) on delete set null,
  subject     text,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_comms_student on public.comms_log(student_id, created_at);

-- In-app notifications (marking sent, homework assigned, class reminders, …).
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null default '00000000-0000-0000-0000-000000000001'
                 references public.organizations(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type         text,
  title        text,
  body         text,
  link         text,
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists idx_notifications_recip on public.notifications(recipient_id, read);

-- ============================================================================
-- 16. ADMIN — provisioning, announcements, audit
-- ============================================================================
-- Pending invitations (admin provisions coaches/students/parents; they accept
-- via Supabase Auth and get linked to a profile).
create table if not exists public.invitations (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null default '00000000-0000-0000-0000-000000000001'
               references public.organizations(id) on delete cascade,
  email      text not null,
  role       text not null check (role in ('admin','coach','student','parent')),
  profile_id uuid references public.profiles(id) on delete set null,
  token      text unique,
  status     text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  invited_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_invitations_email on public.invitations(org_id, lower(email));

-- Broadcast announcements (admin → an audience).
create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null default '00000000-0000-0000-0000-000000000001'
               references public.organizations(id) on delete cascade,
  author_id  uuid references public.profiles(id) on delete set null,
  audience   text not null default 'all' check (audience in ('all','students','coaches','parents','admins')),
  title      text not null,
  body       text,
  starts_at  timestamptz,
  ends_at    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Append-only audit trail of admin/coach actions (who changed what).
create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default '00000000-0000-0000-0000-000000000001'
                references public.organizations(id) on delete cascade,
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,            -- 'create'|'update'|'delete'|'login'|…
  entity_type text,                      -- table/resource name
  entity_id   uuid,
  summary     text,
  diff        jsonb,                     -- { before, after }
  ip          inet,
  created_at  timestamptz not null default now()
);
create index if not exists idx_audit_entity on public.audit_log(entity_type, entity_id);
create index if not exists idx_audit_actor  on public.audit_log(actor_id, created_at);

-- ============================================================================
-- 17. updated_at TRIGGERS (wire set_updated_at onto every mutable table)
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','profiles','student_details','coach_details','guardians',
    'plans','comms_templates','integrations','enrollments','curriculum_terms',
    'curriculum_levels','stories','assignments','class_sessions','homework',
    'workouts','drill_attempts','student_vocab','student_story_progress',
    'submissions','student_skill_levels','student_stats','announcements'
  ]
  loop
    execute format('drop trigger if exists trg_set_updated_at on public.%I;', t);
    execute format(
      'create trigger trg_set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ============================================================================
-- 18. REALTIME — stream the live-class spine + the activity stream + the inbox
-- ============================================================================
do $$ begin alter publication supabase_realtime add table public.class_sessions; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.session_events;  exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.submissions;     exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.notifications;   exception when duplicate_object then null; end $$;

-- Realtime evaluates RLS against the OLD row for UPDATE/DELETE; with the default
-- replica identity that row is only the PK, so Realtime SILENTLY DROPS those
-- events on RLS-protected tables (a subscriber sees nothing despite SUBSCRIBED).
-- REPLICA IDENTITY FULL ships the whole old row so postgres_changes UPDATE/DELETE
-- flow. Required for class_sessions (the live-class sync spine) + any table whose
-- clients react to updates (e.g. notifications mark-as-read).
alter table public.class_sessions replica identity full;
alter table public.session_events replica identity full;
alter table public.submissions    replica identity full;
alter table public.notifications  replica identity full;

-- ============================================================================
-- 19. ROW-LEVEL SECURITY
-- ============================================================================
-- Security model (replaces the POC's permissive policies):
--   • admin   → full access within their org
--   • coach   → their own row, their roster's data, sessions they teach
--   • student → their own data; read of published catalog/content
--   • parent  → read of their child's data (future)
-- Helper functions resolve the caller's profile from auth.uid(). They are
-- SECURITY DEFINER + STABLE so policies stay terse and fast.

create or replace function public.app_profile_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.profiles where auth_user_id = auth.uid() limit 1
$$;
create or replace function public.app_org_id()
returns uuid language sql stable security definer set search_path = public as $$
  select org_id from public.profiles where auth_user_id = auth.uid() limit 1
$$;
create or replace function public.app_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where auth_user_id = auth.uid() limit 1
$$;
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.app_role() = 'admin'
$$;
-- Is the caller the coach currently linked to this student (via enrollment)?
create or replace function public.coaches_student(student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.enrollments e
    where e.student_id = student and e.coach_id = public.app_profile_id()
  )
$$;

-- Enable RLS on every table in this schema.
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','profiles','student_details','coach_details','guardians',
    'student_guardians','plans','skills','belts','genres','workout_categories',
    'comms_templates','app_settings','feature_flags','integrations','enrollments',
    'curriculum_terms','curriculum_levels','stories','story_skills','playbook_notes',
    'assignments','class_sessions','session_events','attendance','homework',
    'workouts','drill_attempts','flagged_items','vocab_words','student_vocab',
    'student_story_progress','submissions','ai_generations','student_skill_levels',
    'student_stats','points_ledger','milestones','portfolio_items','comms_log',
    'notifications','invitations','announcements','audit_log'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- 19a. CATALOG / CONTENT: readable by anyone in the org; writable by admins.
--      (Published stories/curriculum are what both apps render from.)
do $$
declare t text;
begin
  foreach t in array array[
    'skills','belts','genres','workout_categories','comms_templates','plans',
    'curriculum_terms','curriculum_levels','stories','story_skills','playbook_notes',
    'vocab_words','workouts','feature_flags','announcements'
  ]
  loop
    execute format('drop policy if exists rd_%1$s on public.%1$s;', t);
    execute format('drop policy if exists wr_%1$s on public.%1$s;', t);
    -- read: same org (catalogs that lack org_id are global → allow all authenticated)
    if exists (select 1 from information_schema.columns
               where table_schema='public' and table_name=t and column_name='org_id') then
      execute format(
        'create policy rd_%1$s on public.%1$s for select to authenticated using (org_id = public.app_org_id());', t);
    else
      execute format(
        'create policy rd_%1$s on public.%1$s for select to authenticated using (true);', t);
    end if;
    -- write: admins only
    execute format(
      'create policy wr_%1$s on public.%1$s for all to authenticated using (public.is_admin()) with check (public.is_admin());', t);
  end loop;
end $$;

-- 19b. ORG + own profile.
drop policy if exists rd_org on public.organizations;
create policy rd_org on public.organizations for select to authenticated using (id = public.app_org_id());
drop policy if exists wr_org on public.organizations;
create policy wr_org on public.organizations for all to authenticated using (public.is_admin() and id = public.app_org_id()) with check (public.is_admin());

drop policy if exists rd_profiles on public.profiles;
create policy rd_profiles on public.profiles for select to authenticated
  using (org_id = public.app_org_id());                       -- everyone in the org is visible to the apps
drop policy if exists wr_profiles_self on public.profiles;
create policy wr_profiles_self on public.profiles for update to authenticated
  using (id = public.app_profile_id() or public.is_admin())
  with check (id = public.app_profile_id() or public.is_admin());
drop policy if exists wr_profiles_admin on public.profiles;
create policy wr_profiles_admin on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 19c. STUDENT-OWNED tables: student (self) OR their coach OR admin.
--      Applied uniformly to every table keyed by student_id.
do $$
declare t text;
begin
  foreach t in array array[
    'student_details','submissions','homework','drill_attempts','flagged_items',
    'student_vocab','student_story_progress','student_skill_levels','student_stats',
    'points_ledger','milestones','portfolio_items','attendance','comms_log','assignments'
  ]
  loop
    -- student_details keys on profile_id; the rest on student_id.
    if t = 'student_details' then
      execute 'drop policy if exists own_student_details on public.student_details;';
      execute 'create policy own_student_details on public.student_details for all to authenticated
                 using (profile_id = public.app_profile_id() or public.is_admin() or public.coaches_student(profile_id))
                 with check (public.is_admin() or public.coaches_student(profile_id) or profile_id = public.app_profile_id());';
    else
      execute format('drop policy if exists own_%1$s on public.%1$s;', t);
      execute format(
        'create policy own_%1$s on public.%1$s for all to authenticated
           using (student_id = public.app_profile_id() or public.is_admin() or public.coaches_student(student_id))
           with check (student_id = public.app_profile_id() or public.is_admin() or public.coaches_student(student_id));', t);
    end if;
  end loop;
end $$;

-- 19d. COACH detail: self + admin.
drop policy if exists own_coach_details on public.coach_details;
create policy own_coach_details on public.coach_details for all to authenticated
  using (profile_id = public.app_profile_id() or public.is_admin())
  with check (profile_id = public.app_profile_id() or public.is_admin());

-- 19e. ENROLLMENTS + CLASS SESSIONS + EVENTS: the two participants + admin.
drop policy if exists rw_enroll on public.enrollments;
create policy rw_enroll on public.enrollments for all to authenticated
  using (student_id = public.app_profile_id() or coach_id = public.app_profile_id() or public.is_admin())
  with check (public.is_admin() or coach_id = public.app_profile_id());

drop policy if exists rw_sessions on public.class_sessions;
create policy rw_sessions on public.class_sessions for all to authenticated
  using (student_id = public.app_profile_id() or coach_id = public.app_profile_id() or public.is_admin())
  with check (student_id = public.app_profile_id() or coach_id = public.app_profile_id() or public.is_admin());

drop policy if exists rw_events on public.session_events;
create policy rw_events on public.session_events for all to authenticated
  using (exists (select 1 from public.class_sessions s
                 where s.id = session_id
                   and (s.student_id = public.app_profile_id() or s.coach_id = public.app_profile_id() or public.is_admin())))
  with check (exists (select 1 from public.class_sessions s
                 where s.id = session_id
                   and (s.student_id = public.app_profile_id() or s.coach_id = public.app_profile_id() or public.is_admin())));

-- 19f. NOTIFICATIONS: the recipient (+ admin).
drop policy if exists own_notifications on public.notifications;
create policy own_notifications on public.notifications for all to authenticated
  using (recipient_id = public.app_profile_id() or public.is_admin())
  with check (recipient_id = public.app_profile_id() or public.is_admin());

-- 19g. GUARDIANS / links: admin + the linked student/parent.
drop policy if exists rw_guardians on public.guardians;
create policy rw_guardians on public.guardians for all to authenticated
  using (public.is_admin() or profile_id = public.app_profile_id())
  with check (public.is_admin());
drop policy if exists rw_student_guardians on public.student_guardians;
create policy rw_student_guardians on public.student_guardians for all to authenticated
  using (public.is_admin() or student_id = public.app_profile_id() or public.coaches_student(student_id))
  with check (public.is_admin());

-- 19h. ADMIN-ONLY surfaces.
do $$
declare t text;
begin
  foreach t in array array['app_settings','integrations','invitations','audit_log','ai_generations'] loop
    execute format('drop policy if exists admin_%1$s on public.%1$s;', t);
    execute format(
      'create policy admin_%1$s on public.%1$s for all to authenticated
         using (public.is_admin()) with check (public.is_admin());', t);
  end loop;
end $$;

-- ============================================================================
-- 20. SEED — default org + the catalogs both apps rely on
-- ============================================================================
insert into public.organizations (id, name, slug)
values ('00000000-0000-0000-0000-000000000001','Cueword','cueword')
on conflict (id) do nothing;

insert into public.skills (key,label,short,kind,color,icon,ord) values
  ('reading','Reading','Rd','core','var(--reading)','book',1),
  ('listening','Listening','Lis','core','var(--listening)','ear',2),
  ('writing','Writing','Wr','core','var(--writing)','pencil',3),
  ('speaking','Speaking','Sp','core','var(--speaking)','mic',4),
  ('vocab','Vocabulary','Voc','crosscutting','var(--vocab)','sparkle',5)
on conflict (key) do nothing;

insert into public.belts (idx,name,color,ink,points_required) values
  (0,'White','#ECE6D6','#5A4A2A',0),
  (1,'Yellow','#F4C95D','#5A3D0A',1000),
  (2,'Orange','#E89B5C','#5A2E0A',2000),
  (3,'Green','#6FA86A','#FFFFFF',3000),
  (4,'Blue','#5B8FB9','#FFFFFF',4000),
  (5,'Purple','#8B6BB1','#FFFFFF',5000),
  (6,'Brown','#8B6F4E','#FFFFFF',6000),
  (7,'Red','#C9594F','#FFFFFF',7000),
  (8,'Grey','#5C6B7A','#FFFFFF',8000),
  (9,'Black','#2A2A33','#F4C95D',9000)
on conflict (idx) do nothing;

insert into public.genres (name) values
  ('Nonfiction'),('Fiction'),('Fable'),('Biography'),('Poem'),('Folk tale')
on conflict (name) do nothing;

insert into public.workout_categories (key,name,mode,icon,blurb,ord) values
  ('vocabulary','Vocabulary','auto','sparkle','Quick drills to build and lock in new words.',1),
  ('comprehension','Reading & Listening Comprehension','auto','ear','Answer the questions — your score is worked out instantly.',2),
  ('expression','Speaking & Writing','coach','mic','Open-ended practice your coach reads and gives feedback on.',3)
on conflict (key) do nothing;

insert into public.comms_templates (key,label,ord) values
  ('progress','Progress update',1),
  ('homework','Homework reminder',2),
  ('reschedule','Session reschedule',3),
  ('level','Level completed',4)
on conflict (org_id,key) do nothing;

insert into public.app_settings (key,value) values
  ('scheduling', '{"slots_per_week":2,"cancel_window_hours":4,"zoom_auto":true}'::jsonb),
  ('grading',    '{"write_min_words":30}'::jsonb)
on conflict (org_id,key) do nothing;

-- ============================================================================
-- 21. REPORTING VIEWS (admin + third-party tutor-stats dashboard)
-- ============================================================================
-- Coach load: students, today's sessions, items awaiting marking.
-- security_invoker = on → the view respects the caller's RLS (no cross-org leak).
create or replace view public.v_coach_load
with (security_invoker = on) as
select
  c.id as coach_id,
  c.full_name,
  (select count(*) from public.enrollments e where e.coach_id = c.id and e.status='active') as students,
  (select count(*) from public.class_sessions s
     where s.coach_id = c.id and s.scheduled_at::date = current_date)                       as sessions_today,
  (select count(*) from public.submissions m where m.coach_id = c.id and m.status='awaiting') as items_to_mark
from public.profiles c
where c.role = 'coach';

-- Student snapshot for the progress/parent + admin overview.
create or replace view public.v_student_overview
with (security_invoker = on) as
select
  p.id as student_id,
  p.full_name,
  sd.grade,
  sd.current_term,
  sd.current_level,
  sd.primary_coach_id,
  st.points,
  st.belt_index,
  st.classes_attended,
  st.stories_done,
  st.story_accuracy
from public.profiles p
left join public.student_details sd on sd.profile_id = p.id
left join public.student_stats   st on st.student_id  = p.id
where p.role = 'student';

-- ============================================================================
-- 22. ADDING A NEW TABLE (the recipe — keep the schema scalable)
-- ============================================================================
--  1. uuid PK: `id uuid primary key default gen_random_uuid()`.
--  2. Tenant: `org_id uuid not null default '00000000-…-001' references
--     organizations(id) on delete cascade` for any top-level entity.
--  3. Timestamps: `created_at timestamptz not null default now()` and, if the
--     row is mutated, `updated_at timestamptz not null default now()` — then add
--     the table name to the §17 trigger loop.
--  4. FK columns get an index (`create index … on tbl(fk_col)`).
--  5. Small fixed states → text + CHECK; open-ended vocabularies → a catalog
--     table with read-all / admin-write RLS (add it to the §19a loop).
--  6. Owned-by-student data → add the table name to the §19c loop to inherit
--     the student/coach/admin policy. Otherwise write an explicit policy.
--  7. Realtime: only add to the §18 publication if a client must react live.
--  8. Render-only nested blobs → JSONB; anything you filter/report on → a column.
-- ============================================================================
