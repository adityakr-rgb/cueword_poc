"use client";
import { Fragment, useState } from "react";
import { SceneBig, SceneStrip } from "./Scene";
import QuestionView from "./QuestionView";
import VocabGame from "./VocabGame";
import { sentenceFrames, stepPhase } from "@/lib/lesson";
import type { AnswerPayload, Question, Step, Story, StoryKey } from "@/lib/types";

type Emit = { questionType: Question["type"]; choice: AnswerPayload["choice"]; correct: boolean };

function SightWord({ text }: { text: string }) {
  const [found, setFound] = useState(false);
  return (
    <span
      className={found ? "ge-sight ge-sight-found" : "ge-sight"}
      onClick={() => setFound((v) => !v)}
    >
      {text}
    </span>
  );
}

function Passage({
  story,
  onVocab,
}: {
  story: Story;
  onVocab: (word: string, def: string) => void;
}) {
  return (
    <p className="ge-passage">
      {story.read.passage.map((seg, i) => {
        if (seg.vocab) {
          return (
            <span
              key={i}
              className="ge-vocab"
              onClick={() => onVocab(seg.word || seg.text.trim(), seg.def || "")}
            >
              {seg.text}
            </span>
          );
        }
        if (seg.highlight) return <SightWord key={i} text={seg.text} />;
        return <Fragment key={i}>{seg.text}</Fragment>;
      })}
    </p>
  );
}

