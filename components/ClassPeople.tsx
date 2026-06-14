// Left column of the live console — participant tiles + class plan.
// Ported from class-experience.html .class-people + updatePlan().
import { PLAN_ORDER } from "@/lib/lesson";
import type { Driver } from "@/lib/types";

const PLAN_ITEMS: { key: string; label: string }[] = [
  { key: "warmup", label: "Warm-up chat · 3m" },
  { key: "Listen", label: "🎧 Listen · 5m" },
  { key: "Read", label: "📖 Read · 8m" },
  { key: "Speak", label: "🗣️ Speak · 6m" },
  { key: "Write", label: "✍️ Write · 5m" },
  { key: "wrap", label: "Wrap + parent note · 3m" },
];

export default function ClassPeople({
  coachName,
  coachInitial,
  kidName,
  kidInitial,
  sharer,
  activePlanKey,
}: {
  coachName: string;
  coachInitial: string;
  kidName: string;
  kidInitial: string;
  sharer: Driver;
  activePlanKey: string;
}) {
  const order: readonly string[] = PLAN_ORDER;
  const activeIdx = order.indexOf(activePlanKey);

  return (
    <aside className="class-people">
      <div className="cp-tile cp-coach">
        <div className="cp-video">
          <div className="cp-avatar">{coachInitial}</div>
          <div className="cp-badge">🎙️ 📹</div>
          {sharer === "coach" && <div className="cp-share">🖥️ sharing</div>}
        </div>
        <div className="cp-name">
          {coachName} <span className="cp-role">coach</span>
        </div>
      </div>

      <div className="cp-tile cp-student">
        <div className="cp-video">
          <div className="cp-avatar cp-avatar-kid">{kidInitial}</div>
          <div className="cp-badge">🎙️ 📹</div>
          {sharer === "student" && <div className="cp-share">🖥️ sharing</div>}
        </div>
        <div className="cp-name">
          {kidName} <span className="cp-role">student</span>
        </div>
      </div>

      <div className="cp-note">
        1:1 live class on the web platform
        <br />
        (student.cueword.com / coach.cueword.com) over Zoom.
      </div>

      <div className="cp-plan">
        <div className="cp-plan-title">Class plan · ~30 min</div>
        {PLAN_ITEMS.map((it) => {
          const i = order.indexOf(it.key);
          const classes = ["cpp-item"];
          if (it.key === activePlanKey) classes.push("cpp-active");
          else if (i > -1 && activeIdx > -1 && i < activeIdx) classes.push("cpp-done");
          return (
            <div key={it.key} className={classes.join(" ")}>
              {it.label}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
