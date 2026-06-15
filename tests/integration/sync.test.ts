// Integration test — exercises the real sync wire against a live Supabase.
// Gated: skips automatically unless NEXT_PUBLIC_SUPABASE_URL + ANON_KEY are set
// (so `npm test` stays green without a project). Run against local or cloud
// Supabase with the seed applied.
import { config } from "dotenv";
config({ path: ".env.local" });

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { SESSION_ID as SEEDED_SESSION } from "@/lib/config";

const RUN = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

async function reset(client: typeof import("@/lib/supabase/client")) {
  await client
    .getSupabaseBrowser()
    .from("class_sessions")
    .update({ story_key: null, status: "scheduled", current_step: 0, current_phase: null })
    .eq("id", SEEDED_SESSION);
}

describe.skipIf(!RUN)("realtime sync", () => {
  let session: typeof import("@/lib/session");
  let client: typeof import("@/lib/supabase/client");

  beforeAll(async () => {
    session = await import("@/lib/session");
    client = await import("@/lib/supabase/client");
    await reset(client);
  });

  afterAll(async () => {
    if (client) await reset(client);
  });

  it("openStory writes the pointer and a subscriber receives the change", async () => {
    // Node has no native WebSocket that realtime-js will use here, so give it
    // `ws` as the transport. (The browser app uses its built-in WebSocket.)
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      { realtime: { transport: WebSocket as never } },
    );

    // Subscribe first; only trigger the write once the channel is SUBSCRIBED
    // (avoids the race where the update fires before the socket has joined).
    const received = new Promise<{ story_key: string | null; status: string }>(
      (resolve, reject) => {
        const channel = sb
          .channel(`itest-${SEEDED_SESSION}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "class_sessions",
              filter: `id=eq.${SEEDED_SESSION}`,
            },
            (payload) => {
              const row = payload.new as { story_key: string | null; status: string };
              if (row.story_key === "G3" && row.status === "live") {
                resolve({ story_key: row.story_key, status: row.status });
                void sb.removeChannel(channel);
              }
            },
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              void session.openStory(SEEDED_SESSION, "G3", null, "student");
            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              reject(new Error(`channel ${status}`));
            }
          });
      },
    );

    const row = await Promise.race([
      received,
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("no realtime event in time")), 25000),
      ),
    ]);
    expect(row.story_key).toBe("G3");
    expect(row.status).toBe("live");

    // And the durable row reflects it too.
    const fresh = await session.getSession(SEEDED_SESSION);
    expect(fresh?.story_key).toBe("G3");
    expect(fresh?.current_step).toBe(0);
  }, 35000);

  it("setStep advances the synced step", async () => {
    await session.setStep(SEEDED_SESSION, 2, "Listen", "student");
    const fresh = await session.getSession(SEEDED_SESSION);
    expect(fresh?.current_step).toBe(2);
    expect(fresh?.current_phase).toBe("Listen");
  });
});
