"use client";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import SetupNotice from "@cueword/core/components/SetupNotice";
import StorySlate from "@cueword/core/components/StorySlate";
import LiveClass from "@cueword/core/components/LiveClass";
import { useActiveSession } from "@cueword/core/components/useActiveSession";
import { isSupabaseConfigured } from "@cueword/core/lib/supabase/client";
import { logout, useCurrentUser } from "@cueword/core/lib/auth";
import { POC, getZoomLink } from "@cueword/core/lib/config";
import { logAnswer, openStory, setStep, toRenderState } from "@cueword/core/lib/session";
import { getStory, STORY_META } from "@cueword/core/lib/stories";
import { buildSteps, stepPhase } from "@cueword/core/lib/lesson";
import type { AnswerPayload, Question, StoryKey, StoryRow } from "@cueword/core/lib/types";

type Emit = { questionType: Question["type"]; choice: AnswerPayload["choice"]; correct: boolean };

// The student's slate comes straight from the client-side story content.
const SLATE: StoryRow[] = STORY_META.map((m) => ({
  id: m.key,
  key: m.key,
  grade: m.grade,
  title: m.title,
  theme: m.theme,
  theme_color: m.themeColor,
  cover_emoji: m.cover,
  scene_image_url: m.sceneImage,
  created_at: "",
}));

export default function StudentLivePage() {
  const router = useRouter();
  const { user, ready } = useCurrentUser();
  const { session, setSession, loading } = useActiveSession();

  useEffect(() => {
    if (ready && (!user || user.role !== "student")) router.replace("/login");
  }, [ready, user, router]);

  const coachName = POC.coach.displayName;
  const render = useMemo(() => (session ? toRenderState(session) : null), [session]);

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (!ready || loading) return <div className="cw-today">Loading…</div>;
  if (!user || user.role !== "student") return null; // redirecting to /login

  const storyKey = render?.storyKey ?? null;
  const isLive = session?.status === "live" && !!storyKey;
  const zoomLink = getZoomLink(); // JSON config is the single source of truth for the link

  // ---- Live view ----------------------------------------------------------
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
          zoomLink={zoomLink}
          onNext={() => go(idx + 1)}
          onPrev={() => go(idx - 1)}
          onAnswer={onAnswer}
          onLeave={() => router.push("/")}
        />
      );
    }
  }

  // ---- Today / story-pick view (the magic moment) -------------------------
  const pickStory = (key: StoryKey) => {
    if (!session) return;
    setSession({
      ...session,
      story_key: key,
      story_id: null,
      status: "live",
      current_step: 0,
      current_phase: "Listen",
      driver: "student",
    });
    void openStory(session.id, key, null, "student");
  };

  return (
    <div className="cw-today">
      <div className="cw-today-head">
        <div>
          <div className="cw-today-hi">Hi {user.full_name} 👋</div>
          <div className="cw-today-sub">Your class-side learning space</div>
        </div>
        <div className="cw-today-actions">
          <button className="cw-logout" onClick={() => router.push("/")}>
            ← Dashboard
          </button>
          <button
            className="cw-logout"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            Log out
          </button>
        </div>
      </div>

      {session ? (
        <div className="cw-class-card">
          <div>
            <div className="cc-when">Today&apos;s class</div>
            <div className="cc-title">1:1 with {coachName}</div>
            <div className="cc-meta">
              {session.status === "live"
                ? "Your class is live — open a story below to begin together."
                : "Your coach will start the class. Open a story when you're ready."}
            </div>
          </div>
          <div className="cw-class-actions">
            <span className={`cw-status cw-status-${session.status}`}>{session.status}</span>
            <a className="btn-primary btn-small" href={zoomLink} target="_blank" rel="noreferrer">
              Join Zoom
            </a>
          </div>
        </div>
      ) : (
        <div className="cw-slate-empty">
          No class session found — check that Supabase is seeded (config.SESSION_ID).
        </div>
      )}

      <div className="cw-section-label">📚 Your stories — tap one to open it in class</div>
      <StorySlate stories={SLATE} onPick={pickStory} disabled={!session} />
    </div>
  );
}
