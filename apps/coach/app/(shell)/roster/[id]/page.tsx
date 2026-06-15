"use client";
/* Screen 3 — Student Detail (ported from app/screen_roster.jsx → StudentDetail).
   Reads the id via useParams() (the simple Next 16 client-component path). */
import { useParams, useRouter } from "next/navigation";
import { Icon, Avatar, SkillChip, StatusTag } from "@/components/Icon";
import { CW, SKILL_ORDER } from "@/data/coachData";

export default function StudentDetailPage() {
  const C = CW;
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const s = C.byId(id);
  const order = SKILL_ORDER;

  if (!s) {
    return (
      <div className="content-inner fade-up">
        <button className="btn ghost sm" onClick={() => router.push("/roster")}>
          <Icon n="back" size={16} /> Roster
        </button>
        <p className="page-sub" style={{ marginTop: 16 }}>
          Student not found.
        </p>
      </div>
    );
  }

  const hist = C.history[s.id] || [];
  const hw = C.homework[s.id] || [];

  return (
    <div className="content-inner fade-up">
      {/* header */}
      <div className="row" style={{ marginBottom: "var(--pad)", alignItems: "flex-start" }}>
        <button className="btn ghost sm" onClick={() => router.push("/roster")} style={{ marginTop: 4 }}>
          <Icon n="back" size={16} />
        </button>
        <Avatar name={s.name} color={s.color} size={56} />
        <div className="grow">
          <h1 className="page-title" style={{ fontSize: 24 }}>
            {s.name}
          </h1>
          <p className="page-sub">
            Grade {s.grade} · Term {s.term} · Enrolled {s.enrolled} · {s.tzCity}
          </p>
        </div>
        <button className="btn">
          <Icon n="doc" size={16} /> Eval report
        </button>
        <button className="btn" onClick={() => router.push("/comms")}>
          <Icon n="comms" size={16} /> Message parent
        </button>
      </div>

      <div className="kgrid" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
        {/* skill levels */}
        <div className="card">
          <div className="card-head">
            <h3>Skill levels &amp; scores</h3>
            <span className="spacer" />
            {(() => {
              const vals = order.map((k) => s.skills[k].score).filter((x): x is number => x != null);
              const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
              return (
                <span className="chip" style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}>
                  Overall {avg}%
                </span>
              );
            })()}
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Skill</th>
                <th>Level</th>
                <th>Score</th>
                <th>Status</th>
                <th>App sync</th>
              </tr>
            </thead>
            <tbody>
              {order.map((k) => {
                const sk = s.skills[k];
                const synced = sk.appSync === sk.level;
                return (
                  <tr key={k}>
                    <td>
                      <SkillChip skill={k} dot />
                    </td>
                    <td>
                      <b className="tnum">{sk.level}</b>
                    </td>
                    <td>
                      {sk.score == null ? (
                        <span className="muted">—</span>
                      ) : (
                        <div className="row" style={{ gap: 7 }}>
                          <b className="tnum" style={{ width: 30, color: sk.score >= 85 ? "var(--brand-ink)" : sk.score >= 70 ? "var(--ink)" : "var(--warn)" }}>
                            {sk.score}%
                          </b>
                          <span style={{ width: 52 }}>
                            <div className="bar" data-sk={k}>
                              <i style={{ width: sk.score + "%", background: "var(--c)" }} />
                            </div>
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <StatusTag status={sk.status} />
                    </td>
                    <td>
                      <span className="row" style={{ gap: 6 }}>
                        <span className="tnum" style={{ fontWeight: 700, color: synced ? "var(--brand-ink)" : "var(--ink-3)" }}>
                          {sk.appSync}
                        </span>
                        {synced ? (
                          <span className="muted" style={{ fontSize: 11 }}>
                            · synced
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--warn)", fontWeight: 700 }}>· behind</span>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* history + homework */}
        <div className="col" style={{ gap: "var(--gap)" }}>
          <div className="card">
            <div className="card-head">
              <h3>Session history</h3>
            </div>
            <div>
              {hist.map((h, i) => (
                <div key={i} style={{ padding: "11px var(--pad)", borderBottom: "1px solid var(--line-2)" }}>
                  <div className="row" style={{ gap: 8 }}>
                    <span className="tnum muted" style={{ fontSize: 12, width: 46 }}>
                      {h.date}
                    </span>
                    <SkillChip skill={h.skill} level={h.level} />
                    <span className="grow" />
                    <StatusTag status={h.status} />
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 6, paddingLeft: 54 }}>{h.note}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Homework</h3>
              <span className="spacer" />
              <span className="ch-sub muted">{hw.length} assigned</span>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {hw.map((h, i) => (
                  <tr key={i}>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <span className="chip-dot" style={{ width: 8, height: 8, background: `var(--sk-${h.skill})`, flex: "none" }} />
                        <span style={{ fontSize: 12.5 }}>{h.task}</span>
                      </div>
                    </td>
                    <td className="tnum muted" style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>
                      {h.due}
                    </td>
                    <td>
                      <StatusTag status={h.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
