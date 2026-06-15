"use client";
/* Screen — Attendance (ported from app/screen_attendance.jsx). */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, Avatar } from "@/components/Icon";
import { CW, type AttendanceStatus } from "@/data/coachData";

export default function AttendancePage() {
  const C = CW;
  const router = useRouter();
  const [period, setPeriod] = useState("term");

  const all = C.students.map((s) => ({ s, a: C.attendance[s.id] }));
  const totals = all.reduce(
    (acc, { a }) => {
      acc.present += a.present;
      acc.late += a.late;
      acc.absent += a.absent;
      acc.total += a.total;
      return acc;
    },
    { present: 0, late: 0, absent: 0, total: 0 },
  );
  const overall = Math.round(((totals.present + totals.late) / totals.total) * 100);

  const STC: Record<AttendanceStatus, string> = { present: "var(--brand)", late: "var(--warn)", absent: "var(--live)", scheduled: "var(--line)" };
  const STL: Record<AttendanceStatus, string> = { present: "Present", late: "Late", absent: "Absent", scheduled: "Upcoming" };

  const kpis = [
    { num: overall + "%", lbl: "Attendance · this term", tint: "var(--brand)", bg: "var(--brand-soft)", icon: "userCheck" },
    { num: totals.present, lbl: "Present", tint: "var(--brand)", bg: "var(--brand-soft)", icon: "check" },
    { num: totals.late, lbl: "Late arrivals", tint: "var(--warn)", bg: "var(--warn-soft)", icon: "clock" },
    { num: totals.absent, lbl: "Absences", tint: "var(--live)", bg: "var(--live-soft)", icon: "warn" },
  ];

  return (
    <div className="content-inner fade-up">
      <div className="row" style={{ marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-sub">Every student&apos;s session attendance across Term 1</p>
        </div>
        <span className="grow" />
        <div className="role-toggle">
          {[
            ["week", "This week"],
            ["month", "This month"],
            ["term", "Term 1"],
          ].map(([k, l]) => (
            <button key={k} className={period === k ? "on" : ""} onClick={() => setPeriod(k)}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="kgrid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: "var(--gap)" }}>
        {kpis.map((k, i) => (
          <div key={i} className="card kpi">
            <div className="kpi-ico" style={{ background: k.bg, color: k.tint }}>
              <Icon n={k.icon} size={18} />
            </div>
            <div>
              <div className="kpi-num">{k.num}</div>
              <div className="kpi-lbl">{k.lbl}</div>
            </div>
          </div>
        ))}
      </div>

      {/* per-student record */}
      <div className="card">
        <div className="card-head">
          <h3>Student records</h3>
          <span className="spacer" />
          <div className="row" style={{ gap: 14 }}>
            {(["present", "late", "absent"] as const).map((k) => (
              <span key={k} className="row" style={{ gap: 5, fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: STC[k] }} /> {STL[k]}
              </span>
            ))}
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Student</th>
              <th>Grade</th>
              <th style={{ width: "34%" }}>Rate</th>
              <th>Recent sessions</th>
              <th style={{ textAlign: "right" }}>P / L / A</th>
            </tr>
          </thead>
          <tbody>
            {all.map(({ s, a }) => (
              <tr key={s.id} className="clickable" onClick={() => router.push(`/roster/${s.id}`)}>
                <td>
                  <div className="cell-student">
                    <Avatar name={s.name} color={s.color} size={32} />
                    <b>{s.name}</b>
                  </div>
                </td>
                <td>
                  <span className="chip" style={{ background: "var(--surface-3)", color: "var(--ink-2)" }}>
                    G{s.grade}
                  </span>
                </td>
                <td>
                  <div className="row" style={{ gap: 9 }}>
                    <b className="tnum" style={{ width: 36, color: a.rate >= 95 ? "var(--brand-ink)" : a.rate >= 85 ? "var(--warn)" : "var(--live)" }}>
                      {a.rate}%
                    </b>
                    <span className="grow" style={{ maxWidth: 150 }}>
                      <div className="bar">
                        <i style={{ width: a.rate + "%", background: a.rate >= 95 ? "var(--brand)" : a.rate >= 85 ? "var(--warn)" : "var(--live)" }} />
                      </div>
                    </span>
                  </div>
                </td>
                <td>
                  <div className="row" style={{ gap: 3 }}>
                    {a.log
                      .slice(0, 12)
                      .reverse()
                      .map((l, i) => (
                        <span key={i} title={`${l.date} · ${STL[l.status]}`} style={{ width: 14, height: 14, borderRadius: 4, background: STC[l.status], flex: "none" }} />
                      ))}
                  </div>
                </td>
                <td style={{ textAlign: "right" }}>
                  <span className="tnum" style={{ fontSize: 12.5 }}>
                    <b style={{ color: "var(--brand-ink)" }}>{a.present}</b> <span className="muted">/</span> <b style={{ color: "var(--warn)" }}>{a.late}</b>{" "}
                    <span className="muted">/</span> <b style={{ color: "var(--live)" }}>{a.absent}</b>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
