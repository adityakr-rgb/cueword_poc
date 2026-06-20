# Cueword Backend — New Repo Folder Structure (Supabase-native)

> **Scope.** Folder structure for the **new, separate backend repo** for production. **Backend only —
> no frontend code.** Same product *ideas* as the POC, fresh code at a higher bar.
>
> **Verified against your live Supabase project `rasygtcpdeplualbjphq` ("CueWord")** on 2026-06-19 —
> so this reflects what **already exists** vs what's **new**.
>
> **Decisions (locked):**
> - **Stack = Supabase-native.** Postgres + Auth + Realtime + Storage. Server-side logic = **Deno/TypeScript Edge Functions**. No separate API server.
> - **AI provider = OpenAI** (this is what your deployed functions already use): **gpt-4o-mini** (evaluation + story-frame), **whisper-1** (transcription), **tts-1** (text-to-speech). Email = **Resend**. **Not** Anthropic/Claude — earlier drafts said Claude; that was wrong, corrected here.
> - **Topology = separate repos + a typed contract.** Frontends consume a published **`@cueword/contract`** package; no frontend code lives here.
> - **Two Supabase projects (important).** The **self-learn app** project (`rasygtcpdeplualbjphq`) holds the 9 existing Edge Functions. The **tutored backend** runs in its own **separate demo project** (a different account — not connected to tooling) where the tutored tables from the prod SQL already exist. So the demo project is **standalone for the pilot** — its `auth.users` is its own, and the 4 reusable evaluator functions must be **replicated into it** (their source comes from the self-learn repo). The `students.app_user_id → users.id` bridge stays **null** in the standalone demo; it only matters if/when this is later merged into the self-learn prod project.

Suggested repo name: **`cueword-tutored-backend`**.

---

## ⚠️ What ALREADY exists in your Supabase project (do NOT rebuild)

