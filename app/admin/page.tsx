"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  createEnrollment,
  createProfile,
  listEnrollments,
  listProfiles,
  listStories,
  scheduleClass,
} from "@/lib/admin";
import { listSessions, subscribeAllSessions } from "@/lib/session";
import type { ClassSession, Enrollment, Profile, Role, StoryRow } from "@/lib/types";

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

export default function AdminPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Form state
  const [pForm, setPForm] = useState({
    role: "student" as Role,
    full_name: "",
    avatar_emoji: "🙂",
    grade: "",
  });
  const [eForm, setEForm] = useState({ student_id: "", coach_id: "" });
  const [sForm, setSForm] = useState({
    enrollment_id: "",
    story_id: "",
    scheduled_at: "",
    duration_min: 30,
    zoom_link: "https://zoom.us/j/0000000000",
  });

  const reloadProfiles = useCallback(() => listProfiles().then(setProfiles), []);
  const reloadEnrollments = useCallback(() => listEnrollments().then(setEnrollments), []);
  const reloadSessions = useCallback(() => listSessions().then(setSessions), []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void reloadProfiles();
    void reloadEnrollments();
    void listStories().then(setStories);
    void reloadSessions();
    // Client-only default for the datetime-local input (avoids SSR/hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSForm((f) => ({ ...f, scheduled_at: toLocalInput(new Date()) }));
    return subscribeAllSessions(() => void reloadSessions());
  }, [reloadProfiles, reloadEnrollments, reloadSessions]);

  const nameById = useMemo(() => {
    const m = new Map<string, Profile>();
    profiles.forEach((p) => m.set(p.id, p));
    return m;
  }, [profiles]);
  const storyById = useMemo(() => {
    const m = new Map<string, StoryRow>();
    stories.forEach((s) => m.set(s.id, s));
    return m;
  }, [stories]);

  const students = profiles.filter((p) => p.role === "student");
  const coaches = profiles.filter((p) => p.role === "coach");

  if (!isSupabaseConfigured) return <SetupNotice />;

  async function onCreateProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createProfile({
        role: pForm.role,
        full_name: pForm.full_name,
        avatar_emoji: pForm.avatar_emoji || undefined,
        grade: pForm.grade || null,
      });
      setPForm({ ...pForm, full_name: "", grade: "" });
      await reloadProfiles();
      setMsg({ kind: "ok", text: "Profile created." });
    } catch (err) {
      setMsg({ kind: "err", text: (err as Error).message });
    }
  }

  async function onCreateEnrollment(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createEnrollment({ student_id: eForm.student_id, coach_id: eForm.coach_id });
      await reloadEnrollments();
      setMsg({ kind: "ok", text: "Enrollment created." });
    } catch (err) {
      setMsg({ kind: "err", text: (err as Error).message });
    }
  }

  async function onSchedule(e: React.FormEvent) {
    e.preventDefault();
    const enr = enrollments.find((x) => x.id === sForm.enrollment_id);
    if (!enr) {
      setMsg({ kind: "err", text: "Pick an enrollment first." });
      return;
    }
    try {
      await scheduleClass({
        enrollment_id: enr.id,
        student_id: enr.student_id,
        coach_id: enr.coach_id,
        story_id: sForm.story_id || null,
        scheduled_at: new Date(sForm.scheduled_at).toISOString(),
        duration_min: Number(sForm.duration_min),
        zoom_link: sForm.zoom_link,
      });
      await reloadSessions();
      setMsg({ kind: "ok", text: "Class scheduled + story assigned to the student's slate." });
    } catch (err) {
      setMsg({ kind: "err", text: (err as Error).message });
    }
  }

  return (
    <div className="cw-admin">
      <div className="cw-admin-head">
        <h1>🛠️ Admin console</h1>
      </div>
      <div className="cw-admin-sub">
        Provision people, link a student to a coach, and schedule a class with a Zoom link + a
        story.
      </div>
      {msg && <div className={msg.kind === "ok" ? "cw-ok" : "cw-error"}>{msg.text}</div>}

      {/* People */}
      <div className="cw-panel">
        <h3>People</h3>
        <div className="cw-panel-sub">Students, coaches, and admins.</div>
        <div className="cw-list" style={{ marginBottom: 16 }}>
          {profiles.map((p) => (
            <span key={p.id} className="cw-chip">
              {p.avatar_emoji} {p.full_name} · {p.role}
              {p.grade ? ` · G${p.grade}` : ""}
            </span>
          ))}
        </div>
        <form className="cw-form" onSubmit={onCreateProfile}>
          <div className="cw-field">
            <label>Role</label>
            <select
              className="cw-select"
              value={pForm.role}
              onChange={(e) => setPForm({ ...pForm, role: e.target.value as Role })}
            >
              <option value="student">student</option>
              <option value="coach">coach</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div className="cw-field">
            <label>Full name</label>
            <input
              className="cw-input"
              value={pForm.full_name}
              onChange={(e) => setPForm({ ...pForm, full_name: e.target.value })}
              placeholder="e.g. Aanya"
              required
            />
          </div>
          <div className="cw-field">
            <label>Emoji</label>
            <input
              className="cw-input"
              value={pForm.avatar_emoji}
              onChange={(e) => setPForm({ ...pForm, avatar_emoji: e.target.value })}
            />
          </div>
          <div className="cw-field">
            <label>Grade (student)</label>
            <input
              className="cw-input"
              value={pForm.grade}
              onChange={(e) => setPForm({ ...pForm, grade: e.target.value })}
              placeholder="3"
            />
          </div>
          <button className="cw-btn" type="submit">
            Add person
          </button>
        </form>
      </div>

      {/* Enrollments */}
      <div className="cw-panel">
        <h3>Enrollments</h3>
        <div className="cw-panel-sub">Link a student to a coach.</div>
        <div className="cw-list" style={{ marginBottom: 16 }}>
          {enrollments.map((en) => (
            <span key={en.id} className="cw-chip">
              {nameById.get(en.student_id)?.full_name ?? "?"} ↔{" "}
              {nameById.get(en.coach_id)?.full_name ?? "?"}
            </span>
          ))}
        </div>
        <form className="cw-form" onSubmit={onCreateEnrollment}>
          <div className="cw-field">
            <label>Student</label>
            <select
              className="cw-select"
              value={eForm.student_id}
              onChange={(e) => setEForm({ ...eForm, student_id: e.target.value })}
              required
            >
              <option value="">— pick —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="cw-field">
            <label>Coach</label>
            <select
              className="cw-select"
              value={eForm.coach_id}
              onChange={(e) => setEForm({ ...eForm, coach_id: e.target.value })}
              required
            >
              <option value="">— pick —</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>
          <button className="cw-btn" type="submit">
            Link
          </button>
        </form>
      </div>

      {/* Schedule a class */}
      <div className="cw-panel">
        <h3>Schedule a class</h3>
        <div className="cw-panel-sub">
          Pick an enrollment, set a time + Zoom link, assign a story (added to the student&apos;s
          slate).
        </div>
        <form className="cw-form" onSubmit={onSchedule}>
          <div className="cw-field">
            <label>Enrollment</label>
            <select
              className="cw-select"
              value={sForm.enrollment_id}
              onChange={(e) => setSForm({ ...sForm, enrollment_id: e.target.value })}
              required
            >
              <option value="">— pick —</option>
              {enrollments.map((en) => (
                <option key={en.id} value={en.id}>
                  {nameById.get(en.student_id)?.full_name ?? "?"} ↔{" "}
                  {nameById.get(en.coach_id)?.full_name ?? "?"}
                </option>
              ))}
            </select>
          </div>
          <div className="cw-field">
            <label>Story</label>
            <select
              className="cw-select"
              value={sForm.story_id}
              onChange={(e) => setSForm({ ...sForm, story_id: e.target.value })}
            >
              <option value="">— student picks —</option>
              {stories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.cover_emoji} {s.title} ({s.key})
                </option>
              ))}
            </select>
          </div>
          <div className="cw-field">
            <label>Scheduled at</label>
            <input
              className="cw-input"
              type="datetime-local"
              value={sForm.scheduled_at}
              onChange={(e) => setSForm({ ...sForm, scheduled_at: e.target.value })}
              required
            />
          </div>
          <div className="cw-field">
            <label>Duration (min)</label>
            <input
              className="cw-input"
              type="number"
              value={sForm.duration_min}
              onChange={(e) => setSForm({ ...sForm, duration_min: Number(e.target.value) })}
            />
          </div>
          <div className="cw-field">
            <label>Zoom link</label>
            <input
              className="cw-input"
              value={sForm.zoom_link}
              onChange={(e) => setSForm({ ...sForm, zoom_link: e.target.value })}
              required
            />
          </div>
          <button className="cw-btn cw-btn-gold" type="submit">
            Schedule class
          </button>
        </form>
      </div>

      {/* Sessions */}
      <div className="cw-panel">
        <h3>Sessions</h3>
        <div className="cw-panel-sub">Live status updates in real time as the class runs.</div>
        <table className="cw-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Coach</th>
              <th>Story</th>
              <th>Scheduled</th>
              <th>Zoom</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => {
              const story = s.story_id ? storyById.get(s.story_id) : null;
              return (
                <tr key={s.id}>
                  <td>{(s.student_id && nameById.get(s.student_id)?.full_name) || "—"}</td>
                  <td>{(s.coach_id && nameById.get(s.coach_id)?.full_name) || "—"}</td>
                  <td>{s.story_key ?? story?.key ?? "—"}</td>
                  <td>{s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : "—"}</td>
                  <td>
                    {s.zoom_link ? (
                      <a href={s.zoom_link} target="_blank" rel="noreferrer">
                        link
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span className={`cw-status cw-status-${s.status}`}>{s.status}</span>
                  </td>
                </tr>
              );
            })}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={6} style={{ color: "var(--muted)" }}>
                  No sessions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
