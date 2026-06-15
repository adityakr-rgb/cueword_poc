"use client";
import { useState } from "react";
import type { Story } from "../lib/types";

/**
 * Tap a word, then its meaning. Ported from class-experience.js buildGame()/
 * wireGame(). The meanings column is rotated by one (deterministic) instead of
 * Math.random-shuffled — avoids SSR/hydration mismatch, still misaligned.
 */
export default function VocabGame({ story }: { story: Story }) {
  const vocab = story.read.vocab;
  const total = vocab.length;
  const words = vocab.map((v) => ({ id: `w:${v.word}`, word: v.word, label: v.word }));
  const rotated = total > 1 ? [...vocab.slice(1), vocab[0]] : vocab;
  const means = rotated.map((v) => ({
    id: `m:${v.word}`,
    word: v.word,
    label: v.def.split("(")[0].trim(),
  }));

  const [sel, setSel] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string[]>([]);

  function click(id: string, word: string) {
    if (matched.has(word)) return;
    if (!sel) {
      setSel(id);
      return;
    }
    if (sel === id) {
      setSel(null);
      return;
    }
    const selWord = sel.slice(2);
    if (sel[0] === id[0]) {
      setSel(id); // same column → move selection
      return;
    }
    if (selWord === word) {
      setMatched((prev) => new Set(prev).add(word));
      setSel(null);
    } else {
      const pair = [sel, id];
      setWrong(pair);
      setSel(null);
      setTimeout(() => setWrong([]), 550);
    }
  }

  function tileCls(base: string, t: { id: string; word: string }) {
    const c = ["vg-tile", base];
    if (matched.has(t.word)) c.push("vg-matched");
    if (sel === t.id) c.push("vg-sel");
    if (wrong.includes(t.id)) c.push("vg-wrong");
    return c.join(" ");
  }

  const done = matched.size === total;

  return (
    <div className="vg">
      <div className="vg-head">🎮 Match each word to its meaning</div>
      <div className="vg-score">
        Matched <span className="vg-count">{matched.size}</span> of {total}
      </div>
      <div className="vg-board">
        <div className="vg-col">
          {words.map((t) => (
            <button
              key={t.id}
              className={tileCls("vg-word", t)}
              onClick={() => click(t.id, t.word)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="vg-col">
          {means.map((t) => (
            <button
              key={t.id}
              className={tileCls("vg-mean", t)}
              onClick={() => click(t.id, t.word)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {done && <div className="vg-done">🎉 You matched them all — great work!</div>}
    </div>
  );
}
