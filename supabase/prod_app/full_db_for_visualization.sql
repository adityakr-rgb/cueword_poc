-- ============================================================================
-- Cueword — FULL MERGED DB — FOR VISUALIZATION ON A DUMMY PROJECT ONLY
--
-- Run this in a THROWAWAY / dummy Supabase project to see the COMPLETE picture
-- in the schema visualizer: the 14 existing app tables (Zone A) + the 38 new
-- tutored tables (Zone B) + the students->users bridge, all 52 tables wired.
--
--   *** DO NOT RUN THIS ON PRODUCTION. ***
--   Production already HAS the 14 app tables. On production you run ONLY
--   prod_app/0001_tutored_additive.sql (additive, no app tables created).
--
-- This is a BARE SCHEMA for diagrams: plain CREATE TABLE + foreign keys, no
-- defaults / checks / RLS / triggers / functions, so it also imports into web
-- ERD tools. It is dependency-ordered, so it executes top-to-bottom cleanly.
-- (Supabase always provides auth.users, so the id -> auth.users FKs resolve.)
--
-- It starts by DROPPING all 52 tables (if they exist) so it re-runs cleanly on
-- a dummy that already has a starter `profiles` or a half-finished prior run.
-- This DROP is why it must NEVER touch production. Dummy projects only.
-- ============================================================================

-- ============================================================================
-- RESET (DUMMY ONLY) — wipe any pre-existing / partial tables first.
-- ============================================================================
drop table if exists audit_log cascade;
drop table if exists notifications cascade;
drop table if exists homework cascade;
drop table if exists engine_params cascade;
drop table if exists parent_comms cascade;
drop table if exists gap_pack_assignments cascade;
drop table if exists gap_packs cascade;
drop table if exists skill_trackers cascade;
drop table if exists belt_credit cascade;
drop table if exists level_access cascade;
drop table if exists practice_responses cascade;
drop table if exists workout_reviews cascade;
drop table if exists workout_items cascade;
drop table if exists artifacts cascade;
drop table if exists ai_evaluations cascade;
drop table if exists submissions cascade;
drop table if exists question_answers cascade;
drop table if exists story_attempts cascade;
drop table if exists attendance cascade;
drop table if exists session_events cascade;
drop table if exists class_sessions cascade;
drop table if exists practice_pack cascade;
drop table if exists teacher_tips cascade;
drop table if exists story_vocab cascade;
drop table if exists question_keys cascade;
drop table if exists questions cascade;
drop table if exists story_sections cascade;
drop table if exists consent_records cascade;
drop table if exists enrollments cascade;
drop table if exists eval_results cascade;
drop table if exists class_stories cascade;
drop table if exists students cascade;
drop table if exists parents cascade;
drop table if exists coaches cascade;
drop table if exists levels cascade;
drop table if exists terms cascade;
drop table if exists stages cascade;
drop table if exists profiles cascade;
drop table if exists stories cascade;
drop table if exists app_config cascade;
drop table if exists deleted_trials cascade;
drop table if exists studio_profiles cascade;
drop table if exists push_tokens cascade;
drop table if exists rate_limits cascade;
drop table if exists experiment_events cascade;
drop table if exists parent_otps cascade;
drop table if exists content cascade;
drop table if exists streaks cascade;
drop table if exists activity_results cascade;
drop table if exists sessions cascade;
drop table if exists skill_profiles cascade;
drop table if exists users cascade;

-- ============================================================================
-- ZONE A — existing self-learn app (these already exist in production)
-- ============================================================================
create table users (
  id                     uuid primary key references auth.users(id),
  name                   text not null,
  age                    int not null,
  grade                  int not null,
  companion_type         text,
  companion_name         text,
  created_at             timestamptz,
  onboarding_complete    boolean,
  parent_pin             text,
  trial_cohort           int,
  learn_more_variant     text,
  free_tier_variant      text,
  trial_start_date       text,
  trial_end_date         text,
  trial_status           text,
  parent_report_variant  text,
  parental_consent_given boolean,
  parental_consent_at    timestamptz,
  avatar_url             text,
  device_id              text,
  comp_granted           boolean
);

