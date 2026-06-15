"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SetupNotice from "@/components/SetupNotice";
import LiveClass from "@/components/LiveClass";
import BodyClass from "@/components/BodyClass";
import TopBar from "@/components/TopBar";
import ClassPeople from "@/components/ClassPeople";
import { useActiveSession } from "@/components/useActiveSession";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { logout, useCurrentUser } from "@/lib/auth";
import { listProfiles } from "@/lib/admin";
import {
  endClass,
  setDriver,
  setStep,
  startClass,
  subscribeSessionEvents,
  toRenderState,
} from "@/lib/session";
import { getStory } from "@/lib/stories";
import { buildSteps, pickedAnswerLabel, stepPhase } from "@/lib/lesson";
import type { AnswerPayload, Profile } from "@/lib/types";

export default function CoachPage() {
  const router = useRouter();
  const { user, ready } = useCurrentUser();
  const { session, setSession, loading } = useActiveSession(user);
  const [students, setStudents] = useState<Profile[]>([]);
  const [lastAnswer, setLastAnswer] = useState<{
    stepIndex: number;
    correct: boolean;
    choice: AnswerPayload["choice"];
  } | null>(null);

  useEffect(() => {
    if (ready && (!user || user.role !== "coach")) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (!isSupabaseConfigured || !user || user.role !== "coach") return;
    void listProfiles("student").then(setStudents);
  }, [user]);

  // Reflect the student's picks live on the coach screen.
  useEffect(() => {
    if (!isSupabaseConfigured || !session?.id) return;
    return subscribeSessionEvents(session.id, (evt) => {
      if (evt.type === "answer") {
        const p = evt.payload as {
          stepIndex?: number;
          correct?: boolean;
          choice?: AnswerPayload["choice"];
        };
        setLastAnswer({
          stepIndex: Number(p.stepIndex ?? -1),
          correct: Boolean(p.correct),
          choice: p.choice as AnswerPayload["choice"],
        });
      }
    });
  }, [session?.id]);

  const studentName =
    (session?.student_id
      ? students.find((p) => p.id === session.student_id)?.full_name
      : undefined) ??
    students[0]?.full_name ??
    "the student";

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (!ready || loading) return <div className="cw-today">Loading…</div>;
  if (!user || user.role !== "coach") return null; // redirecting to /login

  const coachName = user.full_name;
  const kidInitial = studentName.charAt(0);
  const render = session ? toRenderState(session) : null;
  const storyKey = render?.storyKey ?? null;
  const isLiveWithStory = session?.status === "live" && !!storyKey;

  const logoutBtn = (
    <button
      className="cw-logout"
      onClick={() => {
        logout();
        router.replace("/login");
      }}
    >
      Log out
    </button>
  );

  // ---- Live console -------------------------------------------------------
  if (isLiveWithStory && session && storyKey) {
    const story = getStory(storyKey);
    if (story) {
      const steps = buildSteps(story);
      const idx = render!.stepIndex;
      const isDriver = session.driver === "coach";

      const go = (ni: number) => {
        const clamped = Math.min(Math.max(ni, 0), steps.length - 1);
        const phase = stepPhase(steps[clamped]) || null;
        setSession({ ...session, current_step: clamped, current_phase: phase });
        void setStep(session.id, clamped, phase, "coach");
      };
      const toggleDriver = () => {
        const next = session.driver === "coach" ? "student" : "coach";
        setSession({ ...session, driver: next });
        void setDriver(session.id, next);
      };
      const curStep = steps[idx];
      const answerNote =
        lastAnswer && lastAnswer.stepIndex === idx && curStep.kind === "q"
          ? `${studentName} ticked "${pickedAnswerLabel(curStep.q, lastAnswer.choice)}" ${
              lastAnswer.correct ? "✓ correct" : "✗ wrong answer"
            }`
          : null;

      return (
        <LiveClass
          story={story}
          storyKey={storyKey}
          stepIndex={idx}
          isDriver={isDriver}
          driver={session.driver}
          coachName={coachName}
          kidName={studentName}
          kidInitial={kidInitial}
          zoomLink={session.zoom_link}
          showPlaybook
          answerNote={answerNote}
          onNext={() => go(idx + 1)}
          onPrev={() => go(idx - 1)}
          onLeave={() => {
            void endClass(session.id);
            router.push("/");
          }}
          headerActions={
            <>
              <button className="cw-takeover" onClick={toggleDriver}>
                {isDriver ? `Give control to ${studentName}` : "Take over"}
              </button>
              {logoutBtn}
            </>
          }
        />
      );
    }
  }

  // ---- Live, waiting for the student to open a story ----------------------
  if (session?.status === "live") {
    return (
      <>
        <BodyClass name="class-body" />
        <div className="class-shell">
          <TopBar
            coachName={coachName}
            storyTitle="Waiting to begin…"
            zoomLink={session.zoom_link}
            onLeave={() => {
              void endClass(session.id);
              router.push("/");
            }}
            actions={logoutBtn}
          />
          <div className="class-main">
            <ClassPeople
              coachName={coachName}
              coachInitial={coachName.charAt(0)}
              kidName={studentName}
              kidInitial={kidInitial}
              sharer="student"
              activePlanKey="warmup"
            />
            <main className="class-canvas">
              <div className="cw-waiting">
                <div className="cw-waiting-emoji">🪄</div>
                <h3>Waiting for {studentName} to open a story</h3>
                <p>
                  As soon as {studentName} taps a story on their screen, it appears here — synced
                  live. Warm up with a quick chat meanwhile.
                </p>
              </div>
            </main>
            <aside className="class-playbook">
              <div className="pb-head">
                🎯 Coach playbook <span className="pb-only">coach only</span>
              </div>
              <div className="pb-body">
                <div className="pb-card">
                  <div className="pb-card-h">Get ready</div>
                  <p>
                    The class is live. When {studentName} opens the story, the lesson and your
                    nudges, answers, and rubric appear right here.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </>
    );
  }

  // ---- Today / roster -----------------------------------------------------
  return (
    <div className="cw-today">
      <div className="cw-today-head">
        <div>
          <div className="cw-today-hi">Good day, {coachName} 👋</div>
          <div className="cw-today-sub">Your teaching console</div>
        </div>
        {logoutBtn}
      </div>

      {session ? (
        <div className="cw-class-card">
          <div>
            <div className="cc-when">Today&apos;s session</div>
            <div className="cc-title">1:1 with {studentName}</div>
            <div className="cc-meta">
              {session.status === "completed"
                ? "Class complete. Nice work."
                : `Start the class, then guide ${studentName} through the story.`}
            </div>
          </div>
          <div className="cw-class-actions">
            <span className={`cw-status cw-status-${session.status}`}>{session.status}</span>
            {session.zoom_link && (
              <a
                className="btn-secondary btn-small"
                href={session.zoom_link}
                target="_blank"
                rel="noreferrer"
              >
                Join Zoom
              </a>
            )}
            {session.status === "scheduled" && (
              <button
                className="btn-primary btn-small"
                onClick={() => {
                  setSession({ ...session, status: "live" });
                  void startClass(session.id);
                }}
              >
                Start class →
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="cw-slate-empty">
          No session scheduled — ask the admin to schedule a class.
        </div>
      )}

      <div className="cw-section-label">👩‍🏫 Roster</div>
      <div className="cw-class-card">
        <div>
          <div className="cc-title" style={{ fontSize: 18 }}>
            {studentName}
          </div>
          <div className="cc-meta">
            Reading &amp; Listening above grade · Speaking is the focus.
          </div>
        </div>
      </div>
    </div>
  );
}
