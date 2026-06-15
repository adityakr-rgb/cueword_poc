// ============================================================================
// Admin provisioning endpoint (Node, service role). Handles the privileged
// writes the admin console needs: create profile / enrollment / schedule class.
// ============================================================================
import { NextResponse } from "next/server";
import { getSupabaseAdmin, isAdminConfigured } from "@/lib/supabase/server";
import { generatePassword, generateUsername, hashPassword } from "@/lib/password";
import type { AdminAction } from "@/lib/admin";

export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Supabase admin is not configured (set SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 500 },
    );
  }

  let body: AdminAction;
  try {
    body = (await req.json()) as AdminAction;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const sb = getSupabaseAdmin();

  try {
    switch (body.action) {
      case "createProfile": {
        const { role, full_name, avatar_emoji, grade, timezone, username, password } = body;
        if (!role || !full_name) {
          return NextResponse.json({ error: "role and full_name are required." }, { status: 400 });
        }
        // Admin-generated login: use provided creds or generate them.
        const finalUsername = (username || "").trim() || generateUsername(full_name);
        const finalPassword = (password || "").trim() || generatePassword();
        const { data, error } = await sb
          .from("profiles")
          .insert({
            role,
            full_name,
            avatar_emoji: avatar_emoji ?? null,
            grade: grade ?? null,
            timezone: timezone ?? null,
            username: finalUsername,
            password_hash: hashPassword(finalPassword),
          })
          .select("id, role, full_name, avatar_emoji, grade, timezone, username, created_at")
          .single();
        if (error) throw error;
        // Return the plaintext password once so the admin can share it.
        return NextResponse.json({
          profile: data,
          username: finalUsername,
          password: finalPassword,
        });
      }

      case "createEnrollment": {
        const { student_id, coach_id, plan } = body;
        if (!student_id || !coach_id) {
          return NextResponse.json(
            { error: "student_id and coach_id are required." },
            { status: 400 },
          );
        }
        const { data, error } = await sb
          .from("enrollments")
          .insert({ student_id, coach_id, plan: plan ?? "1:1 Pilot", status: "active" })
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json({ enrollment: data });
      }

      case "scheduleClass": {
        const {
          enrollment_id,
          student_id,
          coach_id,
          story_id,
          scheduled_at,
          duration_min,
          zoom_link,
        } = body;
        if (!student_id || !coach_id || !scheduled_at) {
          return NextResponse.json(
            { error: "student_id, coach_id and scheduled_at are required." },
            { status: 400 },
          );
        }
        // Assigning a story also adds it to the student's slate.
        if (story_id) {
          const { error: aErr } = await sb
            .from("assignments")
            .upsert(
              { student_id, story_id, assigned_by: null },
              { onConflict: "student_id,story_id", ignoreDuplicates: true },
            );
          if (aErr) throw aErr;
        }
        const { data, error } = await sb
          .from("class_sessions")
          .insert({
            enrollment_id: enrollment_id ?? null,
            student_id,
            coach_id,
            story_id: story_id ?? null,
            story_key: null, // set live when the student opens the story (the magic moment)
            scheduled_at,
            duration_min: duration_min ?? 30,
            zoom_link,
            status: "scheduled",
            driver: "student",
            current_step: 0,
          })
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json({ session: data });
      }

      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