create table skill_profiles (
  id                   uuid primary key,
  user_id              uuid references users(id),
  skill                text not null,
  grade_level          int not null,
  level                int not null,
  tier_name            text,
  tier_visible         boolean,
  consecutive_above_80 int,
  consecutive_below_60 int,
  updated_at           timestamptz,
  baseline_grade       int,
  learning_level       int,
  first_session_done   boolean,
  current_level_slug   text,
  current_level_order  int,
  current_unit_index   int,
  current_item_index   int,
  elo_rating           int,
  elo_sessions_count   int,
  xp_level             int,
  total_xp             int
);

create table sessions (
  id                 uuid primary key,
  user_id            uuid references users(id),
  date               date not null,
  completed          boolean,
  xp_earned          int,
  created_at         timestamptz,
  content_selections jsonb,
  completed_at       timestamptz
);

create table activity_results (
  id                   uuid primary key,
  session_id           uuid references sessions(id),
  skill                text not null,
  score                int,
  max_score            int,
  xp_earned            int,
  bonus_xp             boolean,
  second_replay_used   boolean,
  silence_check_passed boolean,
  completed            boolean,
  created_at           timestamptz,
  response             jsonb,
  pending              boolean,
  content_id           uuid,
  item_index           int,
  first_attempt_bonus  boolean
);

create table streaks (
  id                  uuid primary key,
  user_id             uuid references users(id),
  current_streak      int,
  longest_streak      int,
  last_completed_date date,
  freeze_count        int,
  freeze_active       boolean,
  freeze_used_date    date
);

create table content (
  id           uuid primary key,
  skill        text not null,
  grade_level  int not null,
  level        int not null,
  topic        text,
  content_type text,
  body         jsonb,
  status       text,
  created_at   timestamptz,
  level_slug   text,
  unit_index   int,
  level_order  int,
  difficulty   int,
  source       text,
  created_by   uuid,
  reviewed_by  uuid,
  approved_by  uuid,
  promoted_by  uuid,
  reviewed_at  timestamptz,
  approved_at  timestamptz,
  promoted_at  timestamptz,
  review_notes jsonb
);

create table parent_otps (
  id         uuid primary key,
  user_id    uuid references users(id),
  code       text not null,
  expires_at timestamptz not null,
  created_at timestamptz
);

create table experiment_events (
  id                 uuid primary key,
  user_id            uuid references users(id),
  event_type         text not null,
  trial_cohort       int,
  learn_more_variant text,
  free_tier_variant  text,
  metadata           jsonb,
  created_at         timestamptz
);

create table rate_limits (
  id            uuid primary key,
  user_id       uuid not null,
  function_name text not null,
  called_at     timestamptz
);

create table push_tokens (
  id         uuid primary key,
  user_id    uuid unique,
  token      text not null,
  platform   text not null,
  updated_at timestamptz
);

create table studio_profiles (
  id         uuid primary key,
  name       text not null,
  email      text not null,
  role       text not null,
  created_at timestamptz
);

create table deleted_trials (
  id         uuid primary key,
  device_id  text not null,
  deleted_at timestamptz
);

create table app_config (
  id              smallint primary key,
  min_app_version text not null,
  updated_at      timestamptz,
  params          jsonb
);

-- the app's AI-generation cache (stays this shape; authored stories = class_stories)
create table stories (
  id            uuid primary key,
  manifest_hash text unique,
  grade_level   int,
  frame         text,
  content_refs  jsonb not null,
  storyline     jsonb not null,
  model         text,
  created_at    timestamptz
);

