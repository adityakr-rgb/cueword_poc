"use client";
/* Screen 7 — Comms / parent communications (ported from app/screen_comms.jsx).
   WhatsApp/Email buttons are external stubs, as in the mockup. */
import { Icon, Avatar } from "@/components/Icon";
import { CW } from "@/data/coachData";

export default function CommsPage() {
  const C = CW;
  const log = C.comms;

  return (
    <div className="content-inner fade-up">
      <div style={{ marginBottom: 14 }}>
        <h1 className="page-title">Parent comms</h1>
        <p className="page-sub">Messages are sent externally via WhatsApp or email — every touch is logged here for your records.</p>
      </div>

      {/* templates row */}
      <div className="card card-pad" style={{ marginBottom: "var(--gap)" }}>
        <div className="row" style={{ marginBottom: 11 }}>
          <span className="muted" style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase" }}>
            Quick templates
          </span>
        </div>
        <div className="row" style={{ flexWrap: "wrap", gap: 9 }}>
          {C.templates.map((t) => (
            <button key={t.id} className="btn" style={{ borderRadius: "var(--r-pill)" }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--brand)" }} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Student</th>
              <th>Parent</th>
              <th>Last contact</th>
              <th>Last template</th>
              <th style={{ textAlign: "right" }}>Reach out</th>
            </tr>
          </thead>
          <tbody>
            {log.map((m) => {
              const st = C.byId(m.studentId)!;
              return (
                <tr key={m.studentId}>
                  <td>
                    <div className="cell-student">
                      <Avatar name={st.name} color={st.color} size={32} />
                      <b>{st.name}</b>
                    </div>
                  </td>
                  <td>
                    <div>
                      <b style={{ fontSize: 13 }}>{st.parent}</b>
                      <div className="muted" style={{ fontSize: 11.5 }}>
                        {m.note}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <span className={"status-tag " + (m.method === "WhatsApp" ? "st-mastered" : "st-progress")} style={{ fontSize: 10.5 }}>
                        <Icon n={m.method === "WhatsApp" ? "whatsapp" : "mail"} size={12} /> {m.method}
                      </span>
                      <span className="muted tnum" style={{ fontSize: 12 }}>
                        {m.last}
                      </span>
                    </div>
                  </td>
                  <td className="muted" style={{ fontSize: 12.5 }}>
                    {m.template}
                  </td>
                  <td>
                    <div className="row" style={{ gap: 7, justifyContent: "flex-end" }}>
                      <button className="btn sm" style={{ color: "#1FA855", borderColor: "rgba(31,168,85,.3)" }} title="Open WhatsApp">
                        <Icon n="whatsapp" size={15} /> WhatsApp
                      </button>
                      <button className="btn sm" title="Open email">
                        <Icon n="mail" size={15} /> Email
                      </button>
                    </div>
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
