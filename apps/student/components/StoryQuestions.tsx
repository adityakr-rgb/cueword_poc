"use client";
// Interactive comprehension questions for the Story experience — renders all 8
// question types with answer-checking, correct/incorrect feedback, an
// explanation, and a running score. Each card is self-contained; the parent
// only tracks per-question results to show the summary. Scoped under .cw-story.
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
      <span className="sq-verdict-tag">{ok ? "✓ Correct" : "✗ Not quite"}</span>
      {explain && <span className="sq-explain">{explain}</span>}
    </div>
  );
}
function CardActions({
  checked,
  canCheck,
  onCheck,
  onReset,
}: {
  checked: boolean;
  canCheck: boolean;
  onCheck: () => void;
  onReset: () => void;
}) {
  return (
    <div className="sq-actions">
      {!checked ? (
        <button className="sq-check" disabled={!canCheck} onClick={onCheck}>
          Check answer
        </button>
      ) : (
        <button className="sq-retry" onClick={onReset}>
          ↺ Try again
        </button>
      )}
    </div>
  );
}

type CardProps<Q> = { q: Q; onResult: (ok: boolean) => void };

/* ---------- MCQ ---------- */
function McqCard({ q, onResult }: CardProps<McqQuestion>) {
  const [pick, setPick] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const ok = pick === q.correct;
  return (
    <>
      <div className="sq-opts">
        {q.options.map((o, i) => {
          let cls = "sq-opt";
          if (checked) {
            if (i === q.correct) cls += " is-correct";
            else if (i === pick) cls += " is-wrong";
          } else if (i === pick) cls += " is-selected";
          return (
            <button key={i} className={cls} disabled={checked} onClick={() => setPick(i)}>
              {o}
            </button>
          );
        })}
      </div>
      <CardActions
        checked={checked}
        canCheck={pick !== null}
        onCheck={() => {
          setChecked(true);
          onResult(ok);
        }}
        onReset={() => {
          setChecked(false);
          setPick(null);
        }}
      />
      {checked && <Verdict ok={ok} explain={q.explain} />}
    </>
  );
}

/* ---------- TAP (inline word chips) ---------- */
function TapCard({ q, onResult }: CardProps<TapQuestion>) {
  const [pick, setPick] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const ok = pick === q.correct;
  return (
    <>
      <div className="sq-tap">
        {q.words.map((w, i) => {
          let cls = "sq-tap-word";
          if (checked) {
            if (i === q.correct) cls += " is-correct";
            else if (i === pick) cls += " is-wrong";
          } else if (i === pick) cls += " is-selected";
          return (
            <button key={i} className={cls} disabled={checked} onClick={() => setPick(i)}>
              {w}
            </button>
          );
        })}
      </div>
      <CardActions
        checked={checked}
        canCheck={pick !== null}
        onCheck={() => {
          setChecked(true);
          onResult(ok);
        }}
        onReset={() => {
          setChecked(false);
          setPick(null);
        }}
      />
      {checked && <Verdict ok={ok} explain={q.explain} />}
    </>
  );
}

/* ---------- TRUE / FALSE ---------- */
function TrueFalseCard({ q, onResult }: CardProps<TrueFalseQuestion>) {
  const [pick, setPick] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);
  const ok = pick === q.answer;
  const opt = (val: boolean, label: string) => {
    let cls = "sq-opt sq-tf";
    if (checked) {
      if (val === q.answer) cls += " is-correct";
      else if (val === pick) cls += " is-wrong";
    } else if (val === pick) cls += " is-selected";
    return (
      <button className={cls} disabled={checked} onClick={() => setPick(val)}>
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
      <CardActions
        checked={checked}
        canCheck={pick !== null}
        onCheck={() => {
          setChecked(true);
          onResult(ok);
        }}
        onReset={() => {
          setChecked(false);
          setPick(null);
        }}
      />
      {checked && <Verdict ok={ok} explain={q.explain} />}
    </>
  );
}

