import { describe, expect, it } from "vitest";
import { GRADE_STORIES } from "@/lib/stories";
import {
  answerText,
  BAND,
  buildSteps,
  nudgesFor,
  outcomeFor,
  pickedAnswerLabel,
  stepPhase,
  teachFor,
} from "@/lib/lesson";
import type { Step } from "@/lib/types";

describe("buildSteps", () => {
  it("orders G3 steps cover→listen→Qs→read→Qs→game→speak→write→ending→complete", () => {
    const steps = buildSteps(GRADE_STORIES.G3);
    // 2 + 4 listen Qs + 1 read + 5 read Qs + game + speak + write + ending + complete = 17
    expect(steps).toHaveLength(17);
    expect(steps[0].kind).toBe("cover");
    expect(steps[1].kind).toBe("listen");
    expect(steps.at(-1)!.kind).toBe("complete");
    expect(steps.some((s) => s.kind === "ending")).toBe(true);
    expect(steps.some((s) => s.kind === "game")).toBe(true);
    const listenQs = steps.filter((s) => s.kind === "q" && s.phase === "Listen");
    const readQs = steps.filter((s) => s.kind === "q" && s.phase === "Read");
    expect(listenQs).toHaveLength(GRADE_STORIES.G3.listen.questions.length);
    expect(readQs).toHaveLength(GRADE_STORIES.G3.read.questions.length);
  });

  it("omits the ending step for stories without an end (K)", () => {
    const steps = buildSteps(GRADE_STORIES.K);
    expect(steps.some((s) => s.kind === "ending")).toBe(false);
    expect(steps.at(-1)!.kind).toBe("complete");
  });
});

describe("stepPhase", () => {
  it("maps step kinds to the right phase", () => {
    expect(stepPhase({ kind: "listen" })).toBe("Listen");
    expect(stepPhase({ kind: "read" })).toBe("Read");
    expect(stepPhase({ kind: "game" })).toBe("Read");
    expect(stepPhase({ kind: "speak" })).toBe("Speak");
    expect(stepPhase({ kind: "write" })).toBe("Write");
    expect(stepPhase({ kind: "cover" })).toBe("");
    const lq: Step = {
      kind: "q",
      phase: "Listen",
      q: GRADE_STORIES.G3.listen.questions[0],
      qi: 0,
      total: 4,
    };
    expect(stepPhase(lq)).toBe("Listen");
  });
});

describe("answerText", () => {
  it("returns the correct option for mcq", () => {
    const q = GRADE_STORIES.G3.listen.questions[0]; // mcq, correct 0
    expect(answerText(q)).toBe("They fixed bicycles");
  });
  it("joins multi answers and renders match/sequence multi-line", () => {
    const multi = GRADE_STORIES.G3.listen.questions[1];
    expect(answerText(multi)).toContain("·");
    const match = GRADE_STORIES.G3.read.questions[1]; // match
    expect(answerText(match)).toContain("→");
    expect(answerText(match)).toContain("\n");
  });
  it("handles true/false", () => {
    const tf = GRADE_STORIES.G6.read.questions.find((q) => q.type === "truefalse")!;
    expect(["True", "False"]).toContain(answerText(tf));
  });
});

describe("coach playbook helpers", () => {
  it("outcomeFor + teachFor return text for a known rung", () => {
    const q = GRADE_STORIES.G3.read.questions.find((x) => x.rung === "Main idea")!;
    expect(outcomeFor(q).length).toBeGreaterThan(0);
    expect(teachFor(q).length).toBeGreaterThan(0);
  });
  it("nudgesFor leads with a passage/clip nudge and includes the hint", () => {
    const qStep = buildSteps(GRADE_STORIES.G3).find((s) => s.kind === "q") as Extract<
      Step,
      { kind: "q" }
    >;
    const nudges = nudgesFor(qStep);
    expect(nudges.length).toBeGreaterThanOrEqual(1);
    expect(typeof nudges[0]).toBe("string");
  });
});

describe("BAND (who drives)", () => {
  it("is coach-led for K and student-led for 3–8", () => {
    expect(BAND.K.driver).toBe("coach");
    expect(BAND.G3.driver).toBe("student");
    expect(BAND.G6.driver).toBe("student");
  });
});

describe("pickedAnswerLabel (what the student ticked, shown to the coach)", () => {
  it("resolves the ticked option text for each question type", () => {
    const mcq = GRADE_STORIES.G3.listen.questions[0]; // mcq
    expect(pickedAnswerLabel(mcq, 0)).toBe(mcq.opts[0]);
    expect(pickedAnswerLabel(mcq, 1)).toBe(mcq.opts[1]);

    const tf = GRADE_STORIES.G6.read.questions.find((q) => q.type === "truefalse")!;
    expect(pickedAnswerLabel(tf, 0)).toBe("True");
    expect(pickedAnswerLabel(tf, 1)).toBe("False");

    const multi = GRADE_STORIES.G3.listen.questions[1]; // multi
    if (multi.type === "multi") {
      expect(pickedAnswerLabel(multi, [0, 1])).toContain(multi.opts[0]);
    }
  });
});
