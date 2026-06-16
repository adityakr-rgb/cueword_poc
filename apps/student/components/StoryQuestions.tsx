"use client";
// Interactive comprehension for the Story experience — ONE question at a time
// (flip with Previous / Next + a progress rail, no long scroll). Single-answer
// types auto-reveal on tap; multi-step types use a Check button. Calls
// onComplete once every question has been answered, so the player can gate the
// "continue" button. Scoped under .cw-story.
import { useCallback, useMemo, useState } from "react";
import type {
  StoryQuestion,
  McqQuestion,
  MultiQuestion,
  TrueFalseQuestion,
  ClozeQuestion,
  SequenceQuestion,
  MatchQuestion,
  ShortQuestion,
  TapQuestion,
} from "@/data/storyLib";

const TYPE_LABEL: Record<StoryQuestion["type"], string> = {
  mcq: "Multiple choice",
  multi: "Select all that apply",
  truefalse: "True or false",
  cloze: "Fill in the blank",
  sequence: "Put in order",
  match: "Match the pairs",
  short: "Write your answer",
  tap: "Tap the word",
};

/* ---------- helpers ---------- */
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function shuffledOrder(n: number): number[] {
  let order = Array.from({ length: n }, (_, i) => i);
  if (n < 2) return order;
  let guard = 0;
  do {
    order = shuffle(order);
    guard += 1;
  } while (order.every((v, i) => v === i) && guard < 20);
  return order;
}
function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

/* ---------- shared bits ---------- */
function Verdict({ ok, explain }: { ok: boolean; explain?: string }) {
  return (
    <div className={"sq-verdict " + (ok ? "ok" : "no")}>
      <span className="sq-verdict-tag">{ok ? "✓ Nice — that's right." : "✗ Not quite."}</span>
      {explain && <span className="sq-explain">{explain}</span>}
    </div>
  );
}
function CheckButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <div className="sq-actions">
      <button className="sq-check" disabled={disabled} onClick={onClick}>
        Check answer
      </button>
    </div>
  );
}

type CardProps<Q> = { q: Q; onResult: (ok: boolean) => void };

/* ---------- single-answer types: auto-reveal on tap ---------- */
function McqCard({ q, onResult }: CardProps<McqQuestion>) {
  const [pick, setPick] = useState<number | null>(null);
  const checked = pick !== null;
  const choose = (i: number) => {
    if (pick !== null) return;
    setPick(i);
    onResult(i === q.correct);
  };
  return (
    <>
      <div className="sq-opts">
        {q.options.map((o, i) => {
          let cls = "sq-opt";
          if (checked) {
            if (i === q.correct) cls += " is-correct";
            else if (i === pick) cls += " is-wrong";
          }
          return (
            <button key={i} className={cls} disabled={checked} onClick={() => choose(i)}>
              {o}
            </button>
          );
        })}
      </div>
      {checked && <Verdict ok={pick === q.correct} explain={q.explain} />}
    </>
  );
}

function TapCard({ q, onResult }: CardProps<TapQuestion>) {
  const [pick, setPick] = useState<number | null>(null);
  const checked = pick !== null;
  const choose = (i: number) => {
    if (pick !== null) return;
    setPick(i);
    onResult(i === q.correct);
  };
  return (
    <>
      <div className="sq-tap">
        {q.words.map((w, i) => {
          let cls = "sq-tap-word";
          if (checked) {
            if (i === q.correct) cls += " is-correct";
            else if (i === pick) cls += " is-wrong";
          }
          return (
            <button key={i} className={cls} disabled={checked} onClick={() => choose(i)}>
              {w}
            </button>
          );
        })}
      </div>
      {checked && <Verdict ok={pick === q.correct} explain={q.explain} />}
    </>
  );
}

