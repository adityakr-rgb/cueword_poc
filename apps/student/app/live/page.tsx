"use client";
import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import SetupNotice from "@cueword/core/components/SetupNotice";
import LiveClass from "@cueword/core/components/LiveClass";
import { useActiveSession } from "@cueword/core/components/useActiveSession";
import { isSupabaseConfigured } from "@cueword/core/lib/supabase/client";
import { useCurrentUser } from "@cueword/core/lib/auth";
import { POC, getZoomLink } from "@cueword/core/lib/config";
import { logAnswer, openStory, setStep, toRenderState } from "@cueword/core/lib/session";
import { getStory } from "@cueword/core/lib/stories";
import { buildSteps, stepPhase } from "@cueword/core/lib/lesson";
import type { AnswerPayload, Question, StoryKey } from "@cueword/core/lib/types";

type Emit = { questionType: Question["type"]; choice: AnswerPayload["choice"]; correct: boolean };

// The class always runs ONE configured story — the student joins straight into
// it (no story picker). Change it in poc.config.json → session.storyKey.
const AUTO_STORY = (POC.session.storyKey ?? "G3") as StoryKey;

export default function StudentLivePage() {
  const router = useRouter();
  const { user, ready } = useCurrentUser();
  const { session, setSession, loading } = useActiveSession();
  const openedRef = useRef(false);

  useEffect(() => {
    if (ready && (!user || user.role !== "student")) router.replace("/login");
  }, [ready, user, router]);

  const render = useMemo(() => (session ? toRenderState(session) : null), [session]);
  const storyKey = render?.storyKey ?? null;
  const isLive = session?.status === "live" && !!storyKey;

  // Auto-open the configured story the moment we arrive without one, so the
  // student lands directly in the live lesson (Zoom already opened from the
  // dashboard). This is the magic moment — it syncs to the coach instantly.
  useEffect(() => {
    if (!session || isLive || openedRef.current) return;
    openedRef.current = true;
    setSession({
      ...session,
      story_key: AUTO_STORY,
      story_id: null,
      status: "live",
      current_step: 0,
      current_phase: "Listen",
      driver: "student",
    });
    void openStory(session.id, AUTO_STORY, null, "student");
  }, [session, isLive, setSession]);

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (!ready || (loading && !session)) return <div className="cw-today">Loading…</div>;
  if (!user || user.role !== "student") return null; // redirecting to /login

  const coachName = POC.coach.displayName;
  const zoomLink = getZoomLink();

  // ---- Live lesson (the only view — no picker) ----------------------------
  if (isLive && session && storyKey) {
    const story = getStory(storyKey);
    if (story) {
      const steps = buildSteps(story);
      const idx = render!.stepIndex;
      const isDriver = session.driver === "student";

      const go = (ni: number) => {
        const clamped = Math.min(Math.max(ni, 0), steps.length - 1);
        const phase = stepPhase(steps[clamped]) || null;
        setSession({ ...session, current_step: clamped, current_phase: phase });
        void setStep(session.id, clamped, phase, "student");
      };
      const onAnswer = (e: Emit) =>
        void logAnswer(session.id, "student", {
          stepIndex: idx,
          questionType: e.questionType,
          choice: e.choice,
          correct: e.correct,
        });

      return (
        <LiveClass
          story={story}
          storyKey={storyKey}
          stepIndex={idx}
          isDriver={isDriver}
          driver={session.driver}
          coachName={coachName}
          kidName={user.full_name}
          onNext={() => go(idx + 1)}
          onPrev={() => go(idx - 1)}
          onAnswer={onAnswer}
          onLeave={() => router.push("/")}
          headerActions={
            zoomLink ? (
              <a className="ct-zoom" href={zoomLink} target="_blank" rel="noreferrer" title="Open your Zoom video call">
                🎥 Zoom link
              </a>
            ) : undefined
          }
        />
      );
    }
  }

  // ---- Brief state while the story opens (or no seeded session row) -------
  return (
    <div className="cw-today">
      {session ? (
        <div className="cw-class-card">
          <div>
            <div className="cc-when">Opening your class…</div>
            <div className="cc-title">1:1 with {coachName}</div>
            <div className="cc-meta">Taking you into today&apos;s story.</div>
          </div>
        </div>
      ) : (
        <div className="cw-slate-empty">
          No class session found — check that Supabase is seeded (config.SESSION_ID).
        </div>
      )}
    </div>
  );
}