-- ============================================================================
-- ZONE B — new tutored product (ordered so every FK points at an existing table)
-- ============================================================================
create table profiles (
  id           uuid primary key references auth.users(id),
  role         text not null,        -- admin | coach | student | parent
  full_name    text not null,
  avatar_emoji text,
  email        text,
  phone        text,
  timezone     text,
  tz_city      text,
  status       text,
  created_at   timestamptz,
  updated_at   timestamptz
);

create table stages (
  id           uuid primary key,
  number       int,
  belt         text,
  band         text,
  skill_anchor text,                 -- listen | read | vocab | speak | write
  pilot_grade  int,
  created_at   timestamptz,
  updated_at   timestamptz
);

create table terms (
  id         uuid primary key,
  stage_id   uuid references stages(id),
  number     int,
  name       text,
  created_at timestamptz,
  updated_at timestamptz,
  unique (stage_id, number)
);

create table levels (
  id              uuid primary key,
  term_id         uuid references terms(id),
  number_in_term  int,
  number_in_stage int,
  lo              text,
  skill_register  jsonb,
  created_at      timestamptz,
  updated_at      timestamptz,
  unique (term_id, number_in_term)
);

create table coaches (
  profile_id uuid primary key references profiles(id),
  type       text,
  timezone   text,
  capacity   int,
  zoom_link  text,
  meta       jsonb,
  created_at timestamptz,
  updated_at timestamptz
);

create table parents (
  profile_id  uuid primary key references profiles(id),
  comms_prefs jsonb,
  created_at  timestamptz,
  updated_at  timestamptz
);

-- SEAM: app_user_id -> users(id) is the bridge to the self-learn app.
-- eval_result_id FK is added at the very end (students <-> eval_results cycle).
create table students (
  profile_id         uuid primary key references profiles(id),
  grade              int,
  status             text,           -- active | paused | graduated | withdrawn
  learning_mode      text,           -- tutored | self_learn
  parent_id          uuid references parents(profile_id),
  app_user_id        uuid references users(id),
  placement_stage_id uuid references stages(id),
  entry_term_id      uuid references terms(id),
  current_level_id   uuid references levels(id),
  eval_result_id     uuid,
  created_at         timestamptz,
  updated_at         timestamptz
);

create table class_stories (
  id          uuid primary key,
  level_id    uuid references levels(id),
  ord         int,
  key         text unique,
  title       text not null,
  theme       text,
  age_band    text,
  cover_emoji text,
  scene       jsonb,
  status      text,                  -- draft | published | archived
  created_by  uuid references profiles(id),
  created_at  timestamptz,
  updated_at  timestamptz,
  unique (level_id, ord)
);

create table eval_results (
  id                 uuid primary key,
  student_id         uuid references students(profile_id),
  grade              int,
  placement_stage_id uuid references stages(id),
  placement_term_id  uuid references terms(id),
  per_skill_levels   jsonb,
  report_url         text,
  evaluator_id       uuid references profiles(id),
  created_at         timestamptz
);

create table enrollments (
  id         uuid primary key,
  student_id uuid references students(profile_id),
  coach_id   uuid references coaches(profile_id),
  term_id    uuid references terms(id),
  plan       text,
  status     text,                   -- active | paused | completed | cancelled
  start_date date,
  end_date   date,
  created_at timestamptz,
  updated_at timestamptz,
  unique (student_id, term_id)
);

create table consent_records (
  id         uuid primary key,
  parent_id  uuid references parents(profile_id),
  student_id uuid references students(profile_id),
  type       text,                   -- coppa | recording | data_processing
  version    text,
  method     text,
  granted_at timestamptz,
  revoked_at timestamptz,
  unique (student_id, type)
);

create table story_sections (
  id             uuid primary key,
  class_story_id uuid references class_stories(id),
  phase          text,               -- listen | read | speak | write
  content        jsonb,
  created_at     timestamptz,
  updated_at     timestamptz,
  unique (class_story_id, phase)
);

create table questions (
  id         uuid primary key,
  section_id uuid references story_sections(id),
  ord        int,
  type       text,                   -- mcq | multi | truefalse | tap | sequence | cloze | match | short
  skill      text,                   -- listen | read | vocab
  rung       text,
  stem       text not null,
  hint       text,
  data       jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  unique (section_id, ord)
);

