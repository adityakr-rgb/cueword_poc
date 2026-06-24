-- ============================================================================
-- 0002 — Production schema (Day 1 of the 7-day build). ADDITIVE ONLY.
--
-- No drops, no destructive changes — the live single-pair demo keeps working
-- while we layer the real product on top. RLS on the NEW tables stays PERMISSIVE
-- here; migration 0003 replaces every permissive policy with auth-scoped rules
-- once Supabase Auth is wired in the apps (so we never lock ourselves out
-- mid-build).
--
-- Design altitude (deliberate, for a pilot):
--   * RELATIONAL for anything we query / filter / join / report on.
--   * JSONB for deeply-nested, render-only blobs (full story content, AI rubric
--     criteria, gamification presentation). Full content normalization is a
--     fast-follow, not a launch blocker.
-- ============================================================================

-- ---- 1. People & auth linkage ----------------------------------------------
-- Real auth moves to Supabase Auth (auth.users); profiles links to it. The old
-- password_hash column is left in place but goes unused.
alter table public.profiles
  add column if not exists auth_user_id   uuid references auth.users(id) on delete set null,
  add column if not exists email          text,
  add column if not exists phone          text,
  add column if not exists color          text,
  add column if not exists tz_city        text,
  add column if not exists parent_name    text,
  add column if not exists parent_contact text,
  add column if not exists parent_channel text check (parent_channel in ('WhatsApp','Email')),
  add column if not exists term           int,
  add column if not exists level          int,
  add column if not exists coach_meta     jsonb not null default '{}'::jsonb,   -- bio, languages, certs, hours, default zoom, rating, prefs
  add column if not exists student_meta   jsonb not null default '{}'::jsonb;   -- gamification presentation, curriculum position

create unique index if not exists idx_profiles_auth_user on public.profiles(auth_user_id) where auth_user_id is not null;
create unique index if not exists idx_profiles_email     on public.profiles(lower(email)) where email is not null;

-- ---- 2. Scheduling (extend the existing class_sessions sync spine) ----------
alter table public.class_sessions
  add column if not exists skill             text,
  add column if not exists level             text,
  add column if not exists lesson_title      text,
  add column if not exists cancelled_at      timestamptz,
  add column if not exists cancel_reason     text,
  add column if not exists attendance_status text check (attendance_status in ('present','late','absent','scheduled')) default 'scheduled';

-- ---- 3. Submissions & marking ----------------------------------------------
create table if not exists public.submissions (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references public.profiles(id) on delete cascade,
  coach_id       uuid references public.profiles(id) on delete set null,
  skill          text,
  level          text,
  type           text,                  -- 'Writing piece' | 'Spoken story' | ...
  title          text,
  lesson_ref     text,
  body_text      text,
  transcript     text,
  audio_url      text,
  audio_duration text,
  ai_ready       boolean not null default false,
  ai_score       jsonb,                 -- { overall, criteria:[{name,score,max,note}], feedback }
  coach_feedback text,
  status         text not null default 'awaiting' check (status in ('awaiting','marked','sent')),
  submitted_at   timestamptz not null default now(),
  marked_at      timestamptz,
  sent_at        timestamptz
);

-- ---- 4. Homework -----------------------------------------------------------
create table if not exists public.homework (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  skill       text,
  task        text not null,
  type        text,
  description text,
  items_count int,
  assigned_at timestamptz not null default now(),
  due_date    date,
  status      text not null default 'assigned' check (status in ('toassign','assigned','completed','overdue'))
);

-- ---- 5. Attendance ---------------------------------------------------------
create table if not exists public.attendance (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid references public.class_sessions(id) on delete set null,
  date       date not null,
  skill      text,
  status     text not null check (status in ('present','late','absent','scheduled')),
  created_at timestamptz not null default now()
);

-- ---- 6. Communications -----------------------------------------------------
create table if not exists public.comms_templates (
  id    uuid primary key default gen_random_uuid(),
  label text not null,
  body  text
);
create table if not exists public.comms_log (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles(id) on delete cascade,
  coach_id    uuid references public.profiles(id) on delete set null,
  method      text check (method in ('WhatsApp','Email')),
  template_id uuid references public.comms_templates(id) on delete set null,
  note        text,
  created_at  timestamptz not null default now()
);

-- ---- 7. Progress KPIs, gamification, milestones ----------------------------
-- Per-skill mastery already lives in public.progress. Add the queryable KPIs;
-- gamification *presentation* (belt colors, alerts) rides in profiles.student_meta.
create table if not exists public.student_stats (
  student_id       uuid primary key references public.profiles(id) on delete cascade,
  points           int not null default 0,
  belt_index       int not null default 0,
  belt_target      int,
  classes_attended int not null default 0,
  stories_done     int not null default 0,
  workouts_done    int not null default 0,
  story_accuracy   numeric,
  workout_accuracy numeric,
  updated_at       timestamptz not null default now()
);
create table if not exists public.milestones (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  label      text not null,
  date       date,
  done       boolean not null default false,
  ord        int
);

