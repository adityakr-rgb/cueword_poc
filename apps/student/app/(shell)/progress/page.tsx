"use client";
// My Progress (module 12) — KID-FACING. A celebratory, adventure-style view for
// students in Grades 3–5: a warm hero, the belt quest, a shelf of finished
// stories (tap to re-read in review mode), collectable badges, a few fun stats,
// and one gold-star shout-out from the coach. (Parent KPIs are intentionally
// left off this page.)
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Ic, Sunny } from "@/components/Ic";
import { DATA } from "@/data/studentData";
import { STORY_LIB, type Story } from "@/data/storyLib";

export default function Progress() {
  const router = useRouter();
  const G = DATA.GAMIFY;
  const PD = DATA.PARENT;
  const s = DATA.student;

  const belt = G.belts[G.beltIndex];
  const nextBelt = G.belts[G.beltIndex + 1] || belt;
  const beltPct = Math.min(100, Math.round((G.points / G.beltTarget) * 100));
  const ptsToGo = Math.max(0, G.beltTarget - G.points);

  // Story Shelf — the distinct stories the student has already finished, derived
  // from the curriculum's "done" lessons (same slot→story mapping as My Stories).
  const lib = STORY_LIB.STORIES;
  const TC = DATA.TERM_CURRICULUM;
  const assigned = TC.terms.find((t) => t.n === TC.assignedTerm);
  const seen = new Set<string>();
  const finishedStories: Story[] = [];
  (assigned?.levels || []).forEach((lv) =>
    lv.lessons.forEach((le) => {
      if (le.status === "done") {
        const st = lib[(le.no - 1) % lib.length];
        if (st && !seen.has(st.id)) {
          seen.add(st.id);
          finishedStories.push(st);
        }
      }
    }),
  );

  const storiesFinished = DATA.PARENT.stories.done;
  const words = new Set<string>();
  finishedStories.forEach((st) => st.complete?.vocab?.forEach((v) => words.add(v)));
  const wordsCollected = words.size;

  return (
    <div className="page page-wide view-enter cw-kidprog">
      {/* ---- Hero ---- */}
      <div className="kp-hero">
        <span className="kp-hero-fox">
          <Sunny size={92} />
        </span>
        <div className="kp-hero-txt">
          <div className="h-eyebrow">My Progress</div>
          <h1 className="kp-hero-h1">Look how far you&apos;ve come, {s.first}! 🎉</h1>
          <p className="kp-hero-sub">
            You&apos;re a <b>{belt.name} Belt</b> on <b>Level {G.level.current}</b>. Keep it up — you&apos;re doing brilliantly!
          </p>
        </div>
      </div>

      {/* ---- Belt quest ---- */}
      <div className="kp-section-title">🥋 Your belt quest</div>
      <div className="kp-belt" style={{ "--belt-c": belt.color } as CSSProperties}>
        <div className="kp-belt-ring">
          <BeltRing pct={beltPct} color={belt.color} />
          <div className="kp-belt-center">
            <span className="kp-belt-knot" style={{ background: belt.color }}>
              <Ic.medal size={24} stroke={belt.ink} />
            </span>
            <span className="kp-belt-name">{belt.name}</span>
          </div>
        </div>
        <div className="kp-belt-detail">
          <div className="kp-belt-h">
            {ptsToGo > 0 ? (
              <>
                You&apos;re SO close — just <b>{ptsToGo} points</b> to your <b>{nextBelt.name} Belt!</b>
              </>
            ) : (
              <>You&apos;ve maxed this belt — amazing! 🎉</>
            )}
          </div>
          <div className="kp-belt-bar">
            <i style={{ width: `${beltPct}%`, background: belt.color }} />
          </div>
          <div className="kp-belt-pips">
            {G.belts.map((b, i) => (
              <span
                key={b.name}
                className={"kp-pip" + (i < G.beltIndex ? " done" : i === G.beltIndex ? " now" : "")}
                style={{ "--bp": b.color } as CSSProperties}
                title={b.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ---- Story Shelf ---- */}
      <div className="kp-section-title">
        📖 Stories you&apos;ve finished <span className="kp-st-hint">tap any to read it again</span>
      </div>
      <div className="kp-shelf">
        {finishedStories.map((st) => (
          <button key={st.id} className="kp-story" onClick={() => router.push(`/story/${st.id}?review=1`)}>
            <span className="kp-story-cover" style={{ background: st.themeColor }}>
              {st.cover}
            </span>
            <span className="kp-story-title">{st.title}</span>
            <span className="kp-story-cta">
              <Ic.check size={13} stroke="var(--good)" /> Finished
            </span>
          </button>
        ))}
      </div>

      {/* ---- Stats ---- */}
      <div className="kp-section-title">📊 Your stats</div>
      <div className="kp-stats">
        <div className="kp-stat">
          <span className="kp-stat-ico">📚</span>
          <span className="kp-stat-big">{storiesFinished}</span>
          <span className="kp-stat-label">Stories finished</span>
          <span className="kp-stat-sub">this term</span>
        </div>
        <div className="kp-stat">
          <span className="kp-stat-ico">🔤</span>
          <span className="kp-stat-big">{wordsCollected}</span>
          <span className="kp-stat-label">Words collected</span>
          <span className="kp-stat-sub">in your word deck</span>
        </div>
        <div className="kp-stat">
          <span className="kp-stat-ico">⭐</span>
          <span className="kp-stat-big">{PD.storyAccuracy}%</span>
          <span className="kp-stat-label">Avg. accuracy · stories</span>
          <span className="kp-stat-sub">across all stories</span>
        </div>
        <div className="kp-stat">
          <span className="kp-stat-ico">🎯</span>
          <span className="kp-stat-big">{PD.workoutAccuracy}%</span>
          <span className="kp-stat-label">Avg. accuracy · workouts</span>
          <span className="kp-stat-sub">across all workouts</span>
        </div>
      </div>

      {/* ---- Recent coach feedback ---- */}
      <div className="kp-section-title">💬 Recent coach feedback</div>
      <div className="kp-feedback">
        {PD.recentFeedback.map((f, i) => {
          const m = DATA.SKILLS.find((x) => x.id === f.skill);
          return (
            <div key={i} className="kp-fb">
              <div className="kp-fb-head">
                <Avatar size={36} name="L" />
                <div className="kp-fb-meta">
                  <div className="kp-fb-coach">{f.coach}</div>
                  <div className="kp-fb-ctx">
                    <span className="kp-skill-tag" style={{ background: m?.wash, color: m?.color }}>
                      {m?.name}
                    </span>
                    <span className="kp-fb-lesson">{f.lesson}</span>
                  </div>
                </div>
                <span className="kp-fb-date">{f.date}</span>
              </div>
              <p className="kp-fb-text">“{f.text}”</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* belt progress ring */
function BeltRing({ pct, color }: { pct: number; color: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg className="kp-ring" width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="11" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        transform="rotate(-90 60 60)"
      />
    </svg>
  );
}
