// ============================================================================
// Session data access — THE single place that touches Supabase + Realtime.
// Live dashboards call these helpers; no component talks to Supabase directly.
// (Admin provisioning writes go through /api/admin with the service role.)
// ============================================================================
import { getSupabaseBrowser } from "./supabase/client";
import { BAND } from "./lesson";
import type {
  AnswerPayload,
  ClassSession,
  Driver,
  RenderState,
  Role,
  SessionEvent,
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

function pickActive(rows: ClassSession[] | null): ClassSession | null {
  if (!rows || rows.length === 0) return null;
  return rows.find((r) => r.status === "live") ?? rows[0];
}

// ---- Reads ----------------------------------------------------------------

export async function getSession(id: string): Promise<ClassSession | null> {
  const sb = getSupabaseBrowser();
  const { data, error } = await sb.from("class_sessions").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as ClassSession | null) ?? null;
}

export async function getActiveSessionForStudent(studentId: string): Promise<ClassSession | null> {
  const sb = getSupabaseBrowser();
  const { data, error } = await sb
    .from("class_sessions")
    .select("*")
    .eq("student_id", studentId)
    .in("status", ["scheduled", "live"])
    .order("scheduled_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return pickActive(data as ClassSession[] | null);
}

export async function getActiveSessionForCoach(coachId: string): Promise<ClassSession | null> {
  const sb = getSupabaseBrowser();
  const { data, error } = await sb
    .from("class_sessions")
    .select("*")
    .eq("coach_id", coachId)
    .in("status", ["scheduled", "live"])
    .order("scheduled_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return pickActive(data as ClassSession[] | null);
}

export async function listSessions(): Promise<ClassSession[]> {
  const sb = getSupabaseBrowser();
  const { data, error } = await sb
    .from("class_sessions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ClassSession[] | null) ?? [];
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

/** Watch ALL sessions (admin sessions table — live status badges). */
export function subscribeAllSessions(onChange: () => void): () => void {
  const sb = getSupabaseBrowser();
  const channel = sb
    .channel("all-sessions")
    .on("postgres_changes", { event: "*", schema: "public", table: "class_sessions" }, () =>
      onChange(),
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
      driver: BAND[storyKey].driver,
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
  const { error } = await sb
    .from("class_sessions")
    .update({ status: "live", started_at: new Date().toISOString() })
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
