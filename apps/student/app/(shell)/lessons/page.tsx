"use client";
// My Stories (module 09) — the student's term-led story library. A box of 3
// Terms; the assigned term expands into 8 Levels; each Level holds 10 Stories +
// a Workout. Each story slot maps to a library story so the card art, theme and
// player content all match. Tapping a story opens the self-serve Story (/story).
import { useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Ic, Sunny } from "@/components/Ic";
import { DATA, type CurriculumLesson, type CurriculumLevel } from "@/data/studentData";
import { STORY_LIB, type Story } from "@/data/storyLib";

const SCENE_BG: Record<string, string> = {
  space: "linear-gradient(155deg,#0F1830,#2F3B5C)",
  rome: "linear-gradient(155deg,#8B3A2A,#D89A6A)",
  nature: "linear-gradient(155deg,#1E4D32,#5FA873)",
  time: "linear-gradient(155deg,#2A2348,#7C6BA8)",
  ocean: "linear-gradient(155deg,#062B3A,#1E7E9C)",
  storm: "linear-gradient(155deg,#2B2140,#8A6BB0)",
};

/* map a curriculum slot (by global story number) to a library story */
function storyForSlot(no: number): Story {
  const lib = STORY_LIB.STORIES;
  return lib[(no - 1) % lib.length];
}

