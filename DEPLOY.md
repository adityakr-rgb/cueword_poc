# Deploying the Cueword POC (two apps, two Vercel accounts, one repo)

This is an npm-workspaces monorepo with **two deployable Next.js apps** that share a core
package and **one Supabase backend**:

```
apps/student   → student.cueword.com   (Vercel project on ACCOUNT A — "the other account")
apps/coach     → coach.cueword.com     (Vercel project on ACCOUNT B — "your account")
packages/core  → shared sync + live-class + JSON config (not deployed on its own)
```

Both apps talk to the **same** Supabase project, which is how a change on one domain shows up
live on the other (the magic-moment sync).

---

## 0. Before anything: the local gate (do this every time before you push)

The single best way to know a Vercel build will succeed is to reproduce it locally. Vercel uses
the same npm-workspace mechanics, so if both apps build from the repo root, Vercel will too.

```bash
export PATH="$HOME/.local/node/bin:$PATH"   # if node isn't already on PATH
npm install            # once, at the repo root — links @cueword/core into both apps
npm run build          # builds BOTH apps via workspaces — MUST be green before you push
npm run lint
npm test               # unit tests (config/auth/lesson/session)
```

If `npm run build` is green, `@cueword/core` resolves and both apps compile. **Never push red.**

---

## 1. One-time: put the repo on GitHub and grant both accounts access

1. Push this monorepo to **one** GitHub repository.
2. **Account B (yours)** — already has access (it's your repo / org).
3. **Account A (the other account, for the student app)** needs to deploy from the *same* repo:
   - If the repo is on your **personal** GitHub: add the other account's owner as a **collaborator**
     on the repo, and have them authorize the **Vercel GitHub app** on it.
   - If the repo is in a **GitHub org**: grant the org/repo to both accounts' Vercel GitHub app
     installations.
   This grant is the one cross-account step. After it, both Vercel accounts can import the repo.

---

## 2. Create the two Vercel projects

Do this twice — once per account. The **only** project-specific setting that matters is the
**Root Directory**.

### Coach project (your account)
- New Project → import the repo.
- **Root Directory = `apps/coach`**.
- Framework: Next.js (auto-detected; `apps/coach/vercel.json` pins it).
- Build / Output / Install: leave at defaults. Vercel detects the npm workspace at the repo root,
  runs `npm install` there, and symlinks `@cueword/core`.
- **Only if a build fails with `module not found: @cueword/core`:** Project → Settings → General →
  ensure **"Include files outside the Root Directory in the Build Step"** is **ON** (it auto-enables
  for detected monorepos).

### Student project (the other account)
- Same steps, but **Root Directory = `apps/student`**.

---

## 3. Environment variables (identical in BOTH projects)

Both apps need the **same** two variables pointing at the **same** Supabase project — this is what
makes the cross-domain realtime sync work. They are `NEXT_PUBLIC_`-prefixed, so they are **inlined
at build time** — set them *before* the first build and redeploy after any change.

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://glrujjyoloddjbmvqfwx.supabase.co` (your project URL) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the project's anon/publishable key |

No `SUPABASE_SERVICE_ROLE_KEY` is needed (the admin app was removed; auth is the JSON config).

Set these under **Production** (and **Preview** if you want preview deploys to work) in **each**
project, on **each** account.

---

## 4. Domains

- Coach project → add domain `coach.cueword.com`.
- Student project → add domain `student.cueword.com`.
- DNS: add a `CNAME` for each subdomain pointing at `cname.vercel-dns.com`. Both subdomains live
  under the same `cueword.com` zone even though the projects are on different accounts — each
  account verifies only its own subdomain.

---

## 5. The hardcoded creds + Zoom link (what the demo logs in with)

Everything the demo needs is in **`packages/core/src/config/poc.config.json`** — edit this one file:

```jsonc
{
  "coach":   { "username": "...", "password": "...", "displayName": "..." },
  "student": { "username": "...", "password": "...", "displayName": "..." },
  "session": {
    "id": "55555555-5555-5555-5555-555555555555",  // MUST match the seeded class_sessions row
    "zoomLink": "https://zoom.us/j/...",            // the real Zoom link, opened by "Join Zoom"
    "storyKey": null
  }
}
```

After editing, run `npm test` (the config test guards that `session.id` still matches the seed) and
redeploy both apps.

---

## 6. Supabase (already provisioned)

The schema + the single seeded session live in `supabase/migrations/0001_init.sql` and
`supabase/seed.sql`. The one row whose id is `config.session.id` is what both apps subscribe to.
If you ever need a clean demo state, reset that row to `status='scheduled', story_key=null`.

---

## Notes

- The live-class screen requires a **desktop-width** viewport (≥ 940px); below that it shows a
  "use a bigger screen" note by design.
- Local dev: `npm run dev:student` (→ http://localhost:3100) and `npm run dev:coach`
  (→ http://localhost:3200), both against the same Supabase project.
