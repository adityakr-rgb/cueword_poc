-- ============================================================================
-- Cueword Live-Class POC — schema
-- The sync spine is class_sessions (watched by Supabase Realtime). Content
-- (transcripts/questions) lives client-side in lib/stories.ts; the DB only
-- syncs a pointer (story_key + current_step) + an activity stream.
--
-- POC security: RLS is ON with PERMISSIVE policies (anon may read/write) so the
-- demo needs no auth. PRODUCTION: replace each "poc_all_*" policy with
-- auth-scoped rules (student sees own sessions, coach sees roster, etc.).
-- ============================================================================

-- ---- Tables ---------------------------------------------------------------

create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  role          text not null check (role in ('admin','student','coach')),
  full_name     text not null,
  avatar_emoji  text,
  grade         text,
  timezone      text,
  username      text,          -- login id (admin-generated)
  password_hash text,          -- scrypt: "salt:hash" (POC auth; see lib/password.ts)
  created_at    timestamptz not null default now()
);
create unique index if not exists idx_profiles_username
  on public.profiles (lower(username)) where username is not null;

create table if not exists public.enrollments (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  coach_id   uuid not null references public.profiles(id) on delete cascade,
  plan       text,
  status     text default 'active',
  start_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.stories (
  id              uuid primary key default gen_random_uuid(),
  key             text unique not null,           -- 'K' | 'G3' | 'G6'
  grade           text,
  title           text not null,
  theme           text,
  theme_color     text,
  cover_emoji     text,
  scene_image_url text,
  created_at      timestamptz not null default now()
);

create table if not exists public.assignments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles(id) on delete cascade,
  story_id    uuid not null references public.stories(id) on delete cascade,
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz not null default now(),
  status      text default 'assigned',
  unique (student_id, story_id)
);

-- The live shared state. student_id/coach_id/story_key are denormalized so the
-- dashboards can query + filter Realtime without joins.
create table if not exists public.class_sessions (
  id            uuid primary key default gen_random_uuid(),
  enrollment_id uuid references public.enrollments(id) on delete set null,
  student_id    uuid references public.profiles(id) on delete set null,
  coach_id      uuid references public.profiles(id) on delete set null,
  story_id      uuid references public.stories(id) on delete set null,
  story_key     text,
  scheduled_at  timestamptz,
  duration_min  int default 30,
  zoom_link     text,
  status        text not null default 'scheduled'
                  check (status in ('scheduled','live','completed','cancelled')),
  driver        text not null default 'student' check (driver in ('student','coach')),
  current_step  int not null default 0,
  current_phase text,
  started_at    timestamptz,
  ended_at      timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists public.session_events (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.class_sessions(id) on delete cascade,
  actor_role text check (actor_role in ('admin','student','coach')),
  type       text not null check (type in ('open_story','step','answer','phase','note')),
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.progress (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  skill      text not null,
  level      int,
  status     text check (status in ('locked','unlocked','practised','mastered')),
  source     text,
  updated_at timestamptz not null default now(),
  unique (student_id, skill)
);

-- ---- Indexes --------------------------------------------------------------
create index if not exists idx_sessions_student on public.class_sessions(student_id);
create index if not exists idx_sessions_coach   on public.class_sessions(coach_id);
create index if not exists idx_sessions_status  on public.class_sessions(status);
create index if not exists idx_events_session   on public.session_events(session_id);
create index if not exists idx_assign_student   on public.assignments(student_id);

-- ---- Row Level Security: permissive for the POC ---------------------------
-- (Realtime postgres_changes are only delivered to a role that can SELECT.)
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','enrollments','stories','assignments',
    'class_sessions','session_events','progress'
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

-- ---- Realtime: stream the sync spine + activity stream ---------------------
do $$
begin
  alter publication supabase_realtime add table public.class_sessions;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.session_events;
exception when duplicate_object then null;
end $$;

-- Realtime evaluates RLS against the OLD row for UPDATE/DELETE. With the default
-- replica identity that row carries only the primary key, so Realtime silently
-- DROPS the student's setStep() updates and the coach never syncs. REPLICA
-- IDENTITY FULL ships the whole old row so RLS passes and postgres_changes flow.
alter table public.class_sessions replica identity full;
alter table public.session_events  replica identity full;
