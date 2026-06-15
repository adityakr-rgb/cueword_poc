-- ============================================================================
-- Cueword Live-Class POC — seed data (idempotent; safe to re-run)
-- The two-app POC authenticates against packages/core/src/config/poc.config.json
-- (no DB-backed login). This seed only needs the ONE class_sessions row whose id
-- equals config.SESSION_ID ('55555555-…'); both apps subscribe to it for the
-- magic-moment sync. The profiles/enrollments below are legacy FK targets kept
-- so the session row's foreign keys resolve — they are not read by the apps.
-- ============================================================================

-- Legacy profiles (password_hash unused now — auth lives in poc.config.json).
insert into public.profiles (id, role, full_name, avatar_emoji, grade, timezone, username, password_hash) values
  ('11111111-1111-1111-1111-111111111111', 'admin',   'Ops Admin',   '🛠️', null, 'Asia/Kolkata',        'admin', '5ad450e9411230ccb0ec5b5bf1ca88bd:750808cb5167981c96c1b13534ba01c427472700453f4dda3090258fd17ab7e5cc2dbff8dbb0b3d57b611c7e568f57925e833f30ea8e2f808dc1f61cfa91356b'),
  ('22222222-2222-2222-2222-222222222222', 'coach',   'Coach Maya',  '🧑‍🏫', null, 'Asia/Manila',         'maya',  '9930ec7ae90596d814a7e366abfbb085:4741193bf9464dc06f6c7d9c7f564c30bcd90289076ca61f76b0e777ee320aa26df8d430a59de0fe528d852f958da8391b67e6bb70377461d41575aae26fcc93'),
  ('33333333-3333-3333-3333-333333333333', 'student', 'Aanya',       '🦊', '3',  'America/Los_Angeles', 'aanya', '684d08a3a031f48d468690a433eba43b:1e3f722f6e6a7bb8350986f29c30b77225123c5aa5aff8777c2a001259068bb874b80009113b2f80bee3ffbce71504666f787f025a76281402f5ef32418bb04a')
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

-- THE one session both apps watch (id == config.SESSION_ID). story_key stays
-- null so the student picks live (the magic moment). The Zoom link is read from
-- poc.config.json at runtime, not from this row.
insert into public.class_sessions
  (id, enrollment_id, student_id, coach_id, story_id, story_key,
   scheduled_at, duration_min, zoom_link, status, driver, current_step)
values
  ('55555555-5555-5555-5555-555555555555',
   '44444444-4444-4444-4444-444444444444',
   '33333333-3333-3333-3333-333333333333',
   '22222222-2222-2222-2222-222222222222',
   null, null,
   now(), 30, 'https://zoom.us/j/94945601041?pwd=kwiv9XebE7z06u0iVyaqbaKIpTMMq3.1', 'scheduled', 'student', 0)
on conflict (id) do nothing;
