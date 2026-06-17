# Cueword × Edge — Features & Functions Reference

A complete, technical catalog of **everything this website does** — every screen, every
interactive feature, and every function in the shared code. This is a working reference for
people building on or extending the app (not a pitch). For the high-level idea see
[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md); for setup [README.md](../README.md); for shipping
[DEPLOY.md](../DEPLOY.md).

---

## 0. What the site is, in one paragraph

Two separately-deployed Next.js apps — a **Student app** (`apps/student` → student.cueword.com)
and a **Coach app** (`apps/coach` → coach.cueword.com) — that share one Supabase backend and one
shared code package (`@cueword/core`). Almost every screen is a faithful, **static design port**
(driven by local mock data). The **one live, networked feature** is the **synced live class** at
`/live`: when the student opens a story it appears on the coach's screen in real time, and both
walk the lesson (Listen → Read → Speak → Write) in lock-step, with a coach-only teaching playbook.

There are two roles, each fixed to its own app, with one hardcoded login pair:

| Role    | App           | Login             | Display name |
| ------- | ------------- | ----------------- | ------------ |
| Student | `apps/student`  | `maya` / `maya123`  | Maya         |
| Coach   | `apps/coach`    | `liza` / `liza123`  | Liza Reyes   |

---

# PART A — STUDENT APP FEATURES

A warm, gold-themed student space. Sidebar nav: **Home · My Stories · My Workouts · Schedule ·
My Progress · My Portfolio** + a profile chip with Log out. (`apps/student/components/Shell.tsx`)

## A1. Login (`/login`)
- Single-role login form: only the student credentials are accepted.
- Validates client-side against `poc.config.json`; on success stores identity in `localStorage`.
- Every student screen is gated → redirects to `/login` if not logged in.

## A2. Home / Dashboard (`/(shell)/page.tsx`)
The launch pad. Features:
- **Greeting hero** with today's date and the next class callout (coach, time, "starts in N min").
- **Join Zoom Class** button → opens a cosmetic **Connection Check** modal (`NetCheck`): steps
  through wifi/camera/mic/screen checks on a timer, then enables **Join class now**.
- **The live-class seam (`joinClass`)**: the final Join action **opens the real Zoom link in a new
  tab** *and* navigates to `/live` (entering the synced live class). This is how the student enters
  the magic moment.
- **Daily Vocabulary Warmup strip** (`VocabStrip`): shows a word; "Reveal meaning" flips to the
  definition + example; "Got it! Next word" toggles back.
- **Flagged-for-class strip** (`FlaggedStrip`): tricky items from past workouts saved to review
  with the coach (skill-colored, with a count badge).
- **My Skill Levels grid**: Reading / Listening / Writing / Speaking tiles with level + progress
  bar; tapping any goes to My Stories.
- **My Workouts preview**: workout categories, each tagged "Scored instantly" or "Coach reviews".
- **Pick up where you left off** (`ResumeCard`): resume cards that deep-link into a `/story/[id]`.

## A3. My Stories (`/(shell)/lessons/page.tsx`)
The term-led story library.
- **Terms box**: 3 Terms; only the assigned term is unlocked, others show "Unlocks when you
  re-enrol".
- **Levels accordion**: the assigned term has 8 Levels; each expands to reveal its stories. Levels
  carry state `locked` / `current` / `done`; locked levels can't open.
- **Story grid** (`StoryCard`): per story — cover art (theme-colored scene gradient), theme, title,
  blurb, duration + points, and a status badge (Completed / Continue / Upcoming / Locked) with a
  progress bar. Tapping an unlocked story opens the self-serve Story player (`/story/[id]`).
- **Level Workout** (`LevelWorkout`): each level closes with a mixed-drill workout (done score /
  Practise button / locked).

