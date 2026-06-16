"use client";
// Self-serve Story Experience (module 16) — the at-home, single-story reading
// flow: Listen → Read → Word Play → Speak → Write → Complete, with a progress
// stepper, scene, transcript, inline vocab, mock AI feedback and a finish
// screen. Static + self-contained (no Supabase); distinct from the live class.
// Opened from My Stories / Home resume. Scoped under .cw-story.
import { Fragment, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import SetupNotice from "@cueword/core/components/SetupNotice";
import { isSupabaseConfigured } from "@cueword/core/lib/supabase/client";
import { useCurrentUser } from "@cueword/core/lib/auth";
import VocabGame from "@/components/VocabGame";
import StoryQuestions from "@/components/StoryQuestions";
import { DATA } from "@/data/studentData";
import { STORY_LIB, type SceneKind, type SpeakFeedback, type Story } from "@/data/storyLib";

const STEPS = ["listen", "read", "vocab", "speak", "write", "complete"] as const;
const STEP_LABEL = ["Listen", "Read", "Word Play", "Speak", "Write"];

interface VocabPopup {
  word: string;
  def: string;
  example: string;
}

const SCENES: Record<SceneKind, { bg: string; stars?: boolean; orb?: boolean }> = {
  space: { bg: "linear-gradient(180deg,#0F1830,#1A2540 60%,#2F3B5C)", stars: true, orb: true },
  rome: { bg: "linear-gradient(165deg,#8B3A2A,#B5654A 55%,#D89A6A)" },
  nature: { bg: "linear-gradient(165deg,#1E4D32,#2D6B45 55%,#5FA873)" },
  time: { bg: "linear-gradient(165deg,#2A2348,#4A3B6B 55%,#7C6BA8)", stars: true },
  ocean: { bg: "linear-gradient(180deg,#062B3A,#0E4D63 58%,#1E7E9C)", orb: true },
  storm: { bg: "linear-gradient(170deg,#2B2140,#5B3E7A 55%,#8A6BB0)" },
};

function Scene({ story }: { story: Story }) {
  const sc = SCENES[story.sceneKind] || SCENES.space;
  return (
    <div className="listen-scene">
      <div className="scene-base" style={{ background: sc.bg }}>
        {sc.stars && <div className="scene-stars" />}
        {sc.orb && <div className="scene-orb" />}
        <span className="scene-emoji">{story.cover}</span>
        <div className="scene-caption">📷 {story.sceneCaption}</div>
      </div>
    </div>
  );
}

function Stepper({ idx }: { idx: number }) {
  return (
    <div className="story-player-progress">
      {STEP_LABEL.map((label, i) => {
        const cls = "spp-step" + (i < idx ? " done" : i === idx ? " active" : "");
        return (
          <Fragment key={label}>
            {i > 0 && <div className={"spp-line" + (i <= idx ? " done" : "")} />}
            <div className={cls}>
              <span>{i < idx ? "✓" : i + 1}</span>
              {label}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

function passageExample(story: Story, word: string): string {
  const segs = story.read.passage;
  const idx = segs.findIndex((s) => s.vocab === word);
  const before = idx > 0 ? segs[idx - 1].t || "" : "";
  const after = idx < segs.length - 1 ? segs[idx + 1].t || "" : "";
  const snippet = (before + word + after).trim().replace(/\s+/g, " ");
  return snippet.length > 8 ? "“…" + snippet.slice(0, 90).trim() + "…”" : "";
}

// ---- LISTEN ----
function Listen({ story }: { story: Story }) {
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  // Deterministic pseudo-random bar heights (cosmetic) — pure, so it satisfies
  // the react-hooks/purity rule while keeping the same lively waveform look.
  const bars = useMemo(() => Array.from({ length: 40 }, (_, i) => 0.25 + ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * 0.75), []);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setPlayed((p) => {
        const n = p + 1 / 60;
        if (n >= 1) {
          clearInterval(t);
          setPlaying(false);
          return 1;
        }
        return n;
      });
    }, 90);
    return () => clearInterval(t);
  }, [playing]);
  const revealed = Math.max(1, Math.ceil(played * story.listen.lines.length));

  return (
    <div className="story-player-body story-listen-body">
      <Scene story={story} />
      <div className={"listen-player" + (playing ? " playing" : "")}>
        <button
          className="listen-play"
          onClick={() => {
            if (played >= 1) setPlayed(0);
            setPlaying((p) => !p);
          }}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <div className="listen-player-body">
          <div className="listen-player-top">
            <div className="listen-player-title">Listen to the opening scene</div>
            <div className="listen-player-meta">{story.listen.meta}</div>
          </div>
          <div className="listen-waveform">
            {bars.map((h, i) => (
              <span key={i} className={"wave-bar" + (i / bars.length <= played ? " passed" : "")} style={{ height: `${h * 100}%` }} />
            ))}
          </div>
        </div>
      </div>
      <div className="listen-transcript">
        <div className="transcript-label">Transcript</div>
        {story.listen.lines.map((ln, i) => (
          <p key={i} className={"transcript-line" + (ln.quote ? " transcript-quote" : "") + (played > 0 && i >= revealed ? " dim" : "")}>
            {ln.text}
          </p>
        ))}
      </div>
    </div>
  );
}

// ---- READ ----
function Read({ story, onVocab }: { story: Story; onVocab: (v: VocabPopup) => void }) {
  return (
    <div className="story-player-body story-read-body">
      <div className="read-passage-label">{story.read.label}</div>
      <p className="read-text">
        {story.read.passage.map((seg, i) =>
          seg.vocab ? (
            <span key={i} className="vocab" onClick={() => onVocab({ word: seg.vocab!, def: seg.def!, example: passageExample(story, seg.vocab!) })}>
              {seg.vocab}
            </span>
          ) : (
            <Fragment key={i}>{seg.t}</Fragment>
          ),
        )}
      </p>
      <div className="read-vocab-bar">
        <div className="vocab-bar-label">
          <span>📝</span> {story.read.passage.filter((s) => s.vocab).length} new words highlighted — tap any word to learn it
        </div>
        <div className="vocab-bar-collected">
          {story.read.passage
            .filter((s) => s.vocab)
            .map((s, i) => (
              <span key={i} className="vocab-pill" onClick={() => onVocab({ word: s.vocab!, def: s.def!, example: passageExample(story, s.vocab!) })}>
                {s.vocab}
              </span>
            ))}
        </div>
      </div>
      <StoryQuestions questions={story.read.questions} />
    </div>
  );
}

// ---- SPEAK ----
function Speak({ story }: { story: Story }) {
  const [phase, setPhase] = useState<"idle" | "recording" | "done">("idle");
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (phase !== "recording") return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const fb = story.speak.feedback;

  return (
    <div className="story-player-body">
      <div className="speak-prompt">
        <div className="speak-prompt-label">Now you&apos;re in the story</div>
        <h3 className="speak-prompt-q">{story.speak.prompt}</h3>
        <div className="speak-prompt-hints">
          {story.speak.hints.map((h, i) => (
            <div key={i} className="speak-hint">
              {h}
            </div>
          ))}
        </div>
      </div>

      {phase !== "done" ? (
        <div className="speak-mic-area">
          <button
            className={"speak-mic" + (phase === "recording" ? " recording" : "")}
            onClick={() => {
              if (phase === "idle") setPhase("recording");
              else setPhase("done");
            }}
          >
            {phase === "recording" ? "■" : "🎙️"}
            <span className="speak-mic-pulse" />
          </button>
          <div className="speak-mic-label">{phase === "recording" ? "Recording… tap to stop" : "Tap to start recording"}</div>
          {phase === "recording" && <div className="speak-mic-timer">{fmt(secs)}</div>}
        </div>
      ) : (
        <Feedback fb={fb} mode="speak" secs={secs} fmt={fmt} />
      )}
    </div>
  );
}

// ---- WRITE ----
function Write({ story }: { story: Story }) {
  const [done, setDone] = useState(false);
  const w = story.write;
  return (
    <div className="story-player-body">
      <div className="write-prompt">
        <div className="write-prompt-label">Final step · Writing</div>
        <h3 className="write-prompt-q">
          {w.prompt} <span className="write-min">{w.min}</span>
        </h3>
        <div className="write-plan">
          <div className="write-plan-label">📝 Plan time — jot ideas before you write:</div>
          <div className="write-plan-hints">
            {w.planHints.map((h, i) => (
              <span key={i} className="plan-hint">
                {h}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="write-editor-wrap">
        <div className="write-editor">
          <div className="write-editor-content">
            {w.sample.map((p, i) => (
              <p key={i}>
                {p}
                {i === w.sample.length - 1 && <span className="write-cursor">|</span>}
              </p>
            ))}
          </div>
        </div>
        <div className="write-editor-foot">
          <span>
            {w.words} words · {w.paras} paragraphs
          </span>
          <span className="write-saved">Saved ✓</span>
        </div>
      </div>

      {!done ? (
        <div className="write-cta-row">
          <button className="btn-primary" onClick={() => setDone(true)}>
            ✨ Get AI feedback
          </button>
        </div>
      ) : (
        <Feedback fb={w.feedback} mode="write" />
      )}
    </div>
  );
}

// ---- shared FEEDBACK ----
function Feedback({ fb, mode, secs, fmt }: { fb: SpeakFeedback; mode: "speak" | "write"; secs?: number; fmt?: (s: number) => string }) {
  return (
    <div className="story-feedback">
      <div className="feedback-header">
        <div className="feedback-head-left">
          <div className="feedback-eyebrow">AI feedback · {mode === "write" ? "evaluated as you wrote" : "evaluated in 3 seconds"}</div>
          <div className="feedback-overall">
            <span className="feedback-score-big">{fb.score}</span>
            <span className="feedback-score-of">/ 10</span>
            <span className="feedback-score-label">{fb.label}</span>
          </div>
        </div>
        {mode === "speak" && <button className="feedback-listen-btn">▶ Hear your recording ({fmt ? fmt(secs ?? 0) : "0:32"})</button>}
      </div>

      {mode === "write" ? (
        <div className="feedback-rubric feedback-rubric-grid">
          {fb.rubric.map((r) => (
            <div key={r.name} className="rubric-mini">
              <div className="rubric-mini-name">{r.name}</div>
              <div className="rubric-mini-score">{r.score}</div>
              <div className="rubric-mini-bar">
                <div style={{ width: `${r.score * 10}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="feedback-rubric">
          {fb.rubric.map((r) => (
            <div key={r.name} className="rubric-row">
              <div className="rubric-name">{r.name}</div>
              <div className="rubric-bar">
                <div className="rubric-fill" style={{ width: `${r.score * 10}%` }} />
              </div>
              <div className="rubric-score">{r.score}</div>
              {r.note && <div className="rubric-note">{r.note}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="feedback-callouts">
        <div className="callout callout-praise">
          <div className="callout-head">✨ What you nailed</div>
          <p>{fb.praise}</p>
        </div>
        <div className="callout callout-tip">
          <div className="callout-head">💡 Try this next time</div>
          <p>{fb.tip}</p>
        </div>
      </div>
    </div>
  );
}

// ---- COMPLETE ----
function Complete({
  story,
  kid,
  belt,
  onHome,
  onRevise,
}: {
  story: Story;
  kid: string;
  belt: { name: string; pts: number; target: number } | null;
  onHome: () => void;
  onRevise: () => void;
}) {
  const c = story.complete;
  const wasPct = belt ? Math.round((belt.pts / belt.target) * 100) : 34;
  const newPts = (belt ? belt.pts : 340) + c.points;
  const newPct = belt ? Math.round((newPts / belt.target) * 100) : 36;
  const [grew, setGrew] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGrew(true), 350);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="story-complete-wrap">
      <div className="complete-bg">
        <div className="complete-confetti" />
      </div>
      <div className="complete-content">
        <div className="complete-eyebrow">{story.chapter.split("—")[0].trim()} complete</div>
        <h1 className="complete-title">Beautiful work, {kid}.</h1>
        <div className="complete-pts">
          <div className="pts-num-huge">+{c.points}</div>
          <div className="pts-num-label">points earned</div>
        </div>
        <div className="complete-belt-update">
          <div className="cbu-label">{belt ? belt.name : "Yellow"} Belt progress</div>
          <div className="cbu-bar">
            <div className="cbu-fill-was" style={{ width: `${wasPct}%` }} />
            <div className="cbu-fill-new" style={{ width: `${grew ? newPct : wasPct}%` }} />
          </div>
          <div className="cbu-meta">
            <span className="cbu-was">{belt ? belt.pts : 340}</span>
            <span className="cbu-arrow">→</span>
            <span className="cbu-now">
              {newPts} / {belt ? belt.target.toLocaleString() : "1,000"}
            </span>
          </div>
        </div>
        <div className="complete-vocab">
          <div className="cv-label">{c.vocab.length} new words added to your revision deck</div>
          <div className="cv-cards">
            {c.vocab.map((w) => (
              <div key={w} className="cv-card">
                {w}
              </div>
            ))}
          </div>
          <div className="cv-foot">These will quietly come back for review over the next few days — that&apos;s how they stick.</div>
        </div>
        <div className="complete-actions">
          <button className="btn-secondary" onClick={onHome}>
            Back to My Stories
          </button>
          <button className="btn-primary" onClick={onRevise}>
            See my progress →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StoryExperiencePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, ready } = useCurrentUser();
  const story = params?.id ? STORY_LIB.byId[params.id] : undefined;

  const [idx, setIdx] = useState(0);
  const [vocab, setVocab] = useState<VocabPopup | null>(null);

  // Login gate (this route renders outside the shell, so it guards itself).
  useEffect(() => {
    if (ready && (!user || user.role !== "student")) router.replace("/login");
  }, [ready, user, router]);

  // Unknown story → back to the library.
  useEffect(() => {
    if (ready && user?.role === "student" && !story) router.replace("/lessons");
  }, [ready, user, story, router]);

  const stepKey = STEPS[idx];

  const onExit = useMemo(() => () => router.push("/lessons"), [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (vocab) setVocab(null);
        else onExit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [vocab, onExit]);

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (!ready) return null;
  if (!user || user.role !== "student") return null;
  if (!story) return null;

  const kid = user.full_name || DATA.student.first;
  const next = () => setIdx((i) => Math.min(STEPS.length - 1, i + 1));
  const back = () => {
    if (idx === 0) onExit();
    else setIdx((i) => i - 1);
  };

  const FOOT: Record<string, { hint: string; cta: string }> = {
    listen: { hint: "When the scene ends, continue to read what happens next.", cta: "Continue to Reading →" },
    read: { hint: "Now play with the new words to make them stick.", cta: "Continue to Word Play →" },
    vocab: { hint: "Nice wordwork! Now step into the story.", cta: "Continue to Speaking →" },
    speak: { hint: "Last step — write this moment in your own words.", cta: "Continue to Writing →" },
    write: { hint: "Chapter complete! Let's see what you earned.", cta: "Finish chapter →" },
  };
  const belt = DATA.GAMIFY
    ? { name: DATA.GAMIFY.belts[DATA.GAMIFY.beltIndex].name, pts: DATA.GAMIFY.points, target: DATA.GAMIFY.beltTarget }
    : null;

  return (
    <div className="cw-story" style={{ "--story-c": story.themeColor } as CSSProperties}>
      <button className="story-exit" onClick={onExit} title="Close (Esc)">
        ✕
      </button>

      {stepKey === "complete" ? (
        <Complete story={story} kid={kid} belt={belt} onHome={onExit} onRevise={() => router.push("/progress")} />
      ) : (
        <div className="story-shell">
          <header className="story-player-header">
            <button className="back-btn" onClick={back}>
              ←
            </button>
            <div className="story-player-title">
              <div className="sph-name">{story.title}</div>
              <div className="sph-chapter">{story.chapter}</div>
            </div>
            <Stepper idx={idx} />
          </header>

          {stepKey === "listen" && <Listen story={story} />}
          {stepKey === "read" && <Read story={story} onVocab={setVocab} />}
          {stepKey === "vocab" && <VocabGame story={story} />}
          {stepKey === "speak" && <Speak story={story} />}
          {stepKey === "write" && <Write story={story} />}

          <div className="story-player-foot">
            <div className="foot-hint">{FOOT[stepKey].hint}</div>
            <button className="btn-primary" onClick={next}>
              {FOOT[stepKey].cta}
            </button>
          </div>
        </div>
      )}

      {vocab && (
        <div className="vocab-popup" onClick={() => setVocab(null)}>
          <div className="vocab-popup-card" onClick={(e) => e.stopPropagation()}>
            <div className="vocab-popup-word">{vocab.word}</div>
            <div className="vocab-popup-def">{vocab.def}</div>
            {vocab.example && (
              <div className="vocab-popup-example">
                Used in: <em>{vocab.example}</em>
              </div>
            )}
            <button className="btn-primary btn-small" onClick={() => setVocab(null)}>
              I&apos;ll remember this 🧠
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
