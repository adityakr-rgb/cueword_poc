"use client";
// Schedule (module 10) — student week calendar, bounded to exactly 2 slots/week.
// Times in the student's US timezone (coach is in Manila). Parents can cancel a
// class up to 4 hours before it starts. Zoom is automated (fixed link, auto-join,
// auto-record). "Join class" runs the cosmetic NetCheck, then the live-class seam.
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { getZoomLink } from "@cueword/core/lib/config";
import { Avatar, Ic, Sunny } from "@/components/Ic";
import { DATA, type ScheduleClass, type ScheduleDay } from "@/data/studentData";

export default function Schedule() {
  const router = useRouter();
  const S = DATA.SCHEDULE;
  const [check, setCheck] = useState(false);
  const [cancelled, setCancelled] = useState<Record<string, boolean>>({});
  const [confirm, setConfirm] = useState<{ key: string; c: ScheduleClass; day: ScheduleDay } | null>(null);
  const today = S.days.find((d) => d.classes.some((c) => c.today));
  const todayClass = today && today.classes.find((c) => c.today);
  const filled = S.slotsFilled - Object.keys(cancelled).length;

  // Same live-class seam as Home: open Zoom in a new tab + enter the live class.
  const joinClass = () => {
    try {
      window.open(getZoomLink(), "_blank", "noopener,noreferrer");
    } catch {
      /* popup blocked — still navigate */
    }
    router.push("/live");
  };

  return (
    <div className="page page-wide view-enter">
      {check && todayClass && <NetCheck coach={todayClass.coach} onClose={() => setCheck(false)} onJoin={joinClass} />}
      {confirm && (
        <CancelModal
          c={confirm.c}
          day={confirm.day}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            setCancelled((m) => ({ ...m, [confirm.key]: true }));
            setConfirm(null);
          }}
        />
      )}
      <div className="page-head">
        <div>
          <div className="h-eyebrow">My Classes</div>
          <h1 className="page-h1">Your week of classes</h1>
        </div>
        <Sunny size={52} />
      </div>

      {/* weekly slot cap */}
      <div className="slot-cap">
        <span className="slot-dots">
          {Array.from({ length: S.slotsPerWeek }).map((_, i) => (
            <span key={i} className={"slot-dot" + (i < filled ? " filled" : "")} />
          ))}
        </span>
        <span>
          <b>
            {filled} of {S.slotsPerWeek}
          </b>{" "}
          weekly slots filled
        </span>
        <span style={{ color: "var(--ink-3)", fontWeight: 600 }}>· Two 1-on-1 classes a week keeps a steady rhythm.</span>
      </div>

      {/* timezone strip */}
      <div className="tz-strip">
        <span className="tz-chip">
          <Ic.clock size={15} stroke="var(--gold-deep)" /> Times shown in <b>{S.tz}</b>
        </span>
        <span className="tz-note">
          <Ic.calendar size={15} stroke="var(--ink-3)" /> {S.coachTz} — we&apos;ve already converted it for you
        </span>
      </div>

      {/* today's class callout */}
      {todayClass && !cancelled["Wed-0"] && (
        <div className="today-class">
          <div className="tc-left">
            <span className="tc-badge">Today</span>
            <Avatar size={46} name="B" />
            <div>
              <div className="tc-coach">
                {todayClass.time} · {todayClass.coach}
              </div>
              <div className="tc-skill">1-on-1 class</div>
            </div>
          </div>
          <button className="btn btn-gold btn-lg" onClick={() => setCheck(true)}>
            <Ic.zoom size={20} /> Join class
          </button>
        </div>
      )}

      {/* week grid */}
      <div className="week-grid">
        {S.days.map((day) => {
          const isToday = day.classes.some((c) => c.today);
          return (
            <div key={day.d} className={"day-col" + (isToday ? " today" : "")}>
              <div className="day-head">
                <span className="day-name">{day.d}</span>
                <span className="day-date">{day.date}</span>
              </div>
              <div className="day-body">
                {day.classes.length === 0 && <div className="day-empty">No class</div>}
                {day.classes.map((c, i) => {
                  const sk = DATA.SKILLS.find((x) => x.name === c.skill);
                  const key = day.d + "-" + i;
                  const isCancelled = cancelled[key];
                  const canCancel = (c.startsInHours || 0) >= S.cancelWindowHours;
                  return (
                    <div
                      key={i}
                      className={"class-card" + (c.done ? " done" : "") + (c.today ? " now" : "")}
                      style={{ "--c": sk?.color || "var(--gold-deep)", "--w": sk?.wash || "var(--gold-wash)" } as CSSProperties}
                    >
                      <div className="cc-time">{c.time}</div>
                      <div className="cc-skill">
                        <span className="cc-dot" style={{ background: sk?.color }} />
                        {c.skill}
                      </div>
                      <div className="cc-coach">{c.coach}</div>
                      {c.done && (
                        <span className="cc-status">
                          <Ic.check size={13} stroke="var(--good)" /> Attended
                        </span>
                      )}
                      {!c.done &&
                        (isCancelled ? (
                          <div className="cc-actions">
                            <span className="cc-cancelled">
                              <Ic.x size={13} /> Cancelled
                            </span>
                          </div>
                        ) : (
                          <div className="cc-actions">
                            {c.today && <span className="cc-status now">Starting soon</span>}
                            <button className="cc-cancel" disabled={!canCancel} onClick={() => setConfirm({ key, c, day })}>
                              {canCancel ? (
                                <>
                                  <Ic.x size={12} /> Cancel class
                                </>
                              ) : (
                                <>
                                  <Ic.lock size={12} /> Locked
                                </>
                              )}
                            </button>
                            {!canCancel && <span className="cc-locknote">Too close to start — cancel {S.cancelWindowHours}h+ ahead</span>}
                          </div>
                        ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Zoom automation */}
      <div className="zoom-auto">
        <span className="za-ico">
          <Ic.zoom size={20} />
        </span>
        <div className="za-txt">
          <b>Zoom is fully automatic.</b> Every class uses one fixed link that auto-joins and auto-records — your coach never has to create or
          send a new meeting ID. Just tap <b>Join class</b> when it&apos;s time.
        </div>
      </div>

      <div className="sched-note">
        <Ic.message size={18} stroke="var(--gold-deep)" />
        <div>
          New classes are arranged with your parent over WhatsApp, then they appear here automatically. Need to reschedule? Ask your parent to
          message {DATA.student.coach}.
        </div>
      </div>
    </div>
  );
}

/* Parent cancellation confirm — restricted to 4h+ before class */
function CancelModal({ c, day, onClose, onConfirm }: { c: ScheduleClass; day: ScheduleDay; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cm-ico">
          <Ic.x size={26} />
        </div>
        <span className="parent-tag">
          <Ic.eye size={12} /> Parent action
        </span>
        <h3 style={{ marginTop: 12 }}>Cancel this class?</h3>
        <p>
          You&apos;re cancelling{" "}
          <b>
            {day.d} {day.date} · {c.time}
          </b>{" "}
          ({c.skill}) with {c.coach}. This frees the weekly slot — you can rebook over WhatsApp.
        </p>
        <div className="cm-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Keep class
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Cancel class
          </button>
        </div>
      </div>
    </div>
  );
}

/* Pre-class connection check — cosmetic; final action is the live-class seam. */
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
      </div>
    </div>
  );
}