function TrueFalseCard({ q, onResult }: CardProps<TrueFalseQuestion>) {
  const [pick, setPick] = useState<boolean | null>(null);
  const checked = pick !== null;
  const choose = (val: boolean) => {
    if (pick !== null) return;
    setPick(val);
    onResult(val === q.answer);
  };
  const opt = (val: boolean, label: string) => {
    let cls = "sq-opt sq-tf";
    if (checked) {
      if (val === q.answer) cls += " is-correct";
      else if (val === pick) cls += " is-wrong";
    }
    return (
      <button className={cls} disabled={checked} onClick={() => choose(val)}>
        {label}
      </button>
    );
  };
  return (
    <>
      <div className="sq-opts sq-tf-row">
        {opt(true, "True")}
        {opt(false, "False")}
      </div>
      {checked && <Verdict ok={pick === q.answer} explain={q.explain} />}
    </>
  );
}

function ClozeCard({ q, onResult }: CardProps<ClozeQuestion>) {
  const [pick, setPick] = useState<number | null>(null);
  const checked = pick !== null;
  const [before, after] = useMemo(() => {
    const idx = q.text.indexOf("___");
    return idx >= 0 ? [q.text.slice(0, idx), q.text.slice(idx + 3)] : [q.text + " ", ""];
  }, [q.text]);
  const choose = (i: number) => {
    if (pick !== null) return;
    setPick(i);
    onResult(i === q.correct);
  };
  const blankText = pick !== null ? q.options[pick] : "______";
  return (
    <>
      <p className="sq-cloze-text">
        {before}
        <span className={"sq-blank" + (checked ? (pick === q.correct ? " is-correct" : " is-wrong") : "")}>{blankText}</span>
        {after}
      </p>
      <div className="sq-opts sq-opts-inline">
        {q.options.map((o, i) => {
          let cls = "sq-opt sq-chip";
          if (checked) {
            if (i === q.correct) cls += " is-correct";
            else if (i === pick) cls += " is-wrong";
          }
          return (
            <button key={i} className={cls} disabled={checked} onClick={() => choose(i)}>
              {o}
            </button>
          );
        })}
      </div>
      {checked && <Verdict ok={pick === q.correct} explain={q.explain} />}
    </>
  );
}

