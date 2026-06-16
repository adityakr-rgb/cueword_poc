"use client";
import { useState } from "react";
import { QTYPE_LABEL, resolveReveal } from "../lib/lesson";
import type { AnswerPayload, Question } from "../lib/types";

type Emit = {
  questionType: Question["type"];
  choice: AnswerPayload["choice"];
  correct: boolean;
};

function cx(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Renders one question with interaction. Ported from class-experience.js
 * renderQuestion() + wireClassQuestions(). Re-mounted per step (key=stepIndex)
 * so internal state resets between questions.
 */
export default function QuestionView({
  q,
  interactive = true,
  onAnswer,
  reveal,
}: {
  q: Question;
  interactive?: boolean;
  onAnswer?: (e: Emit) => void;
  reveal?: AnswerPayload["choice"] | null;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [multiSel, setMultiSel] = useState<number[]>([]);
  const [rowPick, setRowPick] = useState<Record<number, number>>({});
  const [hintOpen, setHintOpen] = useState(false);

  // Mirror a peer's synced answer (e.g. the child's pick on the coach screen)
  // when there is no local interaction. Student behavior is unchanged.
  const eff = resolveReveal({ picked, answered, multiSel }, reveal);

  const hintText = q.hint ?? ("look" in q ? q.look : undefined);
  const instr = QTYPE_LABEL[q.type];

  // ---- single-choice (mcq / truefalse / cloze) ----------------------------
  function singleChoice(opts: string[], correctIdx: number) {
    return opts.map((o, i) => {
      const classes = ["ge-opt"];
      if (eff.answered) {
        if (i === correctIdx) classes.push("ge-opt-right");
        if (i === eff.picked) {
          classes.push("ge-opt-picked");
          classes.push(i === correctIdx ? "ge-opt-right" : "ge-opt-wrong");
        }
      }
      return (
        <button
          key={i}
          className={classes.join(" ")}
          disabled={!interactive}
          onClick={() => {
            if (answered || !interactive) return;
            setPicked(i);
            setAnswered(true);
            onAnswer?.({ questionType: q.type, choice: i, correct: i === correctIdx });
          }}
        >
          {o}
        </button>
      );
    });
  }

  const hint = hintText ? (
    <div className="ge-hint-wrap">
      <button
        className={cx("ge-hint-btn", hintOpen && "ge-hint-on")}
        onClick={() => setHintOpen((v) => !v)}
      >
        {hintOpen ? "💡 Hide hint" : "💡 Hint"}
      </button>
      {hintOpen && <div className="ge-hint-text">{hintText}</div>}
    </div>
  ) : null;

  let body: React.ReactNode = null;

  if (q.type === "mcq") {
    body = <div className="ge-opts">{singleChoice(q.opts, q.correct)}</div>;
  } else if (q.type === "truefalse") {
    body = <div className="ge-opts">{singleChoice(["True", "False"], q.answer ? 0 : 1)}</div>;
  } else if (q.type === "multi") {
    body = (
      <div className="ge-opts">
        {q.opts.map((o, i) => {
          const on = eff.multiSel.includes(i);
          const isCorrect = q.correct.includes(i);
          const classes = ["ge-opt", "ge-opt-multi"];
          if (on) {
            classes.push("ge-opt-sel");
            classes.push(isCorrect ? "ge-opt-right" : "ge-opt-wrong");
          }
          return (
            <button
              key={i}
              className={classes.join(" ")}
              disabled={!interactive}
              onClick={() => {
                if (!interactive) return;
                const next = on ? multiSel.filter((x) => x !== i) : [...multiSel, i];
                setMultiSel(next);
                const sorted = [...next].sort((a, b) => a - b);
                const target = [...q.correct].sort((a, b) => a - b);
                const correct =
                  sorted.length === target.length && sorted.every((v, k) => v === target[k]);
                onAnswer?.({ questionType: "multi", choice: next, correct });
              }}
            >
              {o}
            </button>
          );
        })}
      </div>
    );
  } else if (q.type === "cloze") {
    const [before, after] = q.text.split("___");
    const blankClasses = ["ge-cloze-blank"];
    if (eff.answered) {
      blankClasses.push("filled");
      blankClasses.push(eff.picked === q.correct ? "blank-right" : "blank-wrong");
    }
    body = (
      <>
        <div className="ge-cloze-sentence">
          {before}
          <span className={blankClasses.join(" ")}>
            {eff.answered && eff.picked !== null ? q.opts[eff.picked] : "____"}
          </span>
          {after}
        </div>
        <div className="ge-opts">{singleChoice(q.opts, q.correct)}</div>
      </>
    );
  } else if (q.type === "match") {
    const meanings = q.pairs.map((p) => p[1]);
    body = (
      <div className="ge-match">
        {q.pairs.map((p, rowIdx) => {
          const rowAnswered = rowPick[rowIdx] !== undefined;
          const correctMeaning = p[1];
          return (
            <div className="ge-match-row" key={rowIdx}>
              <div className="ge-match-term">{p[0]}</div>
              <div className="ge-match-opts">
                {meanings.map((m, mi) => {
                  const classes = ["ge-opt", "ge-match-opt"];
                  if (rowAnswered) {
                    if (m === correctMeaning) classes.push("ge-opt-right");
                    if (mi === rowPick[rowIdx]) {
                      classes.push("ge-opt-picked");
                      classes.push(m === correctMeaning ? "ge-opt-right" : "ge-opt-wrong");
                    }
                  }
                  return (
                    <button
                      key={mi}
                      className={classes.join(" ")}
                      disabled={!interactive}
                      onClick={() => {
                        if (rowAnswered || !interactive) return;
                        setRowPick((prev) => ({ ...prev, [rowIdx]: mi }));
                        onAnswer?.({
                          questionType: "match",
                          choice: m,
                          correct: m === correctMeaning,
                        });
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  } else if (q.type === "sequence") {
    body = (
      <div className="ge-seq">
        {q.items.map((it, i) => (
          <div className="ge-seq-item" key={i}>
            <span className="ge-seq-grip">⋮⋮</span>
            <span className="ge-seq-num">{i + 1}</span>
            <span>{it}</span>
          </div>
        ))}
      </div>
    );
  } else if (q.type === "tap") {
    body = (
      <div className="ge-tap-instr">
        👆 Tap <b>{q.target}</b> in the passage on the left
      </div>
    );
  } else if (q.type === "short") {
    body = (
      <div className="ge-short">
        <div className="ge-short-stem">✏️ {q.stem}</div>
        <div className="ws-editor">
          Write your answer here…<span className="ws-caret">|</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`ge-q ge-q-${q.type}`}>
      <div className="ge-q-text">{q.q}</div>
      {instr ? <div className="ge-q-instr">{instr}</div> : null}
      {body}
      {hint}
    </div>
  );
}
