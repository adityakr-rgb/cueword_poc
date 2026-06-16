"use client";
import { useEffect, useState } from "react";
import StageCard from "./StageCard";
import VocabPopup from "./VocabPopup";
import { BAND, buildSteps, EX_PHASES, PHASE_TIME, stepPhase } from "../lib/lesson";
import type { AnswerPayload, Driver, Phase, Question, Story, StoryKey } from "../lib/types";

const PHASE_ICON: Record<Phase, string> = {
  Listen: "🎧",
  Read: "📖",
  Speak: "🗣️",
  Write: "✍️",
};

type Emit = { questionType: Question["type"]; choice: AnswerPayload["choice"]; correct: boolean };

/** The shared, synced center column. Used by student (no playbook) and coach. */
export default function LessonCanvas({
  story,
  storyKey,
  stepIndex,
  isDriver,
  driver,
  onNext,
  onPrev,
  onAnswer,
  kidName,
  coachName,
  reveal,
}: {
  story: Story;
  storyKey: StoryKey;
  stepIndex: number;
  isDriver: boolean;
  driver: Driver;
  onNext: () => void;
  onPrev: () => void;
  onAnswer?: (e: Emit) => void;
  kidName: string;
  coachName: string;
  reveal?: AnswerPayload["choice"] | null;
}) {
  const [vocab, setVocab] = useState<{ word: string; def: string } | null>(null);

  const steps = buildSteps(story);
  const safeIndex = Math.min(Math.max(stepIndex, 0), steps.length - 1);
  const step = steps[safeIndex];
  const total = steps.length;
  const phaseName = stepPhase(step);
  const atEnd = step.kind === "complete";
  const atEdge = step.kind === "complete" || step.kind === "ending";

  const band = BAND[storyKey];
  const canvasLabel =
    driver === "coach"
      ? `Shared screen — ${coachName} is sharing & marking · ${band.band}`
      : `Shared screen — ${kidName} is sharing & answering · ${band.band}`;

  // Keyboard paging — only for whoever is driving.
  useEffect(() => {
    if (!isDriver) return;
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "Escape") setVocab(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isDriver, onNext, onPrev]);

  const curIdx = EX_PHASES.indexOf(phaseName as Phase);

  return (
    <main className="class-canvas">
      <div className="cc-canvas-label">{canvasLabel}</div>

      <div className="class-phases">
        {EX_PHASES.map((p, i) => {
          const classes = ["ex-phase"];
          if (atEdge || (curIdx > -1 && i < curIdx)) classes.push("ex-phase-done");
          if (i === curIdx) classes.push("ex-phase-active");
          return (
            <span key={p} style={{ display: "contents" }}>
              {i > 0 && <span className="ex-phase-sep" />}
              <div className={classes.join(" ")}>
                <span className="ex-phase-icon">{PHASE_ICON[p]}</span>
                {p}
                <span className="ex-phase-time">{PHASE_TIME[p]}</span>
              </div>
            </span>
          );
        })}
      </div>

      <div
        key={safeIndex}
        className={`ws-stage ge-band-${storyKey}`}
        style={{ ["--ge-color" as string]: story.themeColor } as React.CSSProperties}
      >
        <StageCard
          story={story}
          step={step}
          storyKey={storyKey}
          kidName={kidName}
          isDriver={isDriver}
          onVocab={(word, def) => setVocab({ word, def })}
          onAnswer={onAnswer}
          reveal={reveal}
        />
      </div>

      <div className="class-nav">
        <button
          className="ex-nav-btn ex-nav-back"
          onClick={onPrev}
          disabled={safeIndex === 0 || !isDriver}
        >
          ← Back
        </button>
        <span className="ex-counter">
          Step {safeIndex + 1} / {total}
          {phaseName ? ` · ${phaseName}` : ""}
        </span>
        <button className="ex-nav-btn ex-nav-next" onClick={onNext} disabled={atEnd || !isDriver}>
          {atEnd ? "Story done ✓" : "Next →"}
        </button>
        <span className="class-nav-coach">
          {isDriver ? "You're paced by whoever is sharing · ← / → keys" : "Following the screen…"}
        </span>
      </div>

      <VocabPopup
        word={vocab?.word ?? null}
        def={vocab?.def ?? ""}
        onClose={() => setVocab(null)}
      />
    </main>
  );
}
