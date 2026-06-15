// Left column of the live console — a Zoom placeholder + the class plan.
// The two cosmetic video tiles (coach + student) were intentionally replaced by
// a single "Place your Zoom window here" stage: the real 1:1 video runs in Zoom,
// side-by-side with this class web app. Shared by the student live view, the
// coach live console, and the coach "waiting for story" view.
import { PLAN_ORDER } from "../lib/lesson";

const PLAN_ITEMS: { key: string; label: string }[] = [
  { key: "warmup", label: "Warm-up chat · 3m" },
  { key: "Listen", label: "🎧 Listen · 5m" },
  { key: "Read", label: "📖 Read · 8m" },
  { key: "Speak", label: "🗣️ Speak · 6m" },
  { key: "Write", label: "✍️ Write · 5m" },
  { key: "wrap", label: "Wrap + parent note · 3m" },
];

export default function ClassPeople({ activePlanKey }: { activePlanKey: string }) {
  const order: readonly string[] = PLAN_ORDER;
  const activeIdx = order.indexOf(activePlanKey);

  return (
    <aside className="class-people">
      <div className="cp-zoom-stage">
        <div className="cp-zoom-icon">🎥</div>
        <div className="cp-zoom-title">Place your Zoom window here</div>
        <div className="cp-zoom-sub">
          Your 1:1 video runs in Zoom, side-by-side with the class.
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
