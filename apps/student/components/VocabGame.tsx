"use client";
// Word Play (module 15) — a vocab game step that sits AFTER the Read section of
// a story. Built automatically from the story's highlighted vocab words
// (word + def). Two modes: an auto-generated Crossword (definitions as clues)
// and a tap-to-pair Word Match. Self-contained → exported as VocabGame.
import { useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { Story } from "@/data/storyLib";

interface VWord {
  word: string;
  def: string;
}

const clean = (w: string) => w.toUpperCase().replace(/[^A-Z]/g, "");
const shuffle = <T,>(arr: T[]): T[] => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

interface PlacedWord {
  display: string;
  answer: string;
  clue: string;
  r: number;
  c: number;
  dir: "A" | "D";
  num?: number;
}

const keysOf = (p: PlacedWord): string[] => {
  const arr: string[] = [];
  for (let i = 0; i < p.answer.length; i++) {
    const r = p.dir === "A" ? p.r : p.r + i;
    const c = p.dir === "A" ? p.c + i : p.c;
    arr.push(r + "," + c);
  }
  return arr;
};

interface CrosswordData {
  cells: Record<string, string>;
  placed: PlacedWord[];
  rows: number;
  cols: number;
}

// ---- crossword layout generator (greedy intersect, normalize, number) ----
function buildCrossword(words: VWord[]): CrosswordData {
  const items = words
    .map((w) => ({ display: w.word, answer: clean(w.word), clue: w.def }))
    .filter((it) => it.answer.length > 1)
    .sort((a, b) => b.answer.length - a.answer.length);

  const cells: Record<string, string> = {};
  const placed: PlacedWord[] = [];

  const fits = (answer: string, r: number, c: number, dir: "A" | "D") => {
    for (let i = 0; i < answer.length; i++) {
      const rr = dir === "A" ? r : r + i;
      const cc = dir === "A" ? c + i : c;
      const ex = cells[rr + "," + cc];
      if (ex && ex !== answer[i]) return false;
    }
    return true;
  };
  const put = (it: { display: string; answer: string; clue: string }, r: number, c: number, dir: "A" | "D") => {
    for (let i = 0; i < it.answer.length; i++) {
      const rr = dir === "A" ? r : r + i;
      const cc = dir === "A" ? c + i : c;
      cells[rr + "," + cc] = it.answer[i];
    }
    placed.push({ ...it, r, c, dir });
  };

  if (!items.length) return { cells: {}, placed: [], rows: 0, cols: 0 };
  put(items[0], 0, 0, "A");

  for (let n = 1; n < items.length; n++) {
    const it = items[n];
    let done = false;
    for (const p of placed) {
      if (done) break;
      const dir: "A" | "D" = p.dir === "A" ? "D" : "A";
      for (let pi = 0; pi < p.answer.length && !done; pi++) {
        for (let ii = 0; ii < it.answer.length && !done; ii++) {
          if (p.answer[pi] !== it.answer[ii]) continue;
          const pr = p.dir === "A" ? p.r : p.r + pi;
          const pc = p.dir === "A" ? p.c + pi : p.c;
          const r = dir === "D" ? pr - ii : pr;
          const c = dir === "D" ? pc : pc - ii;
          if (fits(it.answer, r, c, dir)) {
            put(it, r, c, dir);
            done = true;
          }
        }
      }
    }
    if (!done) {
      const rs = Object.keys(cells).map((k) => +k.split(",")[0]);
      put(it, Math.max(...rs) + 2, 0, "A");
    }
  }

  // normalize to (0,0)
  const rrAll = Object.keys(cells).map((k) => +k.split(",")[0]);
  const ccAll = Object.keys(cells).map((k) => +k.split(",")[1]);
  const minR = Math.min(...rrAll);
  const minC = Math.min(...ccAll);
  const ncells: Record<string, string> = {};
  Object.keys(cells).forEach((k) => {
    const [r, c] = k.split(",").map(Number);
    ncells[r - minR + "," + (c - minC)] = cells[k];
  });
  const npl = placed.map((p) => ({ ...p, r: p.r - minR, c: p.c - minC }));
  const rows = Math.max(...rrAll) - minR + 1;
  const cols = Math.max(...ccAll) - minC + 1;

  // numbering by start-cell reading order
  const startKeys = Array.from(new Set(npl.map((p) => p.r + "," + p.c))).sort((a, b) => {
    const [ar, ac] = a.split(",").map(Number);
    const [br, bc] = b.split(",").map(Number);
    return ar - br || ac - bc;
  });
  const num: Record<string, number> = {};
  startKeys.forEach((k, i) => (num[k] = i + 1));
  npl.forEach((p) => (p.num = num[p.r + "," + p.c]));

  return { cells: ncells, placed: npl, rows, cols };
}

function Crossword({ words }: { words: VWord[] }) {
  const data = useMemo(() => buildCrossword(words), [words]);
  const { cells, placed, rows, cols } = data;
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [active, setActive] = useState(0);
  const refs = useRef<Record<string, HTMLInputElement | null>>({});

  const cellWords = useMemo(() => {
    const m: Record<string, number[]> = {};
    placed.forEach((p, wi) => keysOf(p).forEach((k) => (m[k] = m[k] || []).push(wi)));
    return m;
  }, [placed]);

  const fillable = useMemo(() => Object.keys(cells), [cells]);
  const solved = fillable.length > 0 && fillable.every((k) => (entries[k] || "") === cells[k]);

  const activeKeys = placed[active] ? keysOf(placed[active]) : [];
  const focusKey = (k: string) => {
    const el = refs.current[k];
    if (el) el.focus();
  };

  const selectCell = (k: string) => {
    const ws = cellWords[k] || [];
    if (!ws.length) return;
    if (ws.length > 1 && ws.includes(active)) {
      setActive(ws.find((w) => w !== active)!);
    } else if (!ws.includes(active)) {
      setActive(ws[0]);
    }
    focusKey(k);
  };

  const type = (k: string, val: string) => {
    const ch = (val || "").toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
    setEntries((e) => ({ ...e, [k]: ch }));
    if (checked) setChecked(false);
    if (ch) {
      const ks = activeKeys.length ? activeKeys : keysOf(placed[(cellWords[k] || [0])[0]]);
      const i = ks.indexOf(k);
      if (i > -1 && i < ks.length - 1) focusKey(ks[i + 1]);
    }
  };

  const keydown = (k: string, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !entries[k]) {
      const ks = activeKeys;
      const i = ks.indexOf(k);
      if (i > 0) {
        focusKey(ks[i - 1]);
        setEntries((en) => ({ ...en, [ks[i - 1]]: "" }));
      }
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      const ks = activeKeys;
      const i = ks.indexOf(k);
      if (i > -1 && i < ks.length - 1) {
        e.preventDefault();
        focusKey(ks[i + 1]);
      }
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      const ks = activeKeys;
      const i = ks.indexOf(k);
      if (i > 0) {
        e.preventDefault();
        focusKey(ks[i - 1]);
      }
    }
  };

  const revealWord = () => {
    const ks = activeKeys;
    setEntries((e) => {
      const n = { ...e };
      ks.forEach((k) => (n[k] = cells[k]));
      return n;
    });
    setChecked(false);
  };

  const across = placed.filter((p) => p.dir === "A").sort((a, b) => a.num! - b.num!);
  const down = placed.filter((p) => p.dir === "D").sort((a, b) => a.num! - b.num!);

  const startNum: Record<string, number> = {};
  placed.forEach((p) => (startNum[p.r + "," + p.c] = p.num!));

  return (
    <div className="vg-crossword">
      <div className="vg-grid-wrap">
        <div
          className="vg-grid"
          style={{ gridTemplateColumns: `repeat(${cols}, var(--vg-cell))`, gridTemplateRows: `repeat(${rows}, var(--vg-cell))` }}
        >
          {Array.from({ length: rows * cols }).map((_, idx) => {
            const r = Math.floor(idx / cols);
            const c = idx % cols;
            const k = r + "," + c;
            if (!cells[k]) return <div key={k} className="vg-cell vg-cell-void" />;
            const val = entries[k] || "";
            const onWord = activeKeys.includes(k);
            let cls = "vg-cell vg-cell-fill" + (onWord ? " vg-cell-active" : "");
            if (checked && val) cls += val === cells[k] ? " vg-cell-right" : " vg-cell-wrong";
            return (
              <div key={k} className={cls} onClick={() => selectCell(k)}>
                {startNum[k] != null && <span className="vg-cell-num">{startNum[k]}</span>}
                <input
                  ref={(el) => {
                    refs.current[k] = el;
                  }}
                  className="vg-cell-input"
                  value={val}
                  maxLength={1}
                  inputMode="text"
                  aria-label={`cell ${r + 1},${c + 1}`}
                  onChange={(e) => type(k, e.target.value)}
                  onKeyDown={(e) => keydown(k, e)}
                  onFocus={() => {
                    const ws = cellWords[k] || [];
                    if (ws.length && !ws.includes(active)) setActive(ws[0]);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="vg-clues">
        <div className="vg-clue-actions">
          <button className="vg-btn" onClick={() => setChecked(true)}>
            Check
          </button>
          <button className="vg-btn vg-btn-ghost" onClick={revealWord}>
            Reveal word
          </button>
        </div>
        {(
          [
            ["Across", across],
            ["Down", down],
          ] as [string, PlacedWord[]][]
        ).map(([label, list]) =>
          list.length ? (
            <div key={label} className="vg-clue-group">
              <div className="vg-clue-head">{label}</div>
              {list.map((p) => {
                const wi = placed.indexOf(p);
                return (
                  <button
                    key={p.num}
                    className={"vg-clue" + (wi === active ? " is-active" : "")}
                    onClick={() => {
                      setActive(wi);
                      focusKey(p.r + "," + p.c);
                    }}
                  >
                    <span className="vg-clue-num">{p.num}</span>
                    <span className="vg-clue-text">
                      {p.clue} <em>({p.answer.length})</em>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null,
        )}
        {solved && <div className="vg-win">🎉 Crossword solved — every word in place!</div>}
      </div>
    </div>
  );
}

function WordMatch({ words }: { words: VWord[] }) {
  const left = words;
  const defs = useMemo(() => shuffle(words.map((w, i) => ({ def: w.def, idx: i }))), [words]);
  const [sel, setSel] = useState<number | null>(null);
  const [matched, setMatched] = useState<Record<number, boolean>>({});
  const [wrong, setWrong] = useState<{ w: number; d: number } | null>(null);

  const pickWord = (i: number) => {
    if (!matched[i]) setSel(i);
  };
  const pickDef = (d: { def: string; idx: number }) => {
    if (matched[d.idx] || sel == null) return;
    if (sel === d.idx) {
      setMatched((m) => ({ ...m, [d.idx]: true }));
      setSel(null);
    } else {
      setWrong({ w: sel, d: d.idx });
      setSel(null);
      setTimeout(() => setWrong(null), 550);
    }
  };
  const allDone = Object.keys(matched).length === left.length;

  return (
    <div className="vg-match">
      <div className="vg-match-hint">Tap a word, then tap its meaning.</div>
      <div className="vg-match-cols">
        <div className="vg-match-col">
          {left.map((w, i) => (
            <button
              key={i}
              className={"vg-word" + (sel === i ? " is-sel" : "") + (matched[i] ? " is-matched" : "") + (wrong && wrong.w === i ? " is-wrong" : "")}
              onClick={() => pickWord(i)}
              disabled={matched[i]}
            >
              {w.word}
              {matched[i] && <span className="vg-tick">✓</span>}
            </button>
          ))}
        </div>
        <div className="vg-match-col">
          {defs.map((d) => (
            <button
              key={d.idx}
              className={"vg-def" + (matched[d.idx] ? " is-matched" : "") + (wrong && wrong.d === d.idx ? " is-wrong" : "")}
              onClick={() => pickDef(d)}
              disabled={matched[d.idx]}
            >
              {d.def}
            </button>
          ))}
        </div>
      </div>
      {allDone && <div className="vg-win">🎉 All matched — these words are yours now!</div>}
    </div>
  );
}

export default function VocabGame({ story }: { story: Story }) {
  const words = useMemo<VWord[]>(
    () => story.read.passage.filter((s) => s.vocab).map((s) => ({ word: s.vocab as string, def: s.def as string })),
    [story],
  );
  const [mode, setMode] = useState<"crossword" | "match">("crossword");

  return (
    <div className="story-player-body vocab-game">
      <div className="vg-head">
        <div>
          <div className="vg-eyebrow">Word Play</div>
          <h3 className="vg-title">Lock in your {words.length} new words</h3>
        </div>
        <div className="vg-modes" role="tablist">
          <button className={"vg-mode" + (mode === "crossword" ? " is-on" : "")} onClick={() => setMode("crossword")}>
            Crossword
          </button>
          <button className={"vg-mode" + (mode === "match" ? " is-on" : "")} onClick={() => setMode("match")}>
            Word Match
          </button>
        </div>
      </div>
      {mode === "crossword" ? <Crossword key="cw" words={words} /> : <WordMatch key="wm" words={words} />}
    </div>
  );
}
