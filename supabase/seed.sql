-- ============================================================================
-- Cueword Live-Class POC — seed data (idempotent; safe to re-run)
-- Personas: Ops Admin, Coach Maya, Aanya (Grade 3). Stories K/G3/G6 (metadata
-- only — content lives in lib/stories.ts). One scheduled class so all three
-- dashboards have something to show; the admin can also create more.
-- ============================================================================

insert into public.profiles (id, role, full_name, avatar_emoji, grade, timezone) values
  ('11111111-1111-1111-1111-111111111111', 'admin',   'Ops Admin',   '🛠️', null, 'Asia/Kolkata'),
  ('22222222-2222-2222-2222-222222222222', 'coach',   'Coach Maya',  '🧑‍🏫', null, 'Asia/Manila'),
  ('33333333-3333-3333-3333-333333333333', 'student', 'Aanya',       '🦊', '3',  'America/Los_Angeles')
on conflict (id) do nothing;

insert into public.stories (id, key, grade, title, theme, theme_color, cover_emoji, scene_image_url) values
  ('c0000000-0000-0000-0000-0000000000c0', 'K',  'Grade K', 'Pip the Lost Penguin',
     'Animals · Antarctica',              '#5B8FB9', '🐧', null),
  ('c0000000-0000-0000-0000-0000000000c3', 'G3', 'Grade 3', 'The First Flight',
     'Nonfiction · The Story of Flight',  '#6FA86A', '✈️', '/assets/wright-first-flight.jpg'),
  ('c0000000-0000-0000-0000-0000000000c6', 'G6', 'Grade 6', 'What Killed the Dinosaurs?',
     'Nonfiction · Science Detective',    '#8B6BB1', '☄️', '/assets/dinosaur-skeleton.jpg')
on conflict (id) do nothing;

insert into public.enrollments (id, student_id, coach_id, plan, status, start_date) values
  ('44444444-4444-4444-4444-444444444444',
   '33333333-3333-3333-3333-333333333333',
   '22222222-2222-2222-2222-222222222222',
   '1:1 Pilot', 'active', current_date)
on conflict (id) do nothing;

-- Aanya's slate: all three stories assigned by the admin.
insert into public.assignments (student_id, story_id, assigned_by) values
  ('33333333-3333-3333-3333-333333333333', 'c0000000-0000-0000-0000-0000000000c0', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333', 'c0000000-0000-0000-0000-0000000000c3', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333', 'c0000000-0000-0000-0000-0000000000c6', '11111111-1111-1111-1111-111111111111')
on conflict (student_id, story_id) do nothing;

-- One scheduled class today (story chosen live via the magic moment → story_key stays null).
insert into public.class_sessions
  (id, enrollment_id, student_id, coach_id, story_id, story_key,
   scheduled_at, duration_min, zoom_link, status, driver, current_step)
values
  ('55555555-5555-5555-5555-555555555555',
   '44444444-4444-4444-4444-444444444444',
   '33333333-3333-3333-3333-333333333333',
   '22222222-2222-2222-2222-222222222222',
   null, null,
   now(), 30, 'https://zoom.us/j/0000000000', 'scheduled', 'student', 0)
on conflict (id) do nothing;