These **9 Edge Functions are live** in the **self-learn app** project (`rasygtcpdeplualbjphq`) — **a
different project from your tutored demo.** The 4 reusable evaluators are **replicated into the demo
project when needed (you'll handle that)** and called by slug. The other 5 are self-learn-only —
**ignore them**.

| Function | Provider · model | Input → Output | Auth | For the tutored product |
|---|---|---|---|---|
| `transcribe-audio` | OpenAI Whisper (`whisper-1`) | multipart `file` (+ `language`) → `{ text }` | no JWT, rate-limited 10/h | ♻️ reuse — replicate to demo when needed (speaking transcription) |
| `evaluate-writing` | OpenAI `gpt-4o-mini` | `{ grade, prompt, nudge, response }` → `{ grammar, structure, vocab, conventions, total/40, xpDelta, summary, feedback{…} }` | no JWT, 10/h | ♻️ reuse — replicate when needed (Write scoring) |
| `evaluate-speaking` | OpenAI `gpt-4o-mini` | `{ grade, prompt, nudge, sampleAnswer, transcription, silenceCheckFailed }` → `{ grammar, structure, vocab, fluency, relevance, total/50, xpDelta, summary, feedback{…} }` | no JWT, 10/h | ♻️ reuse — replicate when needed (Speak scoring) |
| `generate-tts` | OpenAI `tts-1` (voice `nova`) | `{ text, model?, voice? }` → `audio/mpeg` bytes | no JWT, 15/h | ♻️ reuse — replicate when needed (Listen / read-aloud) |
| `parent-otp` | — | parent-gate OTP | no JWT, 5/h | self-learn — **leave alone** (tutored parents use Supabase Auth) |
| `parent-report` | Resend email | `{ userId, email }` → weekly progress email | no JWT | self-learn — **leave alone** (reuse the *Resend pattern*, not the function) |
| `delete-account` | service-role | account/GDPR deletion | **JWT required** | self-learn `users` — **leave alone** |
| `founder-digest` | — | internal analytics digest | no JWT | internal — **leave alone** |
| `storyify-session` | OpenAI `gpt-4o-mini` | wraps self-learn activities into a story frame; caches to the **AI-cache `stories`** table | **JWT required** | self-learn — **leave alone** (confirms `stories` = AI cache, distinct from the tutored `class_stories`) |

**What this means for the plan:**
- The **Speak / Write / Listen AI is already written** — don't author new scorers. The 4 evaluators are **replicated into the demo project when needed (you handle that)**; your functions call them by slug.
- **Scores must still be persisted server-side** (the "never trust the client" rule) — the one new piece is a thin service-role orchestrator *(transcribe → evaluate → write the tutored tables)*, not a new evaluator.
- When you replicate an evaluator, the demo also needs `OPENAI_API_KEY` set + a `rate_limits` table (they live in the self-learn project, not the demo). The self-learn project's 9 functions are a separate project — you never touch them.

---

## The tree (this new repo)

```
cueword-tutored-backend/
├── README.md
├── .env.example                      # OPENAI_API_KEY, RESEND_API_KEY, ZOOM_*, SUPABASE_* (see below)
├── .gitignore
├── deno.json                         # Deno config + import map for Edge Functions (fmt/lint/test)
├── package.json                      # tooling only (supabase CLI, type-gen) — NOT an app
├── .github/workflows/
│   ├── ci.yml                        # lint + `supabase db lint` + pgTAP + deno test
│   └── deploy.yml                    # push migrations + deploy ONLY this repo's functions
│
├── supabase/
│   ├── config.toml                   # local dev (db, auth, storage, realtime, function settings)
│   │
│   ├── migrations/                   # ⭐ ADDITIVE migrations — new tutored tables only, never touch the 14 app tables
│   │   ├── 0001_identity.sql         # profiles, coaches, parents, students (+ app_user_id → users bridge)
│   │   ├── 0002_curriculum.sql       # stages→terms→levels→class_stories + sections/questions/question_keys/vocab/tips
│   │   ├── 0003_enrollment.sql       # eval_results, enrollments, consent_records
│   │   ├── 0004_live_class.sql       # class_sessions, session_events, attendance  (+ realtime publication)
│   │   ├── 0005_work_story.sql       # story_attempts, question_answers, submissions, ai_evaluations, artifacts
│   │   ├── 0006_workout.sql          # workout_items (SRS), workout_reviews, practice_responses
│   │   ├── 0007_mastery.sql          # level_access, belt_credit, skill_trackers, engine_params
│   │   ├── 0008_ops.sql              # homework, notifications, audit_log, parent_comms, gap_packs
│   │   ├── 0009_rls_helpers.sql      # ONLY the helper fns (is_admin/is_coach_of/can_view_student/current_profile_id) — created once, then frozen
│   │   ├── 0010_views.sql            # KPI / attendance / tutor-stats views
│   │   └── 0011_storage.sql          # storage bucket for submission audio + storage RLS
│   │   #  NOTE: RLS *policies* are co-located in each domain migration above (each table's
│   │   #  policies live with its CREATE TABLE) — there is deliberately NO single shared RLS file.
│   │
│   ├── functions/                    # ⭐ new tutored functions (the 4 reusable evaluators are replicated into the demo project WHEN NEEDED — user-managed, called by slug)
│   │   ├── _shared/
│   │   │   ├── rateLimit.ts          # mirror the existing pattern (uses the existing rate_limits table)
│   │   │   ├── openai.ts             # thin OpenAI REST helper (chat / whisper / tts) — provider = OpenAI
│   │   │   ├── supabaseAdmin.ts      # service-role client
│   │   │   ├── auth.ts               # verify JWT → { profileId, role }; requireRole()
│   │   │   ├── cors.ts · errors.ts · validate.ts
│   │   │   ├── email.ts              # Resend wrapper (same provider as parent-report)
│   │   │   └── match.ts              # answer-matching helpers for grade-answer
│   │   │
│   │   ├── score-submission/index.ts # ⭐ the reuse hub: (audio→transcribe-audio)→evaluate-speaking/-writing→write ai_evaluations + submissions.ai_score  (service-role)
│   │   ├── grade-answer/index.ts     # auto-score question_answers + roll up story_attempts (service-role; never client-trusted)
│   │   ├── mark-assist/index.ts      # coach AI draft (reuses evaluate-* output / a tailored prompt)
│   │   ├── mastery-engine/index.ts   # level_access points (Y) + belt_credit (retention) + skill_trackers; math from engine_params
│   │   ├── srs-review/index.ts       # workout_items Leitner-ladder updates on review
│   │   ├── provision-user/index.ts   # admin invite: create auth user + profile + invite email (Resend) + audit_log
│   │   ├── schedule-session/index.ts # create class_sessions (admin enters zoom_link) + recurring slots
│   │   ├── notify/index.ts           # write notifications + send reminder emails (Resend)
│   │   ├── coach-playbook/index.ts   # read-only live coaching aid: content + answer keys + student answers (coach/admin only)
│   │   └── reset-pilot/index.ts      # ops: reset/seed demo state (admin-only)
│   │
│   ├── seed.sql                      # entrypoint seed
│   ├── seeds/
│   │   ├── catalog.sql               # skills, belts, genres, engine_params defaults
│   │   ├── curriculum.sql            # stages/terms/levels/class_stories + sections/questions/vocab
│   │   └── pilot.sql                 # pilot coaches/students/parents/enrollments/sessions
│   │
│   └── tests/                        # pgTAP database tests (`supabase test db`)
│       ├── rls_identity_test.sql     # cross-tenant denial: student A can't read student B
│       ├── rls_curriculum_test.sql   # question_keys hidden from students; content readable
│       ├── rls_work_test.sql         # students write own raw work only; score fields stripped on insert
│       └── views_test.sql            # KPI/attendance/stats views return expected rows
│
├── packages/
│   └── contract/                     # ⭐ the typed surface frontends consume (backend-owned)
│       ├── package.json              # @cueword/contract
│       └── src/
│           ├── database.types.ts     # generated: `supabase gen types typescript`
│           ├── domain.ts             # Story, Question union (8 types), RenderState, Role…
│           ├── ai.ts                 # the REAL OpenAI rubric shapes (see "Contract" below)
│           ├── functions.ts          # request/response types per Edge Function (new + the reused ones)
│           └── index.ts
│
├── scripts/
│   ├── gen-types.sh                  # regenerate database.types.ts
│   ├── migrate.sh
│   ├── seed-content.ts               # author/import story content → class_stories + sections/questions
│   └── reset-pilot.sh
│
└── docs/
    ├── SCHEMA.md · RLS.md · ENGINE.md
    └── FUNCTIONS.md                  # new functions AND the reused existing ones (with their real I/O)
```

---

## Ownership & conflict-free commits (two devs, one backend)

The backend is **not** two apps — it's one shared service layer. So you **don't** split it "coach vs
student"; you split it **by domain / function**, and the layout is inherently conflict-resistant:

- **One folder per Edge Function** → two devs editing *different* functions share no file → no conflict.
- **Migrations are append-only + timestamped** → you never edit a shipped migration; new ones get unique
  filenames → no collision.
- **Only `_shared/` and `packages/contract/` are truly shared** → the single coordination point.

**Domain ownership (keep your same two devs):**

| | **Dev C** (Coach/Admin domains) | **Dev S** (Student/Learning domains) |
|---|---|---|
| Functions | `provision-user`, `schedule-session`, `notify`, `mark-assist`, `coach-playbook`, `reset-pilot` | `score-submission`, `grade-answer`, `mastery-engine`, `srs-review` |
| Migrations | `0001_identity`, `0003_enrollment`, `0008_ops`, `0010_views` | `0002_curriculum`, `0004_live_class`, `0005_work_story`, `0006_workout`, `0007_mastery`, `0011_storage` |
| Reuse (no edits) | existing `evaluate-*` | existing `transcribe-audio`, `generate-tts` |

**The five rules that keep commits conflict-free:**
1. **Edit only your own function folders.** Never touch another dev's `functions/<name>/`.
2. **Never edit a shipped or another dev's migration.** Add a NEW timestamped migration for your domain.
3. **RLS policies live INSIDE each domain's migration** (with its tables) — there is **no single shared
   RLS file** to fight over. The only shared SQL is `0009_rls_helpers.sql`, created once early then frozen.
4. **`_shared/` and `packages/contract/` are announce-before-edit** (CODEOWNERS = both). Keep changes
   here small and frequent; they're the only real shared surface.
5. **Branches → PRs → integration branch**, same as the frontend repos. Use `CODEOWNERS` to auto-route:
   `functions/<C-owned>/` + `migrations/000{1,3,8}_*` + `0010_*` → Dev C; the rest → Dev S;
   `_shared/**` + `packages/contract/**` → both.

> If only **one** dev builds the backend, none of this matters — it's already a single coherent repo.
> This section only applies when two people commit to it in parallel.

---

## Why it's laid out this way

### `supabase/functions/` — reuse first, build only the gaps
The existing 9 functions cover **transcription, writing/speaking evaluation, and TTS**. The tutored
backend's only AI-adjacent new function is **`score-submission`**: a service-role orchestrator that
takes a submission, (transcribes audio if needed via `transcribe-audio`,) calls `evaluate-writing` /
`evaluate-speaking`, and **writes the result** into `ai_evaluations` + `submissions.ai_score`. That
keeps the **"scores are written server-side, never by the client"** rule while reusing the built
evaluators. The genuinely new logic is the tutored-only domain: `grade-answer`, `mastery-engine`,
`srs-review`, `provision-user`, `schedule-session`, `notify`, `coach-playbook`, `reset-pilot`.

> **Rule of thumb:** plain read/write the logged-in user may do → no function, just RLS + the
> auto-generated REST/Realtime API. Computes a score, touches another user's data, uses a secret key,
> or must be tamper-proof → an Edge Function. Already exists in the project → call it, don't rebuild it.

### `supabase/migrations/` — additive, the schema is the source of truth
One migration per Zone-B domain, in dependency order, **RLS on the new tables only** (`0009`). Never
rename/drop/retype the 14 frozen app tables; the tutored `class_stories` is a **new** table (the app's
`stories` stays the AI cache), and `students.app_user_id` is the nullable bridge to `users`.

### `packages/contract/` — the one thing frontends import
Generated DB types + domain model + the **real** function I/O shapes (including the existing OpenAI
rubric shapes). Secrets never live here.

---

## Conventions (matched to what your project already does)

- **Provider = OpenAI**, called via the REST API inside functions (`/v1/chat/completions`,
  `/v1/audio/transcriptions`, `/v1/audio/speech`); model `gpt-4o-mini` for text. Email via **Resend**.
- **Rate limiting:** reuse the existing `rate_limits` table + the `_shared/rateLimit.ts` approach
  (per-user, per-function, 1-hour window, fail-open for non-user tokens). Add the new functions' limits
  to the same map.
- **Auth posture:** evaluators can stay `verify_jwt:false` + token-based rate limit (as today);
  **service-role writers** (`score-submission`, `grade-answer`, `mastery-engine`, `srs-review`,
  `provision-user`) should require a verified JWT and check role server-side before writing protected tables.
- **Deploy per-function** so this repo never redeploys/disturbs the existing 9.
- **Functions:** one folder per function, entry `index.ts`, shared code in `_shared/`; imports via root `deno.json`.
- **Migrations:** forward-only, timestamp-prefixed, additive; RLS after the tables it protects.

---

## `.env.example` (corrected — OpenAI, not Anthropic)

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only (functions/CI)
SUPABASE_DB_URL=                  # migrations/scripts
OPENAI_API_KEY=                   # evaluate-writing / evaluate-speaking / transcribe-audio / generate-tts / score-submission
RESEND_API_KEY=                   # provision-user / notify / parent emails
# (No Zoom keys — there is no zoom-notify feature. The per-session Zoom meeting
#  link is just an admin-entered value stored in class_sessions.zoom_link.)
```

> There is **no `ANTHROPIC_API_KEY`** — the platform is OpenAI. If you later switch evaluation to Claude,
> that's a deliberate migration of the existing functions, not an assumption to bake in now.

---

## Contract — the REAL AI rubric shapes (for `packages/contract/src/ai.ts`)

```
WritingScore  = { grammar, structure, vocab, conventions, total /40, xpDelta,
                  summary, feedback: { <criterion>: { description, examples: [{original, improved, tip}] } } }

SpeakingScore = { grammar, structure, vocab, fluency, relevance, total /50, xpDelta,
                  summary, feedback: { …same shape… } }

Transcribe    = (multipart: file, language?) -> { text }
TTS           = { text, model?, voice? } -> audio/mpeg bytes
```

Persist these into `submissions.ai_score` (jsonb) + an `ai_evaluations` row (model, tokens, cost) when
`score-submission` runs. The frontends read the typed shape from `@cueword/contract`.

---

## How to create it (one-time)

1. `supabase init` → `supabase/config.toml` + skeleton. Link to project `rasygtcpdeplualbjphq`.
2. Add `deno.json` + the `packages/contract` workspace.
3. Author the additive migrations by domain, then `0009_rls.sql` (new tables only).
4. `supabase functions new <name>` for each **new** function; share via `_shared/`. Call the existing
   `evaluate-*` / `transcribe-audio` / `generate-tts` by their slugs.
5. `supabase gen types typescript` → `packages/contract/src/database.types.ts`.
6. CI: lint + pgTAP + deno test; deploy: migrations + `supabase functions deploy <only this repo's functions>`.

*Frontends are out of scope here — they consume `@cueword/contract` from their own repos.*
