// ============================================================================
// Server-side Supabase client (Next.js 16 App Router). Bound to the request's
// cookies via @supabase/ssr so the authenticated session + RLS apply on the
// server. cookies() is ASYNC in Next 16 — always `await` it.
//
// Import this ONLY from server code (Proxy, Server Actions, Route Handlers,
// Server Components). next/headers throws if pulled into a Client Component,
// which is the intended guard.
// ============================================================================
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(url && anon);

/** A Supabase client wired to this request's cookies (reads + refreshes session). */
export async function getSupabaseServer(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Invoked from a Server Component, where cookies are read-only. The
          // Proxy session refresh handles writing — safe to ignore here.
        }
      },
    },
  });
}
