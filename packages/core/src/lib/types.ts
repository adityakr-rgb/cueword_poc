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

// Admin removed for the two-app POC — only the student and coach roles remain.
export type Role = "student" | "coach";
export type SessionStatus = "scheduled" | "live" | "completed" | "cancelled";
export type Driver = "student" | "coach";

// ---- Supabase row shapes --------------------------------------------------

/** JSON column helper (no `any`). */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  avatar_emoji: string | null;
  grade: string | null;
  timezone: string | null;
  username: string | null;
  // Production additions (migration 0002)
  auth_user_id: string | null;
  email: string | null;
  phone: string | null;
  color: string | null;
  tz_city: string | null;
  parent_name: string | null;
  parent_contact: string | null;
  parent_channel: "WhatsApp" | "Email" | null;
  term: number | null;
  level: number | null;
  coach_meta: Json;
  student_meta: Json;
  created_at: string;
}

/** The logged-in identity stored client-side (never includes the password hash). */
export interface AuthUser {
  id: string;
  role: Role;
  full_name: string;
  avatar_emoji: string | null;
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
  // Production additions (migration 0002): DB-backed content + catalog fields
  blurb: string | null;
  duration: string | null;
  genre: string | null;
  content: Json | null;
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
  // Production additions (migration 0002)
  skill: string | null;
  level: string | null;
  lesson_title: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  attendance_status: "present" | "late" | "absent" | "scheduled" | null;
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

// ---- Production row shapes (migration 0002) -------------------------------
// Hand-authored to match the codebase style (no generated `Database` blob).
// jsonb columns use the `Json` helper; render-only nested shapes stay loose.

export interface Submission {
  id: string;
  student_id: string;
  coach_id: string | null;
  skill: string | null;
  level: string | null;
  type: string | null;
  title: string | null;
  lesson_ref: string | null;
  body_text: string | null;
  transcript: string | null;
  audio_url: string | null;
  audio_duration: string | null;
  ai_ready: boolean;
  ai_score: Json | null; // { overall, criteria:[{name,score,max,note}], feedback }
  coach_feedback: string | null;
  status: "awaiting" | "marked" | "sent";
  submitted_at: string;
  marked_at: string | null;
  sent_at: string | null;
}

export interface Homework {
  id: string;
  student_id: string;
  assigned_by: string | null;
  skill: string | null;
  task: string;
  type: string | null;
  description: string | null;
  items_count: number | null;
  assigned_at: string;
  due_date: string | null;
  status: "toassign" | "assigned" | "completed" | "overdue";
}

export interface Attendance {
  id: string;
  student_id: string;
  session_id: string | null;
  date: string;
  skill: string | null;
  status: "present" | "late" | "absent" | "scheduled";
  created_at: string;
}

export interface CommsTemplate {
  id: string;
  label: string;
  body: string | null;
}

export interface CommsLog {
  id: string;
  student_id: string;
  coach_id: string | null;
  method: "WhatsApp" | "Email" | null;
  template_id: string | null;
  note: string | null;
  created_at: string;
}

export interface StudentStats {
  student_id: string;
  points: number;
  belt_index: number;
  belt_target: number | null;
  classes_attended: number;
  stories_done: number;
  workouts_done: number;
  story_accuracy: number | null;
  workout_accuracy: number | null;
  updated_at: string;
}

export interface Milestone {
  id: string;
  student_id: string;
  label: string;
  date: string | null;
  done: boolean;
  ord: number | null;
}

export interface PortfolioItem {
  id: string;
  student_id: string;
  type: "spoken" | "reading" | "writing" | "listening" | null;
  title: string | null;
  topic: string | null;
  skill: string | null;
  duration: string | null;
  words: number | null;
  excerpt: string | null;
  level: number | null;
  score: Json | null; // { correct, total }
  questions: Json | null; // [{ q, your, correct }]
  audio_url: string | null;
  coach_note: string | null;
  created_at: string;
}

export interface StudentVocab {
  id: string;
  student_id: string;
  word: string;
  pos: string | null;
  meaning: string | null;
  example: string | null;
  box: number;
  due_at: string | null;
  created_at: string;
}

export interface FlaggedItem {
  id: string;
  student_id: string;
  skill: string | null;
  title: string | null;
  item: string | null;
  source: string | null;
  resolved: boolean;
  created_at: string;
}

export interface Workout {
  id: string;
  category: string | null; // 'vocab' | 'comprehension' | 'expression'
  mode: "auto" | "coach" | null;
  title: string;
  skill: string | null;
  level: number | null;
  items: number | null;
  content: Json; // questions etc.
  created_at: string;
}

export interface DrillAttempt {
  id: string;
  student_id: string;
  workout_id: string | null;
  status: "todo" | "done" | "awaiting" | "feedback";
  score: Json | null; // { correct, total }
  flagged: number;
  body_text: string | null;
  audio_url: string | null;
  coach_feedback: string | null;
  submitted_at: string | null;
  created_at: string;
}

export interface CurriculumStory {
  id: string;
  term: number;
  level: number;
  n: number;
  story_id: string | null;
  title: string | null;
  genre: string | null;
  steps: number | null;
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: string | null;
  title: string | null;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}
