"use client";
import { useState } from "react";
import { answerText, BAND, nudgesFor, outcomeFor, QTYPE_LABEL, teachFor } from "../lib/lesson";
import type { Driver, Step, Story, StoryKey } from "../lib/types";

function RubricCard({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div className="pb-card">
      <div className="pb-card-h">{title}</div>
      {rows.map(([name, width]) => (
        <div className="pb-r" key={name}>
          <span>{name}</span>
          <div className="pb-r-bar">
            <div style={{ width: `${width}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function WhoCard({
  band,
  driver,
  kidName,
}: {
  band: string;
  driver: "coach" | "student";
  kidName: string;
}) {
  return (
    <div className="pb-card pb-who">
      <div className="pb-card-h">Who&apos;s driving · {band}</div>
      <p>
        {driver === "coach"
          ? `You share & mark; ${kidName} answers out loud.`
          : `${kidName} shares & answers; you guide and can take over.`}
      </p>
    </div>
  );
}

function WordCard({ story }: { story: Story }) {
  return (
    <div className="pb-card">
      <div className="pb-card-h">Focus words — model, then check they apply it</div>
      {story.read.vocab.map((v) => (
        <div className="pb-word-item" key={v.word}>
          <div className="pb-word-top">
            <span className="pb-word">{v.word}</span>
            <span className="pb-word-def">{v.def}</span>
          </div>
          {v.ex && (
            <div className="pb-word-ex">
              {v.ex.map((e, i) => (
                <span key={i}>&quot;{e}&quot;</span>
              ))}
            </div>
          )}
          <div className="pb-word-apply">
            ✅ &quot;Now use <b>{v.word}</b> in your own sentence.&quot;
          </div>
        </div>
      ))}
    </div>
  );
}

function AnswerCard({ text }: { text: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="pb-card pb-key">
      <div className="pb-card-h">Answer</div>
      <button className="pb-reveal" onClick={() => setShown((v) => !v)}>
        {shown ? "Hide answer" : "Tap to reveal the answer"}
      </button>
      {shown && (
        <div className="pb-answer" style={{ whiteSpace: "pre-line" }}>
          {text}
        </div>
      )}
    </div>
  );
}

/** Coach-only right rail. Ported from class-experience.js renderPlaybook(). */
export default function CoachPlaybook({
  story,
  storyKey,
  step,
  kidName,
  driver,
}: {
  story: Story;
  storyKey: StoryKey;
  step: Step;
  kidName: string;
  driver: Driver;
}) {
  const band = BAND[storyKey];
  const who = <WhoCard band={band.band} driver={driver} kidName={kidName} />;

  let content: React.ReactNode = null;

  if (step.kind === "cover") {
    content = (
      <>
        {who}
        <div className="pb-card">
          <div className="pb-card-h">Today&apos;s flow · ~30 min</div>
          <ol className="pb-flow">
            <li>🎧 Listen + {story.listen.questions.length} checks · 5m</li>
            <li>📖 Read + {story.read.questions.length} checks · 8m</li>
            <li>🗣️ Speak · 6m</li>
            <li>✍️ Write · 5m</li>
          </ol>
        </div>
      </>
    );
  } else if (step.kind === "listen") {
    content = (
      <>
        {who}
        <div className="pb-card">
          <div className="pb-card-h">Run the clip</div>
          <p>
            Play once through. Ask: &quot;What just happened? Who is this about?&quot; Replay before
            the questions if needed.
          </p>
        </div>
      </>
    );
  } else if (step.kind === "read") {
    content = (
      <>
        {who}
        <div className="pb-card">
          <div className="pb-card-h">Reading aloud · nudge</div>
          <p>
            &quot;Point to each word as you read.&quot; Pause on every highlighted word and check
            meaning in context before moving on.
          </p>
        </div>
        <WordCard story={story} />
      </>
    );
  } else if (step.kind === "q") {
    const q = step.q;
    content = (
      <>
        <div className="pb-card pb-nudge">
          <div className="pb-card-h">
            Nudges to deliver{" "}
            <span className="pb-sub">lightest first — don&apos;t give it away</span>
          </div>
          <ol className="pb-nudges">
            {nudgesFor(step).map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ol>
        </div>
        <div className="pb-card pb-outcome">
          <div className="pb-card-h">
            Learning outcome{" "}
            <span className={`pb-rung pb-rung-l${q.level}`}>
              {q.level} · {q.rung}
            </span>
          </div>
          <p>{outcomeFor(q)}</p>
          <div className="pb-teach">
            <div className="pb-teach-h">How to teach it to the student</div>
            <p>{teachFor(q)}</p>
          </div>
          <p className="pb-tiny">
            {step.phase} comprehension · {QTYPE_LABEL[q.type]}
          </p>
        </div>
        {q.rung === "Vocabulary" && (
          <div className="pb-card">
            <div className="pb-card-h">Application check</div>
            <p>
              After they answer, ask them to <b>use the word in a new sentence</b> — that proves
              they can apply it, not just recognize it.
            </p>
          </div>
        )}
        <AnswerCard text={answerText(q)} />
      </>
    );
  } else if (step.kind === "speak") {
    content = (
      <>
        <RubricCard
          title="Live scoring"
          rows={[
            ["Confidence", 68],
            ["Vocabulary", 80],
            ["Fluency", 72],
            ["Relevance", 85],
          ]}
        />
        <div className="pb-card">
          <div className="pb-card-h">Push-back prompts</div>
          <ul className="pb-prompts">
            <li>&quot;Tell me more — why?&quot;</li>
            <li>&quot;Can you use one of today&apos;s words?&quot;</li>
            <li>&quot;What would you do next?&quot;</li>
          </ul>
        </div>
      </>
    );
  } else if (step.kind === "write") {
    const starter = (story.write.sample || story.write.trace || story.write.prompt).split(
      /[.!?]/,
    )[0];
    content = (
      <>
        <RubricCard
          title="Live scoring"
          rows={[
            ["Ideas", 78],
            ["Structure", 70],
            ["Grammar", 82],
            ["Vocabulary", 75],
          ]}
        />
        <div className="pb-card">
          <div className="pb-card-h">
            {driver === "coach" ? "You scribe — offer" : "Offer a sentence starter"}
          </div>
          <p>&quot;{starter}…&quot;</p>
        </div>
      </>
    );
  } else if (step.kind === "game") {
    content = (
      <>
        {who}
        <div className="pb-card">
          <div className="pb-card-h">Vocabulary game</div>
          <p>
            Have {kidName} tap a word, then its meaning. If they miss, nudge with a sentence:
            &quot;Which one means…?&quot; Celebrate when all of them match.
          </p>
        </div>
      </>
    );
  } else if (step.kind === "ending") {
    content = (
      <>
        {who}
        <div className="pb-card">
          <div className="pb-card-h">The ending</div>
          <p>Read the ending together with feeling, then move to the wrap.</p>
        </div>
      </>
    );
  } else if (step.kind === "complete") {
    content = (
      <>
        <div className="pb-card">
          <div className="pb-card-h">Wrap</div>
          <p>Recap the journey, celebrate one specific win, then write the parent note.</p>
        </div>
        <div className="pb-card">
          <div className="pb-card-h">Words to spaced revision</div>
          <div className="pb-words">
            {story.srs.map((x) => (
              <span className="pb-word" key={x}>
                {x}
              </span>
            ))}
          </div>
        </div>
        <div className="pb-card">
          <div className="pb-card-h">Standards covered today</div>
          <p className="pb-tiny">{story.calibration}</p>
        </div>
      </>
    );
  }

  return <div className="pb-body">{content}</div>;
}