## A4. My Workouts (`/(shell)/workouts/page.tsx`)
Self-paced practice between classes. Three categories, two grading modes:
- **Auto-scored** (Vocabulary, Reading & Listening Comprehension): runs the **DrillRunner** modal —
  one MCQ at a time, instant right/wrong marking, a progress bar, and a **wrong answer is "flagged"
  for the coach** ("saved for your coach to review in class"). Ends on a score ring with a
  flagged-count note.
- **Coach-reviewed** (Speaking & Writing): runs the **CoachDrill** modal — a textarea (writing) or a
  tap-to-record mic stub (speaking); **Send to coach** moves it to "awaiting", and a later
  "feedback" state shows the coach's note.
- Per-drill cards track status across the session (`done` w/ score, `awaiting`, `feedback`, `todo`).
- Headline principle shown in-UI: *"Anything you get wrong is saved for class — a mistake is never
  a dead end."*

## A5. Schedule (`/(shell)/schedule/page.tsx`)
Parent-facing weekly calendar.
- **Weekly slot cap**: exactly 2 classes/week, shown as filled/empty dots.
- **Timezone strip**: times shown in the student's US timezone; notes the coach is in Manila and
  "we've converted it for you."
- **Today's class callout** → **Join class** runs the same NetCheck → live-class seam (Zoom + `/live`).
- **Week grid**: per-day class cards (skill-colored), with Attended status for past classes.
- **Parent cancellation** (`CancelModal`): a class can be cancelled **only 4h+ before start**
  (otherwise the button is "Locked"); cancelling frees the weekly slot.
- **Zoom automation note**: one fixed link auto-joins and auto-records every class.

## A6. My Progress (`/(shell)/progress/page.tsx`)
Parent-facing progress dashboard.
- **Child snapshot banner**: name, grade, coach, current belt + level, next class.
- **Belt & Level hero**: an SVG **belt progress ring** (`BeltRing`) showing % toward the next belt,
  plus a pip track of all belts.
- **Points-to-next-belt card**: a single 1,000-point goal; progress bar + "N points to the next
  belt."
- **Level card**: story dots for the current level (done/next), "N more stories to reach Level X+1."
- **Milestone alerts**: nudges to keep going.
- **KPI strip**: classes attended, stories completed, workouts completed, avg accuracy (stories &
  workouts), days to next milestone.
- **Recent coach feedback** cards + a **Term milestones** timeline.

## A7. My Portfolio (`/(shell)/works/page.tsx`)
Saved class work, filterable (All / Reading / Listening / Writing / Speaking).
- **Writing pieces**: excerpt cards; modal shows the full text + coach note.
- **Speaking pieces**: a **waveform + play/pause** audio player (cosmetic) with duration.
- **Reading & Listening exercises** (`QuizResult`): a score block + per-question dots; modal shows
  the score ring, each question with the student's answer marked correct/missed, and (for listening)
  an audio clip player.
- Every item carries a **coach's note**.

## A8. Self-serve Story player (`/story/[id]`)
The at-home, single-story reading flow (independent of the live class; no Supabase). Steps with a
progress **Stepper**: **Listen → Read → Word Play → Speak → Write → Complete**.
- **Listen**: a themed **Scene**, a play button that animates a **waveform** and progressively
  reveals the **transcript** line by line.
- **Read**: the passage with **tappable inline vocab** (opens a definition popup with a usage
  example pulled from the passage), a "new words" bar, and embedded comprehension questions
  (`StoryQuestions`).
- **Word Play**: a vocabulary matching game (`VocabGame`).
- **Speak**: a prompt with hints + a **tap-to-record** mic (timer) → mock **AI feedback**
  (score /10, rubric bars, "what you nailed" / "try this next time").
- **Write**: a prompt with plan hints + a textarea with a **30-word minimum** gate → mock AI
  feedback (rubric grid).
- **Complete**: confetti finish screen — points earned, an **animated belt-progress bar** growing,
  and **new vocab words added to a spaced-revision deck**.
- **Esc** closes a vocab popup or exits; keyboard-friendly.

---

# PART B — COACH APP FEATURES

