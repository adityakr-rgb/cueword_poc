// Left column of the live console — a Zoom placeholder + the class plan.
// The two cosmetic video tiles (coach + student) were intentionally replaced by
// a single "Place your Zoom window here" stage: the real 1:1 video runs in Zoom,
// side-by-side with this class web app. Shared by the student live view, the
// coach live console, and the coach "waiting for story" view.
import ClassPlan from "./ClassPlan";

export default function ClassPeople({ activePlanKey }: { activePlanKey: string }) {
  return (
    <aside className="class-people">
      <div className="cp-zoom-stage">
        <div className="cp-zoom-icon">🎥</div>
        <div className="cp-zoom-title">Place your Zoom window here</div>
        <div className="cp-zoom-sub">Your 1:1 video runs in Zoom, side-by-side with the class.</div>
      </div>

      <div className="cp-note">
        1:1 live class on the web platform
        <br />
        (student.cueword.com / coach.cueword.com) over Zoom.
      </div>

      <ClassPlan activePlanKey={activePlanKey} />
    </aside>
  );
}
