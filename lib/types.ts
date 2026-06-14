// ============================================================================
// Shared types — content model (ported from the prototype's data.js) + the
// Supabase row shapes + the synced render-state. One place, no `any`.
// ============================================================================

// ---- Content model (story / lesson) ---------------------------------------

export type StoryKey = "K" | "G3" | "G6";
export type Phase = "Listen" | "Read" | "Speak" | "Write";
export type QuestionType =
  | "mcq"
  | "multi"
  | "truefalse"
  | "tap"
  | "sequence"
  | "cloze"
  | "match"
  | "short";

interface QuestionBase {
  level: number;
  rung: string;
  q: string;
  hint?: string;
}
export interface McqQuestion extends QuestionBase {
  type: "mcq";
  opts: string[];
  correct: number;
}
export interface MultiQuestion extends QuestionBase {
  type: "multi";
  opts: string[];
  correct: number[];
}
export interface TrueFalseQuestion extends QuestionBase {
  type: "truefalse";
  answer: boolean;
}
export interface TapQuestion extends QuestionBase {
  type: "tap";
  target: string;
}
export interface SequenceQuestion extends QuestionBase {
  type: "sequence";
  items: string[];
}
export interface ClozeQuestion extends QuestionBase {
  type: "cloze";
  text: string;
  opts: string[];
  correct: number;
}
export interface MatchQuestion extends QuestionBase {
  type: "match";
  pairs: [string, string][];
}
export interface ShortQuestion extends QuestionBase {
  type: "short";
  stem: string;
  look?: string;
  sample: string;
}
export type Question =
  | McqQuestion
  | MultiQuestion
  | TrueFalseQuestion
  | TapQuestion
  | SequenceQuestion
  | ClozeQuestion
  | MatchQuestion
  | ShortQuestion;

export interface PassageSegment {
  text: string;
  vocab?: boolean;
  word?: string;
  def?: string;
  highlight?: boolean;
}
export interface VocabWord {
  word: string;
  def: string;
  ex?: string[];
}
export interface Scene {
  bg: string;
  main: string;
  accents: string[];
  caption: string;
  image?: string;
  imgPos?: string;
}
export interface Story {
  grade: string;
  gradeShort: string;
  title: string;
  theme: string;
  themeColor: string;
  chapter: string;
  duration: string;
  about: string;
  cover: string;
  scene: Scene;
  fact?: string;
  listen: { clipMeta: string; transcript: string; questions: Question[] };
  read: {
    label: string;
    passage: PassageSegment[];
    vocab: VocabWord[];
    questions: Question[];
  };
  speak: { label: string; prompt: string; hints: string[] };
  write: {
    label: string;
    mode?: "trace";
    prompt: string;
    trace?: string;
    drawPrompt?: string;
    sample?: string;
  };
  end?: string;
  srs: string[];
  calibration: string;
}

// ---- Lesson steps (output of buildSteps) ----------------------------------

export type Step =
  | { kind: "cover" }
  | { kind: "listen" }
  | { kind: "read" }
  | { kind: "game" }
  | { kind: "speak" }
  | { kind: "write" }
  | { kind: "ending" }
  | { kind: "complete" }
  | { kind: "q"; phase: "Listen" | "Read"; q: Question; qi: number; total: number };

// ---- Roles & session ------------------------------------------------------

export type Role = "admin" | "student" | "coach";
export type SessionStatus = "scheduled" | "live" | "completed" | "cancelled";
export type Driver = "student" | "coach";

// ---- Supabase row shapes --------------------------------------------------

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  avatar_emoji: string | null;
  grade: string | null;
  timezone: string | null;
  created_at: string;
}
export interface Enrollment {
  id: string;
  student_id: string;
  coach_id: string;
  plan: string | null;
  status: string | null;
  start_date: string | null;
  created_at: string;
}
export interface StoryRow {
  id: string;
  key: string;
  grade: string | null;
  title: string;
  theme: string | null;
  theme_color: string | null;
  cover_emoji: string | null;
  scene_image_url: string | null;
  created_at: string;
}
export interface AssignmentRow {
  id: string;
  student_id: string;
  story_id: string;
  assigned_by: string | null;
  assigned_at: string;
  status: string | null;
}
export interface ClassSession {
  id: string;
  enrollment_id: string | null;
  student_id: string | null;
  coach_id: string | null;
  story_id: string | null;
  story_key: string | null;
  scheduled_at: string | null;
  duration_min: number | null;
  zoom_link: string | null;
  status: SessionStatus;
  driver: Driver;
  current_step: number;
  current_phase: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}
export type SessionEventType = "open_story" | "step" | "answer" | "phase" | "note";
export interface SessionEvent {
  id: string;
  session_id: string;
  actor_role: Role | null;
  type: SessionEventType;
  payload: Record<string, unknown>;
  created_at: string;
}

// ---- The synced render-state (what every dashboard renders from) ----------

export interface RenderState {
  storyKey: StoryKey | null;
  stepIndex: number;
  phase: string | null;
  status: SessionStatus;
  driver: Driver;
}

// Answer event payload (student picks reflected on the coach screen).
export interface AnswerPayload {
  stepIndex: number;
  questionType: QuestionType;
  choice: number | number[] | boolean | string;
  correct: boolean;
}
