"use client";
// My Progress (module 12) — PARENT-facing dashboard. Leads with the dual Belt +
// Level system and the multi-skill gates (you can't belt-up by maxing one skill
// — every skill must clear the threshold), plus milestone alerts. Then parent
// KPIs, coach feedback and term milestones.
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Ic } from "@/components/Ic";
import { DATA } from "@/data/studentData";

export default function Progress() {
  const router = useRouter();
  const P = DATA.PROGRESS;
  const PD = DATA.PARENT;
  const G = DATA.GAMIFY;
  const s = DATA.student;

  const belt = G.belts[G.beltIndex];
  const nextBelt = G.belts[G.beltIndex + 1];
  const minPts = Math.min(...G.skills.map((x) => x.pts));
  const beltPct = Math.min(100, Math.round((minPts / G.gateTarget) * 100));
  const blocker = G.skills.filter((x) => x.pts < G.gateTarget).sort((a, b) => a.pts - b.pts)[0];

  return (
    <div className="page page-wide view-enter">
      <div className="page-head">
        <div>
          <div className="h-eyebrow">My Progress</div>
          <h1 className="page-h1">{s.first}&apos;s learning journey</h1>
        </div>
        <span className="parent-pill">
          <Ic.eye size={16} /> Parent view
        </span>
      </div>

      {/* Child snapshot banner */}
      <div className="child-banner">
        <Avatar size={62} name={s.first} />
        <div className="cb-id">
          <div className="cb-name">{s.first} P.</div>
          <div className="cb-sub">
            Grade {s.grade} · with {s.coach}
          </div>
        </div>
        <div className="cb-divide" />
        <div className="cb-fact">
          <div className="cbf-label">Belt</div>
          <div className="cbf-value">
            {belt.name} · Level {G.level.current}/{G.level.total}
          </div>
        </div>
        <div className="cb-fact">
          <div className="cbf-label">Next class</div>
          <div className="cbf-value">Today · 4:00 PM</div>
        </div>
        <button className="btn btn-ghost cb-btn" onClick={() => router.push("/schedule")}>
          View schedule
        </button>
      </div>

      {/* Belt hero */}
      <div className="section-title" style={{ marginTop: 28 }}>
        Belt &amp; level
      </div>
      <div className="belt-hero" style={{ "--belt-c": belt.color } as CSSProperties}>
        <div className="belt-art">
          <BeltRing pct={beltPct} color={belt.color} />
          <div className="belt-center">
            <span className="belt-knot" style={{ background: belt.color }}>
              <Ic.medal size={22} stroke={belt.ink} />
            </span>
            <span className="belt-name">{belt.name}</span>
            <span className="belt-tier">
              Belt {G.beltIndex + 1} / {G.belts.length}
            </span>
          </div>
        </div>
        <div className="belt-info">
          <div className="belt-eyebrow">Working toward {nextBelt.name} belt</div>
          <div className="belt-h">
            {beltPct}% of the way to {nextBelt.name}
          </div>
          <div className="belt-sub">
            A belt is earned across <b>all four skills</b> — not one. {s.first} is strong in Reading, but <b>{blocker.name}</b> needs{" "}
            {G.gateTarget - blocker.pts} more points before the {nextBelt.name} belt unlocks.
          </div>
          <div className="belt-track">
            {G.belts.map((b, i) => (
              <span
                key={b.name}
                className={"belt-pip" + (i < G.beltIndex ? " done" : i === G.beltIndex ? " now" : "")}
                style={{ "--bp": b.color } as CSSProperties}
                title={b.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Multi-skill gates */}
      <div className="gate-card">
        <div className="gate-head">
          <Ic.target size={22} stroke="var(--gold-deep)" />
          <div className="gh-txt">
            <div className="gate-title">What it takes to level up</div>
            <div className="gate-note">
              Each skill earns its own points. The next belt opens only when <b>every</b> skill reaches {G.gateTarget} — so a high Reading
              score can&apos;t carry a low one.
            </div>
          </div>
        </div>
        <div className="gate-grid">
          {G.skills.map((sk) => {
            const Cic = Ic[sk.icon] || Ic.book;
            const met = sk.pts >= G.gateTarget;
            const pct = Math.min(100, (sk.pts / G.gateTarget) * 100);
            return (
              <div key={sk.id} className="gate-row">
                <span className="gate-ico" style={{ background: sk.wash, color: sk.color }}>
                  <Cic size={18} stroke={sk.color} />
                </span>
                <div className="gate-body">
                  <div className="gate-top">
                    <span className="gate-name">{sk.name}</span>
                    <span className={"gate-pts " + (met ? "met" : "short")}>
                      {sk.pts} / {G.gateTarget}
                    </span>
                  </div>
                  <div className="gate-bar">
                    <i style={{ width: `${pct}%`, background: met ? "var(--good)" : sk.color }} />
                  </div>
                  <span className={"gate-status " + (met ? "met" : "short")}>
                    {met ? (
                      <>
                        <Ic.check size={13} /> Ready
                      </>
                    ) : (
                      <>
                        <Ic.lock size={12} /> {G.gateTarget - sk.pts} pts to go
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Level + milestone alerts */}
      <div className="lvl-row">
        <div className="level-card">
          <div className="level-top">
            <div className="level-badge">
              <b>{G.level.current}</b>
              <span>Level</span>
            </div>
            <div className="level-titles">
              <div className="lt-h">
                Level {G.level.current} of {G.level.total}
              </div>
              <div className="lt-sub">
                Term 1 · Foundations · {G.level.storiesDone}/{G.level.storiesTotal} stories this level
              </div>
            </div>
          </div>
          <div className="level-dots">
            {Array.from({ length: G.level.storiesTotal }).map((_, i) => (
              <span key={i} className={"level-dot" + (i < G.level.storiesDone ? " done" : i === G.level.storiesDone ? " next" : "")}>
                {i < G.level.storiesDone ? <Ic.check size={13} stroke="#fff" /> : null}
              </span>
            ))}
          </div>
          <div className="level-foot">
            <b>{G.level.storiesTotal - G.level.storiesDone} more stories</b> to reach Level {G.level.current + 1}.
          </div>
        </div>

        <div className="alerts-card">
          <div className="alerts-title">Keep going</div>
          {G.alerts.map((a, i) => {
            const Aic = Ic[a.icon] || Ic.flag;
            return (
              <div key={i} className="alert-row">
                <span className={"alert-ico " + a.tone}>
                  <Aic size={17} />
                </span>
                <span className="alert-text">{a.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI strip — parent-facing term stats */}
      <div className="section-title" style={{ marginTop: 28 }}>
        This term at a glance
      </div>
      <div className="kpi-row">
        <Kpi
          icon="calendar"
          tint="var(--listening)"
          wash="var(--listening-wash)"
          big={`${PD.attendance.attended}/${PD.attendance.total}`}
          label="Classes attended"
          sub={`${Math.round((PD.attendance.attended / PD.attendance.total) * 100)}% of sessions completed`}
        />
        <Kpi icon="book" tint="var(--reading)" wash="var(--reading-wash)" big={`${PD.stories.done}`} label="Stories completed" sub={`of ${PD.stories.total} this term`} />
        <Kpi
          icon="target"
          tint="var(--writing)"
          wash="var(--writing-wash)"
          big={`${PD.workouts.done}`}
          label="Workouts completed"
          sub={`${PD.workouts.assigned - PD.workouts.done} still to try`}
        />
        <Kpi icon="star" tint="var(--speaking)" wash="var(--speaking-wash)" big={`${PD.storyAccuracy}%`} label="Avg. accuracy · stories" sub="across all stories" />
        <Kpi icon="star" tint="var(--gold-deep)" wash="var(--gold-wash)" big={`${PD.workoutAccuracy}%`} label="Avg. accuracy · workouts" sub="across all workouts" />
        <Kpi icon="flag" tint="var(--minor)" wash="var(--minor-wash)" big={`${PD.nextMilestone.daysAway} days`} label="Until next milestone" sub={PD.nextMilestone.label} />
      </div>

      {/* feedback + milestones */}
      <div className="prog-cols2">
        <div>
          <div className="section-title">Recent coach feedback</div>
          <div className="feedback-list">
            {PD.recentFeedback.map((f, i) => {
              const m = DATA.SKILLS.find((x) => x.id === f.skill);
              return (
                <div key={i} className="fb-card">
                  <div className="fb-head">
                    <Avatar size={34} name="B" />
                    <div className="fb-meta">
                      <div className="fb-coach">{f.coach}</div>
                      <div className="fb-ctx">
                        <span className="skill-tag" style={{ background: m?.wash, color: m?.color }}>
                          <span className="st-dot" style={{ background: m?.color }} /> {m?.name}
                        </span>
                        <span className="fb-lesson">{f.lesson}</span>
                      </div>
                    </div>
                    <span className="fb-date">{f.date}</span>
                  </div>
                  <p className="fb-text">“{f.text}”</p>
                </div>
              );
            })}
            <button className="fb-more" onClick={() => router.push("/works")}>
              See {s.first}&apos;s portfolio <Ic.arrowR size={15} />
            </button>
          </div>
        </div>

        <div>
          <div className="section-title">Term milestones</div>
          <div className="timeline card">
            {P.milestones.map((m, i) => (
              <div key={i} className={"tl-row" + (m.done ? " done" : "")}>
                <span className="tl-dot">{m.done ? <Ic.check size={15} stroke="#fff" /> : <Ic.flag size={14} stroke="var(--ink-3)" />}</span>
                <span className="tl-label">{m.label}</span>
                <span className="tl-date">{m.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* belt progress ring */
function BeltRing({ pct, color }: { pct: number; color: string }) {
  const r = 58;
  const c = 2 * Math.PI * r;
  return (
    <svg className="belt-ring" width="132" height="132" viewBox="0 0 132 132">
      <circle cx="66" cy="66" r={r} fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="10" />
      <circle
        cx="66"
        cy="66"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
      />
    </svg>
  );
}

function Kpi({ icon, tint, wash, big, label, sub }: { icon: string; tint: string; wash: string; big: string; label: string; sub: string }) {
  const C = Ic[icon] || Ic.star;
  return (
    <div className="kpi-card">
      <span className="kpi-ico" style={{ background: wash, color: tint }}>
        <C size={22} stroke={tint} />
      </span>
      <div className="kpi-big" style={{ color: tint }}>
        {big}
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}
