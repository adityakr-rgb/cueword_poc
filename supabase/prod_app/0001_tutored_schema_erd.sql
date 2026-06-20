-- ============================================================================
-- Cueword — TUTORED PRODUCT — ERD / VISUALIZER VERSION
--
-- FOR DIAGRAM TOOLS ONLY (dbdiagram.io, drawSQL, etc.) — NOT for execution.
-- Plain CREATE TABLE only: columns + primary keys + foreign keys + unique.
-- No PL/pgSQL, no dollar-quoted blocks, no enums-as-types, no triggers, no RLS.
-- The runnable migration is: prod_app/0001_tutored_additive.sql
--
-- Enum-style columns are kept as text with an inline -- value hint.
-- students.app_user_id is the seam to the app's users table (external; no FK here).
-- ============================================================================

create table profiles (
  id           uuid primary key,
  role         text not null,        -- admin | coach | student | parent
  full_name    text not null,
  avatar_emoji text,
  email        text,
  phone        text,
  timezone     text,
  tz_city      text,
  status       text,                 -- active | invited | inactive | archived
  created_at   timestamptz,
  updated_at   timestamptz
);

create table coaches (
  profile_id uuid primary key references profiles(id),
  type       text,                   -- full_time | part_time | contract
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

create table students (
  profile_id         uuid primary key references profiles(id),
  grade              int,
  status             text,           -- active | paused | graduated | withdrawn
  learning_mode      text,           -- tutored | self_learn
  parent_id          uuid references parents(profile_id),
  app_user_id        uuid,           -- SEAM: -> users(id) in the app DB (external, nullable)
  placement_stage_id uuid references stages(id),
  entry_term_id      uuid references terms(id),
  current_level_id   uuid references levels(id),
  eval_result_id     uuid references eval_results(id),
  created_at         timestamptz,
  updated_at         timestamptz
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
