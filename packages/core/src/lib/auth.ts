"use client";
// ============================================================================
// Client-side auth (POC). Identity lives in localStorage; login is validated
// purely client-side against the hardcoded JSON config (no server, no Supabase
// profiles). This gates identity/UX only — data access is still anon — but for
// a single-coach / single-student demo that is exactly the point.
// ============================================================================
import { useEffect, useState } from "react";
import type { AuthUser, Role } from "./types";
import { credentialFor, SESSION_ID } from "./config";

const KEY = "cw_session";

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AuthUser): void {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function logout(): void {
  localStorage.removeItem(KEY);
}

/**
 * Validate a login against the JSON config for the given role. Each app calls
 * this with its own fixed role (student app → "student", coach app → "coach").
 * Throws on mismatch. On success the identity is persisted to localStorage.
 */
export function validateLogin(role: Role, username: string, password: string): AuthUser {
  const cred = credentialFor(role);
  if (username.trim().toLowerCase() === cred.username.toLowerCase() && password === cred.password) {
    const user: AuthUser = {
      id: SESSION_ID,
      role,
      full_name: cred.displayName,
      avatar_emoji: null,
    };
    setCurrentUser(user);
    return user;
  }
  throw new Error("Invalid username or password.");
}

/** Reads the session on mount (client-only, so SSR markup stays consistent). */
export function useCurrentUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Read the client-only session after mount (keeps SSR markup consistent).
    /* eslint-disable react-hooks/set-state-in-effect */
    setUser(getCurrentUser());
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  return { user, ready, setUser };
}

/** Each app is single-role, so home is always "/". */
export const HOME_FOR: Record<Role, string> = {
  coach: "/",
  student: "/",
};
