"use client";
// My Portfolio (module 13) — saved class work: writing & spoken pieces (with
// playback) plus completed reading & listening exercises (with scores + answers).
import { useState } from "react";
import type { CSSProperties } from "react";
import { Avatar, Ic } from "@/components/Ic";
import { DATA, type WorkItem } from "@/data/studentData";

type WorkType = WorkItem["type"];

const WORK_TYPE: Record<string, { label: string; Icon: (typeof Ic)[string]; glyph: "stroke" | "color" }> = {
  writing: { label: "Writing", Icon: Ic.write, glyph: "stroke" },
  spoken: { label: "Speaking", Icon: Ic.mic, glyph: "color" },
  reading: { label: "Reading", Icon: Ic.book, glyph: "stroke" },
  listening: { label: "Listening", Icon: Ic.ear, glyph: "stroke" },
};

function TypeTag({ type, color, wash, suffix }: { type: WorkType; color?: string; wash?: string; suffix?: string }) {
  const meta = WORK_TYPE[type] || WORK_TYPE.writing;
  const Icon = meta.Icon;
  const ico = meta.glyph === "color" ? <Icon size={16} color={color} /> : <Icon size={16} stroke={color} />;
  return (
    <span className="work-type" style={{ background: wash, color }}>
      {ico}
      {meta.label}
      {suffix ? ` ${suffix}` : ""}
    </span>
  );
}

// NOTE: kept verbatim from the mockup — SECTION_ORDER uses "speaking" while the
// data items use type "spoken", so the "speaking" section is always empty in the
// "All" view (filtered out below). Spoken pieces show only under the "Speaking"
// filter button (filter value "spoken"). Typed as string to mirror that quirk.
const SECTION_ORDER: string[] = ["reading", "listening", "writing", "speaking"];
const SECTION_BLURB: Record<string, string> = {
  reading: "Comprehension exercises",
  listening: "Audio comprehension",
  writing: "Written pieces",
  speaking: "Voice recordings",
};

