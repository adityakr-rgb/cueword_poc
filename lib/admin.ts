// ============================================================================
// Admin/provisioning data access. Reads use the anon client; privileged writes
// go through /api/admin (service role) so the service key never hits the browser.
// ============================================================================
import { getSupabaseBrowser } from "./supabase/client";
import type { Enrollment, Profile, Role, StoryRow } from "./types";

// ---- Reads (anon, client) -------------------------------------------------

export async function listProfiles(role?: Role): Promise<Profile[]> {
  const sb = getSupabaseBrowser();
  // Never select password_hash to the browser.
  let q = sb
    .from("profiles")
    .select("id, role, full_name, avatar_emoji, grade, timezone, username, created_at")
    .order("created_at", { ascending: true });
  if (role) q = q.eq("role", role);
  const { data, error } = await q;
  if (error) throw error;
  return (data as Profile[] | null) ?? [];
}

export async function listStories(): Promise<StoryRow[]> {
  const sb = getSupabaseBrowser();
  const { data, error } = await sb.from("stories").select("*").order("key", { ascending: true });
  if (error) throw error;
  return (data as StoryRow[] | null) ?? [];
}

export async function listEnrollments(): Promise<Enrollment[]> {
  const sb = getSupabaseBrowser();
  const { data, error } = await sb
    .from("enrollments")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Enrollment[] | null) ?? [];
}

/** Stories on a student's slate (joined metadata), for the student dashboard. */
export async function getAssignedStories(studentId: string): Promise<StoryRow[]> {
  const sb = getSupabaseBrowser();
  const { data, error } = await sb
    .from("assignments")
    .select("stories(*)")
    .eq("student_id", studentId);
  if (error) throw error;
  const rows = (data ?? []) as unknown as { stories: StoryRow | null }[];
  return rows.map((r) => r.stories).filter((s): s is StoryRow => Boolean(s));
}

// ---- Writes (via the service-role route handler) --------------------------

export type AdminAction =
  | {
      action: "createProfile";
      role: Role;
      full_name: string;
      avatar_emoji?: string;
      grade?: string | null;
      timezone?: string | null;
      username?: string; // optional — server generates if omitted
      password?: string; // optional — server generates if omitted
    }
  | { action: "createEnrollment"; student_id: string; coach_id: string; plan?: string }
  | {
      action: "scheduleClass";
      enrollment_id: string;
      student_id: string;
      coach_id: string;
      story_id?: string | null;
      scheduled_at: string;
      duration_min: number;
      zoom_link: string;
    };

async function postAdmin<T>(body: AdminAction): Promise<T> {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Admin request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function createProfile(
  p: Omit<Extract<AdminAction, { action: "createProfile" }>, "action">,
) {
  return postAdmin<{ profile: Profile; username: string; password: string }>({
    action: "createProfile",
    ...p,
  });
}
export function createEnrollment(
  p: Omit<Extract<AdminAction, { action: "createEnrollment" }>, "action">,
) {
  return postAdmin<{ enrollment: Enrollment }>({ action: "createEnrollment", ...p });
}
export function scheduleClass(
  p: Omit<Extract<AdminAction, { action: "scheduleClass" }>, "action">,
) {
  return postAdmin<{ session: unknown }>({ action: "scheduleClass", ...p });
}
