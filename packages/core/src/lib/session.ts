// ============================================================================
// Session data access — THE single place that touches Supabase + Realtime.
// Live dashboards call these helpers; no component talks to Supabase directly.
// All apps watch ONE seeded session row (config.SESSION_ID); there is no
// per-profile lookup or provisioning (admin removed).
// ============================================================================
import { getSupabaseBrowser } from "./supabase/client";
import { getStory as getBundledStory } from "./stories";
import type {
  AnswerPayload,
  ClassSession,
  Driver,
  RenderState,
  Role,
  SessionEvent,
  Story,
  StoryKey,
} from "./types";

// Map a session row → the render-state every dashboard draws from.
export function toRenderState(row: ClassSession): RenderState {
  return {
    storyKey: (row.story_key as StoryKey | null) ?? null,
    stepIndex: row.current_step ?? 0,
    phase: row.current_phase,
    status: row.status,
    driver: row.driver,
  };
}

// ---- Reads ----------------------------------------------------------------

export async function getSession(id: string): Promise<ClassSession | null> {
  const sb = getSupabaseBrowser();
  const { data, error } = await sb.from("class_sessions").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as ClassSession | null) ?? null;
}

/**
 * Fetch a story's full content (the Story shape: transcript, passage, MCQs,
 * vocab, rubric…) from the DB by key. This is what makes the live class — and
 * the coach playbook derived from it — DB-backed instead of hardcoded: the
 * synced row carries only `story_key`, and each app resolves that pointer to
 * the real content here.
 *
 * Falls back to the bundled copy (lib/stories.ts) only if the row has no
 * `content` yet (e.g. not seeded), so a half-migrated DB degrades gracefully
 * rather than blanking the class.
 */
export async function fetchStoryContent(key: StoryKey): Promise<Story | null> {
  const sb = getSupabaseBrowser();
  const { data, error } = await sb.from("stories").select("content").eq("key", key).maybeSingle();
  if (error) throw error;
  const dbStory = (data?.content as Story | null) ?? null;
  if (dbStory) return dbStory;
  console.warn(
    `[cueword] stories.content is empty for "${key}" — using bundled fallback. ` +
      `Seed it with: npm run seed:content`,
  );
  return getBundledStory(key);
}

// ---- Realtime subscriptions (the sync wire) -------------------------------

/** Watch one session row. Returns an unsubscribe fn. */
export function subscribeSession(id: string, onChange: (row: ClassSession) => void): () => void {
  const sb = getSupabaseBrowser();
  const channel = sb
    .channel(`session-${id}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "class_sessions", filter: `id=eq.${id}` },
      (payload) => {
        if (payload.new && Object.keys(payload.new).length) {
          onChange(payload.new as ClassSession);
        }
      },
    )
    .subscribe();
  return () => {
    void sb.removeChannel(channel);
  };
}

/** Watch the activity stream for one session (answers, notes, open_story). */
export function subscribeSessionEvents(
  sessionId: string,
  onEvent: (event: SessionEvent) => void,
): () => void {
  const sb = getSupabaseBrowser();
  const channel = sb
    .channel(`session-events-${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "session_events",
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => onEvent(payload.new as SessionEvent),
    )
    .subscribe();
  return () => {
    void sb.removeChannel(channel);
  };
}

// ---- Mutations (live session control — anon, permissive POC policies) ------

export async function logEvent(
  sessionId: string,
  actorRole: Role,
  type: SessionEvent["type"],
  payload: Record<string, unknown>,
): Promise<void> {
  const sb = getSupabaseBrowser();
  const { error } = await sb
    .from("session_events")
    .insert({ session_id: sessionId, actor_role: actorRole, type, payload });
  if (error) throw error;
}

/** THE MAGIC MOMENT — student opens a story; coach + admin see it live. */
export async function openStory(
  sessionId: string,
  storyKey: StoryKey,
  storyId: string | null,
  actorRole: Role = "student",
): Promise<void> {
  const sb = getSupabaseBrowser();
  const { error } = await sb
    .from("class_sessions")
    .update({
      story_key: storyKey,
      story_id: storyId,
      current_step: 0,
      current_phase: "Listen",
      status: "live",
      driver: "student", // the student always drives the lesson (ticks answers, navigates)
    })
    .eq("id", sessionId);
  if (error) throw error;
  await logEvent(sessionId, actorRole, "open_story", { storyKey });
}

export async function setStep(
  sessionId: string,
  stepIndex: number,
  phase: string | null,
  actorRole: Role,
): Promise<void> {
  const sb = getSupabaseBrowser();
  const { error } = await sb
    .from("class_sessions")
    .update({ current_step: stepIndex, current_phase: phase })
    .eq("id", sessionId);
  if (error) throw error;
  await logEvent(sessionId, actorRole, "step", { stepIndex, phase });
}

export async function logAnswer(
  sessionId: string,
  actorRole: Role,
  payload: AnswerPayload,
): Promise<void> {
  await logEvent(sessionId, actorRole, "answer", { ...payload });
}

export async function startClass(sessionId: string): Promise<void> {
  const sb = getSupabaseBrowser();
  // Start (or restart) the class in a clean live state — clears any prior story
  // so the magic moment can be (re)demoed. Safe for the normal scheduled→live
  // path too (a scheduled session has no story yet). This is what lets a coach
  // restart a "completed" class instead of being stuck.
  const { error } = await sb
    .from("class_sessions")
    .update({
      status: "live",
      story_key: null,
      story_id: null,
      current_step: 0,
      current_phase: null,
      driver: "student",
      started_at: new Date().toISOString(),
      ended_at: null,
    })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function endClass(sessionId: string): Promise<void> {
  const sb = getSupabaseBrowser();
  const { error } = await sb
    .from("class_sessions")
    .update({ status: "completed", ended_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw error;
}

/** Coach takes over / hands back control of the shared screen. */
export async function setDriver(sessionId: string, driver: Driver): Promise<void> {
  const sb = getSupabaseBrowser();
  const { error } = await sb.from("class_sessions").update({ driver }).eq("id", sessionId);
  if (error) throw error;
}
