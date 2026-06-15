"use client";
/* Screen 6 — Marking item + AudioBar (ported from app/screen_marking.jsx →
   MarkingItem). Reads the id via useParams(). Send-feedback / assign-homework
   are local-state demo affordances (as in the mockup). */
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon, Avatar, SkillChip, AITag } from "@/components/Icon";
import { CW } from "@/data/coachData";

function AudioBar({ duration }: { duration?: string }) {
  const [playing, setPlaying] = useState(false);
  const [pct, setPct] = useState(0);
  // Waveform heights: generated on the client after mount (avoids SSR/CSR
  // hydration mismatch from Math.random in render).
  const [bars, setBars] = useState<number[]>(() => Array.from({ length: 48 }, () => 50));
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    setBars(Array.from({ length: 48 }, () => 20 + Math.random() * 80));
  }, []);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(
      () =>
        setPct((p) => {
          if (p >= 100) {
            clearInterval(t);
            setPlaying(false);
            return 100;
          }
          return p + 1.5;
        }),
      80,
    );
    return () => clearInterval(t);
  }, [playing]);
  const barCount = useMemo(() => bars.length, [bars]);
  return (
    <div className="row" style={{ gap: 12, background: "var(--surface-3)", borderRadius: "var(--r-md)", padding: "12px 14px" }}>
      <button
        onClick={() => setPlaying((p) => !p)}
        style={{ width: 40, height: 40, borderRadius: 99, border: 0, background: "var(--brand)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}
      >
        <Icon n={playing ? "pause" : "play"} size={17} />
      </button>
      <div className="grow row" style={{ gap: 2, alignItems: "center", height: 36 }}>
        {bars.map((h, i) => (
          <div key={i} style={{ flex: 1, height: h + "%", borderRadius: 2, background: (i / barCount) * 100 <= pct ? "var(--brand)" : "var(--line)" }} />
        ))}
      </div>
      <span className="tnum muted" style={{ fontSize: 12, fontWeight: 700 }}>
        {duration}
      </span>
    </div>
  );
}

export default function MarkingItemPage() {
  const C = CW;
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const m = C.submissions.find((x) => x.id === id);
  const st = m ? C.byId(m.studentId) : undefined;

  const [scores, setScores] = useState<number[]>(() => (m && m.ai ? m.ai.criteria.map((c) => c.score) : []));
  const [feedback, setFeedback] = useState(m && m.ai ? m.ai.feedback : "");
  const [sent, setSent] = useState(false);
  const [hw, setHw] = useState({ skill: m ? m.skill : "write", type: "written", desc: "", due: "" });
  const [hwSaved, setHwSaved] = useState(false);

  if (!m || !st) {
    return (
      <div className="content-inner fade-up">
        <button className="btn ghost sm" onClick={() => router.push("/marking")}>
          <Icon n="back" size={16} /> Marking
        </button>
        <p className="page-sub" style={{ marginTop: 16 }}>
          Submission not found.
        </p>
      </div>
    );
  }

  const overall = m.ai ? Math.round((scores.reduce((a, b) => a + b, 0) / (m.ai.criteria.length * 5)) * 100) : null;

  return (
    <div className="content-inner fade-up">
      {/* header */}
      <div className="row" style={{ marginBottom: 14, alignItems: "flex-start" }}>
        <button className="btn ghost sm" onClick={() => router.push("/marking")} style={{ marginTop: 2 }}>
          <Icon n="back" size={16} />
        </button>
        <div className="grow">
          <div className="row" style={{ gap: 10 }}>
            <h1 className="page-title" style={{ fontSize: 22 }}>
              {m.title}
            </h1>
            {m.aiReady && <AITag>AI pre-scored</AITag>}
          </div>
          <div className="page-sub">
            <Avatar name={st.name} color={st.color} size={18} style={{ display: "inline-flex" }} /> {st.name} · {m.type} · {m.lesson}
          </div>
        </div>
        <button className="btn" onClick={() => router.push(`/roster/${st.id}`)}>
          <Icon n="roster" size={15} /> Student
        </button>
      </div>

      <div className="kgrid" style={{ gridTemplateColumns: "1.4fr 1fr", alignItems: "start" }}>
        {/* LEFT — the work */}
        <div className="card">
          <div className="card-head">
            <SkillChip skill={m.skill} level={m.level} />
            <span className="ch-sub muted">{m.lesson}</span>
            <span className="spacer" />
            <span className="ch-sub muted tnum">Submitted {m.date}</span>
          </div>
          {m.transcript ? (
            <div className="card-pad">
              {/* audio playback */}
              <AudioBar duration={m.duration} />
              <div className="row" style={{ gap: 7, margin: "16px 0 8px" }}>
                <span className="muted" style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase" }}>
                  Transcript
                </span>
                <AITag>Auto</AITag>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink-2)", whiteSpace: "pre-wrap" }}>{m.transcript}</div>
            </div>
          ) : (
            <div className="card-pad">
              <div style={{ fontSize: 15, lineHeight: 1.85, color: "var(--ink)", whiteSpace: "pre-wrap", fontFamily: "Georgia, serif" }}>{m.body}</div>
            </div>
          )}
        </div>

        {/* RIGHT — stacked cards */}
        <div className="col" style={{ gap: "var(--gap)" }}>
          {/* AI score */}
          {m.ai ? (
            <div className="card">
              <div className="card-head">
                <h3>Score</h3>
                <AITag>AI draft</AITag>
                <span className="spacer" />
                <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--brand-ink)" }}>
                  {overall}
                  <span style={{ fontSize: 13, color: "var(--ink-4)" }}>/100</span>
                </div>
              </div>
              <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {m.ai.criteria.map((c, i) => (
                  <div key={i}>
                    <div className="row" style={{ marginBottom: 5 }}>
                      <b style={{ fontSize: 13 }}>{c.name}</b>
                      <span className="grow" />
                      <div className="row" style={{ gap: 3 }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => setScores((s) => s.map((v, j) => (j === i ? n : v)))}
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 6,
                              border: 0,
                              cursor: "pointer",
                              background: n <= scores[i] ? "var(--brand)" : "var(--surface-3)",
                              color: n <= scores[i] ? "#fff" : "var(--ink-4)",
                              fontSize: 11,
                              fontWeight: 800,
                            }}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="muted" style={{ fontSize: 11.5 }}>
                      {c.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card card-pad">
              <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)" }}>Score</h3>
              <div className="waiting">
                <div className="pulse">
                  <Icon n="bolt" size={16} />
                </div>
                Not AI-scored — grade manually below.
              </div>
            </div>
          )}

          {/* Feedback */}
          <div className="card card-pad">
            <div className="row" style={{ marginBottom: 9 }}>
              <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 15 }}>Feedback</h3>
              {m.ai && <AITag>AI-drafted · edit before sending</AITag>}
            </div>
            <textarea
              className="textarea"
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value);
                setSent(false);
              }}
              rows={6}
            />
            <div className="row" style={{ marginTop: 11 }}>
              <span className="muted" style={{ fontSize: 11.5 }}>
                {sent ? <span style={{ color: "var(--brand-ink)", fontWeight: 700 }}>✓ Sent to {st.first}</span> : "Sends to the student's app + parent log"}
              </span>
              <span className="grow" />
              <button className="btn-zoom" style={{ boxShadow: "none", background: "var(--ink)" }} onClick={() => setSent(true)}>
                <Icon n="send" size={15} /> Send feedback
              </button>
            </div>
          </div>

          {/* Assign homework */}
          <div className="card card-pad" style={{ background: "var(--surface-2)" }}>
            <div className="row" style={{ marginBottom: 11 }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--brand-soft)", color: "var(--brand-ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon n="plus" size={15} />
              </span>
              <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 15 }}>Assign homework</h3>
              <span className="grow" />
              <span className="muted" style={{ fontSize: 11 }}>
                follow-up
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              <div className="field">
                <label>Skill</label>
                <select className="select" value={hw.skill} onChange={(e) => setHw({ ...hw, skill: e.target.value as typeof hw.skill })}>
                  {C.SKILLS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Type</label>
                <select className="select" value={hw.type} onChange={(e) => setHw({ ...hw, type: e.target.value })}>
                  <option value="written">Written</option>
                  <option value="spoken">Spoken</option>
                  <option value="reading">Reading</option>
                </select>
              </div>
            </div>
            <div className="field" style={{ marginTop: 9 }}>
              <label>Description</label>
              <input className="input" placeholder="e.g. Revise paragraph 2 — fix run-ons" value={hw.desc} onChange={(e) => setHw({ ...hw, desc: e.target.value })} />
            </div>
            <div className="row" style={{ marginTop: 9, gap: 9 }}>
              <div className="field grow">
                <label>Due date</label>
                <input className="input" type="date" value={hw.due} onChange={(e) => setHw({ ...hw, due: e.target.value })} />
              </div>
              <button
                className="btn primary"
                style={{ alignSelf: "flex-end" }}
                onClick={() => {
                  setHwSaved(true);
                  setTimeout(() => setHwSaved(false), 2000);
                }}
              >
                {hwSaved ? "✓ Assigned" : "Assign"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