-- ---- 8. Portfolio (saved class work) ---------------------------------------
create table if not exists public.portfolio_items (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  type       text check (type in ('spoken','reading','writing','listening')),
  title      text,
  topic      text,
  skill      text,
  duration   text,
  words      int,
  excerpt    text,
  level      int,
  score      jsonb,            -- { correct, total }
  questions  jsonb,            -- [{ q, your, correct }]
  audio_url  text,
  coach_note text,
  created_at timestamptz not null default now()
);

-- ---- 9. Vocabulary deck (spaced revision) & flagged items ------------------
create table if not exists public.student_vocab (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  word       text not null,
  pos        text,
  meaning    text,
  example    text,
  box        int not null default 0,    -- spaced-repetition box (Leitner)
  due_at     timestamptz,
  created_at timestamptz not null default now(),
  unique (student_id, word)
);
create table if not exists public.flagged_items (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  skill      text,
  title      text,
  item       text,
  source     text,
  resolved   boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---- 10. Workouts & drill attempts -----------------------------------------
-- Drill CONTENT (questions) is JSONB on the workout (render-only); ATTEMPTS are
-- relational so we can score, flag for the coach, and report.
create table if not exists public.workouts (
  id         uuid primary key default gen_random_uuid(),
  category   text,                  -- 'vocab' | 'comprehension' | 'expression'
  mode       text check (mode in ('auto','coach')),
  title      text not null,
  skill      text,
  level      int,
  items      int,
  content    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.drill_attempts (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references public.profiles(id) on delete cascade,
  workout_id     uuid references public.workouts(id) on delete set null,
  status         text not null default 'todo' check (status in ('todo','done','awaiting','feedback')),
  score          jsonb,             -- { correct, total }
  flagged        int not null default 0,
  body_text      text,              -- coach-reviewed writing
  audio_url      text,              -- coach-reviewed speaking
  coach_feedback text,
  submitted_at   timestamptz,
  created_at     timestamptz not null default now()
);

-- ---- 11. Content: story bodies + curriculum map ----------------------------
-- Full lesson content (transcripts, passages, questions) moves out of the
-- hardcoded lib/stories.ts into a JSONB column — the SAME Story shape the client
-- already renders, now DB-backed and editable from the admin panel.
alter table public.stories
  add column if not exists blurb    text,
  add column if not exists duration text,
  add column if not exists genre    text,
  add column if not exists content  jsonb;

create table if not exists public.curriculum_stories (
  id       uuid primary key default gen_random_uuid(),
  term     int not null,
  level    int not null,
  n        int not null,             -- story number within the level
  story_id uuid references public.stories(id) on delete set null,
  title    text,
  genre    text,
  steps    int,
  unique (term, level, n)
);

-- ---- 12. Notifications -----------------------------------------------------
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type         text,
  title        text,
  body         text,
  link         text,
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ---- 13. Indexes -----------------------------------------------------------
create index if not exists idx_submissions_student on public.submissions(student_id);
create index if not exists idx_submissions_coach   on public.submissions(coach_id);
create index if not exists idx_submissions_status  on public.submissions(status);
create index if not exists idx_homework_student    on public.homework(student_id);
create index if not exists idx_attendance_student  on public.attendance(student_id);
create index if not exists idx_comms_student       on public.comms_log(student_id);
create index if not exists idx_milestones_student  on public.milestones(student_id);
create index if not exists idx_portfolio_student   on public.portfolio_items(student_id);
create index if not exists idx_vocab_student       on public.student_vocab(student_id);
create index if not exists idx_flagged_student     on public.flagged_items(student_id);
create index if not exists idx_attempts_student    on public.drill_attempts(student_id);
create index if not exists idx_notifications_recip on public.notifications(recipient_id);
create index if not exists idx_curriculum_tl       on public.curriculum_stories(term, level);

-- ---- 14. Realtime ----------------------------------------------------------
-- Live marking + notifications benefit from realtime (sessions/events already on).
do $$ begin alter publication supabase_realtime add table public.submissions;   exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.notifications; exception when duplicate_object then null; end $$;

-- Realtime drops UPDATE/DELETE postgres_changes on RLS tables unless the full old
-- row is logged (e.g. notifications mark-as-read, submission status changes).
alter table public.submissions   replica identity full;
alter table public.notifications replica identity full;

-- ---- 15. RLS — PERMISSIVE placeholder (replaced by auth-scoped 0003) --------
do $$
declare t text;
begin
  foreach t in array array[
    'submissions','homework','attendance','comms_templates','comms_log',
    'student_stats','milestones','portfolio_items','student_vocab',
    'flagged_items','workouts','drill_attempts','curriculum_stories','notifications'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists poc_all_%1$s on public.%1$s;', t);
    execute format(
      'create policy poc_all_%1$s on public.%1$s for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;
