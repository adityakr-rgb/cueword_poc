"use client";
/* Screen 2 — Roster (ported from app/screen_roster.jsx → Roster). */
import { useRouter } from "next/navigation";
import { Icon, Avatar } from "@/components/Icon";
import { CW } from "@/data/coachData";

export default function RosterPage() {
  const C = CW;
  const router = useRouter();
  return (
    <div className="content-inner fade-up">
      <div className="row" style={{ marginBottom: "var(--pad)" }}>
        <div>
          <h1 className="page-title">Roster</h1>
          <p className="page-sub">{C.students.length} active students</p>
        </div>
        <span className="grow" />
        <button className="btn">
          <Icon n="filter" size={15} /> Grade
        </button>
        <button className="btn">
          <Icon n="search" size={15} /> Find student
        </button>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Student</th>
              <th>Grade</th>
              <th>Next session</th>
              <th>Term</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {C.students.map((s) => {
              const ts = C.sessions.find((x) => x.studentId === s.id);
              const status = ts ? (ts.status === "done" ? "done" : ts.status === "live" ? "live" : "upcoming") : "upcoming";
              return (
                <tr key={s.id} className="clickable" onClick={() => router.push(`/roster/${s.id}`)}>
                  <td>
                    <div className="cell-student">
                      <Avatar name={s.name} color={s.color} size={34} />
                      <div>
                        <b>{s.name}</b>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="chip" style={{ background: "var(--surface-3)", color: "var(--ink-2)" }}>
                      G{s.grade}
                    </span>
                  </td>
                  <td className="muted tnum" style={{ fontSize: 12.5 }}>
                    {s.next}
                  </td>
                  <td>
                    <span className="tnum">{s.term}</span>
                  </td>
                  <td>
                    {status === "live" ? (
                      <span className="status-tag" style={{ background: "var(--live-soft)", color: "var(--live)" }}>
                        <span className="live-dot" style={{ background: "var(--live)" }} /> Live now
                      </span>
                    ) : status === "done" ? (
                      <span className="status-tag st-mastered">
                        <Icon n="check" size={12} /> Done
                      </span>
                    ) : (
                      <span className="status-tag st-progress">Upcoming</span>
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
