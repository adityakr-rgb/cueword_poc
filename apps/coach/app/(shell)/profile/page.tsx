"use client";
/* Screen — Coach profile & settings (ported from app/screen_profile.jsx).
   Tabs are driven by ?section=; "Sign out" is wired to the real logout(). */
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon, Avatar } from "@/components/Icon";
import { CW, type CoachProfile } from "@/data/coachData";
import { logout } from "@cueword/core/lib/auth";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      style={{
        width: 42,
        height: 24,
        borderRadius: 99,
        border: 0,
        padding: 3,
        cursor: "pointer",
        background: on ? "var(--brand)" : "var(--line)",
        transition: ".15s",
        flex: "none",
      }}
    >
      <span
        style={{
          display: "block",
          width: 18,
          height: 18,
          borderRadius: 99,
          background: "#fff",
          transform: on ? "translateX(18px)" : "none",
          transition: ".15s",
          boxShadow: "0 1px 3px rgba(0,0,0,.2)",
        }}
      />
    </button>
  );
}

function Row({ icon, label, value, mono }: { icon: string; label: string; value: string; mono?: boolean }) {
  return (
    <div className="row" style={{ padding: "11px 0", borderBottom: "1px solid var(--line-2)", gap: 12 }}>
      <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--surface-3)", color: "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
        <Icon n={icon} size={15} />
      </span>
      <span className="muted" style={{ fontSize: 12.5, fontWeight: 600, width: 130 }}>
        {label}
      </span>
      <span className="grow" style={{ fontSize: 13.5, fontWeight: 650, fontFamily: mono ? "var(--font-ui)" : "inherit", letterSpacing: mono ? ".01em" : 0 }}>
        {value}
      </span>
    </div>
  );
}

type PrefKey = keyof CoachProfile["prefs"];

