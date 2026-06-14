// ============================================================================
// Server Supabase client (service role) — used ONLY in route handlers for admin
// provisioning. The service key must never reach the browser.
// ============================================================================
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function isAdminConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return Boolean(url && key);
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) {
    throw new Error(
      "Supabase admin is not configured. Set SUPABASE_SERVICE_ROLE_KEY (and the project URL).",
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
