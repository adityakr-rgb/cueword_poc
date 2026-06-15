"use client";
// ============================================================================
// Client-side auth session (POC). Identity lives in localStorage; login is
// verified server-side by /api/login. Data access is still anon (permissive
// RLS), so this gates identity/UX, not data security — see README.
// ============================================================================
import { useEffect, useState } from "react";
import type { AuthUser } from "@/lib/types";

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

export async function login(username: string, password: string): Promise<AuthUser> {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const json = (await res.json().catch(() => ({}))) as { user?: AuthUser; error?: string };
  if (!res.ok || !json.user) throw new Error(json.error || "Login failed.");
  setCurrentUser(json.user);
  return json.user;
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

export const HOME_FOR: Record<AuthUser["role"], string> = {
  admin: "/admin",
  coach: "/coach",
  student: "/student",
};
