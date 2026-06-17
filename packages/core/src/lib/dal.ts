// ============================================================================
// Data Access Layer — the single place that resolves "who is the signed-in
// user" on the server and enforces role authorization. Follows the Next.js
// auth guide: optimistic checks live in Proxy; SECURE checks live here, close
// to the data. auth.getUser() validates the JWT against Supabase Auth (not just
// the cookie), so it is safe to gate on.
//
// Memoized with React cache() so repeated calls in one render pass hit Supabase
// once.
// ============================================================================
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "./supabase/server";
import type { Profile, Role } from "./types";

/** Returns the authenticated auth.users id, or redirects to /login. */
export const verifySession = cache(async (): Promise<{ userId: string }> => {
  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");
  return { userId: user.id };
});

/** The signed-in user's profile (joined via profiles.auth_user_id), or null. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  return (data as Profile | null) ?? null;
});

/** Require a signed-in profile whose role is allowed; redirect to /login otherwise. */
export async function requireRole(allowed: Role | Role[]): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  if (!roles.includes(profile.role)) redirect("/login");
  return profile;
}
