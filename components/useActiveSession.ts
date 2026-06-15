"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  getActiveSessionForCoach,
  getActiveSessionForStudent,
  subscribeAllSessions,
  subscribeSession,
} from "@/lib/session";
import type { AuthUser, ClassSession } from "@/lib/types";

/**
 * Loads the active/today session for the logged-in student or coach and keeps
 * it live via Realtime. The single hook both /student and /coach use.
 */
export function useActiveSession(user: AuthUser | null) {
  const [session, setSession] = useState<ClassSession | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<ClassSession | null>(null);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const userId = user?.id ?? null;
  const role = user?.role ?? null;

  const fetchActive = useCallback(
    (id: string) =>
      role === "coach" ? getActiveSessionForCoach(id) : getActiveSessionForStudent(id),
    [role],
  );

  // Initial load for the logged-in user.
  useEffect(() => {
    if (!isSupabaseConfigured || !userId || (role !== "student" && role !== "coach")) return;
    let cancelled = false;
    (async () => {
      try {
        const s = await fetchActive(userId);
        if (!cancelled) setSession(s);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, role, fetchActive]);

  // Fast path: live updates for the active session row.
  useEffect(() => {
    if (!session?.id || !isSupabaseConfigured) return;
    return subscribeSession(session.id, (row) => setSession(row));
  }, [session?.id]);

  // Pick up a newly-created session if we currently have none.
  useEffect(() => {
    if (!isSupabaseConfigured || !userId || (role !== "student" && role !== "coach")) return;
    return subscribeAllSessions(() => {
      if (!sessionRef.current) void fetchActive(userId).then((s) => s && setSession(s));
    });
  }, [userId, role, fetchActive]);

  return { session, setSession, loading, error };
}
