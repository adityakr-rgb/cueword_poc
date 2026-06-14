"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { listProfiles } from "@/lib/admin";
import {
  getActiveSessionForCoach,
  getActiveSessionForStudent,
  subscribeAllSessions,
  subscribeSession,
} from "@/lib/session";
import type { ClassSession, Profile } from "@/lib/types";

/**
 * Resolves the seeded identity for a role, loads its active/today session, and
 * keeps it live via Realtime. The single hook both /student and /coach use.
 */
export function useActiveSession(role: "student" | "coach") {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<ClassSession | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<ClassSession | null>(null);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const fetchActive = useCallback(
    async (id: string) =>
      role === "student" ? getActiveSessionForStudent(id) : getActiveSessionForCoach(id),
    [role],
  );

  // Initial load: identity + active session.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    (async () => {
      try {
        const profs = await listProfiles(role);
        const prof = profs[0] ?? null;
        if (cancelled) return;
        setProfile(prof);
        if (prof) {
          const s = await fetchActive(prof.id);
          if (!cancelled) setSession(s);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role, fetchActive]);

  // Fast path: live updates for the active session row.
  useEffect(() => {
    if (!session?.id || !isSupabaseConfigured) return;
    return subscribeSession(session.id, (row) => setSession(row));
  }, [session?.id]);

  // Pick up a newly-created session if we currently have none (admin scheduling live).
  useEffect(() => {
    if (!isSupabaseConfigured || !profile) return;
    return subscribeAllSessions(() => {
      if (!sessionRef.current) void fetchActive(profile.id).then((s) => s && setSession(s));
    });
  }, [profile, fetchActive]);

  return {
    profile,
    session,
    setSession,
    loading,
    error,
    configured: isSupabaseConfigured,
  };
}
