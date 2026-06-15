import { describe, expect, it } from "vitest";
import { POC, SESSION_ID, getZoomLink, credentialFor } from "@/lib/config";

// This UUID is the contract between poc.config.json and supabase/seed.sql.
// If you change it in one place, change it in both — this test guards the link.
const SEED_SESSION_ID = "55555555-5555-5555-5555-555555555555";

describe("poc.config.json", () => {
  it("has coach + student credentials with display names", () => {
    for (const role of ["coach", "student"] as const) {
      const c = POC[role];
      expect(c.username.trim()).toBeTruthy();
      expect(c.password.length).toBeGreaterThan(0);
      expect(c.displayName.trim()).toBeTruthy();
    }
  });

  it("SESSION_ID is a valid UUID and matches the seeded class_sessions row", () => {
    expect(SESSION_ID).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(SESSION_ID).toBe(SEED_SESSION_ID);
  });

  it("zoomLink is an http(s) URL", () => {
    expect(getZoomLink()).toMatch(/^https?:\/\//);
  });

  it("credentialFor returns the matching credential per role", () => {
    expect(credentialFor("coach")).toBe(POC.coach);
    expect(credentialFor("student")).toBe(POC.student);
  });
});
