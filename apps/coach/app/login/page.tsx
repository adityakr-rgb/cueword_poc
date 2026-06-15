"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SetupNotice from "@cueword/core/components/SetupNotice";
import { isSupabaseConfigured } from "@cueword/core/lib/supabase/client";
import { getCurrentUser, validateLogin } from "@cueword/core/lib/auth";
import { POC } from "@cueword/core/lib/config";

export default function CoachLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already logged in → go home.
  useEffect(() => {
    const u = getCurrentUser();
    if (u && u.role === "coach") router.replace("/");
  }, [router]);

  if (!isSupabaseConfigured) return <SetupNotice />;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      validateLogin("coach", username, password);
      router.replace("/");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="cw-login">
      <div className="cw-login-card">
        <div className="cw-launch-logo">
          <span className="dot" />
          <b>cueword</b>
          <span>coach</span>
        </div>
        <h1>Log in</h1>
        <p className="cw-login-sub">Sign in to your coaching console.</p>

        <form onSubmit={onSubmit} className="cw-login-form">
          <div className="cw-field">
            <label>Username</label>
            <input
              className="cw-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="cw-field">
            <label>Password</label>
            <input
              className="cw-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <div className="cw-error">{error}</div>}
          <button className="cw-btn" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Log in →"}
          </button>
        </form>

        <div className="cw-demo-accounts">
          <div className="cw-demo-title">Demo account</div>
          <ul>
            <li>
              <b>{POC.coach.username}</b> / {POC.coach.password} — {POC.coach.displayName}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
