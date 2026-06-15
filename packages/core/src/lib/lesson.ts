// ============================================================================
// Pure lesson logic — ported from the prototype's class-experience.js.
// No DOM, no React, no network → fully unit-testable. Components render JSX
// from these structures; the coach playbook reads the text helpers here.
// ============================================================================
import type { AnswerPayload, Driver, Phase, Question, Step, Story, StoryKey } from "./types";

// Build the ordered step list for a story (cover → listen → Qs → read → Qs →
// game → speak → write → ending → complete). Mirrors buildSteps() exactly.
export function buildSteps(g: Story): Step[] {
  const steps: Step[] = [{ kind: "cover" }, { kind: "listen" }];
  g.listen.questions.forEach((q, i) =>
    steps.push({ kind: "q", phase: "Listen", q, qi: i, total: g.listen.questions.length }),
  );
  steps.push({ kind: "read" });
  g.read.questions.forEach((q, i) =>
    steps.push({ kind: "q", phase: "Read", q, qi: i, total: g.read.questions.length }),
  );
  steps.push({ kind: "game" });
  steps.push({ kind: "speak" }, { kind: "write" });
  if (g.end) steps.push({ kind: "ending" });
  steps.push({ kind: "complete" });
  return steps;
}

export const EX_PHASES: Phase[] = ["Listen", "Read", "Speak", "Write"];

export function stepPhase(step: Step): Phase | "" {
  if (step.kind === "listen" || (step.kind === "q" && step.phase === "Listen")) return "Listen";
  if (step.kind === "read" || step.kind === "game" || (step.kind === "q" && step.phase === "Read"))
    return "Read";
  if (step.kind === "speak") return "Speak";
  if (step.kind === "write") return "Write";
  return "";
}

export const PHASE_TIME: Record<Phase, string> = {
  Listen: "5m",
  Read: "8m",
  Speak: "6m",
  Write: "5m",
};

export const PLAN_ORDER = ["warmup", "Listen", "Read", "Speak", "Write", "wrap"] as const;

export const QTYPE_LABEL: Record<Question["type"], string> = {
  mcq: "Choose one",
  multi: "Choose all that apply",
  truefalse: "True or false",
  tap: "Tap the word",
  sequence: "Put in order",
  cloze: "Fill the blank",
  match: "Match",
  short: "Write it",
};

// Which grade band drives + shares the screen (K–2 coach-led; 3–8 student-led).
export const BAND: Record<StoryKey, { band: string; driver: Driver; sharer: Driver }> = {
  K: { band: "K–2", driver: "coach", sharer: "coach" },
  G3: { band: "3–8", driver: "student", sharer: "student" },
  G6: { band: "3–8", driver: "student", sharer: "student" },
};

export const CL_KID: Record<StoryKey, { name: string; initial: string }> = {
  K: { name: "Liam", initial: "L" },
  G3: { name: "Aanya", initial: "A" },
  G6: { name: "Sofia", initial: "S" },
};

// Student-facing sentence frames for the speaking step (data, not markup).
export function sentenceFrames(key: StoryKey): string[] {
  if (key === "K") return ['"I would say…"', '"Mama, I am here!"'];
  if (key === "G3") return ['"I think… because…"', '"First… then… finally…"'];
  return ['"My claim is…"', '"The evidence shows…"', '"On the other hand…"'];
}

// ---- Coach playbook content ------------------------------------------------

// The correct answer, as displayable text. Multi-line types use "\n".
export function answerText(q: Question): string {
  switch (q.type) {
    case "mcq":
      return q.opts[q.correct];
    case "truefalse":
      return q.answer ? "True" : "False";
    case "multi":
      return q.correct.map((i) => q.opts[i]).join("  ·  ");
    case "cloze":
      return q.opts[q.correct];
    case "sequence":
      return q.items.map((it, i) => `${i + 1}. ${it}`).join("\n");
    case "match":
      return q.pairs.map((p) => `${p[0]} → ${p[1]}`).join("\n");
    case "tap":
      return q.target;
    case "short":
      return q.sample;
  }
}

