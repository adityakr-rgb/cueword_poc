"use client";
/* Screen 6 — Marking queue (ported from app/screen_marking.jsx → Marking list). */
import { useRouter } from "next/navigation";
import { Avatar, SkillChip, AITag } from "@/components/Icon";
import { CW } from "@/data/coachData";

export default function MarkingPage() {
  const C = CW;
  const router = useRouter();
  return (
    <div className="content-inner fade-up">
      <h1 className="page-title">Marking</h1>
      <p className="page-sub">{C.submissions.length} items awaiting your review · AI has pre-scored the ready ones</p>
      <div className="card" style={{ marginTop: "var(--pad)", overflow: "hidden" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Student</th>
              <th>Artifact</th>
              <th>Lesson</th>
              <th>Submitted</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {C.submissions.map((m) => {
              const st = C.byId(m.studentId)!;
              return (
                <tr key={m.id} className="clickable" onClick={() => router.push(`/marking/${m.id}`)}>
                  <td>
                    <div className="cell-student">
                      <Avatar name={st.name} color={st.color} size={32} />
                      <b>{st.name}</b>
                    </div>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      <SkillChip skill={m.skill} level={m.level} />
                      <span style={{ fontSize: 12.5 }}>{m.type}</span>
                    </div>
                  </td>
                  <td className="muted" style={{ fontSize: 12.5 }}>
                    {m.lesson}
                  </td>
                  <td className="muted tnum" style={{ fontSize: 12.5 }}>
                    {m.date}
                  </td>
                  <td>{m.aiReady ? <AITag>AI ready</AITag> : <span className="muted" style={{ fontSize: 12 }}>Needs scoring</span>}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="link">Review</button>
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