export default function ProfilePage() {
  const C = CW;
  const k = C.coach;
  const router = useRouter();
  const search = useSearchParams();
  const section = search.get("section") || "profile";
  const [prefs, setPrefs] = useState({ ...k.prefs });
  const toggle = (key: PrefKey) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const tabs = [
    ["profile", "Profile"],
    ["preferences", "Preferences"],
    ["account", "Account"],
  ];

  return (
    <div className="content-inner fade-up">
      {/* header */}
      <div className="card" style={{ overflow: "hidden", marginBottom: "var(--gap)", position: "relative" }}>
        <div style={{ height: 76, background: "linear-gradient(110deg, var(--brand) 0%, var(--brand-ink) 100%)" }} />
        {/* avatar overlaps the banner edge */}
        <div style={{ position: "absolute", left: "var(--pad)", top: 38, border: "4px solid var(--surface)", borderRadius: "50%" }}>
          <Avatar name={k.name} color={k.color} size={80} />
        </div>
        <div className="row" style={{ padding: "14px var(--pad) 16px", paddingLeft: "calc(var(--pad) + 100px)", alignItems: "center", gap: 16, minHeight: 56 }}>
          <div className="grow">
            <h1 className="page-title" style={{ fontSize: 23 }}>
              {k.name}
            </h1>
            <div className="row" style={{ gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              <span className="chip" style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}>
                {k.role}
              </span>
              <span className="muted" style={{ fontSize: 13 }}>
                {k.location} · ID {k.coachId}
              </span>
            </div>
          </div>
          <button className="btn">
            <Icon n="note" size={15} /> Edit profile
          </button>
        </div>
        {/* stats strip */}
        <div className="row" style={{ borderTop: "1px solid var(--line-2)" }}>
          {(
            [
              ["Students", k.stats.students],
              ["Sessions taught", k.stats.sessionsTaught],
              ["Attendance", k.stats.attendance],
            ] as [string, string | number][]
          ).map(([l, v], i) => (
            <div key={i} className="grow" style={{ padding: "13px var(--pad)", borderLeft: i ? "1px solid var(--line-2)" : "none" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{v}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* tabs */}
      <div className="role-toggle" style={{ marginBottom: "var(--gap)", width: "fit-content" }}>
        {tabs.map(([key, label]) => (
          <button key={key} className={section === key ? "on" : ""} onClick={() => router.push(`/profile?section=${key}`)} style={{ padding: "6px 16px" }}>
            {label}
          </button>
        ))}
      </div>

      {section === "profile" && (
        <div className="kgrid" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
          <div className="card card-pad">
            <h3 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontSize: 15 }}>Personal details</h3>
            <Row icon="roster" label="Full name" value={k.name} />
            <Row icon="mail" label="Email" value={k.email} mono />
            <Row icon="phone" label="Phone" value={k.phone} mono />
            <Row icon="globe2" label="Timezone" value={k.timezone} />
            <Row icon="comms" label="Languages" value={k.languages.join(" · ")} />
            <Row icon="clock" label="Member since" value={`${k.joined} · ${k.tenure}`} />
          </div>
          <div className="card card-pad">
            <h3 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontSize: 15 }}>Teaching</h3>
            <Row icon="cap" label="Certification" value={k.certs} />
            <Row icon="curriculum" label="Grades" value={k.grades.map((g) => "G" + g).join(", ")} />
            <Row icon="schedule" label="Working days" value={k.workingDays} />
            <Row icon="clock" label="Working hours" value={k.workingHours} />
            <Row icon="zoom" label="Default Zoom" value={k.defaultZoom} mono />
            <Row icon="shield" label="Coach ID" value={k.coachId} mono />
          </div>
        </div>
      )}

      {section === "preferences" && (
        <div className="kgrid" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
          <div className="card">
            <div className="card-head">
              <h3>Session preferences</h3>
            </div>
            <div className="card-pad" style={{ paddingTop: 4 }}>
              {(
                [
                  ["showStudentTz", "Always show student timezone", "Display each student's US local time beside Manila time."],
                  ["autoFeedback", "AI-drafted feedback", "Pre-fill feedback with an AI draft you can edit before sending."],
                  ["reminders", "Session reminders", "Nudge me 10 minutes before each session starts."],
                ] as [PrefKey, string, string][]
              ).map(([key, t, d]) => (
                <div key={key} className="row" style={{ padding: "11px 0", borderBottom: "1px solid var(--line-2)", gap: 14, alignItems: "flex-start" }}>
                  <div className="grow">
                    <b style={{ fontSize: 13.5 }}>{t}</b>
                    <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                      {d}
                    </div>
                  </div>
                  <Toggle on={prefs[key]} onClick={() => toggle(key)} />
                </div>
              ))}
            </div>
          </div>
          <div className="col" style={{ gap: "var(--gap)" }}>
            <div className="card">
              <div className="card-head">
                <h3>Notifications</h3>
              </div>
              <div className="card-pad" style={{ paddingTop: 4 }}>
                {(
                  [
                    ["weeklyDigest", "Weekly digest email", "Summary of attendance, marks & progress."],
                    ["soundAlerts", "Sound alerts", "Play a chime when a student submits work."],
                  ] as [PrefKey, string, string][]
                ).map(([key, t, d]) => (
                  <div key={key} className="row" style={{ padding: "11px 0", borderBottom: "1px solid var(--line-2)", gap: 14, alignItems: "flex-start" }}>
                    <div className="grow">
                      <b style={{ fontSize: 13.5 }}>{t}</b>
                      <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                        {d}
                      </div>
                    </div>
                    <Toggle on={prefs[key]} onClick={() => toggle(key)} />
                  </div>
                ))}
              </div>
            </div>
            <div className="banner info">
              <Icon n="gear" />
              <div>
                <b>Appearance</b> — this console ships in the warm light theme with the icon rail at a comfortable density.
              </div>
            </div>
          </div>
        </div>
      )}

      {section === "account" && (
        <div className="kgrid" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
          <div className="card card-pad">
            <h3 style={{ margin: "0 0 12px", fontFamily: "var(--font-display)", fontSize: 15 }}>Security</h3>
            <div className="field" style={{ marginBottom: 11 }}>
              <label>Change password</label>
              <input className="input" type="password" defaultValue="············" />
            </div>
            <div className="row" style={{ gap: 10, marginBottom: 4 }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--brand-soft)", color: "var(--brand-ink)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <Icon n="shield" size={16} />
              </span>
              <div className="grow">
                <b style={{ fontSize: 13.5 }}>Two-factor authentication</b>
                <div className="muted" style={{ fontSize: 12 }}>
                  Enabled · SMS to {k.phone}
                </div>
              </div>
              <span className="status-tag st-mastered">On</span>
            </div>
            <button className="btn" style={{ marginTop: 14 }}>
              Update password
            </button>
          </div>
          <div className="card card-pad">
            <h3 style={{ margin: "0 0 12px", fontFamily: "var(--font-display)", fontSize: 15 }}>Account</h3>
            <Row icon="mail" label="Login email" value={k.email} mono />
            <Row icon="globe2" label="Region" value="Philippines (PH)" />
            <div className="row" style={{ gap: 10, marginTop: 16 }}>
              <button
                className="btn"
                style={{ color: "var(--live)", borderColor: "rgba(240,71,107,.3)" }}
                onClick={() => {
                  logout();
                  router.replace("/login");
                }}
              >
                <Icon n="logout" size={15} /> Sign out
              </button>
              <span className="muted" style={{ fontSize: 11.5 }}>
                You&apos;ll need to sign in again to coach.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
