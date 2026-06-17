import { describe, expect, it } from "vitest";
import { toRenderState } from "@/lib/session";
import type { ClassSession } from "@/lib/types";

function makeSession(over: Partial<ClassSession> = {}): ClassSession {
  return {
    id: "s1",
    enrollment_id: "e1",
    student_id: "st1",
    coach_id: "co1",
    story_id: null,
    story_key: "G3",
    scheduled_at: null,
    duration_min: 30,
    zoom_link: null,
    status: "live",
    driver: "student",
    current_step: 3,
    current_phase: "Read",
    started_at: null,
    ended_at: null,
    skill: null,
    level: null,
    lesson_title: null,
    cancelled_at: null,
    cancel_reason: null,
    attendance_status: "scheduled",
    created_at: "2026-06-15T00:00:00Z",
    ...over,
  };
}

describe("toRenderState", () => {
  it("maps a session row to the synced render-state", () => {
    expect(toRenderState(makeSession())).toEqual({
      storyKey: "G3",
      stepIndex: 3,
      phase: "Read",
      status: "live",
      driver: "student",
    });
  });

  it("defaults storyKey to null and stepIndex to 0 before a story is opened", () => {
    const rs = toRenderState(
      makeSession({ story_key: null, current_step: 0, status: "scheduled" }),
    );
    expect(rs.storyKey).toBeNull();
    expect(rs.stepIndex).toBe(0);
    expect(rs.status).toBe("scheduled");
  });
});
