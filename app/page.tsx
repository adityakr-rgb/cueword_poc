// Role launcher — open the three dashboards (new tabs make the demo easy).
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
        Open all three in separate windows. When the child opens a story, it appears live on the
        coach&apos;s screen — then step through the lesson together, Listen → Read → Speak → Write.
      </p>

      <div className="cw-launch-cards">
        <a className="cw-launch-card" href="/admin" target="_blank" rel="noreferrer">
          <div className="cw-launch-emoji">🛠️</div>
          <h2>Admin</h2>
          <p>Provision people, schedule a class with a Zoom link, and assign a story.</p>
          <span className="go">Open Admin →</span>
        </a>
        <a className="cw-launch-card" href="/student" target="_blank" rel="noreferrer">
          <div className="cw-launch-emoji">🦊</div>
          <h2>Child</h2>
          <p>See today&apos;s class, open a story, and learn through the lesson.</p>
          <span className="go">Open Child →</span>
        </a>
        <a className="cw-launch-card" href="/coach" target="_blank" rel="noreferrer">
          <div className="cw-launch-emoji">🧑‍🏫</div>
          <h2>Coach</h2>
          <p>Start the class, watch the synced story, and guide with the coach-only playbook.</p>
          <span className="go">Open Coach →</span>
        </a>
      </div>

      <div className="cw-demo-script">
        <b>Demo flow:</b> 1) In <b>Admin</b>, schedule a class (Zoom link + story). 2) In{" "}
        <b>Coach</b>, click <b>Start class</b>. 3) In <b>Child</b>, tap a story — it opens live on
        the Coach screen. 4) Step through Listen → Read → Speak → Write together.
      </div>
    </div>
  );
}
