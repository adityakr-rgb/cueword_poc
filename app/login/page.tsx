"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getCurrentUser, HOME_FOR, login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already logged in → go to the right dashboard.
  useEffect(() => {
    const u = getCurrentUser();
    if (u) router.replace(HOME_FOR[u.role]);
  }, [router]);

  if (!isSupabaseConfigured) return <SetupNotice />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const u = await login(username, password);
      router.replace(HOME_FOR[u.role]);
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
          <span>live class</span>
        </div>
        <h1>Log in</h1>
        <p className="cw-login-sub">Coaches and students sign in with the ID the admin created.</p>

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
          <div className="cw-demo-title">Demo accounts</div>
          <ul>
            <li>
              <b>admin</b> / admin123 — Admin
            </li>
            <li>
              <b>maya</b> / maya123 — Coach
            </li>
            <li>
              <b>aanya</b> / aanya123 — Student
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
