import { NextRequest, NextResponse } from "next/server";

async function getZoomToken(): Promise<string> {
  const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env;
  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    throw new Error("Missing ZOOM_ACCOUNT_ID / ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET");
  }
  const creds = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
    { method: "POST", headers: { Authorization: `Basic ${creds}` } },
  );
  if (!res.ok) throw new Error(`Zoom auth ${res.status}: ${await res.text()}`);
  const { access_token } = (await res.json()) as { access_token: string };
  return access_token;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { message?: string };
  if (!body.message?.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  // Gracefully no-op when Zoom isn't configured so the class still works.
  if (!process.env.ZOOM_ACCOUNT_ID) {
    return NextResponse.json({ ok: true, skipped: "not configured" });
  }

  const coachEmail = process.env.ZOOM_COACH_EMAIL;
  if (!coachEmail) {
    return NextResponse.json({ error: "ZOOM_COACH_EMAIL not set" }, { status: 500 });
  }

  try {
    const token = await getZoomToken();
    // Send from the coach's Zoom account to themselves (appears in Saved Messages /
    // the coach's own chat). Use to_contact=coachEmail for a DM to a different bot
    // user once one is set up.
    const res = await fetch(
      `https://api.zoom.us/v2/chat/users/${encodeURIComponent(coachEmail)}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: body.message,
          to_contact: coachEmail,
        }),
      },
    );
    if (!res.ok) {
      const err = await res.text();
      console.error("[zoom-notify]", res.status, err);
      return NextResponse.json({ error: err }, { status: res.status });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[zoom-notify]", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
