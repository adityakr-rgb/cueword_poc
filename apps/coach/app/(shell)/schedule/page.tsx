"use client";
/* Screen 4 — Schedule (ported from app/screen_schedule.jsx).
   Static week grid. Join Zoom opens the real getZoomLink(); the live callout
   pushes to /live. */
import { Fragment } from "react";
import { useRouter } from "next/navigation";
import { Icon, Avatar, SkillChip } from "@/components/Icon";
import { CW } from "@/data/coachData";
import { getZoomLink } from "@cueword/core/lib/config";

type EvTuple = [number, number, string, string, string?];

export default function SchedulePage() {
  const C = CW;
  const router = useRouter();
  const zoomLink = getZoomLink();
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayFull = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dates = [8, 9, 10, 11, 12, 13, 14];
  const todayIdx = 2; // Wed
  const todayLabel = `${dayFull[todayIdx]}, Jun ${dates[todayIdx]}`;
  const times = ["5:30", "6:00", "6:30", "7:00", "7:30", "8:00", "8:30", "9:00", "9:30", "10:00"];

  // events: [dayIdx, timeIdx, studentId, skill, status?]  (timeIdx into `times`)
  const ev0: EvTuple[] = [
    [0, 1, "amara", "write"],
    [0, 4, "liam", "read"],
    [0, 6, "maya", "vocab"],
    [1, 1, "diego", "speak"],
    [1, 4, "liam", "read"],
    [1, 7, "sofia", "write"],
    [2, 1, "amara", "write", "done"],
    [2, 0, "maya", "read", "live"],
    [2, 6, "diego", "speak"],
    [2, 8, "noah", "vocab"],
    [3, 2, "sofia", "read"],
    [3, 5, "amara", "read"],
    [3, 8, "noah", "write"],
    [4, 1, "maya", "write"],
    [4, 4, "diego", "vocab"],
    [4, 7, "liam", "speak"],
    [5, 3, "noah", "listen"],
    [5, 6, "amara", "speak"],
    [6, 2, "sofia", "speak"],
    [6, 5, "maya", "listen"],
  ];
  const ev = ev0;
  const liveEv = ev0.find((e) => e[4] === "live");
  const liveStudent = liveEv ? C.byId(liveEv[2]) : null;

  return (
    <div className="content-inner fade-up">
      <div className="row" style={{ marginBottom: 14 }}>
        <div>
          <h1 className="page-title">Schedule</h1>
          <p className="page-sub">
            Today is <b style={{ color: "var(--ink-2)" }}>{todayLabel}</b> · you teach all 7 days, evening Manila time
          </p>
        </div>
        <span className="grow" />
        <div className="row" style={{ gap: 4 }}>
          <button className="btn ghost sm">
            <Icon n="chevL" size={16} />
          </button>
          <b className="tnum" style={{ fontSize: 13.5, minWidth: 150, textAlign: "center" }}>
            Jun 8 – 14, 2026
          </b>
          <button className="btn ghost sm">
            <Icon n="chevR" size={16} />
          </button>
        </div>
        <button className="btn primary">
          <Icon n="plus" size={16} /> Schedule session
        </button>
      </div>

      {/* ongoing-session callout */}
      {liveStudent && liveEv && (
        <div
          onClick={() => router.push("/live")}
          role="button"
          tabIndex={0}
          className="row"
          style={{
            width: "100%",
            textAlign: "left",
            border: "1px solid color-mix(in srgb, var(--live) 35%, transparent)",
            background: "var(--live-soft)",
            borderRadius: "var(--r-md)",
            padding: "11px 16px",
            marginBottom: 14,
            gap: 12,
            cursor: "pointer",
          }}
        >
          <span className="live-dot" style={{ background: "var(--live)", width: 9, height: 9 }} />
          <b style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--live)" }}>Live now</b>
          <Avatar name={liveStudent.name} color={liveStudent.color} size={28} />
          <b style={{ fontSize: 14 }}>{liveStudent.name}</b>
          <SkillChip skill={liveEv[3]} level={liveStudent.skills[liveEv[3] as keyof typeof liveStudent.skills].level} />
          <span className="muted" style={{ fontSize: 12.5 }}>
            · {times[liveEv[1]]} PM · {todayLabel}
          </span>
          <span className="grow" />
          <a className="btn-zoom live" href={zoomLink} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} style={{ textDecoration: "none" }}>
            <Icon n="zoom" size={15} /> Join Zoom
          </a>
          <span className="btn-zoom" style={{ pointerEvents: "none", background: "var(--ink)" }}>
            <Icon n="live" size={15} /> Open live class
          </span>
        </div>
      )}

      {/* persistent, non-dismissable timezone banner */}
      <div className="banner warn" style={{ marginBottom: 14 }}>
        <Icon n="warn" />
        <div>
          <b>All times shown in Manila time (PH · UTC+08:00).</b> Students see these converted to their own local time on their end.
        </div>
      </div>

      {/* student colour legend */}
      <div className="row" style={{ flexWrap: "wrap", gap: 14, marginBottom: 12, padding: "0 2px" }}>
        {C.students.map((s) => (
          <span key={s.id} className="row" style={{ gap: 6, fontSize: 12, color: "var(--ink-2)", fontWeight: 600 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: s.color }} /> {s.first} {s.last[0]}.
          </span>
        ))}
      </div>

      <div className="card card-pad" style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "58px repeat(7, minmax(120px, 1fr))", gridAutoRows: "46px", minWidth: 820 }}>
          {/* header */}
          <div style={{ gridColumn: 1, gridRow: 1 }} />
          {days.map((d, i) => (
            <div
              key={d}
              style={{ gridColumn: i + 2, gridRow: 1, textAlign: "center", padding: "0 0 8px", borderBottom: i === todayIdx ? "2px solid var(--brand)" : "1px solid var(--line)" }}
            >
              <div style={{ fontSize: 11.5, fontWeight: 700, color: i === todayIdx ? "var(--brand-ink)" : "var(--ink-3)" }}>{i === todayIdx ? "TODAY" : d}</div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 17,
                  fontWeight: 700,
                  marginTop: 2,
                  ...(i === todayIdx
                    ? { color: "#fff", background: "var(--brand)", width: 30, height: 30, borderRadius: 99, display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }
                    : { color: "var(--ink)" }),
                }}
              >
                {dates[i]}
              </div>
            </div>
          ))}

          {/* time rows */}
          {times.map((t, ti) => (
            <Fragment key={t}>
              <div style={{ gridColumn: 1, gridRow: ti + 2, fontSize: 11, color: "var(--ink-4)", textAlign: "right", paddingRight: 8, transform: "translateY(-7px)", fontWeight: 600 }}>
                {t} PM
              </div>
              {days.map((_, di) => (
                <div
                  key={di}
                  style={{
                    gridColumn: di + 2,
                    gridRow: ti + 2,
                    borderBottom: "1px solid var(--line-2)",
                    borderLeft: di === 0 ? "1px solid var(--line-2)" : "none",
                    borderRight: "1px solid var(--line-2)",
                    background: di === todayIdx ? "var(--surface-2)" : "transparent",
                  }}
                />
              ))}
            </Fragment>
          ))}

          {/* current-time indicator (Google-Calendar style) — today, ~7:54 PM */}
          {(() => {
            const nowRow = 0 + 24 / 30; // 5:30 slot (idx0) + 24min into it
            return (
              <div style={{ gridColumn: todayIdx + 2, gridRow: "2 / -1", position: "relative", pointerEvents: "none" }}>
                <div style={{ position: "absolute", left: 0, right: 0, top: `${nowRow * 46}px`, height: 2, background: "var(--live)" }}>
                  <span style={{ position: "absolute", left: -5, top: -4, width: 10, height: 10, borderRadius: 99, background: "var(--live)" }} />
                  <span style={{ position: "absolute", right: 2, top: -16, fontSize: 9.5, fontWeight: 800, color: "var(--live)", background: "var(--surface)", padding: "0 3px", borderRadius: 4 }}>
                    NOW
                  </span>
                </div>
              </div>
            );
          })()}

          {/* event pills — name only, coloured per student */}
          {ev.map(([di, ti, sid, , status], i) => {
            const st = C.byId(sid)!;
            // derive lifecycle: past days = done, future days = upcoming, today = explicit status
            let phase = "upcoming";
            if (di < todayIdx) phase = "done";
            else if (di === todayIdx) phase = status === "done" ? "done" : status === "live" ? "live" : "upcoming";
            const live = phase === "live";
            const done = phase === "done";
            return (
              <button
                key={i}
                onClick={() => (live ? router.push("/live") : router.push(`/roster/${sid}`))}
                style={{
                  gridColumn: di + 2,
                  gridRow: ti + 2,
                  margin: 3,
                  border: 0,
                  borderRadius: 10,
                  padding: "7px 9px",
                  textAlign: "left",
                  background: live ? st.color : `color-mix(in srgb, ${st.color} 16%, var(--surface))`,
                  borderLeft: `3px solid ${st.color}`,
                  color: live ? "#fff" : "var(--ink)",
                  overflow: "hidden",
                  position: "relative",
                  cursor: "pointer",
                  opacity: done ? 0.45 : 1,
                  filter: done ? "grayscale(.5)" : "none",
                  outline: live ? "2px solid var(--live)" : "none",
                  zIndex: 2,
                }}
              >
                <div className="row" style={{ gap: 5 }}>
                  {live && <span className="live-dot" style={{ background: "#fff" }} />}
                  <b style={{ fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {st.first} {st.last[0]}.
                  </b>
                </div>
                {live && <div style={{ fontSize: 10.5, fontWeight: 700, color: "#fff", opacity: 0.9, marginTop: 1 }}>{times[ti]} PM</div>}
                {done && <span style={{ position: "absolute", top: 6, right: 7, fontSize: 9, fontWeight: 800, color: "var(--ink-3)" }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
