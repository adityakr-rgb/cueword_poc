"use client";
// Home dashboard (module 08) — next class, vocab warmup, flagged review,
// skill levels, workouts, resume. The "Join Zoom Class" affordance flows
// through the cosmetic NetCheck animation, whose final action is the dynamic
// seam: open the real Zoom in a new tab AND enter the live class (/live).
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { getZoomLink } from "@cueword/core/lib/config";
import { Avatar, Ic, Sunny } from "@/components/Ic";
import { DATA, type SkillId } from "@/data/studentData";

function SkillGlyph({ id, size = 24, color = "currentColor" }: { id: SkillId; size?: number; color?: string }) {
  const map: Record<SkillId, (typeof Ic)[string]> = { reading: Ic.book, listening: Ic.ear, writing: Ic.pencil, speaking: Ic.mic };
  const C = map[id] || Ic.book;
  return <C size={size} stroke={color} />;
}

function niceDate() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function Home() {
  const router = useRouter();
  const D = DATA;
  const s = D.student;
  const nc = D.NEXT_CLASS;
  const [check, setCheck] = useState(false);

  // The seam: Zoom opens in a new tab AND the student enters the live class.
  const joinClass = () => {
    try {
      window.open(getZoomLink(), "_blank", "noopener,noreferrer");
    } catch {
      /* popup blocked — still navigate to the live class */
    }
    router.push("/live");
  };

  return (
    <div className="page view-enter">
      {check && <NetCheck coach={nc.coach} onClose={() => setCheck(false)} onJoin={joinClass} />}
      {/* hero + next class */}
      <div className="home-hero">
        <div className="hero-greet">
          <div className="hero-sun">
            <Sunny size={64} />
          </div>
          <div>
            <div className="h-eyebrow">{niceDate()}</div>
            <h1 className="hero-h1">Hi {s.first}! Ready to learn?</h1>
            <p className="hero-sub">
              You have a class with <b>{nc.coach}</b> today. Let&apos;s get ready! 🌟
            </p>
          </div>
        </div>

        <div className="nextclass card">
          <div className="nc-top">
            <span className="pill" style={{ background: "var(--gold-wash)", color: "var(--gold-ink)" }}>
              <Ic.clock size={15} /> Next class
            </span>
            <span className="nc-when">
              {nc.when} · {nc.time} <span className="nc-tz">{nc.tz}</span>
            </span>
          </div>
          <div className="nc-body">
            <Avatar size={52} name="B" />
            <div>
              <div className="nc-coach">{nc.coach}</div>
              <div className="nc-meta">1-on-1 class · starts in {nc.inMins} min</div>
            </div>
          </div>
          <button className="btn btn-gold btn-lg btn-block" onClick={() => setCheck(true)}>
            <Ic.zoom size={22} /> Join Zoom Class
          </button>
          <div className="nc-hint">We&apos;ll do a quick connection check first ✨</div>
        </div>
      </div>

      {/* vocab warmup strip */}
      <VocabStrip />

      {/* flagged items the coach will review in class */}
      <FlaggedStrip />

      {/* skill levels */}
      <div className="section-title" style={{ marginTop: 30 }}>
        My Skill Levels
        <button className="more" onClick={() => router.push("/lessons")}>
          Go to My Stories →
        </button>
      </div>
      <div className="skill-grid">
        {D.SKILLS.map((sk) => (
          <button
            key={sk.id}
            className="skill-tile pop-in"
            style={{ "--c": sk.color, "--w": sk.wash } as CSSProperties}
            onClick={() => router.push("/lessons")}
          >
            <div className="st-ico">
              <SkillGlyph id={sk.id} size={26} color={sk.color} />
            </div>
            <div className="st-name">{sk.name}</div>
            <div className="st-lvl">
              Level {sk.level} <span>of {D.PROGRESS.levelsPerSkill}</span>
            </div>
            <div className="bar" style={{ marginTop: 10 }}>
              <i style={{ width: `${(sk.level / D.PROGRESS.levelsPerSkill) * 100}%`, background: sk.color }} />
            </div>
          </button>
        ))}
      </div>

      {/* workouts + resume */}
      <div className="home-cols">
        <div>
          <div className="section-title">
            My Workouts{" "}
            <button className="more" onClick={() => router.push("/workouts")}>
              See all →
            </button>
          </div>
          <div className="practice-list">
            {D.WORKOUTS.categories.map((c) => {
              const Cic = Ic[c.icon] || Ic.target;
              return (
                <button
                  key={c.id}
                  className="practice-row"
                  style={{ "--c": c.color, "--w": c.wash } as CSSProperties}
                  onClick={() => router.push("/workouts")}
                >
                  <span className="pr-ico" style={{ background: c.wash, color: c.color }}>
                    <Cic size={20} stroke={c.color} />
                  </span>
                  <div className="pr-mid">
                    <div className="pr-title">{c.name}</div>
                    <div className="pr-sub">
                      {c.mode === "auto" ? (
                        <>
                          <Ic.bolt size={12} /> Scored instantly
                        </>
                      ) : (
                        <>
                          <Ic.message size={12} /> Coach reviews
                        </>
                      )}
                    </div>
                  </div>
                  <Ic.chevR size={20} stroke="var(--ink-3)" />
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="section-title">Pick up where you left off</div>
          <div className="resume-list">
            {D.RESUME.map((r) => (
              <ResumeCard key={r.id} r={r} />
            ))}
            <div className="resume-empty">That&apos;s everything — nice and tidy! 🎉</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlaggedStrip() {
  const F = DATA.FLAGGED;
  if (!F || F.length === 0) return null;
  return (
    <div className="flag-strip pop-in">
      <div className="flag-head">
        <span className="flag-ico">
          <Ic.flag size={18} />
        </span>
        <div className="flag-htext">
          <b>To go over with your coach</b>
          <span>Tricky bits from your workouts — saved for your next class.</span>
        </div>
        <span className="flag-count">{F.length}</span>
      </div>
      <div className="flag-list">
        {F.map((f) => {
          const sk = DATA.SKILLS.find((x) => x.id === f.skill);
          return (
            <div key={f.id} className="flag-item">
              <span className="flag-dot" style={{ background: sk?.color }} />
              <div className="flag-imid">
                <div className="flag-ititle">{f.item}</div>
                <div className="flag-isub">
                  {f.title} · {sk?.name}
                </div>
              </div>
              <span className="flag-from">{f.from}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VocabStrip() {
  const v = DATA.VOCAB;
  const [flip, setFlip] = useState(false);
  return (
    <div className="vocab-strip pop-in">
      <div className="vs-left">
        <div className="vs-badge">
          <Ic.sparkle size={18} /> Daily Vocabulary Warmup
        </div>
        <div className="vs-word">
          {v.word} <span className="vs-pos">{v.pos}</span>
        </div>
        {flip ? (
          <div className="vs-mean view-enter">
            <b>Meaning:</b> {v.meaning}
            <br />
            <span className="vs-ex">“{v.example}”</span>
          </div>
        ) : (
          <div className="vs-prompt">Do you know what this word means?</div>
        )}
      </div>
      <div className="vs-right">
        <div className="vs-prog">
          {v.progress.done}/{v.progress.total} words today
        </div>
        <button className="btn btn-gold" onClick={() => setFlip((f) => !f)}>
          {flip ? "Got it! Next word" : "Reveal meaning"}
        </button>
      </div>
    </div>
  );
}

function ResumeCard({ r }: { r: (typeof DATA.RESUME)[number] }) {
  const router = useRouter();
  const sk = DATA.SKILLS.find((x) => x.id === r.skill);
  const storyId = r.skill === "speaking" ? "rome" : "astronaut";
  return (
    <button
      className="resume-card"
      style={{ "--c": sk?.color } as CSSProperties}
      onClick={() => router.push(`/story/${storyId}`)}
    >
      <div className="rc-top">
        <span className="pill" style={{ background: sk?.wash, color: sk?.color }}>
          <SkillGlyph id={r.skill} size={15} color={sk?.color} /> {sk?.name}
        </span>
        <span className="rc-lvl">Level {r.level}</span>
      </div>
      <div className="rc-title">{r.title}</div>
      <div className="rc-foot">
        <div className="bar" style={{ flex: 1 }}>
          <i style={{ width: `${(r.item / r.total) * 100}%`, background: sk?.color }} />
        </div>
        <span className="rc-prog">
          Item {r.item}/{r.total}
        </span>
      </div>
      <span className="rc-go">
        <Ic.play size={15} fill="currentColor" stroke="none" /> Resume
      </span>
    </button>
  );
}

/* Pre-class connection check — runs through each check, then lets student join.
   Cosmetic only; the final "Join class now" is the seam into the live class. */
function NetCheck({ coach, onClose, onJoin }: { coach: string; onClose: () => void; onJoin: () => void }) {
  const steps = DATA.NETCHECK;
  const [done, setDone] = useState(0);
  const allDone = done >= steps.length;

  useEffect(() => {
    if (allDone) return;
    const t = setTimeout(() => setDone((d) => d + 1), 850);
    return () => clearTimeout(t);
  }, [done, allDone]);

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="netcheck pop-in" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x nc-x" onClick={onClose}>
          <Ic.x size={16} />
        </button>
        <div className="nc-head">
          <div className="nc-sun">
            <Sunny size={56} mood={allDone ? "happy" : "neutral"} />
          </div>
          <h2 className="nc-title">{allDone ? "You're all set!" : "Quick connection check"}</h2>
          <p className="nc-desc">
            {allDone ? `Everything looks great. Time to meet ${coach}!` : "Let's make sure everything works before your class."}
          </p>
        </div>

        <div className="nc-steps">
          {steps.map((st, i) => {
            const state = i < done ? "ok" : i === done ? "running" : "wait";
            const C = Ic[st.icon] || Ic.wifi;
            return (
              <div key={st.id} className={"nc-step " + state}>
                <span className="ncs-ico">
                  <C size={20} />
                </span>
                <span className="ncs-mid">
                  <span className="ncs-label">{st.label}</span>
                  <span className="ncs-detail">{state === "ok" ? st.ok : state === "running" ? st.detail : "Waiting…"}</span>
                </span>
                <span className="ncs-state">
                  {state === "ok" && <Ic.checkCircle size={22} stroke="var(--good)" />}
                  {state === "running" && (
                    <span className="ncs-spin">
                      <Ic.spinner size={20} stroke="var(--gold-deep)" />
                    </span>
                  )}
                  {state === "wait" && <span className="ncs-dot" />}
                </span>
              </div>
            );
          })}
        </div>

        <button
          className="btn btn-gold btn-lg btn-block"
          disabled={!allDone}
          onClick={() => {
            onClose();
            onJoin();
          }}
        >
          {allDone ? (
            <>
              <Ic.zoom size={20} /> Join class now
            </>
          ) : (
            "Checking…"
          )}
        </button>
        <div className="nc-tip">
          <Ic.screen size={14} stroke="var(--ink-3)" /> Remember to share your screen when you join.
        </div>
      </div>
    </div>
  );
}
