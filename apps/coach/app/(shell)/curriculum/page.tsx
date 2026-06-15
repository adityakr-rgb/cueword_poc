"use client";
/* Curriculum — 3 Terms × 8 Levels × 10 Stories (ported from
   app/screen_curriculum.jsx). Stories replace lessons. "Teach now" → /live. */
import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, StatusTag } from "@/components/Icon";
import { CW } from "@/data/coachData";

// genre colour coding — distinct, decorative category hues
const GENRE_C: Record<string, string> = {
  Nonfiction: "#2D7FF9",
  Fiction: "#EC5A8D",
  Fable: "#EE9612",
  Biography: "#7C5CFC",
  Poem: "#06AFC4",
  "Folk tale": "#11A974",
};
function GenreChip({ genre }: { genre: string }) {
  const c = GENRE_C[genre] || "#6A766F";
  return (
    <span className="chip" style={{ background: `color-mix(in srgb, ${c} 14%, transparent)`, color: c }}>
      <span className="chip-dot" style={{ background: c }} />
      {genre}
    </span>
  );
}

export default function CurriculumPage() {
  const C = CW;
  const router = useRouter();
  const [studentId, setStudentId] = useState("maya");
  const student = C.byId(studentId)!;
  const pos = student.pos;
  const [term, setTerm] = useState(pos.term);
  const [level, setLevel] = useState(pos.level);

  // When the student changes, jump to their current term/level. React's
  // recommended "adjust state during render" pattern (no effect) — keeps the
  // mockup's behaviour without a cascading-render setState-in-effect.
  const [prevStudent, setPrevStudent] = useState(studentId);
  if (prevStudent !== studentId) {
    setPrevStudent(studentId);
    setTerm(pos.term);
    setLevel(pos.level);
  }

  const termObj = C.TERMS[term - 1];
  const levelObj = termObj.levels[level - 1];
  const lvlStatus = C.levelStatus(pos, term, level);

  return (
    <div className="content-inner fade-up">
      <div className="row" style={{ marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Curriculum</h1>
          <p className="page-sub">
            {student.first} is on{" "}
            <b style={{ color: "var(--brand-ink)" }}>
              Term {pos.term} · Level {pos.level} · Story {pos.story} of 10
            </b>
            <span className="muted"> — content is pushed from admin; you assign &amp; sequence</span>
          </p>
        </div>
        <span className="grow" />
        <div className="field" style={{ minWidth: 190 }}>
          <label>Student</label>
          <select className="select" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            {C.students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · G{s.grade}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* term tabs */}
      <div className="row" style={{ gap: 10, marginBottom: "var(--gap)" }}>
        {C.TERMS.map((t) => {
          const st = C.levelStatus(pos, t.term, 1) === "locked" && t.term > pos.term ? "locked" : t.term < pos.term ? "done" : t.term === pos.term ? "current" : "locked";
          const on = term === t.term;
          return (
            <button
              key={t.term}
              onClick={() => {
                setTerm(t.term);
                setLevel(t.term === pos.term ? pos.level : 1);
              }}
              className="card"
              style={{
                flex: 1,
                padding: "12px 16px",
                textAlign: "left",
                cursor: "pointer",
                border: on ? "2px solid var(--brand)" : "1px solid var(--line)",
                background: on ? "var(--brand-soft)" : "var(--surface)",
              }}
            >
              <div className="row">
                <b style={{ fontFamily: "var(--font-display)", fontSize: 16, color: on ? "var(--brand-ink)" : "var(--ink)" }}>{t.name}</b>
                <span className="grow" />
                {st === "current" ? (
                  <span className="status-tag st-progress">In progress</span>
                ) : st === "done" ? (
                  <span className="status-tag st-mastered">Done</span>
                ) : (
                  <Icon n="lock" size={14} style={{ color: "var(--ink-4)" }} />
                )}
              </div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                8 levels · 80 stories
              </div>
            </button>
          );
        })}
      </div>

      {/* level progression ribbon */}
      <div className="card card-pad" style={{ marginBottom: "var(--gap)", overflowX: "auto" }}>
        <div className="row" style={{ gap: 0, minWidth: 720 }}>
          {termObj.levels.map((lv, i) => {
            const s = C.levelStatus(pos, term, lv.level);
            const sel = level === lv.level;
            const done = s === "mastered";
            const cur = s === "current";
            return (
              <Fragment key={lv.level}>
                {i > 0 && <div style={{ flex: 1, height: 3, background: done || cur ? "var(--brand)" : "var(--line)" }} />}
                <button
                  onClick={() => setLevel(lv.level)}
                  title={lv.unit}
                  style={{ flex: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, border: 0, background: "transparent", cursor: "pointer", width: 84, padding: 0 }}
                >
                  <span
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 99,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12.5,
                      fontWeight: 800,
                      background: done ? "var(--brand)" : cur ? "#fff" : "var(--surface-3)",
                      color: done ? "#fff" : cur ? "var(--brand-ink)" : "var(--ink-4)",
                      border: sel ? "2.5px solid var(--ink)" : cur ? "2.5px solid var(--brand)" : "2.5px solid transparent",
                    }}
                  >
                    {done ? <Icon n="check" size={15} /> : s === "locked" ? <Icon n="lock" size={13} /> : lv.level}
                  </span>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: sel ? "var(--ink)" : "var(--ink-4)",
                      textAlign: "center",
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 84,
                    }}
                  >
                    L{lv.level}
                  </span>
                </button>
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* selected level — stories */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px var(--pad)", background: "linear-gradient(105deg, #283531 0%, #16201C 100%)", color: "#fff" }}>
          <div className="row" style={{ gap: 12 }}>
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: `color-mix(in srgb, var(--sk-read) 85%, #fff)`,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontFamily: "var(--font-display)",
              }}
            >
              L{level}
            </span>
            <div className="grow">
              <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 700 }}>{levelObj.unit}</div>
              <div style={{ fontSize: 12.5, opacity: 0.9 }}>
                {termObj.name} · Level {level} · 10 stories
              </div>
            </div>
            {lvlStatus === "current" ? (
              <span className="chip" style={{ background: "rgba(255,255,255,.22)", color: "#fff" }}>
                Current level
              </span>
            ) : lvlStatus === "mastered" ? (
              <span className="chip" style={{ background: "rgba(255,255,255,.22)", color: "#fff" }}>
                Completed
              </span>
            ) : (
              <span className="chip" style={{ background: "rgba(255,255,255,.22)", color: "#fff" }}>
                <Icon n="lock" size={12} /> Locked
              </span>
            )}
          </div>
          <div className="row" style={{ marginTop: 12, gap: 9 }}>
            <span style={{ fontSize: 11.5, opacity: 0.85, fontWeight: 700 }}>Every story runs</span>
            <div className="row" style={{ gap: 5 }}>
              {C.STORY_FLOW.map((sk, i) => (
                <Fragment key={sk}>
                  {i > 0 && <span style={{ opacity: 0.6 }}>→</span>}
                  <span style={{ padding: "3px 9px", borderRadius: "var(--r-pill)", background: "rgba(255,255,255,.18)", fontSize: 11.5, fontWeight: 750 }}>{C.skillLabel(sk)}</span>
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 8 }}></th>
              <th style={{ width: 40 }}>#</th>
              <th>Story</th>
              <th>Genre</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {levelObj.stories.map((sty) => {
              const s = C.storyStatus(pos, term, level, sty.n);
              const cur = s === "current";
              const locked = s === "locked";
              const done = s === "done";
              const accent = cur ? "var(--live)" : done ? "var(--brand)" : "transparent";
              return (
                <tr key={sty.id} style={cur ? { background: "var(--brand-soft)" } : {}}>
                  <td style={{ padding: 0 }}>
                    <div style={{ width: 4, height: 44, background: accent, borderRadius: "0 3px 3px 0" }} />
                  </td>
                  <td>
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 8,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: 12,
                        background: done ? "var(--brand-soft)" : cur ? "var(--brand)" : "var(--surface-3)",
                        color: done ? "var(--brand-ink)" : cur ? "#fff" : "var(--ink-4)",
                      }}
                    >
                      {done ? <Icon n="check" size={13} /> : locked ? <Icon n="lock" size={12} /> : sty.n}
                    </span>
                  </td>
                  <td>
                    <b style={{ fontSize: 13.5, color: locked ? "var(--ink-3)" : "var(--ink)" }}>{sty.title}</b>
                  </td>
                  <td>
                    <GenreChip genre={sty.genre} />
                  </td>
                  <td>
                    {cur ? (
                      <span className="status-tag" style={{ background: "var(--live-soft)", color: "var(--live)" }}>
                        ● Current
                      </span>
                    ) : done ? (
                      <StatusTag status="completed" />
                    ) : (
                      <StatusTag status="locked" />
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {cur ? (
                      <button className="btn-zoom sm" style={{ padding: "6px 12px" }} onClick={() => router.push("/live")}>
                        <Icon n="live" size={14} /> Teach now
                      </button>
                    ) : locked ? (
                      <button className="btn sm ghost" style={{ color: "var(--ink-3)" }}>
                        <Icon n="unlock" size={13} /> Unlock
                      </button>
                    ) : (
                      <button className="link">
                        <span className="row" style={{ gap: 4 }}>
                          <Icon n="eye" size={13} /> Preview
                        </span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
