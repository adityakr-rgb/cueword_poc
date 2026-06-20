// The ~30-min class timeline with the current phase highlighted and the past
// phases marked done. Extracted so both the coach's left column (ClassPeople)
// and the student's right rail (LiveClass) render the exact same plan.
import { PLAN_ORDER } from "../lib/lesson";

const PLAN_ITEMS: { key: string; label: string }[] = [
  { key: "warmup", label: "Warm-up chat · 3m" },
  { key: "Listen", label: "🎧 Listen · 5m" },
  { key: "Read", label: "📖 Read · 8m" },
  { key: "Speak", label: "🗣️ Speak · 6m" },
  { key: "Write", label: "✍️ Write · 5m" },
  { key: "wrap", label: "Wrap + parent note · 3m" },
];

export default function ClassPlan({ activePlanKey }: { activePlanKey: string }) {
  const order: readonly string[] = PLAN_ORDER;
  const activeIdx = order.indexOf(activePlanKey);

  return (
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
  );
}
