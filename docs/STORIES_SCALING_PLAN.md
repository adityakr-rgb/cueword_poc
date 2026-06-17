# Scaling Stories — POC (3 stories) → Production (80+ stories)

**Goal:** make the app handle any number of stories with **zero code edits per story** — author everything in the database.

**Status today:** story content + MCQs + the coach playbook already live in the DB (`stories.content` jsonb, fetched live). The live-class engine already scales. What remains are a few shortcuts still pinned to the original 3 demo stories (`K`, `G3`, `G6`).

_Written 2026-06-17, against the codebase right after story content was moved to the DB._

---

## TL;DR

- **Storage / sync / fetching / playbook → already fine at 80.** Don't touch them.
- **Required work = a bounded code refactor (~7 files)** to remove the hardcoded-3 assumptions.
- **DB needs almost nothing structural** — you just insert more rows.
- **The real lift is an admin authoring UI** (already on the Day-6 roadmap), because hand-editing 7 KB of JSON per story is not viable at 80.

---

## What already scales — DO NOT change

| Concern | Why it's fine at 80+ |
|---|---|
| **Storage** | 80 × ~7 KB ≈ 0.5 MB of jsonb in `stories.content`. Trivial for Postgres. |
| **Sync** | Only **one** story is active per class. The synced row carries one pointer + one step number regardless of catalog size. |
| **Fetching** | `fetchStoryContent` is a single indexed lookup by `key` (UNIQUE). Only the **active** story loads, never all 80. |
| **Coach playbook** | Derived per-question from the active story. Catalog-size independent. |

---

## A. Required code changes (the core refactor)

### 1. `packages/core/src/lib/types.ts`
Make the story key a free string instead of a 3-value union.

```ts
// BEFORE
export type StoryKey = "K" | "G3" | "G6";

// AFTER
export type StoryKey = string; // any DB story key / slug (e.g. "g3-first-flight")
```

### 2. `packages/core/src/lib/lesson.ts`
Replace the per-key `BAND` map with a function that derives "who drives" from the story's grade. Delete `CL_KID` (unused). Optionally make `sentenceFrames` grade-aware.

```ts
// DELETE these two maps:
//   export const BAND:   Record<StoryKey, {...}> = { K: ..., G3: ..., G6: ... }
//   export const CL_KID: Record<StoryKey, {...}> = { ... }   // unused anyway

// ADD — derive the band from grade (K–2 coach-led, 3+ student-led):
export function bandFor(story: Story): { band: string; driver: Driver; sharer: Driver } {
  const g = (story.gradeShort ?? "").toUpperCase();
  const n = g === "K" ? 0 : parseInt(g, 10);
  const coachLed = !Number.isNaN(n) && n <= 2; // K, 1, 2 → coach-led
  return coachLed
    ? { band: "K–2", driver: "coach", sharer: "coach" }
    : { band: "3–8", driver: "student", sharer: "student" };
}
```

`sentenceFrames(key)` already has a safe default branch, so it won't crash on new keys — but for correctness you may later switch it to take `story` / `gradeShort` instead of the key.

### 3. `packages/core/src/components/LessonCanvas.tsx` and `CoachPlaybook.tsx`
Both call `const band = BAND[storyKey]` (LessonCanvas line ~53, CoachPlaybook line ~100). Both already render from the `story` object, so:

```ts
// BEFORE
const band = BAND[storyKey];

// AFTER
const band = bandFor(story);   // import { bandFor } from "../lib/lesson"
```

Then `storyKey` is no longer needed for the band; drop it from the component props if nothing else uses it.

### 4. `packages/core/src/lib/session.ts`
Drop the "fall back to the 3 bundled stories" branch — it's meaningless once there are 80. Add a catalog list helper.

```ts
// fetchStoryContent: remove the getBundledStory import + the fallback.
export async function fetchStoryContent(key: StoryKey): Promise<Story | null> {
  const sb = getSupabaseBrowser();
  const { data, error } = await sb.from("stories").select("content").eq("key", key).maybeSingle();
  if (error) throw error;
  return (data?.content as Story | null) ?? null; // null → show a "story not found" state
}

// NEW — for the catalog / admin list:
export async function listStories(): Promise<StoryRow[]> {
  const sb = getSupabaseBrowser();
  const { data, error } = await sb.from("stories").select("*").order("grade");
  if (error) throw error;
  return (data as StoryRow[]) ?? [];
}
```

