// Landing — open each role in its own window and log in.
export default function Home() {
  return (
    <div className="cw-launch">
      <div className="cw-launch-logo">
        <span className="dot" />
        <b>cueword</b>
        <span>live class POC</span>
      </div>

      <h1>One live class. Three dashboards. Synced in real time.</h1>
      <p className="lede">
        Open each role in its own window and log in. When the child opens a story, it appears live
        on the coach&apos;s screen — then step through the lesson together, Listen → Read → Speak →
        Write.
      </p>

      <div className="cw-launch-cards">
        <a className="cw-launch-card" href="/login" target="_blank" rel="noreferrer">
          <div className="cw-launch-emoji">🛠️</div>
          <h2>Admin</h2>
          <p>Provision people, generate logins, schedule a class with a Zoom link + story.</p>
          <span className="go">Log in · admin / admin123 →</span>
        </a>
        <a className="cw-launch-card" href="/login" target="_blank" rel="noreferrer">
          <div className="cw-launch-emoji">🦊</div>
          <h2>Child</h2>
          <p>See today&apos;s class, open a story, and drive the lesson.</p>
          <span className="go">Log in · aanya / aanya123 →</span>
        </a>
        <a className="cw-launch-card" href="/login" target="_blank" rel="noreferrer">
          <div className="cw-launch-emoji">🧑‍🏫</div>
          <h2>Coach</h2>
          <p>Start the class, watch the synced story, and guide with the coach-only playbook.</p>
          <span className="go">Log in · maya / maya123 →</span>
        </a>
      </div>

      <div className="cw-demo-script">
        <b>Demo flow:</b> 1) <b>Coach</b> (maya) clicks <b>Start class</b>. 2) <b>Child</b> (aanya)
        taps a story — it opens live on the Coach screen and the child drives. 3) Step through
        Listen → Read → Speak → Write together. <b>Admin</b> (admin) can generate more logins +
        schedule classes.
      </div>
    </div>
  );
}