create table question_keys (
  question_id uuid primary key references questions(id),
  correct     jsonb not null
);

create table story_vocab (
  id             uuid primary key,
  class_story_id uuid references class_stories(id),
  word           text not null,
  definition     text,
  examples       jsonb,
  is_top         boolean,
  created_at     timestamptz,
  unique (class_story_id, word)
);

create table teacher_tips (
  id             uuid primary key,
  class_story_id uuid references class_stories(id),
  phase          text,
  step_ref       text,
  tip_text       text not null,
  ord            int,
  created_at     timestamptz
);

create table practice_pack (
  id         uuid primary key,
  level_id   uuid references levels(id),
  kind       text,                   -- micro_passage | micro_clip | production_prompt | sentence_surgery
  skill      text,
  content    jsonb,
  status     text,
  created_at timestamptz,
  updated_at timestamptz
);

create table class_sessions (
  id                  uuid primary key,
  enrollment_id       uuid references enrollments(id),
  student_id          uuid references students(profile_id),
  coach_id            uuid references coaches(profile_id),
  class_story_id      uuid references class_stories(id),
  scheduled_at        timestamptz,
  duration_min        int,
  zoom_link           text,
  status              text,          -- scheduled | live | completed | cancelled
  driver              text,          -- student | coach
  current_step        int,
  current_phase       text,
  current_question_id uuid references questions(id),
  started_at          timestamptz,
  ended_at            timestamptz,
  cancelled_at        timestamptz,
  cancel_reason       text,
  cancelled_by        uuid references profiles(id),
  created_at          timestamptz,
  updated_at          timestamptz
);

create table session_events (
  id         uuid primary key,
  session_id uuid references class_sessions(id),
  actor_id   uuid references profiles(id),
  actor_role text,
  type       text,                   -- open_story | step | answer | phase | note
  payload    jsonb,
  created_at timestamptz
);

create table attendance (
  id         uuid primary key,
  student_id uuid references students(profile_id),
  session_id uuid references class_sessions(id),
  status     text,                   -- present | late | absent | excused | scheduled
  marked_by  uuid references profiles(id),
  created_at timestamptz,
  unique (session_id, student_id)
);

create table story_attempts (
  id               uuid primary key,
  student_id       uuid references students(profile_id),
  class_story_id   uuid references class_stories(id),
  session_id       uuid references class_sessions(id),
  status           text,             -- in_progress | completed | abandoned
  accuracy         numeric,
  points_awarded   int,
  per_skill_scores jsonb,
  is_reserve       boolean,
  last_step        int,
  started_at       timestamptz,
  completed_at     timestamptz,
  updated_at       timestamptz
);

create table question_answers (
  id          uuid primary key,
  attempt_id  uuid references story_attempts(id),
  student_id  uuid references students(profile_id),
  question_id uuid references questions(id),
  answer      jsonb not null,
  is_correct  boolean,
  created_at  timestamptz,
  unique (attempt_id, question_id)
);

create table submissions (
  id               uuid primary key,
  student_id       uuid references students(profile_id),
  origin           text,             -- story | workout
  section_id       uuid references story_sections(id),
  practice_pack_id uuid references practice_pack(id),
  skill            text,             -- speak | write
  type             text,             -- spoken | written
  body             text,
  content_url      text,
  score            numeric,
  tutor_feedback   text,
  marked_by        uuid references profiles(id),
  status           text,             -- submitted | ai_scored | marked | sent
  created_at       timestamptz,
  updated_at       timestamptz,
  marked_at        timestamptz
);

create table ai_evaluations (
  id            uuid primary key,
  submission_id uuid references submissions(id),
  status        text,                -- pending | running | succeeded | failed
  result        jsonb,
  model_used    text,
  tokens_in     int,
  tokens_out    int,
  cost_cents    numeric,
  error         text,
  created_at    timestamptz,
  completed_at  timestamptz
);

