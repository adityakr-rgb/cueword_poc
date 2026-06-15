"use client";
import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "../lib/supabase/client";
import { getSession, subscribeSession } from "../lib/session";
import { SESSION_ID } from "../lib/config";
import type { ClassSession } from "../lib/types";

/**
 * Loads THE one seeded live-class session (config.SESSION_ID) and keeps it live
 * via Realtime. Both apps (student + coach) call this and watch the same row, so
 * a change on one domain appears on the other — that's the magic moment.
 */
export function useActiveSession() {
  const [session, setSession] = useState<ClassSession | null>(null);
  // When Supabase isn't configured we never load, so start "not loading".
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  // Initial load of the seeded row.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    (async () => {
      try {
        const s = await getSession(SESSION_ID);
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
  }, []);

  // Fast path: live updates for the seeded session row.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    return subscribeSession(SESSION_ID, (row) => setSession(row));
  }, []);

  return { session, setSession, loading, error };
}
