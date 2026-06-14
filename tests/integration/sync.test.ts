// Integration test — exercises the real sync wire against a live Supabase.
// Gated: skips automatically unless NEXT_PUBLIC_SUPABASE_URL + ANON_KEY are set
// (so `npm test` stays green without a project). Run against local or cloud
// Supabase with the seed applied.
import { config } from "dotenv";
config({ path: ".env.local" });

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const RUN = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const SEEDED_SESSION = "55555555-5555-5555-5555-555555555555";

describe.skipIf(!RUN)("realtime sync", () => {
  let session: typeof import("@/lib/session");
  let client: typeof import("@/lib/supabase/client");

  beforeAll(async () => {
    session = await import("@/lib/session");
    client = await import("@/lib/supabase/client");
    // Reset the seeded session to a clean "scheduled, no story" state.
    await client
      .getSupabaseBrowser()
      .from("class_sessions")
      .update({ story_key: null, status: "scheduled", current_step: 0, current_phase: null })
      .eq("id", SEEDED_SESSION);
  });

  afterAll(async () => {
    if (!RUN) return;
    await client
      .getSupabaseBrowser()
      .from("class_sessions")
      .update({ story_key: null, status: "scheduled", current_step: 0, current_phase: null })
      .eq("id", SEEDED_SESSION);
  });

  it("openStory writes the pointer and a subscriber receives the change", async () => {
    const received = new Promise<{ story_key: string | null; status: string }>((resolve) => {
      const unsub = session.subscribeSession(SEEDED_SESSION, (row) => {
        if (row.story_key === "G3" && row.status === "live") {
          resolve({ story_key: row.story_key, status: row.status });
          unsub();
        }
      });
    });

    // Give the channel a moment to subscribe, then trigger the magic moment.
    await new Promise((r) => setTimeout(r, 800));
    await session.openStory(SEEDED_SESSION, "G3", null, "student");

    const row = await Promise.race([
      received,
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("no realtime event")), 8000)),
    ]);
    expect(row.story_key).toBe("G3");
    expect(row.status).toBe("live");

    // And the durable row reflects it too.
    const fresh = await session.getSession(SEEDED_SESSION);
    expect(fresh?.story_key).toBe("G3");
    expect(fresh?.current_step).toBe(0);
  }, 15000);

  it("setStep advances the synced step", async () => {
    await session.setStep(SEEDED_SESSION, 2, "Listen", "student");
    const fresh = await session.getSession(SEEDED_SESSION);
    expect(fresh?.current_step).toBe(2);
    expect(fresh?.current_phase).toBe("Listen");
  });
});
