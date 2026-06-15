// Scene art — ported from class-experience.js exScene()/sceneStrip().
import type { Story } from "../lib/types";

/** Big scene used on cover / ending / complete steps. */
export function SceneBig({ story, tag }: { story: Story; tag?: string }) {
  const sc = story.scene;
  return (
    <div className="ex-scene" style={{ background: sc.bg }}>
      {sc.image ? (
        <img
          className="ex-scene-img"
          src={sc.image}
          alt=""
          style={{ objectPosition: sc.imgPos || "center" }}
        />
      ) : (
        <div className="ex-scene-art">
          {sc.accents.map((a, i) => (
            <span key={i} className={`ex-accent ex-accent-${i + 1}`}>
              {a}
            </span>
          ))}
          <span className="ex-scene-main">{sc.main}</span>
        </div>
      )}
      <div className="ex-scene-cap">📷 {tag || sc.caption}</div>
    </div>
  );
}

/** Thin scene strip used on the two-pane activity steps. */
export function SceneStrip({ story, tag }: { story: Story; tag?: string }) {
  const sc = story.scene;
  return (
    <div className="ws-scenestrip" style={{ background: sc.bg }}>
      {sc.image ? (
        <img
          className="ws-scene-img"
          src={sc.image}
          alt=""
          style={{ objectPosition: sc.imgPos || "center" }}
        />
      ) : (
        <span className="ws-scene-emoji">{sc.main}</span>
      )}
      <span className="ws-scene-cap">📷 {tag || sc.caption}</span>
    </div>
  );
}