// The option the student actually ticked — shown to the coach in the answer note.
export function pickedAnswerLabel(q: Question, choice: AnswerPayload["choice"]): string {
  switch (q.type) {
    case "mcq":
    case "cloze":
      return typeof choice === "number" ? q.opts[choice] : String(choice);
    case "truefalse":
      if (typeof choice === "boolean") return choice ? "True" : "False";
      return choice === 0 ? "True" : "False";
    case "multi":
      return Array.isArray(choice) ? choice.map((i) => q.opts[i]).join(", ") : String(choice);
    case "match":
      return String(choice);
    default:
      return String(choice);
  }
}

// Learning outcome each skill (rung) targets — shown to the coach per question.
export const OUTCOME: Record<string, string> = {
  Locate: "Locate information that is stated directly in the text.",
  Recall: "Recall key details from what was heard.",
  Detail: "Identify specific supporting details.",
  Vocabulary: "Work out a word's meaning from context and word parts.",
  Feeling: "Infer how a character feels using clues in the text.",
  Sequence: "Put the events in the order they happened.",
  Infer: "Make an inference that the evidence supports.",
  "Main idea": "Determine the central problem or main idea.",
  Evidence: "Find and cite text evidence for an answer.",
  "Cite evidence": "Cite specific evidence from the text.",
  POV: "Analyse the narrator's or writer's point of view.",
  Summarize: "Summarise the key points accurately.",
  Evaluate: "Evaluate a claim and tell fact from opinion.",
};

export function outcomeFor(q: Question): string {
  return OUTCOME[q.rung] || `${q.rung} — ${QTYPE_LABEL[q.type] || ""}`;
}

// How the coach should teach each skill (a quick coaching move).
export const TEACH: Record<string, string> = {
  Locate: 'Show the answer is "right there." Read the line together and underline the exact words.',
  Recall: "Have them retell what they heard in their own words first, then find the detail.",
  Detail: 'Details are the small facts. Ask "which exact words tell us?"',
  Vocabulary:
    "Model using the clues around the word (and its parts). Cover the word, guess from the sentence, then check.",
  Feeling:
    'Feelings show through actions and words. Ask "what is the character doing, and how would that feel?"',
  Sequence:
    "Use signal words — first, next, then, last. Lay the events out on a timeline together.",
  Infer:
    'Inference = a clue + what you already know. Think aloud: "The text says X; I know Y; so probably Z."',
  "Main idea":
    'Ask "what is this mostly about?" Say it in one sentence; the details should support it.',
  Evidence: 'Insist on proof — every answer points to a line. "Show me where the text says so."',
  "Cite evidence":
    'Model quoting: find the exact sentence and read it as the proof. "My evidence is…"',
  POV: 'Ask whose eyes we see through. "Who is telling this, and what do they want us to think?"',
  Summarize: "Keep only the big points — somebody / wanted / but / so. Cut the small stuff.",
  Evaluate:
    'Separate fact (can be checked) from opinion (a belief). Ask "could we prove this is true?"',
};

export function teachFor(q: Question): string {
  return TEACH[q.rung] || "";
}

// Graduated nudges the coach can deliver for the on-screen question (lightest first).
export function nudgesFor(step: Extract<Step, { kind: "q" }>): string[] {
  const q = step.q;
  const out: string[] = [];
  out.push(
    step.phase === "Listen"
      ? 'Replay the clip — "Listen again just for this part."'
      : 'Point them back to the passage — "Where does the story tell us?"',
  );
  if (q.hint) out.push(q.hint);
  const byType: Partial<Record<Question["type"], string>> = {
    mcq: "Have them rule out the choice that is clearly wrong first.",
    multi: "Remind them more than one answer can be right — check every option.",
    truefalse: 'Ask: "What in the text proves it true or false?"',
    sequence: 'Ask: "What happened first? What had to come before that?"',
    cloze: "Read the sentence aloud with each option — which one sounds right?",
    match: "Start with the word they are surest of, then match the rest.",
    tap: "Ask them to find the word with their finger before tapping.",
    short: "Have them say the answer out loud before they write it.",
  };
  if (byType[q.type]) out.push(byType[q.type] as string);
  return out;
}
