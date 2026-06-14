"use client";
import { getStory } from "@/lib/stories";
import type { StoryKey, StoryRow } from "@/lib/types";

/** The student's assigned-story slate. Tapping a card is the magic moment. */
export default function StorySlate({
  stories,
  onPick,
  disabled,
}: {
  stories: StoryRow[];
  onPick: (key: StoryKey) => void;
  disabled?: boolean;
}) {
  if (stories.length === 0) {
    return <div className="cw-slate-empty">No stories assigned yet — ask your admin.</div>;
  }
  return (
    <div className="cw-slate-grid">
      {stories.map((s) => {
        const g = getStory(s.key);
        return (
          <button
            key={s.id}
            className="carousel-card cw-slate-card"
            disabled={disabled}
            onClick={() => onPick(s.key as StoryKey)}
          >
            <div
              className="cc-cover"
              style={{ background: g?.scene.bg ?? s.theme_color ?? "#1A2540" }}
            >
              {g?.scene.image ? (
                <img className="cw-cover-img" src={g.scene.image} alt="" />
              ) : (
                <div className="cw-cover-emoji">{s.cover_emoji ?? g?.cover ?? "📖"}</div>
              )}
              <div className="cc-badge cc-badge-new">✦ Open in class</div>
            </div>
            <div className="cc-body">
              <div className="cc-theme">
                <span className="theme-dot" style={{ background: s.theme_color ?? "#888" }} />
                {s.theme}
              </div>
              <h3 className="cc-title">{s.title}</h3>
              {g && <p className="cc-desc">{g.about}</p>}
              <div className="cc-foot">
                <div className="cc-stats">
                  <span>⏱ {g?.duration ?? ""}</span>
                  <span className="cc-dot">·</span>
                  <span>{s.grade}</span>
                </div>
                <span className="cc-cta cc-cta-resume">Open ▶</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