> Removing the `getStory` import here is also what drops `GRADE_STORIES` out of the **app bundle** (it's the only app-bundle file that pulls it in).

### 5. `packages/core/src/lib/stories.ts`
`GRADE_STORIES` stops being the runtime source — keep it only as **test fixtures / initial-seed data**. Delete the unused `STORY_META`. Keep `STORY_KEYS` (used by tests + seed). `getStory` (the bundled lookup) is now only referenced by the orphaned `StorySlate.tsx` — keep or delete with it.

### 6. `packages/core/src/components/useStoryContent.tsx`
Follows automatically from the type change:

```ts
export function useStoryContent(storyKey: string | null): { story: Story | null } { ... }
```

### 7. Story selection must come from the session, not a constant ⚠️
`apps/student/app/live/page.tsx` hardcodes:

```ts
const AUTO_STORY = (POC.session.storyKey ?? "G3") as StoryKey; // every class opens the SAME story
```

At 80 stories the session must know **which** story to run. Replace `AUTO_STORY` with the story assigned to this session — i.e. read `class_sessions.story_key` / `story_id` (set by the coach/admin when scheduling) and open that. The student should not pick from 80; that's a scheduling/assignment decision.

---

## B. Optional but recommended — sync on `story_id` (UUID)

Instead of a hand-typed `key`, sync on the auto-generated `story_id`. This removes the "invent 80 unique keys" burden entirely.

- `class_sessions.story_id` (UUID) already exists.
- `openStory(...)` already accepts a `storyId` — write it instead of (or alongside) `story_key`.
- Add `fetchStoryById(id)` (mirror of `fetchStoryContent`), have `toRenderState` expose `storyId`, and key `useStoryContent` off the id.
- `key` then becomes an optional human-friendly slug.

Pick **one** identifier to standardize on; don't half-use both.

---

## C. DB changes (minimal)

- **Structurally required: none.** Insert more rows into `stories`; set each row's `content` jsonb. That's it.
- **`key`:** keep it `UNIQUE NOT NULL` as a slug (e.g. `g3-first-flight`), **or** make it nullable if you standardize on `story_id` (Option B).
- **RLS:** wire auth-scoped policies (planned migration `0003`) before real students/coaches use it. Needed for real users — not because of story count.
- **Optional fast-follow:** normalize questions into a `story_questions` table **only if** you later want analytics ("which questions trip students up") or DB-level validation. Not needed for rendering.
- **Selection:** use the existing `assignments` / `curriculum_stories` tables to choose which story a session runs (feeds the session's `story_id`).

---

## D. Authoring — the real lift for 80 stories (admin panel, Day 6)

Hand-typing a 7 KB JSON blob per story in the Supabase table editor is error-prone and unvalidated. Build a **Stories** section in the admin app:

- List / create / edit / publish stories.
- A **structured editor**: a field per Story part (cover, scene, listen, read, speak, write, srs, calibration) + an "add question" form **per question type** (mcq, multi, truefalse, tap, sequence, cloze, match, short).
- It writes the `stories` row + `content` jsonb for the author.
- Assign stories to students/sessions via `assignments` / `curriculum_stories`.

---

## Checklist

- [ ] `types.ts`: `StoryKey = string`
- [ ] `lesson.ts`: delete `BAND` + `CL_KID`; add `bandFor(story)`
- [ ] `LessonCanvas.tsx`: `BAND[storyKey]` → `bandFor(story)`
- [ ] `CoachPlaybook.tsx`: `BAND[storyKey]` → `bandFor(story)`; drop unused `storyKey` prop
- [ ] `session.ts`: remove bundled fallback in `fetchStoryContent`; add `listStories()`
- [ ] `stories.ts`: demote `GRADE_STORIES` to fixtures; delete `STORY_META`
- [ ] `useStoryContent.tsx`: param `string | null`
- [ ] Student live page: replace `AUTO_STORY` with the session's assigned story
- [ ] (Optional B) switch sync/fetch to `story_id`
- [ ] (Optional) `seed:content` → upsert by `key`, or retire once admin authoring exists
- [ ] DB: confirm `key` slug strategy; plan RLS `0003`
- [ ] Admin panel: structured story editor + assignment

## Verify after the changes

```bash
npm test                 # unit tests (update any that import GRADE_STORIES / StoryKey literals)
npm run build:student    # both apps must build
npm run build:coach
```

Then run both apps and confirm a story still opens on the student and syncs to the coach (the "magic moment"), and that the coach playbook still renders. Add a 4th story in the DB with a brand-new key/grade and confirm it works **without any code change** — that's the acceptance test for this whole refactor.

## Gotchas

- Any unit test that imports `GRADE_STORIES` or uses the literal `StoryKey` values will need a tiny update.
- `gradeShort` must be set on every story (it drives `bandFor`). Values like `"K"`, `"3"`, `"6"`.
- If you keep `key` required, the admin UI must generate a unique slug (or use `story_id`).
- Don't ship all 80 stories in the client bundle — the DB is the source; the bundle should carry none (or only tiny fixtures).