A professional coaching console (9 screens). Icon-rail nav: **Dashboard · Roster · Schedule ·
Attendance · Curriculum · Marking · Comms**, plus a **Live class** pulse button, a profile/avatar
button, and a contextual sidebar on some routes. A **Manila clock** + "Students in US time"
reminder sits in the top bar. (`apps/coach/components/Shell.tsx`)

> The Shell owns the single `useActiveSession()` Realtime subscription and shares it via React
> context (`useLiveSession`) so the dashboard live-hero reads the real session without opening a
> duplicate channel. The live "pulse" in the rail is driven by the **real** session status.

## B1. Login (`/login`)
- Single-role coach login, same client-side mechanism as the student app.

## B2. Dashboard (`/(shell)/page.tsx`)
- **Greeting** + today's session/marking counts.
- **Live hero**: when the real session is live, a dark hero card shows the live student + a **Join
  Zoom** button and clicks through to `/live`. Otherwise shows an **Up next** card.
- **Time-gated Join**: `joinActive()` only shows a session's Join button from **15 min before start
  to 15 min after end** (Manila time); ticks every 30s.
- **KPI cards**: total students, sessions today, items to mark (hot), attendance %.
- **Today's sessions** panel: each session row (avatar, skill chip, time, duration, Live/Done/
  Upcoming status, conditional Join).
- **Your tasks inbox**: a **priority-ordered** merge of marking submissions + per-student homework
  (overdue → to-mark → to-assign → assigned → completed); marking rows deep-link to `/marking/[id]`,
  homework rows to `/roster/[id]`.

## B3. Roster (`/(shell)/roster/page.tsx` + `/roster/[id]`)
- **List**: a table of all students (avatar, grade chip, next session, term, live/done/upcoming
  status); rows click into the detail page. Filter + Find buttons (cosmetic).
- **Contextual sidebar**: students grouped by grade.
- **Student detail** (`/roster/[id]`):
  - **Skill levels & scores table**: per skill — level, score% (color-graded) with a bar, status
    tag, and an **"App sync"** column showing whether the coach-side level matches the student app's
    level (synced / behind).
  - **Session history** with notes; **Homework** table (task, due, status).
  - Header actions: Eval report, **Message parent** (→ Comms).

## B4. Schedule (`/(shell)/schedule/page.tsx`)
- **Week grid** (Mon–Sun × time rows), event pills colored per student; clicking a live pill → `/live`,
  others → the student detail.
- **Live-now callout** → opens the live class / Join Zoom.
- A **"NOW" current-time indicator** line (Google-Calendar style) on today's column.
- A persistent **Manila-time banner** + a per-student color legend. "Schedule session" button
  (cosmetic).

## B5. Attendance (`/(shell)/attendance/page.tsx`)
- Period toggle (week / month / term).
- **KPI cards**: overall attendance %, present, late, absent (computed from the data).
- **Per-student records table**: attendance rate (color-graded) with a bar, a **recent-sessions
  heatmap** of colored squares (present/late/absent), and P/L/A counts. Rows click to the student.
- Contextual sidebar flags students **below 95%**.

## B6. Curriculum (`/(shell)/curriculum/page.tsx`)
- A **3 Terms × 8 Levels × 10 Stories** browser, per selected student.
- **Term tabs** (current/done/locked), a **level progression ribbon** (done/current/locked nodes),
  and the selected level's **story table** (number, title, **genre chip**, status).
- Each story row's action depends on status: **Teach now** (→ `/live`) for the current story,
  **Preview** for done, **Unlock** for locked.
- Notes that content is pushed from admin; the coach assigns & sequences. Every story runs the
  fixed **Listen → Read → Speak → Write** flow.

## B7. Marking (`/(shell)/marking/page.tsx` + `/marking/[id]`)
- **Queue**: submissions to grade (contextual sidebar mirrors it); an **AI-ready** spark tag marks
  items with an AI draft.
