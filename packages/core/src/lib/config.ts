// ============================================================================
// POC config — the ONE file to hardcode creds + the Zoom link + the seeded
// session id. Shared by both apps. `session.id` MUST equal the seeded
// `class_sessions.id` in Supabase, or both apps subscribe to nothing and the
// magic moment never fires. (See supabase/seed.sql + tests/unit/config.test.ts.)
// ============================================================================
import raw from "../config/poc.config.json";
import type { Role } from "./types";

export interface PocCredential {
  username: string;
  password: string;
  displayName: string;
}

export interface PocConfig {
  coach: PocCredential;
  student: PocCredential;
  session: {
    id: string;
    zoomLink: string;
    storyKey: string | null;
  };
}

export const POC: PocConfig = raw as PocConfig;

/** The single live-class session both apps watch. */
export const SESSION_ID: string = POC.session.id;

/** The hardcoded Zoom link (used as the fallback when a row has no zoom_link). */
export function getZoomLink(): string {
  return POC.session.zoomLink;
}

export function credentialFor(role: Role): PocCredential {
  return role === "coach" ? POC.coach : POC.student;
}
