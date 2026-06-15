"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SetupNotice from "@/components/SetupNotice";
import StorySlate from "@/components/StorySlate";
import LiveClass from "@/components/LiveClass";
import { useActiveSession } from "@/components/useActiveSession";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { logout, useCurrentUser } from "@/lib/auth";
import { getAssignedStories, listProfiles, listStories } from "@/lib/admin";
import { logAnswer, openStory, setStep, toRenderState } from "@/lib/session";
import { getStory } from "@/lib/stories";
import { buildSteps, stepPhase } from "@/lib/lesson";
import type { AnswerPayload, Profile, Question, StoryKey, StoryRow } from "@/lib/types";

type Emit = { questionType: Question["type"]; choice: AnswerPayload["choice"]; correct: boolean };

export default function StudentPage() {
  const router = useRouter();
  const { user, ready } = useCurrentUser();
  const { session, setSession, loading } = useActiveSession(user);
  const [assigned, setAssigned] = useState<StoryRow[]>([]);
  const [allStories, setAllStories] = useState<StoryRow[]>([]);
  const [coaches, setCoaches] = useState<Profile[]>([]);

  useEffect(() => {
    if (ready && (!user || user.role !== "student")) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (!isSupabaseConfigured || !user || user.role !== "student") return;
    void getAssignedStories(user.id).then(setAssigned);
    void listStories().then(setAllStories);
    void listProfiles("coach").then(setCoaches);
  }, [user]);

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (!ready || loading) return <div className="cw-today">Loading…</div>;
  if (!user || user.role !== "student") return null; // redirecting to /login

  // Slate = the student's assigned stories, or all stories as a fallback so a
  // freshly-created student can always open something.
  const slate = assigned.length ? assigned : allStories;
  const coachName =
    coaches.find((c) => c.id === session?.coach_id)?.full_name ??
    coaches[0]?.full_name ??
    "your coach";

  const render = session ? toRenderState(session) : null;
  const storyKey = render?.storyKey ?? null;
  const isLive = session?.status === "live" && !!storyKey;

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
          kidInitial={user.full_name.charAt(0)}
          zoomLink={session.zoom_link}
          onNext={() => go(idx + 1)}
          onPrev={() => go(idx - 1)}
          onAnswer={onAnswer}
          onLeave={() => router.push("/")}
        />
      );
    }
  }

  // ---- Today view ---------------------------------------------------------
  const pickStory = (key: StoryKey) => {
    if (!session) return;
    const row = slate.find((s) => s.key === key);
    setSession({
      ...session,
      story_key: key,
      story_id: row?.id ?? null,
      status: "live",
      current_step: 0,
      current_phase: "Listen",
      driver: "student",
    });
    void openStory(session.id, key, row?.id ?? null, "student");
  };

  return (
    <div className="cw-today">
      <div className="cw-today-head">
        <div>
          <div className="cw-today-hi">Hi {user.full_name} 👋</div>
          <div className="cw-today-sub">Your class-side learning space</div>
        </div>
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
            {session.zoom_link && (
              <a
                className="btn-primary btn-small"
                href={session.zoom_link}
                target="_blank"
                rel="noreferrer"
              >
                Join Zoom
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="cw-slate-empty">
          No class scheduled yet — ask your admin to schedule one.
        </div>
      )}

      <div className="cw-section-label">📚 Your stories — tap one to open it in class</div>
      <StorySlate stories={slate} onPick={pickStory} disabled={!session} />
    </div>
  );
}