- **Marking item** (`/marking/[id]`):
  - **The work**: either an **AudioBar** (play/pause + animated waveform + transcript, for spoken
    work) or the written body.
  - **AI score card**: per-criterion 1–5 **clickable score chips** (editable) and a computed overall
    /100; falls back to "grade manually" when not AI-scored.
  - **Feedback**: an AI-drafted, editable textarea → **Send feedback** ("Sends to the student's app
    + parent log"; shows ✓ Sent).
  - **Assign homework**: skill + type selects, description, due date → **Assign** (local demo).

## B8. Comms (`/(shell)/comms/page.tsx`)
- Parent communication log (method + last-touched per student); contextual sidebar lists recent
  touches. Reached from the student detail's "Message parent."

## B9. Profile / Settings (`/(shell)/profile/page.tsx`)
- Sections: Profile / Preferences / Account (via `?section=`); shows the signed-in coach identity.

## B10. Live class (`/live`) — coach side
Covered in Part C (the shared live class). The coach side adds: **Start/Restart class**, a
**"waiting for the student to open a story"** state, the **coach playbook**, **Take over / Give
control**, the student's **answers mirrored live**, **End class**, and **Join Zoom**.

---

# PART C — THE LIVE CLASS (the one synced, networked feature)

Mounted at `/live` in **both** apps. The shared shell is `<LiveClass>`
(`packages/core/src/components/LiveClass.tsx`), composed of a TopBar, **ClassPeople** (left),
**LessonCanvas** (center), and — coach only — the **CoachPlaybook** (right).

## C1. The magic-moment flow
1. **Coach** `/live` → **Start class** (`startClass`) → status flips `live`, story cleared → shows
   **"Waiting for {student} to open a story."**
2. **Student** taps **Join** (Home/Schedule) → Zoom opens + lands on `/live`, which **auto-opens the
   configured story** (`openStory`, default `G3` "The First Flight") — no picker. Status → `live`,
   step 0, phase Listen, driver = student.
3. The story **appears on the coach's screen** within a moment (Realtime push), and the lesson runs.

## C2. The synced lesson structure
`buildSteps()` expands a story into an ordered step list:
`cover → listen → (Listen questions) → read → (Read questions) → game → speak → write → ending →
complete`. Four phases with on-screen time budgets: **Listen 5m · Read 8m · Speak 6m · Write 5m.**

## C3. LessonCanvas (center column) — features
- **Phase rail** showing Listen/Read/Speak/Write with done/active states.
- **StageCard**: renders the current step — cover, listen (clip + transcript), a **question** (one
  of 8 types), read passage with tappable vocab, the vocab game, speak, write, ending, complete.
- **Navigation**: Back / Next + a "Step N / M · Phase" counter. **Only the driver** can navigate;
  the driver also gets **← / → arrow-key paging** (ignored while typing).
- **VocabPopup** for tapped words.
- **Canvas label** announces who's sharing ("{student} is sharing & answering" / "{coach} is sharing
  & marking").

## C4. Question types (8)
`mcq` (choose one) · `multi` (choose all) · `truefalse` · `tap` (tap the word) · `sequence` (put in
order) · `cloze` (fill the blank) · `match` · `short` (write it). Each renders its own interaction.

## C5. Answer mirroring
When the student answers, `logAnswer` writes a `session_events` row. The coach subscribes
(`subscribeSessionEvents`) and feeds the synced choice back into the **same QuestionView** via the
`reveal` prop, so the coach sees the option grid light up green/red exactly as the student does.

## C6. Driver / take-over
Student drives by default. The coach can press **Take over** (`setDriver('coach')`) and **Give
control** back. `isDriver` (computed from `session.driver`) gates navigation and interactivity on
each side. The "who's sharing" UI updates accordingly.

## C7. ClassPeople (left column) — the Zoom placeholder
Instead of video tiles, a single **"Place your Zoom window here"** stage (the real 1:1 video runs in
Zoom side-by-side), plus the **Class plan** (~30 min) with the active phase highlighted. Used in the
student live view, the coach live console, and the coach "waiting" view.

## C8. CoachPlaybook (right column, coach only)
Context-sensitive per step — the student never sees it:
- **Who's driving** card (band + who shares/answers).
- **cover**: today's flow (~30 min) with question counts.
- **listen / read**: how to run the clip / reading-aloud nudges + a **focus-words** card.
- **question step**: **graduated nudges** (lightest first), the **learning outcome** + rung level,
  **how to teach it**, an application check for vocabulary, and a **tap-to-reveal answer**.
- **speak / write**: a **live-scoring rubric** + push-back prompts / sentence starters.
- **game / ending / complete**: matching guidance, ending read, and a wrap card with **words to
  spaced revision** + the **standards covered**.

## C9. Lifecycle controls
- **Start / Restart** (`startClass`) — also lets a coach restart a `completed` class.
- **End** (`endClass`) — leaving the live console marks the session `completed`.
- **Join Zoom** — opens `getZoomLink()` in a new tab from the TopBar.
- **Desktop-only**: the live class needs ≥ 940px; narrower shows a "use a bigger screen" note.

---

# PART D — SHARED CORE FUNCTIONS (`@cueword/core`)

The shared package. **All Supabase access is isolated in `lib/session.ts`** — no screen talks to
the DB directly.

## D1. Session & Realtime — `lib/session.ts`
| Function | Signature → effect |
| --- | --- |
| `toRenderState(row)` | `ClassSession → RenderState` — maps a DB row to `{ storyKey, stepIndex, phase, status, driver }` (what every screen renders from). |
| `getSession(id)` | Reads one `class_sessions` row. |
| `subscribeSession(id, onChange)` | Realtime: watch that row for any change; returns an unsubscribe fn. **The sync wire.** |
| `subscribeSessionEvents(id, onEvent)` | Realtime: watch INSERTs on `session_events` (answers/notes). |
| `logEvent(id, role, type, payload)` | Insert a `session_events` row. |
| `openStory(id, key, storyId, role)` | **Magic moment** — set story_key/step 0/phase Listen/status live/driver student + logs `open_story`. |
| `setStep(id, idx, phase, role)` | Move the lesson; logs `step`. |
| `logAnswer(id, role, payload)` | Record the student's pick (mirrored to the coach). |
| `startClass(id)` | Flip to live in a clean state (clears story) — also restarts a completed class. |
| `endClass(id)` | Mark `completed` + stamp `ended_at`. |
| `setDriver(id, driver)` | Take over / hand back control. |

## D2. Lesson logic — `lib/lesson.ts` (pure, unit-tested, no DOM/network)
- `buildSteps(story)` — the ordered step list.
- `stepPhase(step)` / `EX_PHASES` / `PHASE_TIME` / `PLAN_ORDER` — phase helpers + budgets.
- `QTYPE_LABEL` — human label per question type.
- `BAND` — grade-band → driver/sharer mapping; `CL_KID` — sample names.
- `sentenceFrames(key)` — speaking frames.
- **Playbook content helpers**: `answerText(q)` (correct answer as text), `pickedAnswerLabel(q,
  choice)` (what the student ticked), `resolveReveal(local, reveal)` (merge local interaction with a
  peer's synced choice — local wins), `OUTCOME` / `outcomeFor(q)`, `TEACH` / `teachFor(q)`,
  `nudgesFor(step)` (graduated hints).

## D3. Auth — `lib/auth.ts` (client-side, no server)
- `validateLogin(role, username, password)` — checks against `poc.config.json`; persists identity to
  `localStorage`; throws on mismatch.
- `getCurrentUser()` / `setCurrentUser(user)` / `logout()`.
- `useCurrentUser()` — React hook returning `{ user, ready, setUser }` (reads after mount to keep SSR
  consistent).
- `HOME_FOR` — each app is single-role, so home is always `/`.

## D4. Config — `lib/config.ts` (the one file to edit)
Reads `config/poc.config.json`. Exposes `POC` (typed config), `SESSION_ID` (the one watched row),
`getZoomLink()`, `credentialFor(role)`.

## D5. Stories content — `lib/stories.ts`
- `GRADE_STORIES` — the full lesson content for the 3 stories (transcripts, passages, vocab,
  questions). `STORY_KEYS = ["K","G3","G6"]`. `getStory(key)`. `STORY_META` — light catalog.

| Key | Grade | Title | Theme |
| --- | --- | --- | --- |
| `K` | K | Pip the Lost Penguin | Animals · Antarctica |
| `G3` | 3 | The First Flight | Nonfiction · Flight |
| `G6` | 6 | What Killed the Dinosaurs? | Nonfiction · Science |

## D6. Types — `lib/types.ts`
Single source of truth for the content model (`Story`, `Question` union of 8 types, `Step`), roles
(`Role = student|coach`, `Driver`, `SessionStatus`), DB row shapes (`ClassSession`,
`SessionEvent`, …), `AuthUser`, the synced `RenderState`, and `AnswerPayload`. No `any`.

## D7. Shared components
`LiveClass`, `LessonCanvas`, `StageCard`, `QuestionView`, `CoachPlaybook`, `ClassPeople`, `TopBar`,
`StorySlate`, `Scene`, `VocabGame`, `VocabPopup`, `useActiveSession` (the hook that loads + live-
watches the one configured session), `SetupNotice` (shown when Supabase env is missing), `BodyClass`.

---

# PART E — DATA, SYNC & SECURITY

## E1. The sync design — "sync the pointer, not the content"
Realtime carries only a tiny **pointer** on one `class_sessions` row:
`{ story_key, current_step, current_phase, driver, status }`. Heavy lesson content never travels —
it renders client-side from `lib/stories.ts` keyed by `story_key`. A second INSERT-only stream,
`session_events`, carries the activity log (`open_story` / `step` / `answer` / `phase` / `note`).
Both apps subscribe to the single row whose id = `config.session.id`.

## E2. Database (`supabase/migrations/0001_init.sql`)
Tables: `profiles`, `enrollments`, `stories`, `assignments`, **`class_sessions`** (the sync spine),
**`session_events`** (activity stream), `progress`. Realtime publication is on `class_sessions` +
`session_events`. The seed inserts the one watched session row (`5555…`).

## E3. Security posture (POC)
- **Auth** gates identity/UX only — it's a client-side JSON-config check, no server.
- **RLS** is ON but **permissive** (`anon` can read/write everything) so the demo needs no real auth.
  The migration documents the production replacement (auth-scoped policies).
- No real video (Zoom runs in a separate tab; the in-app tile is a placeholder). No real audio
  recording (mic stubs + cosmetic waveforms). Most dashboard data is local mock data; only `/live`
  is DB-backed.

---

# PART F — BUILD, TEST & RUN FUNCTIONS

Monorepo scripts (`package.json`):
- `npm run dev:student` (:3100) / `npm run dev:coach` (:3200) — run each app.
- `npm run build` — build both apps via workspaces; `build:student` / `build:coach` for one.
- `npm run lint` · `npm run format` / `format:check`.
- `npm test` — Vitest **unit** (lesson + session + config + auth).
- `npm run test:int` — Vitest **integration** vs live Supabase (proves Realtime sync); skips without env.
- `npm run test:e2e` — Playwright cross-app E2E (student :3100 opens a story → coach :3200 sees it
  live → driver semantics → Zoom placeholder). First run: `npx playwright install chromium`.
- `npm run test:all` — unit + integration + e2e.

Tests on disk: `tests/unit/{lesson,session,config,auth}.test.ts`, `tests/integration/sync.test.ts`,
`e2e/magic-moment.spec.ts`.

---

*This reference reflects the code in `packages/core` and both apps. The live class is the only
dynamic, networked surface; everything else is a faithful design port over local data.*