export default function Works() {
  const W = DATA.WORKS;
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState<WorkItem | null>(null);

  const types = filter === "all" ? SECTION_ORDER : [filter];
  const sections = types
    .map((t) => ({ type: t, items: W.filter((w) => w.type === t) }))
    .filter((sec) => sec.items.length > 0);

  return (
    <div className="page view-enter">
      <div className="page-head">
        <div>
          <div className="h-eyebrow">My Portfolio</div>
          <h1 className="page-h1">Maya&apos;s portfolio</h1>
        </div>
        <span style={{ display: "none" }} />
      </div>
      <p className="page-lead">
        Everything Maya writes, records, reads or listens to in class is saved here — tangible proof of her progress for parents to keep. 📚
      </p>

      <div className="works-filter">
        {(
          [
            ["all", "All"],
            ["reading", "Reading"],
            ["listening", "Listening"],
            ["writing", "Writing"],
            ["spoken", "Speaking"],
          ] as [string, string][]
        ).map(([k, lbl]) => (
          <button key={k} className={"wf-btn" + (filter === k ? " on" : "")} onClick={() => setFilter(k)}>
            {lbl}
          </button>
        ))}
      </div>

      <div className="works-sections">
        {sections.map(({ type, items }) => {
          const skId = type === "spoken" ? "speaking" : type;
          const sk = DATA.SKILLS.find((s) => s.id === skId)!;
          const meta = WORK_TYPE[type];
          const Icon = meta.Icon;
          return (
            <section key={type} className="works-section">
              <div className="ws-head">
                <span className="ws-ico" style={{ background: sk.wash, color: sk.color }}>
                  <Icon size={19} stroke={sk.color} color={sk.color} />
                </span>
                <div className="ws-titles">
                  <h2 className="ws-title">{meta.label}</h2>
                  <span className="ws-blurb">{SECTION_BLURB[type]}</span>
                </div>
                <span className="ws-count">
                  {items.length} {items.length === 1 ? "piece" : "pieces"}
                </span>
              </div>
              <div className="works-grid">
                {items.map((w) => (
                  <WorkCard key={w.id} w={w} onOpen={setOpen} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {open && <WorkModal w={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function WorkCard({ w, onOpen }: { w: WorkItem; onOpen: (w: WorkItem) => void }) {
  const sk = DATA.SKILLS.find((s) => s.id === w.skill)!;
  const isQuiz = w.type === "reading" || w.type === "listening";
  return (
    <button className="work-card pop-in" style={{ "--c": sk.color, "--w": sk.wash } as CSSProperties} onClick={() => onOpen(w)}>
      <div className="work-top">
        <TypeTag type={w.type} color={sk.color} wash={sk.wash} />
        <span className="work-date">{w.date}</span>
      </div>
      <div className="work-topic">{w.topic}</div>

      {w.type === "writing" && <div className="work-excerpt">“{w.excerpt}”</div>}
      {w.type === "spoken" && (
        <div className="work-audio">
          <span className="wa-play">
            <Ic.play size={16} fill="#fff" stroke="none" />
          </span>
          <Waveform color={sk.color} />
          <span className="wa-dur">{w.dur}</span>
        </div>
      )}
      {isQuiz && <QuizResult w={w} color={sk.color} />}

      <div className="work-foot">
        {w.type === "writing" && `${w.words} words`}
        {w.type === "spoken" && "Voice recording"}
        {w.type === "reading" && `Level ${w.level} · ${w.questions?.length} questions`}
        {w.type === "listening" && `Listened · ${w.dur}`}
        <span className="work-open">
          Open <Ic.arrowR size={15} stroke={sk.color} />
        </span>
      </div>
    </button>
  );
}

/* compact score block for reading/listening cards */
function QuizResult({ w, color }: { w: WorkItem; color: string }) {
  if (!w.score || !w.questions) return null;
  const pct = Math.round((w.score.correct / w.score.total) * 100);
  return (
    <div className="work-quiz">
      <div className="wq-score">
        <span className="wq-big" style={{ color }}>
          {w.score.correct}
          <i>/{w.score.total}</i>
        </span>
        <span className="wq-label">correct · {pct}%</span>
      </div>
      <div className="wq-dots">
        {w.questions.map((q, i) => (
          <span key={i} className={"wq-dot" + (q.correct ? " ok" : " miss")} style={q.correct ? { background: color } : undefined} />
        ))}
      </div>
    </div>
  );
}

function Waveform({ color, n = 26 }: { color: string; n?: number }) {
  return (
    <span className="wave">
      {Array.from({ length: n }).map((_, i) => (
        <i key={i} style={{ height: `${20 + Math.abs(Math.sin(i * 1.3)) * 70}%`, background: color, opacity: i < n * 0.35 ? 1 : 0.3 }} />
      ))}
    </span>
  );
}

function WorkModal({ w, onClose }: { w: WorkItem; onClose: () => void }) {
  const sk = DATA.SKILLS.find((s) => s.id === w.skill)!;
  const [playing, setPlaying] = useState(false);
  const isQuiz = w.type === "reading" || w.type === "listening";
  const coachNote = {
    spoken: "Lovely clear voice, Maya! You spoke in full sentences and used the word ‘favourite’ perfectly. Next time, try adding one more detail about why you like it. ⭐",
    writing: "Great descriptive words — ‘giant sandcastle’ paints a clear picture! Remember to start each sentence with a capital letter. Keep it up! ⭐",
    reading: "Wonderful comprehension, Maya — you found the characters, setting and the big message. For the ordering question, read each step slowly before you place it. ⭐",
    listening: "Excellent listening! You remembered lots of details from the story. Re-listen to the part near the stream — that's the one we'll practise next time. ⭐",
  }[w.type];

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal pop-in" style={{ "--c": sk.color } as CSSProperties} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <TypeTag type={w.type} color={sk.color} wash={sk.wash} suffix="Exercise" />
          <button className="modal-x" onClick={onClose}>
            ✕
          </button>
        </div>
        <h2 className="modal-title">{w.topic}</h2>
        <div className="modal-date">
          <Ic.calendar size={15} stroke="var(--ink-3)" /> {w.date}, 2026 · Exit ticket
        </div>

        {w.type === "writing" && (
          <div className="modal-writing">
            {w.excerpt} The waves were big and we laughed all day long. I want to go back next summer with my whole family.
          </div>
        )}

        {w.type === "spoken" && (
          <div className="modal-audio">
            <button className="ma-play" style={{ background: sk.color }} onClick={() => setPlaying((p) => !p)}>
              {playing ? <Ic.pause size={26} stroke="#fff" /> : <Ic.play size={26} fill="#fff" stroke="none" />}
            </button>
            <Waveform color={sk.color} n={48} />
            <span className="ma-dur">{w.dur}</span>
          </div>
        )}

        {isQuiz && w.score && w.questions && (
          <>
            {w.type === "listening" && (
              <div className="modal-audio modal-audio-sm">
                <button className="ma-play" style={{ background: sk.color }} onClick={() => setPlaying((p) => !p)}>
                  {playing ? <Ic.pause size={22} stroke="#fff" /> : <Ic.play size={22} fill="#fff" stroke="none" />}
                </button>
                <div className="ma-clip-meta">
                  <b>Audio clip</b>
                  <span>The story Maya listened to · {w.dur}</span>
                </div>
                <Waveform color={sk.color} n={32} />
              </div>
            )}

            <div className="quiz-banner" style={{ background: sk.wash }}>
              <span className="qb-ring" style={{ "--c": sk.color, "--p": (w.score.correct / w.score.total) * 100 + "%" } as CSSProperties}>
                <b style={{ color: sk.color }}>{Math.round((w.score.correct / w.score.total) * 100)}%</b>
              </span>
              <div className="qb-text">
                <div className="qb-score" style={{ color: sk.color }}>
                  {w.score.correct} of {w.score.total} correct
                </div>
                <div className="qb-sub">
                  {w.type === "reading" ? "Reading comprehension" : "Listening comprehension"} · Level {w.level}
                </div>
              </div>
            </div>

            <div className="quiz-list">
              {w.questions.map((q, i) => (
                <div key={i} className={"quiz-q" + (q.correct ? "" : " miss")}>
                  <span className={"qq-mark" + (q.correct ? " ok" : " miss")} style={q.correct ? { background: sk.color } : undefined}>
                    {q.correct ? <Ic.check size={13} stroke="#fff" /> : <Ic.x size={13} stroke="#fff" />}
                  </span>
                  <div className="qq-body">
                    <div className="qq-q">{q.q}</div>
                    <div className="qq-a">
                      Maya answered: <b>{q.your}</b>
                      {q.correct ? "" : " — reviewed in class"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="modal-feedback">
          <div className="mf-head">
            <Avatar size={32} name="B" /> <b>Coach Bianca&apos;s note</b>
          </div>
          <p>{coachNote}</p>
        </div>
      </div>
    </div>
  );
}
