"use client";
// My Workouts (module 14) — three workout types:
//   • Vocabulary (auto-scored drills)
//   • Reading & Listening Comprehension (auto-scored MCQs, instant accuracy)
//   • Speaking & Writing (subjective — coach evaluates & gives feedback)
import { useState } from "react";
import type { CSSProperties } from "react";
import { Avatar, Ic, Sunny } from "@/components/Ic";
import { DATA, type Drill, type WorkoutCategory } from "@/data/studentData";

type Score = { correct: number; total: number };
type DrillResult = { status: string; score?: Score };

export default function Workouts() {
  const W = DATA.WORKOUTS;
  const [open, setOpen] = useState<{ cat: WorkoutCategory; drill: Drill } | null>(null);
  const [results, setResults] = useState<Record<string, DrillResult>>({});

  const statusOf = (d: Drill) => results[d.id]?.status || d.status;
  const scoreOf = (d: Drill) => results[d.id]?.score || d.score;

  const finishAuto = (d: Drill, score: Score) => {
    setResults((r) => ({ ...r, [d.id]: { status: "done", score } }));
  };
  const submitCoach = (d: Drill) => {
    setResults((r) => ({ ...r, [d.id]: { status: "awaiting" } }));
    setOpen(null);
  };

  return (
    <div className="page page-wide view-enter">
      <div className="page-head">
        <div>
          <div className="h-eyebrow">My Workouts</div>
          <h1 className="page-h1">Practice that earns your belt</h1>
        </div>
        <Sunny size={52} />
      </div>
      <p className="page-lead">
        Short drills between classes. The auto-marked ones score you instantly; speaking &amp; writing go to {DATA.student.coach} for
        feedback. Every workout adds points toward your next belt. 💪
      </p>

      <div className="wo-sections">
        {W.categories.map((cat) => {
          const Cic = Ic[cat.icon] || Ic.sparkle;
          return (
            <section key={cat.id} className="wo-cat">
              <div className="wo-cat-head">
                <span className="wo-cat-ico" style={{ background: cat.wash, color: cat.color }}>
                  <Cic size={22} stroke={cat.color} />
                </span>
                <div className="wo-cat-titles">
                  <h2 className="wo-cat-title">{cat.name}</h2>
                  <span className="wo-cat-blurb">{cat.blurb}</span>
                </div>
                <span className={"wo-cat-mode " + cat.mode}>
                  {cat.mode === "auto" ? (
                    <>
                      <Ic.bolt size={14} /> Scored instantly
                    </>
                  ) : (
                    <>
                      <Ic.message size={14} /> Coach reviews
                    </>
                  )}
                </span>
              </div>
              <div className="wo-grid">
                {cat.drills.map((d) => (
                  <DrillCard
                    key={d.id}
                    d={d}
                    cat={cat}
                    status={statusOf(d)}
                    score={scoreOf(d)}
                    onOpen={() => setOpen({ cat, drill: d })}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {open &&
        (open.cat.mode === "auto" ? (
          <DrillRunner
            cat={open.cat}
            drill={open.drill}
            prevScore={scoreOf(open.drill)}
            done={statusOf(open.drill) === "done"}
            onClose={() => setOpen(null)}
            onFinish={(s) => finishAuto(open.drill, s)}
          />
        ) : (
          <CoachDrill cat={open.cat} drill={open.drill} status={statusOf(open.drill)} onClose={() => setOpen(null)} onSubmit={() => submitCoach(open.drill)} />
        ))}
    </div>
  );
}

function DrillCard({
  d,
  cat,
  status,
  score,
  onOpen,
}: {
  d: Drill;
  cat: WorkoutCategory;
  status: string;
  score?: Score;
  onOpen: () => void;
}) {
  const auto = cat.mode === "auto";
  return (
    <button className="wo-card" style={{ "--c": cat.color } as CSSProperties} onClick={onOpen}>
      <div className="wo-card-top">
        <span className="wo-pill" style={{ background: cat.wash, color: cat.color }}>
          {cat.id === "expression" ? (
            d.kind === "writing" ? (
              <>
                <Ic.write size={13} stroke={cat.color} /> Writing
              </>
            ) : (
              <>
                <Ic.mic size={13} stroke={cat.color} /> Speaking
              </>
            )
          ) : (
            <>{d.items} items</>
          )}
        </span>
        <span className="wo-lvl">Level {d.level}</span>
      </div>
      <div className="wo-title">{d.title}</div>

      <div className="wo-foot">
        {auto && status === "done" && score && (
          <>
            <span className="wo-score">
              <Ic.checkCircle size={16} stroke="var(--good)" /> {score.correct}/{score.total}
            </span>
            <span className="wo-cta">
              Redo <Ic.arrowR size={15} stroke={cat.color} />
            </span>
          </>
        )}
        {auto && status !== "done" && (
          <>
            <span className="wo-meta">Instant score</span>
            <span className="wo-cta">
              Start drill <Ic.arrowR size={15} stroke={cat.color} />
            </span>
          </>
        )}
        {!auto && status === "feedback" && (
          <>
            <span className="wo-meta">From {d.coach}</span>
            <span className="wo-await">
              <Ic.star size={15} stroke="var(--listening)" /> See feedback
            </span>
          </>
        )}
        {!auto && status === "awaiting" && (
          <>
            <span className="wo-meta">Submitted</span>
            <span className="wo-await">
              <Ic.clock size={15} stroke="var(--listening)" /> With coach
            </span>
          </>
        )}
        {!auto && status === "todo" && (
          <>
            <span className="wo-meta">Coach reviews</span>
            <span className="wo-cta">
              Start <Ic.arrowR size={15} stroke={cat.color} />
            </span>
          </>
        )}
      </div>
    </button>
  );
}

/* Auto drill runner — MCQ one at a time, instant marking */
function DrillRunner({
  cat,
  drill,
  onClose,
  onFinish,
  done,
  prevScore,
}: {
  cat: WorkoutCategory;
  drill: Drill;
  onClose: () => void;
  onFinish: (s: Score) => void;
  done: boolean;
  prevScore?: Score;
}) {
  const qs = drill.questions || [];
  const reviewOnly = qs.length === 0;
  const Cic = Ic[cat.icon] || Ic.sparkle;
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(reviewOnly);

  const q = qs[i];
  const pick = (oi: number) => {
    if (picked !== null) return;
    setPicked(oi);
    if (oi === q.correct) setCorrect((c) => c + 1);
  };
  const next = () => {
    if (i + 1 < qs.length) {
      setI(i + 1);
      setPicked(null);
    } else {
      setFinished(true);
      onFinish({ correct, total: qs.length });
    }
  };

  const total = reviewOnly && prevScore ? prevScore.total : qs.length;
  const got = reviewOnly && prevScore ? prevScore.correct : correct;
  const pct = total ? Math.round((got / total) * 100) : 0;
  void done;

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="drill" style={{ "--c": cat.color, "--w": cat.wash } as CSSProperties} onClick={(e) => e.stopPropagation()}>
        {!finished && q ? (
          <div className="drill-grid">
            <aside className="drill-aside">
              <span className="drill-aside-ico">
                <Cic size={26} stroke={cat.color} />
              </span>
              <div className="drill-aside-title">{drill.title}</div>
              <div className="drill-aside-prog">
                Question {i + 1} of {qs.length}
              </div>
              <div className="drill-bar">
                <i style={{ width: `${((i + (picked !== null ? 1 : 0)) / qs.length) * 100}%`, background: cat.color }} />
              </div>
              {drill.passage && (
                <div className="drill-passage">
                  <div className="drill-passage-label">
                    <Ic.book size={14} stroke={cat.color} /> Read the passage
                  </div>
                  <div className="drill-passage-body" dangerouslySetInnerHTML={{ __html: drill.passage }} />
                </div>
              )}
            </aside>
            <div className="drill-main">
              <div className="drill-q" dangerouslySetInnerHTML={{ __html: q.q }} />
              <div className="drill-opts">
                {q.opts.map((o, oi) => {
                  let cls = "drill-opt";
                  if (picked !== null) {
                    if (oi === q.correct) cls += " right";
                    else if (oi === picked) cls += " wrong";
                  }
                  return (
                    <button key={oi} className={cls} disabled={picked !== null} onClick={() => pick(oi)}>
                      <span className="dk">{String.fromCharCode(65 + oi)}</span>
                      <span>{o}</span>
                    </button>
                  );
                })}
              </div>

              {picked !== null &&
                (picked === q.correct ? (
                  <div className="drill-feedback ok">
                    <Ic.checkCircle size={17} stroke="var(--good)" /> Nice — that&apos;s right!
                  </div>
                ) : (
                  <div className="drill-feedback flag">
                    <Ic.flag size={16} stroke="var(--gold-deep, #D9A938)" /> Not quite — the right answer&apos;s highlighted in green.
                  </div>
                ))}

              <div className="drill-foot">
                {picked !== null && (
                  <button className="btn btn-gold" onClick={next}>
                    {i + 1 < qs.length ? (
                      <>
                        Next <Ic.arrowR size={17} />
                      </>
                    ) : (
                      <>
                        See score <Ic.arrowR size={17} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="drill-centered">
            <div className="drill-result">
              <div className="dr-ring" style={{ "--c": cat.color, "--p": pct + "%" } as CSSProperties}>
                <b style={{ color: cat.color }}>
                  {got}/{total}
                  <span>correct</span>
                </b>
              </div>
              <h3>{pct >= 80 ? "Brilliant work! 🎉" : pct >= 50 ? "Good effort! 👏" : "Keep going! 💪"}</h3>
              <p>{reviewOnly ? "You finished this drill earlier." : `That's ${pct}% — and worth points toward your belt.`}</p>
              <button className="btn btn-gold btn-lg btn-block" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Speaking / Writing drill — subjective, goes to the coach */
function CoachDrill({
  cat,
  drill,
  status,
  onClose,
  onSubmit,
}: {
  cat: WorkoutCategory;
  drill: Drill;
  status: string;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const writing = drill.kind === "writing";
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="drill" style={{ "--c": cat.color, "--w": cat.wash } as CSSProperties} onClick={(e) => e.stopPropagation()}>
        {status === "feedback" ? (
          <div className="drill-centered">
            <div className="drill-coach">
              <div className="dc-emoji">⭐</div>
              <h3>{drill.coach} sent feedback</h3>
              <p>Your coach listened to your {writing ? "writing" : "recording"} and left you a note.</p>
              <div className="drill-coachnote">
                <div className="dcn-head">
                  <Avatar size={28} name="B" /> {drill.coach}
                </div>
                <p>{drill.feedback}</p>
              </div>
              <div className="drill-foot" style={{ justifyContent: "center", marginTop: 18 }}>
                <button className="btn btn-gold" onClick={onClose}>
                  Got it
                </button>
              </div>
            </div>
          </div>
        ) : status === "awaiting" ? (
          <div className="drill-centered">
            <div className="drill-coach">
              <div className="dc-emoji">📨</div>
              <h3>Sent to your coach</h3>
              <p>{DATA.student.coach} will read your work and add feedback — usually before your next class.</p>
              <button className="btn btn-gold btn-lg btn-block" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="drill-grid">
            <aside className="drill-aside">
              <span className="drill-aside-ico">
                {writing ? <Ic.write size={26} stroke={cat.color} /> : <Ic.mic size={26} stroke={cat.color} />}
              </span>
              <div className="drill-aside-title">{drill.title}</div>
              <p className="drill-aside-desc">
                {writing
                  ? "Write your response below. Your coach will read it and give you feedback."
                  : "Tap to record your answer out loud. Your coach will listen and give you feedback."}
              </p>
            </aside>
            <div className="drill-main">
              {writing ? (
                <textarea className="w-text long drill-textarea" rows={9} placeholder="Start writing here…" />
              ) : (
                <div
                  className="ge-mic-stub"
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, justifyContent: "center", flex: 1, padding: "26px 0" }}
                >
                  <span
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: "50%",
                      background: cat.color,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "var(--sh-md)",
                    }}
                  >
                    <Ic.mic size={32} stroke="#fff" />
                  </span>
                  <span style={{ fontWeight: 700, color: "var(--ink-2)" }}>Tap to record</span>
                </div>
              )}
              <div className="drill-foot" style={{ marginTop: 18 }}>
                <button className="btn btn-ghost btn-lg" onClick={onClose}>
                  Cancel
                </button>
                <button className="btn btn-gold btn-lg" onClick={onSubmit}>
                  <Ic.arrowR size={17} /> Send to {DATA.student.coach}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