function StimulusPane({
  story,
  step,
  onVocab,
}: {
  story: Story;
  step: Step;
  onVocab: (word: string, def: string) => void;
}) {
  if (stepPhase(step) === "Listen") {
    return (
      <>
        <div className="ws-text-label">🎧 The clip — stays on screen</div>
        <div className="ge-audio">
          <div className="ge-audio-play">▶</div>
          <div className="ge-audio-meta">{story.listen.clipMeta}</div>
        </div>
        <div className="ge-transcript">
          {story.listen.transcript.split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </>
    );
  }
  return (
    <>
      <div className="ws-text-label">📖 The passage — stays on screen</div>
      <Passage story={story} onVocab={onVocab} />
      {step.kind === "read" && (
        <div className="ge-vocab-bar">
          <div className="ge-vocab-bar-label">📝 New words — tap</div>
          <div className="ge-vocab-chips">
            {story.read.vocab.map((v) => (
              <button key={v.word} className="ge-vocab-chip" onClick={() => onVocab(v.word, v.def)}>
                {v.word}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function ActivityPane({
  story,
  step,
  storyKey,
  isDriver,
  onAnswer,
  answerNote,
}: {
  story: Story;
  step: Step;
  storyKey: StoryKey;
  isDriver: boolean;
  onAnswer?: (e: Emit) => void;
  answerNote?: string | null;
}) {
  if (step.kind === "listen") {
    return (
      <>
        <div className="ws-task">🎧 Listen to the story</div>
        <div className="ws-task-sub">
          Tap play and listen. You can listen again as many times as you like — then answer the
          questions.
        </div>
      </>
    );
  }
  if (step.kind === "read") {
    return (
      <>
        <div className="ws-task">📖 Read the story</div>
        <div className="ws-task-sub">
          Read it through. Tap any glowing word to learn what it means — then answer the questions.
        </div>
        {story.fact && (
          <div className="ws-fact">
            <span className="ws-fact-icon">💡</span>
            <span>{story.fact}</span>
          </div>
        )}
      </>
    );
  }
  if (step.kind === "q") {
    return (
      <>
        <div className="ws-qhead">
          Question {step.qi + 1} of {step.total}
        </div>
        <QuestionView q={step.q} interactive={isDriver} onAnswer={onAnswer} />
        {answerNote && <div className="ws-answer-note">{answerNote}</div>}
      </>
    );
  }
  if (step.kind === "speak") {
    return (
      <>
        <div className="ws-task">🗣️ Your turn to speak</div>
        <h4 className="ge-prompt">{story.speak.prompt}</h4>
        <div className="ge-hints">
          {story.speak.hints.map((h, i) => (
            <span key={i} className="ge-hint">
              {h}
            </span>
          ))}
        </div>
        <div className="ws-frames">
          <div className="ws-frames-h">You could start with…</div>
          {sentenceFrames(storyKey).map((f, i) => (
            <span key={i} className="ws-frame">
              {f}
            </span>
          ))}
        </div>
        <div className="ge-mic">
          <span className="ge-mic-icon">🎙️</span> Tap to record
        </div>
      </>
    );
  }
  if (step.kind === "write") {
    const w = story.write;
    if (w.mode === "trace") {
      return (
        <>
          <div className="ws-task">✍️ Trace, then draw</div>
          <div className="ws-task-sub">{w.prompt}</div>
          <div className="ws-trace-wrap">
            <div className="ws-trace-line">
              <span className="ws-trace-text">{w.trace}</span>
            </div>
          </div>
          <div className="ws-draw">
            <div className="ws-draw-label">✏️ {w.drawPrompt}</div>
            <div className="ws-draw-area">🖍️</div>
          </div>
        </>
      );
    }
    return (
      <>
        <div className="ws-task">✍️ Your turn to write</div>
        <h4 className="ge-prompt">{w.prompt}</h4>
        <div className="ws-editor">
          Write your answer here…<span className="ws-caret">|</span>
        </div>
      </>
    );
  }
  return null;
}

/** Renders one lesson step. Ported from class-experience.js buildWorkspace(). */
export default function StageCard({
  story,
  step,
  storyKey,
  kidName,
  isDriver,
  onVocab,
  onAnswer,
  answerNote,
}: {
  story: Story;
  step: Step;
  storyKey: StoryKey;
  kidName: string;
  isDriver: boolean;
  onVocab: (word: string, def: string) => void;
  onAnswer?: (e: Emit) => void;
  answerNote?: string | null;
}) {
  if (step.kind === "cover") {
    return (
      <>
        <SceneBig story={story} tag={story.scene.caption} />
        <div className="ws-cover-body">
          <div className="ex-cover-theme">
            <span className="ge-theme-dot" style={{ background: story.themeColor }} />
            {story.theme}
          </div>
          <h2 className="ex-cover-title">{story.title}</h2>
          <p className="ws-about">{story.about}</p>
          <div className="ws-flow-label">In this story you will…</div>
          <div className="ex-cover-flow">
            <span className="ex-flow-chip">🎧 Listen</span>
            <span className="ex-flow-arrow">→</span>
            <span className="ex-flow-chip">📖 Read</span>
            <span className="ex-flow-arrow">→</span>
            <span className="ex-flow-chip">🗣️ Speak</span>
            <span className="ex-flow-arrow">→</span>
            <span className="ex-flow-chip">✍️ Write</span>
          </div>
        </div>
      </>
    );
  }

  if (step.kind === "complete") {
    return (
      <>
        <SceneBig story={story} tag="Story complete!" />
        <div className="ws-complete-body">
          <div className="ex-complete-eyebrow">
            {story.title} · {story.grade}
          </div>
          <h2 className="ex-complete-title">Great class, {kidName} 🎉</h2>
          <div className="ex-complete-recap">
            <div className="ex-recap-item">
              <span className="ex-recap-icon">🎧</span> Listened &amp; answered{" "}
              {story.listen.questions.length} questions
            </div>
            <div className="ex-recap-item">
              <span className="ex-recap-icon">📖</span> Read &amp; answered{" "}
              {story.read.questions.length} questions
            </div>
            <div className="ex-recap-item">
              <span className="ex-recap-icon">🗣️</span> Spoke in character with the coach
            </div>
            <div className="ex-recap-item">
              <span className="ex-recap-icon">✍️</span>{" "}
              {story.write.mode === "trace"
                ? "Traced a sentence and drew a picture"
                : "Wrote a response"}
            </div>
          </div>
          <div className="ex-srs-box">
            <div className="ge-srs-label">Added to the spaced-revision deck</div>
            <div className="ge-srs-chips">
              {story.srs.map((w) => (
                <span key={w} className="ge-srs-chip">
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (step.kind === "ending") {
    return (
      <>
        <SceneBig story={story} tag="How the story ends" />
        <div className="ws-cover-body">
          <div className="ws-flow-label">📖 How the story ends</div>
          <p className="ws-ending">{story.end}</p>
        </div>
      </>
    );
  }

  if (step.kind === "game") {
    return (
      <>
        <SceneStrip story={story} tag="Word game" />
        <div className="ws-game">
          <VocabGame story={story} />
        </div>
      </>
    );
  }

  // Activity steps → two-pane workspace.
  const cap =
    step.kind === "q"
      ? step.phase === "Listen"
        ? "Listening check"
        : "Reading check"
      : step.kind === "listen"
        ? "Now listening…"
        : step.kind === "read"
          ? "Now reading…"
          : step.kind === "speak"
            ? "Speaking together"
            : "Writing together";

  return (
    <>
      <SceneStrip story={story} tag={cap} />
      <div className="ws">
        <div className="ws-text">
          <StimulusPane story={story} step={step} onVocab={onVocab} />
        </div>
        <div className="ws-activity">
          <ActivityPane
            story={story}
            step={step}
            storyKey={storyKey}
            isDriver={isDriver}
            onAnswer={onAnswer}
            answerNote={answerNote}
          />
        </div>
      </div>
    </>
  );
}