export default function Lessons() {
  const TC = DATA.TERM_CURRICULUM;
  const assigned = TC.terms.find((t) => t.n === TC.assignedTerm)!;
  const [openLevel, setOpenLevel] = useState(3); // current level

  return (
    <div className="page page-wide view-enter">
      <div className="page-head">
        <div>
          <div className="h-eyebrow">My Stories</div>
          <h1 className="page-h1">
            Term {assigned.n} · {assigned.sub}
          </h1>
        </div>
        <Sunny size={52} />
      </div>
      <p className="page-lead">
        Every story weaves <b>listening</b>, <b>reading</b>, <b>speaking</b> and <b>writing</b> into one adventure. Term {assigned.n} has{" "}
        <b>8 levels</b>, each with <b>10 stories</b> and a Workout. Your coach unlocks each level as you&apos;re ready.
      </p>

      {/* Terms box */}
      <div className="terms-box">
        {TC.terms.map((t) => {
          const isAssigned = t.n === TC.assignedTerm;
          return (
            <div key={t.n} className={"term-card " + (isAssigned ? "assigned" : "locked")}>
              <div className="tcd-top">
                <span className="tcd-n">Term {t.n}</span>
                {isAssigned ? <span className="tcd-tag">You&apos;re here</span> : <Ic.lock size={17} stroke="var(--locked)" />}
              </div>
              <div className="tcd-sub">{t.sub}</div>
              {isAssigned ? (
                <div className="tcd-meta">8 levels · 80 stories</div>
              ) : (
                <div className="tcd-meta locked">Unlocks when you re-enrol</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Levels of the assigned term */}
      <div className="levels">
        {(assigned.levels || []).map((lv) => {
          const doneCount = lv.lessons.filter((le) => le.status === "done").length;
          const locked = lv.state === "locked";
          const isOpen = openLevel === lv.lvl && !locked;
          return (
            <div key={lv.lvl} className={"lvl " + lv.state + (isOpen ? " open" : "")}>
              <button className="lvl-head" disabled={locked} onClick={() => setOpenLevel(isOpen ? -1 : lv.lvl)}>
                <span className={"lvl-num " + lv.state}>{lv.state === "done" ? <Ic.check size={20} stroke="#fff" /> : lv.lvl}</span>
                <span className="lvl-titles">
                  <span className="lvl-title">
                    Level {lv.lvl} · {lv.title}
                    {lv.state === "current" && <span className="lvl-here">In progress</span>}
                  </span>
                  <span className="lvl-meta">
                    {locked ? (
                      <>
                        <Ic.lock size={13} /> Unlocks after Level {lv.lvl - 1}
                      </>
                    ) : (
                      `${lv.lessons.length} stories · ${doneCount} done`
                    )}
                  </span>
                </span>
                {!locked && <Ic.chevD size={22} stroke="var(--ink-3)" className={"lvl-chev" + (isOpen ? " up" : "")} />}
              </button>

              {isOpen && (
                <div className="stories-wrap view-enter">
                  <div className="ll-note">
                    <Ic.calendar size={15} stroke="var(--gold-deep)" /> Stories open as you go. Tap one to start the Listen → Read → Speak →
                    Write journey.
                  </div>
                  <div className="story-grid">
                    {lv.lessons.map((le) => (
                      <StoryCard key={le.code} le={le} />
                    ))}
                  </div>
                  <LevelWorkout lv={lv} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StoryCard({ le }: { le: CurriculumLesson }) {
  const router = useRouter();
  const story = storyForSlot(le.no);
  const locked = le.status === "upcoming" || le.status === "locked";
  const inProgress = le.status === "today";
  const done = le.status === "done";
  const pct = done ? 100 : inProgress ? 40 : 0;

  const open = () => {
    // A finished story replays in review mode, so the answers are shown.
    if (!locked) router.push(`/story/${story.id}${done ? "?review=1" : ""}`);
  };

  return (
    <button
      className={"story-card" + (locked ? " locked" : "")}
      onClick={open}
      disabled={locked}
      style={{ "--sc-c": story.themeColor } as CSSProperties}
    >
      <div className="sc-cover" style={{ background: SCENE_BG[story.sceneKind] || SCENE_BG.space }}>
        <span className="sc-emoji">{story.cover}</span>
        {done && (
          <span className="sc-badge sc-badge-done">
            <Ic.check size={12} stroke="#fff" /> Completed
          </span>
        )}
        {inProgress && <span className="sc-badge sc-badge-now">▸ Continue</span>}
        {le.status === "upcoming" && (
          <span className="sc-badge sc-badge-soon">
            <Ic.lock size={11} /> Upcoming
          </span>
        )}
        {le.status === "locked" && (
          <span className="sc-badge sc-badge-soon">
            <Ic.lock size={11} /> Locked
          </span>
        )}
      </div>
      <div className="sc-body">
        <div className="sc-theme">
          <span className="sc-dot" style={{ background: story.themeColor }} />
          {story.theme}
        </div>
        <div className="sc-title">{story.title}</div>
        <div className="sc-blurb">{story.blurb}</div>

        {(done || inProgress) && (
          <div className="sc-progress">
            <div className="sc-progress-bar">
              <div className="sc-progress-fill" style={{ width: pct + "%" }} />
            </div>
            <span className="sc-progress-pct">{pct}%</span>
          </div>
        )}

        <div className="sc-foot">
          <div className="sc-stats">
            <span>⏱ {story.duration}</span>
            <span className="sc-fdot">·</span>
            <span>{story.points}</span>
          </div>
          <span className="sc-cta">
            {done ? (
              <>
                Replay <Ic.arrowR size={15} />
              </>
            ) : inProgress ? (
              <>Resume ▶</>
            ) : locked ? (
              <>Soon</>
            ) : (
              <>Start ▶</>
            )}
          </span>
        </div>
      </div>
    </button>
  );
}

/* Each level closes with a Workout (vocab + comprehension + expression drills) */
function LevelWorkout({ lv }: { lv: CurriculumLevel }) {
  const router = useRouter();
  const w = lv.workout;
  if (!w) return null;
  const locked = w.state === "locked";
  return (
    <div className={"lvl-workout " + w.state}>
      <span className="lw-ico">
        <Ic.target size={20} stroke={locked ? "var(--ink-3)" : "var(--minor-deep)"} />
      </span>
      <div className="lw-body">
        <div className="lw-title">Level {lv.lvl} Workout</div>
        <div className="lw-sub">{w.items} mixed drills · vocabulary, comprehension &amp; expression</div>
      </div>
      {w.state === "done" && (
        <span className="lw-state done">
          <Ic.check size={14} stroke="var(--good)" /> {w.score}
        </span>
      )}
      {w.state === "open" && (
        <button className="lw-btn" onClick={() => router.push("/workouts")}>
          Practise <Ic.arrowR size={15} />
        </button>
      )}
      {locked && (
        <span className="lw-state">
          <Ic.lock size={13} /> Finish the stories first
        </span>
      )}
    </div>
  );
}
