/** Shown when Supabase env vars aren't set yet, so the app still renders. */
export default function SetupNotice() {
  return (
    <div className="cw-setup">
      <h2>Connect Supabase to run the POC</h2>
      <p>
        Create a Supabase project, then add a <code>.env.local</code> at the project root:
      </p>
      <ol>
        <li>
          <code>NEXT_PUBLIC_SUPABASE_URL</code> — your project URL
        </li>
        <li>
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> — the anon public key (client + Realtime)
        </li>
        <li>
          <code>SUPABASE_SERVICE_ROLE_KEY</code> — service role key (admin writes only)
        </li>
      </ol>
      <p>
        Run <code>supabase/migrations/0001_init.sql</code> then <code>supabase/seed.sql</code> in
        the Supabase SQL editor, and restart <code>npm run dev</code>.
      </p>
    </div>
  );
}
