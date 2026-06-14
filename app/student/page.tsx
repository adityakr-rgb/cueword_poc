"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SetupNotice from "@/components/SetupNotice";
import StorySlate from "@/components/StorySlate";
import LiveClass from "@/components/LiveClass";
import { useActiveSession } from "@/components/useActiveSession";
import { getAssignedStories, listProfiles } from "@/lib/admin";
import { logAnswer, openStory, setStep, toRenderState } from "@/lib/session";
import { getStory } from "@/lib/stories";
import { BAND, buildSteps, stepPhase } from "@/lib/lesson";
import type { AnswerPayload, Question, StoryKey, StoryRow } from "@/lib/types";

type Emit = { questionType: Question["type"]; choice: AnswerPayload["choice"]; correct: boolean };

export default function StudentPage() {
  const router = useRouter();
  const { profile, session, setSession, loading, configured } = useActiveSession("student");
  const [assigned, setAssigned] = useState<StoryRow[]>([]);
  const [coachName, setCoachName] = useState("Coach Maya");

  useEffect(() => {
    if (!configured || !profile) return;
    void getAssignedStories(profile.id).then(setAssigned);
    void listProfiles("coach").then((c) => c[0] && setCoachName(c[0].full_name));
  }, [configured, profile]);

  if (!configured) return <SetupNotice />;
  if (loading) return <div className="cw-today">Loading…</div>;

  const render = session ? toRenderState(session) : null;
  const storyKey = render?.storyKey ?? null;
  const isLive = session?.status === "live" && !!storyKey;

  // ---- Live view ----------------------------------------------------------
  if (isLive && session && storyKey) {
    const story = getStory(storyKey);
    if (story) {
      const steps = buildSteps(story);
      const idx = render!.stepIndex;
      const isDriver = BAND[storyKey].driver === "student";

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
          coachName={coachName}
          kidName={profile?.full_name ?? "Student"}
          kidInitial={(profile?.full_name ?? "S").charAt(0)}
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
    const row = assigned.find((s) => s.key === key);
    setSession({
      ...session,
      story_key: key,
      story_id: row?.id ?? null,
      status: "live",
      current_step: 0,
      current_phase: "Listen",
      driver: BAND[key].driver,
    });
    void openStory(session.id, key, row?.id ?? null, "student");
  };

  return (
    <div className="cw-today">
      <div className="cw-today-head">
        <div>
          <div className="cw-today-hi">Hi {profile?.full_name ?? "there"} 👋</div>
          <div className="cw-today-sub">Your class-side learning space</div>
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
      <StorySlate stories={assigned} onPick={pickStory} disabled={!session} />
    </div>
  );
}
