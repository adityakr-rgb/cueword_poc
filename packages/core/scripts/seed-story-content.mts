// ============================================================================
// Seed stories.content — the full Story JSON (transcript, passage, MCQs, vocab,
// rubric, SRS, calibration) — into Supabase from the typed GRADE_STORIES source
// of truth in lib/stories.ts.
//
// This is what makes the live class + coach playbook DB-backed: the synced
// class_sessions row carries only `story_key`; each app resolves that pointer
// to real content via stories.content (see lib/session.ts → fetchStoryContent).
//
// Run from the repo ROOT:
//   npm run seed:content                       # upsert via Supabase client
//   node packages/core/scripts/seed-story-content.mts --dry      # preview, no network
//   node packages/core/scripts/seed-story-content.mts --emit-sql # print UPDATE SQL
//
// Uses SUPABASE_SERVICE_ROLE_KEY if present (bypasses RLS), else the anon key.
// Idempotent — safe to re-run; it overwrites content with the current source.
// ============================================================================
import { createClient } from "@supabase/supabase-js";
import { GRADE_STORIES, STORY_KEYS } from "../src/lib/stories.ts";

const patches = STORY_KEYS.map((key) => {
  const s = GRADE_STORIES[key];
  return { key, blurb: s.about, duration: s.duration, genre: s.theme, content: JSON.stringify(s) };
});

const sqlLit = (v: string) => `'${v.replace(/'/g, "''")}'`;

const mode = process.argv.includes("--emit-sql")
  ? "emit"
  : process.argv.includes("--dry")
    ? "dry"
    : "write";

if (mode === "emit") {
  const sql = patches
    .map(
      (p) =>
        `update public.stories set\n` +
        `  content  = ${sqlLit(p.content)}::jsonb,\n` +
        `  blurb    = ${sqlLit(p.blurb)},\n` +
        `  duration = ${sqlLit(p.duration)},\n` +
        `  genre    = ${sqlLit(p.genre)}\n` +
        `where key = ${sqlLit(p.key)};`,
    )
    .join("\n\n");
  process.stdout.write(sql + "\n");
  process.exit(0);
}

if (mode === "dry") {
  for (const p of patches) {
    console.log(`${p.key}: ${p.content.length} bytes · "${p.blurb.slice(0, 52)}…"`);
  }
  console.log(`\n${patches.length} stories ready (dry run — nothing written).`);
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error(
    "Missing Supabase env. Run via `npm run seed:content` (loads .env.local) from the repo root.",
  );
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });
for (const p of patches) {
  const { error } = await sb
    .from("stories")
    .update({
      content: JSON.parse(p.content),
      blurb: p.blurb,
      duration: p.duration,
      genre: p.genre,
    })
    .eq("key", p.key);
  if (error) {
    console.error(`✗ ${p.key}: ${error.message}`);
    process.exit(1);
  }
  console.log(`✓ seeded ${p.key} (${p.content.length} bytes)`);
}
console.log(`\nDone — ${patches.length} stories' content is now in the DB.`);