/* ---------- multi-step types: Check button ---------- */
function MultiCard({ q, onResult }: CardProps<MultiQuestion>) {
  const [picks, setPicks] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const ok = sameSet(picks, q.correct);
  const toggle = (i: number) => {
    if (checked) return;
    setPicks((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  };
  return (
    <>
      <div className="sq-opts">
        {q.options.map((o, i) => {
          const isCorrect = q.correct.includes(i);
          const isPicked = picks.includes(i);
          let cls = "sq-opt sq-multi";
          if (checked) {
            if (isCorrect) cls += " is-correct";
            else if (isPicked) cls += " is-wrong";
          } else if (isPicked) cls += " is-selected";
          return (
            <button key={i} className={cls} disabled={checked} onClick={() => toggle(i)}>
              <span className="sq-box">{isPicked ? "✓" : ""}</span>
              {o}
            </button>
          );
        })}
      </div>
      {!checked ? (
        <CheckButton
          disabled={picks.length === 0}
          onClick={() => {
            setChecked(true);
            onResult(ok);
          }}
        />
      ) : (
        <Verdict ok={ok} explain={q.explain} />
      )}
    </>
  );
}

function SequenceCard({ q, onResult }: CardProps<SequenceQuestion>) {
  const [order, setOrder] = useState<number[]>(() => shuffledOrder(q.items.length));
  const [checked, setChecked] = useState(false);
  const ok = order.every((v, i) => v === i);
  const move = (pos: number, dir: -1 | 1) => {
    if (checked) return;
    const target = pos + dir;
    if (target < 0 || target >= order.length) return;
    setOrder((o) => {
      const n = o.slice();
      [n[pos], n[target]] = [n[target], n[pos]];
      return n;
    });
  };
  return (
    <>
      <ol className="sq-seq">
        {order.map((itemIdx, pos) => {
          let cls = "sq-seq-item";
          if (checked) cls += itemIdx === pos ? " is-correct" : " is-wrong";
          return (
            <li key={itemIdx} className={cls}>
              <span className="sq-seq-num">{pos + 1}</span>
              <span className="sq-seq-text">{q.items[itemIdx]}</span>
              {!checked && (
                <span className="sq-seq-ctrls">
                  <button className="sq-seq-btn" disabled={pos === 0} onClick={() => move(pos, -1)} aria-label="Move up">
                    ↑
                  </button>
                  <button className="sq-seq-btn" disabled={pos === order.length - 1} onClick={() => move(pos, 1)} aria-label="Move down">
                    ↓
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {!checked ? (
        <CheckButton
          disabled={false}
          onClick={() => {
            setChecked(true);
            onResult(ok);
          }}
        />
      ) : (
        <Verdict ok={ok} explain={q.explain} />
      )}
    </>
  );
}

function MatchCard({ q, onResult }: CardProps<MatchQuestion>) {
  const rights = useMemo(() => shuffle(q.pairs.map((p) => p[1])), [q.pairs]);
  const [assign, setAssign] = useState<(string | "")[]>(() => q.pairs.map(() => ""));
  const [checked, setChecked] = useState(false);
  const allChosen = assign.every((a) => a !== "");
  const ok = q.pairs.every((p, i) => assign[i] === p[1]);
  return (
    <>
      <div className="sq-match">
        {q.pairs.map((p, i) => {
          const rowOk = assign[i] === p[1];
          return (
            <div key={i} className={"sq-match-row" + (checked ? (rowOk ? " is-correct" : " is-wrong") : "")}>
              <span className="sq-match-left">{p[0]}</span>
              <span className="sq-match-arrow">→</span>
              <select
                className="sq-match-select"
                disabled={checked}
                value={assign[i]}
                onChange={(e) => setAssign((a) => a.map((v, j) => (j === i ? e.target.value : v)))}
              >
                <option value="">Choose…</option>
                {rights.map((r, ri) => (
                  <option key={ri} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {checked && !rowOk && <span className="sq-match-fix">→ {p[1]}</span>}
            </div>
          );
        })}
      </div>
      {!checked ? (
        <CheckButton
          disabled={!allChosen}
          onClick={() => {
            setChecked(true);
            onResult(ok);
          }}
        />
      ) : (
        <Verdict ok={ok} explain={q.explain} />
      )}
    </>
  );
}

function ShortCard({ q, onResult }: CardProps<ShortQuestion>) {
  const [text, setText] = useState("");
  const [checked, setChecked] = useState(false);
  const [selfOk, setSelfOk] = useState<boolean | null>(null);
  const hits = useMemo(() => {
    if (!q.keywords?.length) return [];
    const lc = text.toLowerCase();
    return q.keywords.filter((k) => lc.includes(k.toLowerCase()));
  }, [text, q.keywords]);
  const autoGraded = !!q.keywords?.length;

  return (
    <>
      <textarea
        className="sq-short-input"
        rows={3}
        placeholder="Type your answer…"
        value={text}
        disabled={checked}
        onChange={(e) => setText(e.target.value)}
      />
      {!checked ? (
        <CheckButton
          disabled={text.trim().length === 0}
          onClick={() => {
            setChecked(true);
            if (autoGraded) onResult(hits.length >= 1);
          }}
        />
      ) : (
        <div className="sq-short-review">
          {autoGraded ? (
            <Verdict
              ok={hits.length >= 1}
              explain={
                (hits.length ? `You used ${hits.length} key idea${hits.length > 1 ? "s" : ""}: ${hits.join(", ")}. ` : "Try to include a key idea from the story. ") +
                (q.explain ?? "")
              }
            />
          ) : selfOk === null ? (
            <div className="sq-selfgrade">
              <div className="sq-selfgrade-q">Compare with the sample below — did you capture the main idea?</div>
              <div className="sq-selfgrade-btns">
                <button
                  className="sq-self-yes"
                  onClick={() => {
                    setSelfOk(true);
                    onResult(true);
                  }}
                >
                  ✓ Yes, I got it
                </button>
                <button
                  className="sq-self-no"
                  onClick={() => {
                    setSelfOk(false);
                    onResult(false);
                  }}
                >
                  Not quite
                </button>
              </div>
            </div>
          ) : (
            <Verdict ok={selfOk === true} explain={q.explain} />
          )}
          <div className="sq-sample">
            <span className="sq-sample-label">Sample answer</span>
            <p>{q.sample}</p>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- dispatcher ---------- */
function QuestionBody({ q, onResult }: { q: StoryQuestion; onResult: (ok: boolean) => void }) {
  switch (q.type) {
    case "mcq":
      return <McqCard q={q} onResult={onResult} />;
    case "multi":
      return <MultiCard q={q} onResult={onResult} />;
    case "truefalse":
      return <TrueFalseCard q={q} onResult={onResult} />;
    case "cloze":
      return <ClozeCard q={q} onResult={onResult} />;
    case "sequence":
      return <SequenceCard q={q} onResult={onResult} />;
    case "match":
      return <MatchCard q={q} onResult={onResult} />;
    case "short":
      return <ShortCard q={q} onResult={onResult} />;
    case "tap":
      return <TapCard q={q} onResult={onResult} />;
    default:
      return null;
  }
}

export default function StoryQuestions({
  questions,
  onContinue,
  continueLabel,
}: {
  questions: StoryQuestion[];
  onContinue?: () => void;
  continueLabel?: string;
}) {
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [current, setCurrent] = useState(0);
  const setResult = useCallback((id: string, ok: boolean) => setResults((r) => ({ ...r, [id]: ok })), []);

  const total = questions.length;
  const answered = Object.keys(results).length;
  const correct = Object.values(results).filter(Boolean).length;

  if (!total) return null;

  const curId = questions[current].id;
  const curAnswered = results[curId] !== undefined;
  const isLast = current >= total - 1;
  const navHint = !curAnswered ? "Choose your answer" : isLast ? "That's the last question" : "On to the next one";

  return (
    <div className="sq-flip">
      <div className="sq-flip-head">
        <span className="sq-flip-title">Comprehension check</span>
        <span className="sq-flip-count">
          {answered} / {total} answered{answered ? ` · ${correct} correct` : ""}
        </span>
      </div>
      <div className="sq-rail">
        {questions.map((qq, i) => (
          <span key={qq.id} className={"sq-seg" + (i === current ? " current" : results[qq.id] !== undefined ? " done" : "")} />
        ))}
      </div>
      <div className="sq-step-label">
        Question {current + 1} of {total} <span className="sq-step-type">· {TYPE_LABEL[questions[current].type]}</span>
      </div>

      {/* All questions stay mounted (state preserved when flipping); only the
          current one is shown — so there's no long scroll. */}
      {questions.map((qq, i) => (
        <div key={qq.id} className="sq-q" style={{ display: i === current ? "block" : "none" }}>
          <div className="sq-prompt-box">{qq.prompt}</div>
          {qq.hint && <div className="sq-hint">💡 {qq.hint}</div>}
          <QuestionBody q={qq} onResult={(ok) => setResult(qq.id, ok)} />
        </div>
      ))}

      <div className="sq-nav">
        <button className="sq-nav-btn prev" disabled={current === 0} onClick={() => setCurrent((c) => Math.max(0, c - 1))}>
          ← Previous
        </button>
        <span className="sq-nav-hint">{navHint}</span>
        {isLast && onContinue ? (
          <button className="sq-nav-btn next" onClick={onContinue}>
            {continueLabel ?? "Continue →"}
          </button>
        ) : (
          <button className="sq-nav-btn next" disabled={isLast} onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}>
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