create table artifacts (
  id             uuid primary key,
  student_id     uuid references students(profile_id),
  submission_id  uuid references submissions(id),
  type           text,
  content_url    text,
  title          text,
  tutor_feedback text,
  created_at     timestamptz
);

create table workout_items (
  id                    uuid primary key,
  student_id            uuid references students(profile_id),
  type                  text,        -- vocab | recall
  source_class_story_id uuid references class_stories(id),
  payload               jsonb,
  srs_state             jsonb,
  ladder_step           int,
  due_at                timestamptz,
  matured               boolean,
  created_at            timestamptz,
  updated_at            timestamptz
);

create table workout_reviews (
  id              uuid primary key,
  workout_item_id uuid references workout_items(id),
  student_id      uuid references students(profile_id),
  correct         boolean not null,
  resulting_state jsonb,
  reviewed_at     timestamptz
);

create table practice_responses (
  id               uuid primary key,
  student_id       uuid references students(profile_id),
  practice_pack_id uuid references practice_pack(id),
  skill            text,
  answer           jsonb,
  score            numeric,
  created_at       timestamptz
);

create table level_access (
  id         uuid primary key,
  student_id uuid references students(profile_id),
  level_id   uuid references levels(id),
  points     int,
  latched    boolean,
  stars      jsonb,
  status     text,                   -- in_progress | open | needs_review
  updated_at timestamptz,
  unique (student_id, level_id)
);

create table belt_credit (
  id           uuid primary key,
  student_id   uuid references students(profile_id),
  level_id     uuid references levels(id),
  retained_pct numeric,
  credited     boolean,
  credited_at  timestamptz,
  updated_at   timestamptz,
  unique (student_id, level_id)
);

create table skill_trackers (
  id         uuid primary key,
  student_id uuid references students(profile_id),
  skill      text,
  rating     numeric,
  status     text,                   -- locked | unlocked | practised | mastered
  updated_at timestamptz,
  unique (student_id, skill)
);

create table gap_packs (
  id           uuid primary key,
  skill_anchor text,
  title        text not null,
  pdf_url      text,
  created_at   timestamptz
);

create table gap_pack_assignments (
  id           uuid primary key,
  student_id   uuid references students(profile_id),
  gap_pack_id  uuid references gap_packs(id),
  assigned_by  uuid references profiles(id),
  status       text,                 -- assigned | in_progress | completed
  assigned_at  timestamptz,
  completed_at timestamptz,
  unique (student_id, gap_pack_id)
);

create table parent_comms (
  id         uuid primary key,
  student_id uuid references students(profile_id),
  coach_id   uuid references coaches(profile_id),
  channel    text,                   -- whatsapp | email | sms
  template   text,
  note       text,
  sent_at    timestamptz
);

create table engine_params (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_at  timestamptz
);

create table homework (
  id             uuid primary key,
  student_id     uuid references students(profile_id),
  assigned_by    uuid references profiles(id),
  skill          text,
  title          text not null,
  type           text,
  description    text,
  items_count    int,
  class_story_id uuid references class_stories(id),
  submission_id  uuid references submissions(id),
  due_date       date,
  status         text,               -- assigned | completed | overdue | cancelled
  assigned_at    timestamptz,
  updated_at     timestamptz
);

create table notifications (
  id           uuid primary key,
  recipient_id uuid references profiles(id),
  type         text,
  title        text,
  body         text,
  link         text,
  read         boolean,
  created_at   timestamptz
);

create table audit_log (
  id          uuid primary key,
  actor_id    uuid references profiles(id),
  action      text not null,
  entity_type text,
  entity_id   uuid,
  summary     text,
  diff        jsonb,
  created_at  timestamptz
);

-- close the students <-> eval_results cycle (the only deferred FK)
alter table students add constraint students_eval_result_fk
  foreign key (eval_result_id) references eval_results(id);
