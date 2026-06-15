// ============================================================================
// Login endpoint (Node, service role). Verifies username + password against
// profiles and returns the client-safe user identity. POC auth — see README.
// ============================================================================
import { NextResponse } from "next/server";
import { getSupabaseAdmin, isAdminConfigured } from "@/lib/supabase/server";
import { verifyPassword } from "@/lib/password";

export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Auth is not configured (set SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 500 },
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = (await req.json()) as { username?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const username = (body.username || "").trim();
  const password = body.password || "";
  if (!username || !password) {
    return NextResponse.json({ error: "Enter a username and password." }, { status: 400 });
  }

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("profiles")
    .select("id, role, full_name, avatar_emoji, password_hash")
    .ilike("username", username)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const row = data as {
    id: string;
    role: string;
    full_name: string;
    avatar_emoji: string | null;
    password_hash: string | null;
  } | null;
  if (!row || !verifyPassword(password, row.password_hash)) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: row.id,
      role: row.role,
      full_name: row.full_name,
      avatar_emoji: row.avatar_emoji,
    },
  });
}