/* ---------- MULTI (select all) ---------- */
function MultiCard({ q, onResult }: CardProps<MultiQuestion>) {
  const [picks, setPicks] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const ok = sameSet(picks, q.correct);
  const toggle = (i: number) => setPicks((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
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
      <CardActions
        checked={checked}
        canCheck={picks.length > 0}
        onCheck={() => {
          setChecked(true);
          onResult(ok);
        }}
        onReset={() => {
          setChecked(false);
          setPicks([]);
        }}
      />
      {checked && <Verdict ok={ok} explain={q.explain} />}
    </>
  );
}

/* ---------- CLOZE (fill the blank) ---------- */
function ClozeCard({ q, onResult }: CardProps<ClozeQuestion>) {
  const [pick, setPick] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const ok = pick === q.correct;
  const [before, after] = useMemo(() => {
    const idx = q.text.indexOf("___");
    return idx >= 0 ? [q.text.slice(0, idx), q.text.slice(idx + 3)] : [q.text + " ", ""];
  }, [q.text]);
  const blankText = pick !== null ? q.options[pick] : "______";
  return (
    <>
      <p className="sq-cloze-text">
        {before}
        <span className={"sq-blank" + (checked ? (ok ? " is-correct" : " is-wrong") : pick !== null ? " is-filled" : "")}>{blankText}</span>
        {after}
      </p>
      <div className="sq-opts sq-opts-inline">
        {q.options.map((o, i) => {
          let cls = "sq-opt sq-chip";
          if (checked) {
            if (i === q.correct) cls += " is-correct";
            else if (i === pick) cls += " is-wrong";
          } else if (i === pick) cls += " is-selected";
          return (
            <button key={i} className={cls} disabled={checked} onClick={() => setPick(i)}>
              {o}
            </button>
          );
        })}
      </div>
      <CardActions
        checked={checked}
        canCheck={pick !== null}
        onCheck={() => {
          setChecked(true);
          onResult(ok);
        }}
        onReset={() => {
          setChecked(false);
          setPick(null);
        }}
      />
      {checked && <Verdict ok={ok} explain={q.explain} />}
    </>
  );
}

/* ---------- SEQUENCE (reorder) ---------- */
function SequenceCard({ q, onResult }: CardProps<SequenceQuestion>) {
  const [order, setOrder] = useState<number[]>(() => shuffledOrder(q.items.length));
  const [checked, setChecked] = useState(false);
  const ok = order.every((v, i) => v === i);
  const move = (pos: number, dir: -1 | 1) => {
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
      <CardActions
        checked={checked}
        canCheck={true}
        onCheck={() => {
          setChecked(true);
          onResult(ok);
        }}
        onReset={() => {
          setChecked(false);
          setOrder(shuffledOrder(q.items.length));
        }}
      />
      {checked && <Verdict ok={ok} explain={q.explain} />}
    </>
  );
}

/* ---------- MATCH (pair left to right) ---------- */
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
      <CardActions
        checked={checked}
        canCheck={allChosen}
        onCheck={() => {
          setChecked(true);
          onResult(ok);
        }}
        onReset={() => {
          setChecked(false);
          setAssign(q.pairs.map(() => ""));
        }}
      />
      {checked && <Verdict ok={ok} explain={q.explain} />}
    </>
  );
}

/* ---------- SHORT (open response) ---------- */
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
  const ok = autoGraded ? hits.length >= 1 : selfOk === true;

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
        <CardActions
          checked={false}
          canCheck={text.trim().length > 0}
          onCheck={() => {
            setChecked(true);
            if (autoGraded) onResult(hits.length >= 1);
          }}
          onReset={() => {}}
        />
      ) : (
        <div className="sq-short-review">
          {autoGraded ? (
            <Verdict
              ok={ok}
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
            <Verdict ok={ok} explain={q.explain} />
          )}
          <div className="sq-sample">
            <span className="sq-sample-label">Sample answer</span>
            <p>{q.sample}</p>
          </div>
          <button
            className="sq-retry"
            onClick={() => {
              setChecked(false);
              setSelfOk(null);
              setText("");
            }}
          >
            ↺ Try again
          </button>
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

function QuestionCard({ q, n, onResult }: { q: StoryQuestion; n: number; onResult: (ok: boolean) => void }) {
  return (
    <div className="sq-card">
      <div className="sq-card-head">
        <span className="sq-num">Q{n}</span>
        <span className="sq-type">{TYPE_LABEL[q.type]}</span>
      </div>
      <div className="sq-prompt">{q.prompt}</div>
      {q.hint && <div className="sq-hint">💡 {q.hint}</div>}
      <QuestionBody q={q} onResult={onResult} />
    </div>
  );
}

export default function StoryQuestions({ questions, title = "Comprehension check" }: { questions: StoryQuestion[]; title?: string }) {
  const [results, setResults] = useState<Record<string, boolean>>({});
  const setResult = useCallback((id: string, ok: boolean) => setResults((r) => ({ ...r, [id]: ok })), []);

  if (!questions || questions.length === 0) return null;

  const answered = Object.keys(results).length;
  const correct = Object.values(results).filter(Boolean).length;
  const allDone = answered >= questions.length;

  return (
    <div className="sq-list">
      <div className="sq-head">
        <div className="sq-head-title">
          {title} <span className="sq-count">{questions.length} questions</span>
        </div>
        <div className="sq-progress">
          {answered}/{questions.length} answered{answered ? ` · ${correct} correct` : ""}
        </div>
      </div>
      {questions.map((q, i) => (
        <QuestionCard key={q.id} q={q} n={i + 1} onResult={(ok) => setResult(q.id, ok)} />
      ))}
      {allDone && (
        <div className={"sq-summary " + (correct === questions.length ? "perfect" : "")}>
          <span className="sq-summary-score">
            {correct} / {questions.length}
          </span>
          <span className="sq-summary-label">
            {correct === questions.length ? "Perfect — every answer correct! 🎉" : correct >= questions.length / 2 ? "Nice work! Review the ones you missed." : "Good effort — try the tricky ones again."}
          </span>
        </div>
      )}
    </div>
  );
}
