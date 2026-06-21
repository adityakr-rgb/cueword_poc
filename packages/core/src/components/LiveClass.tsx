"use client";
import { useState, type ReactNode } from "react";
import BodyClass from "./BodyClass";
import TopBar from "./TopBar";
import ClassPeople from "./ClassPeople";
import ClassPlan from "./ClassPlan";
import ZoomPip from "./ZoomPip";
import LessonCanvas from "./LessonCanvas";
import CoachPlaybook from "./CoachPlaybook";
import { buildSteps, stepPhase } from "../lib/lesson";
import type { AnswerPayload, Driver, Question, Step, Story, StoryKey } from "../lib/types";

type Emit = { questionType: Question["type"]; choice: AnswerPayload["choice"]; correct: boolean };

function planKeyFor(step: Step): string {
  if (step.kind === "cover") return "warmup";
  if (step.kind === "complete" || step.kind === "ending") return "wrap";
  return stepPhase(step) || "warmup";
}

/** The dark live-class shell — shared by /student (no playbook) and /coach. */
export default function LiveClass({
  story,
  storyKey,
  stepIndex,
  isDriver,
  driver,
  coachName,
  kidName,
  zoomLink,
  onNext,
  onPrev,
  onAnswer,
  onLeave,
  showPlaybook = false,
  rightRail = false,
  headerActions,
  reveal,
}: {
  story: Story;
  storyKey: StoryKey;
  stepIndex: number;
  isDriver: boolean;
  driver: Driver;
  coachName: string;
  kidName: string;
  zoomLink?: string | null;
  onNext: () => void;
  onPrev: () => void;
  onAnswer?: (e: Emit) => void;
  onLeave?: () => void;
  showPlaybook?: boolean;
  /** Student layout: a right rail (class plan + progress) with the Zoom
   *  drop-zone docked at its bottom, sharing one width so they line up. The
   *  lesson canvas fills the remaining width and the left column is dropped. */
  rightRail?: boolean;
  headerActions?: ReactNode;
  reveal?: AnswerPayload["choice"] | null;
}) {
  const steps = buildSteps(story);
  const idx = Math.min(Math.max(stepIndex, 0), steps.length - 1);
  const step = steps[idx];
  const progress = Math.round(((idx + 1) / steps.length) * 100);

  // Layout toggle (student only): "classic" keeps the right rail + top stepper;
  // "focus" drops the rail, widens the stage, moves Back/Next to side arrows and
  // the phase stepper to the bottom, with the Zoom PiP floating bottom-right.
  const [focus, setFocus] = useState(false);
  const focusLayout = rightRail && focus;
  const mainClass = showPlaybook ? "" : focusLayout ? "cw-focus" : rightRail ? "cw-rail" : "cw-2col";

  return (
    <>
      <BodyClass name="class-body" />
      <div className="class-shell">
        <TopBar
          coachName={coachName}
          storyTitle={`${story.cover} ${story.title}`}
          zoomLink={zoomLink}
          onLeave={onLeave}
          actions={headerActions}
        />
        <div className={`class-main ${mainClass}`}>
          {!rightRail && <ClassPeople activePlanKey={planKeyFor(step)} />}
          <LessonCanvas
            story={story}
            storyKey={storyKey}
            stepIndex={idx}
            isDriver={isDriver}
            driver={driver}
            onNext={onNext}
            onPrev={onPrev}
            onAnswer={onAnswer}
            kidName={kidName}
            coachName={coachName}
            reveal={reveal}
            focus={focusLayout}
            showTopPhases={!rightRail}
          />
          {showPlaybook && (
            <aside className="class-playbook">
              <div className="pb-head">
                🎯 Coach playbook{" "}
                <span className="pb-only">coach only — the student can&apos;t see this</span>
              </div>
              <CoachPlaybook
                key={idx}
                story={story}
                storyKey={storyKey}
                step={step}
                kidName={kidName}
                driver={driver}
              />
            </aside>
          )}
          {rightRail && !focus && (
            <aside className="class-rail">
              <div className="rail-head">
                <span>📋 Class plan</span>
                <span className="rail-step">
                  Step {idx + 1} / {steps.length}
                </span>
              </div>
              <div className="rail-progress">
                <div style={{ width: `${progress}%` }} />
              </div>
              <div className="rail-scroll">
                <ClassPlan activePlanKey={planKeyFor(step)} />
              </div>
              <ZoomPip />
            </aside>
          )}
        </div>
        {focusLayout && (
          <div className="zoom-pip-float">
            <ZoomPip />
          </div>
        )}
        {rightRail && (
          <button
            className="class-layout-toggle"
            onClick={() => setFocus((f) => !f)}
            title="Switch layout"
          >
            {focus ? "▤ Layout 1" : "⛶ Layout 2"}
          </button>
        )}
      </div>
    </>
  );
}
