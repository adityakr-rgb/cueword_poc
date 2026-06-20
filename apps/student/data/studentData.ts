// ============================================================
// Cueword Student — mock data (ported verbatim from window.DATA).
// Terminology per handoff: item = question, widget = sub-question.
// 4 leveled skills + Vocabulary as a cross-cutting daily warmup.
// Window-global → ESM: this file exports a typed `DATA` object whose
// values are identical to the recovered mockup's `window.DATA`.
// ============================================================

export type SkillId = "reading" | "listening" | "writing" | "speaking";

export interface Skill {
  id: SkillId;
  name: string;
  blurb: string;
  level: number;
  color: string;
  wash: string;
  icon: string;
}

export interface Term {
  n: number;
  name: string;
  levels: number[];
  status: string;
}

export interface Passage {
  type: "passage";
  title: string;
  imgCap: string;
  body: string;
}

export interface Widget {
  id: string;
  type: "mcq" | "text" | "order";
  prompt: string;
  options?: string[];
  correct?: number;
  correctOrder?: number[];
  hint?: string;
  placeholder?: string;
  long?: boolean;
}

export interface LessonItem {
  no: number;
  role: string;
  label: string;
  stimulus: Passage;
  teach: string;
  widgets: Widget[];
}

export interface Lesson {
  id: string;
  skill: SkillId;
  level: number;
  title: string;
  skills: string[];
  coachNote: string;
  items: LessonItem[];
}

export interface Review {
  answers: Record<string, number | string | number[]>;
  score: { correct: number; total: number };
  wrong: string[];
  feedback: string;
  grade: string;
}

export interface HomeworkItem {
  id: string;
  title: string;
  skill: SkillId;
  assigned: string;
  dueDay: number;
  dueLabel: string;
  status: string;
  items: number;
}

export interface ResumeItem {
  id: string;
  skill: SkillId;
  title: string;
  level: number;
  item: number;
  total: number;
}

export interface Vocab {
  word: string;
  pos: string;
  meaning: string;
  example: string;
  progress: { done: number; total: number };
}

export interface NextClass {
  coach: string;
  when: string;
  time: string;
  tz: string;
  inMins: number;
}

export interface ProgressSkill extends Skill {
  mastered: number;
  practised: number;
  open: number;
  locked: number;
}

export interface Milestone {
  label: string;
  date: string;
  done: boolean;
}

export interface Progress {
  termsCompleted: number;
  termsTotal: number;
  currentTerm: number;
  termName: string;
  levelsPerSkill: number;
  levelsUnlocked: number;
  levelsMastered: number;
  skills: ProgressSkill[];
  milestones: Milestone[];
  weeks: number[];
}

export interface WorkQuestion {
  q: string;
  your: string;
  correct: boolean;
}

export interface WorkItem {
  id: string;
  type: "spoken" | "reading" | "writing" | "listening";
  title: string;
  topic: string;
  date: string;
  skill: SkillId;
  dur?: string;
  words?: number;
  excerpt?: string;
  level?: number;
  score?: { correct: number; total: number };
  questions?: WorkQuestion[];
}

export interface CurriculumLesson {
  code: string;
  no: number;
  title: string;
  skill: SkillId;
  items: number;
  status: string;
  hw: string;
  classAt: string | null;
  hwDue: string | null;
  seq: string[];
  outcomes: string[];
  about: string;
  mins: number;
}

export interface CurriculumWorkout {
  items: number;
  state: string;
  score: string | null;
}

export interface CurriculumLevel {
  lvl: number;
  title: string;
  state: string;
  lessons: CurriculumLesson[];
  workout: CurriculumWorkout;
}

export interface CurriculumTerm {
  n: number;
  name: string;
  sub: string;
  state: string;
  levels?: CurriculumLevel[];
  lessons?: number;
}

export interface TermCurriculum {
  assignedTerm: number;
  levelsPerTerm: number;
  storiesPerLevel: number;
  terms: CurriculumTerm[];
}

export interface Belt {
  name: string;
  color: string;
  ink: string;
}

export interface GamifySkill {
  id: string;
  name: string;
  pts: number;
  icon: string;
  color: string;
  wash: string;
}

export interface GamifyAlert {
  icon: string;
  tone: string;
  text: string;
}

export interface Gamify {
  belts: Belt[];
  beltIndex: number;
  points: number;
  beltTarget: number;
  gateTarget: number;
  skills: GamifySkill[];
  level: { current: number; total: number; storiesDone: number; storiesTotal: number };
  alerts: GamifyAlert[];
}

export interface DrillQuestion {
  q: string;
  opts: string[];
  correct: number;
}

export interface Drill {
  id: string;
  title: string;
  items: number;
  level: number;
  status: string;
  /** Reading passage (HTML) shown above the questions for reading-comprehension drills. */
  passage?: string;
  questions?: DrillQuestion[];
  score?: { correct: number; total: number };
  flagged?: number;
  kind?: "writing" | "speaking";
  feedback?: string;
  coach?: string;
}

export interface WorkoutCategory {
  id: string;
  name: string;
  icon: string;
  mode: "auto" | "coach";
  color: string;
  wash: string;
  blurb: string;
  drills: Drill[];
}

export interface Workouts {
  categories: WorkoutCategory[];
}

export interface FlaggedItem {
  id: string;
  skill: SkillId;
  title: string;
  item: string;
  from: string;
  date: string;
}

export interface ScheduleClass {
  time: string;
  coach: string;
  skill: string;
  today?: boolean;
  done?: boolean;
  startsInHours?: number;
}

export interface ScheduleDay {
  d: string;
  date: number;
  classes: ScheduleClass[];
}

export interface Schedule {
  tz: string;
  coachTz: string;
  weekLabel: string;
  slotsPerWeek: number;
  slotsFilled: number;
  cancelWindowHours: number;
  zoomAuto: boolean;
  days: ScheduleDay[];
  hours: string[];
}

export interface ParentFeedback {
  date: string;
  skill: SkillId;
  coach: string;
  lesson: string;
  text: string;
}

export interface Parent {
  attendance: { attended: number; total: number };
  stories: { done: number; total: number };
  workouts: { done: number; assigned: number };
  storyAccuracy: number;
  workoutAccuracy: number;
  avgScore: number;
  recentFeedback: ParentFeedback[];
  nextMilestone: { label: string; date: string; daysAway: number; lessonsLeft: number };
}

export interface NetCheckStep {
  id: string;
  label: string;
  detail: string;
  ok: string;
  icon: string;
}

export interface Student {
  name: string;
  first: string;
  grade: number;
  coins: number;
  coach: string;
  term: number;
  zoomUrl: string;
}

export interface StudentData {
  SKILLS: Skill[];
  TERMS: Term[];
  LEVEL_TITLES: Record<SkillId, string[]>;
  lessonsFor: (skillId: SkillId, lvl: number) => unknown[];
  LESSON: Lesson;
  REVIEW: Review;
  HOMEWORK: HomeworkItem[];
  RESUME: ResumeItem[];
  VOCAB: Vocab;
  NEXT_CLASS: NextClass;
  PROGRESS: Progress;
  WORKS: WorkItem[];
  TERM_CURRICULUM: TermCurriculum;
  SCHEDULE: Schedule;
  PARENT: Parent;
  NETCHECK: NetCheckStep[];
  GAMIFY: Gamify;
  BELTS: Belt[];
  WORKOUTS: Workouts;
  FLAGGED: FlaggedItem[];
  student: Student;
}

const SKILLS: Skill[] = [
  { id: "reading", name: "Reading", blurb: "Read & understand", level: 6, color: "var(--reading)", wash: "var(--reading-wash)", icon: "book" },
  { id: "listening", name: "Listening", blurb: "Listen & answer", level: 4, color: "var(--listening)", wash: "var(--listening-wash)", icon: "ear" },
  { id: "writing", name: "Writing", blurb: "Write your ideas", level: 3, color: "var(--writing)", wash: "var(--writing-wash)", icon: "pencil" },
  { id: "speaking", name: "Speaking", blurb: "Say it out loud", level: 5, color: "var(--speaking)", wash: "var(--speaking-wash)", icon: "mic" },
];

// 15 levels grouped into 3 terms (T1 1–5 Foundations, T2 6–10 Building, T3 11–15 Mastery)
const TERMS: Term[] = [
  { n: 1, name: "Term 1 · Foundations", levels: [1, 2, 3, 4, 5], status: "active" },
  { n: 2, name: "Term 2 · Building", levels: [6, 7, 8, 9, 10], status: "locked" },
  { n: 3, name: "Term 3 · Mastery", levels: [11, 12, 13, 14, 15], status: "locked" },
];

// Level titles per skill (just enough to feel real)
const LEVEL_TITLES: Record<SkillId, string[]> = {
  reading: ["Story Basics", "Who & Where", "Main Idea", "Sequencing", "Cause & Effect", "Character Feelings", "Making Predictions", "Fact vs Opinion", "Compare & Contrast", "Summarising", "Inference", "Author's Purpose", "Text Features", "Theme", "Synthesis"],
  listening: ["Sound Hunt", "Listen for Who", "Key Details", "Following Steps", "Listening for Why", "Tone of Voice", "Predict from Audio", "Real or Made-up", "Two Speakers", "Retell What You Heard", "Read Between Lines", "Speaker's Goal", "Audio Clues", "Big Message", "Put It Together"],
  writing: ["Letters & Words", "Super Sentences", "Joining Ideas", "Tell a Story", "Because & So", "Show Feelings", "What Happens Next", "My Opinion", "Then & Now", "Wrap It Up", "Add Details", "Why I Think", "Strong Starts", "My Message", "Whole Pieces"],
  speaking: ["Clear Sounds", "Say Who", "Tell the Details", "Steps Out Loud", "Say Why", "Happy or Sad Voice", "Guess Out Loud", "True Story?", "Talk it Through", "Retell Aloud", "Read My Mind", "My Big Goal", "Spoken Clues", "My Main Point", "Speak it All"],
};

// lessons per level vary (3/5/7). Build a generator.
function lessonsFor(skillId: SkillId, lvl: number): unknown[] {
  const counts = [3, 5, 7, 3, 5];
  const n = counts[(lvl - 1) % counts.length];
  const topicBank: Record<SkillId, string[]> = {
    reading: ["The Lost Kite", "Maya's Garden", "A Day at the Tide Pools", "The Friendly Robot", "Grandpa's Map", "Snow in the City", "The Talking Parrot"],
    listening: ["At the Market", "The Weather Report", "A Phone Call", "The Story Circle", "Directions to the Park", "The Animal Show", "Two Friends Plan"],
    writing: ["My Best Day", "A Letter to a Friend", "The Mystery Box", "Describe Your Pet", "My Invention", "A Thank You Note", "The Adventure"],
    speaking: ["Tell Me About You", "Retell the Story", "My Favourite Place", "Give Directions", "Show & Tell", "My Big News", "Describe a Picture"],
  };
  const skillTags: Record<SkillId, string[]> = {
    reading: ["Reading"], listening: ["Listening"], writing: ["Writing"], speaking: ["Speaking"],
  };
  return Array.from({ length: n }, (_, i) => ({
    id: `${skillId}-l${lvl}-le${i + 1}`,
    no: i + 1,
    title: topicBank[skillId][i % topicBank[skillId].length],
    skills: i === 1 ? [skillTags[skillId][0], "Vocabulary"] : skillTags[skillId],
    status:
      skillId === "reading" && lvl === 6 && i === 0
        ? "done"
        : skillId === "reading" && lvl === 6 && i === 1
          ? "inprogress"
          : "open",
  }));
}

// ---- The hero lesson: Reading L6 · "The Lost Kite" — full item player ----
const PASSAGE_A: Passage = {
  type: "passage",
  title: "The Lost Kite",
  imgCap: "A red kite stuck high in a tree",
  body: `<p>On Saturday, Sam took his bright red kite to the park. The wind was strong and the kite flew high above the trees.</p>
<p>Suddenly, the string slipped right out of Sam's hand! The kite floated up, up, up — and got stuck in the tallest oak tree.</p>
<p>Sam felt sad. But then his friend Mia had an idea. "Let's ask the park keeper for the long ladder," she said. Together, they got the kite back. Sam smiled. A good friend always helps.</p>`,
};
const PASSAGE_B: Passage = {
  type: "passage",
  title: "Mia's Turn",
  imgCap: "Two kids flying a kite together",
  body: `<p>The next week, it was Mia's kite that got tangled in a bush. This time, Sam knew just what to do.</p>
<p>"Hold this side," Sam said calmly. Slowly and gently, they freed the kite. Helping each other made flying kites twice as fun.</p>`,
};

const LESSON: Lesson = {
  id: "reading-l6-le1",
  skill: "reading",
  level: 6,
  title: "The Lost Kite",
  skills: ["Reading", "Vocabulary"],
  coachNote: "Read the passage aloud together first. Pause on Item 4 to discuss how Sam feels before he answers.",
  items: [
    {
      no: 1, role: "learning", label: "Learning",
      stimulus: PASSAGE_A,
      teach: "When we read a story, we find out <b>who</b> is in it and <b>where</b> it happens. These are called the characters and the setting.",
      widgets: [
        { id: "w1", type: "mcq", prompt: "Who is the main character in this story?", options: ["Sam", "The park keeper", "A dog", "Mia's mum"], correct: 0 },
        { id: "w2", type: "mcq", prompt: "Where does the story happen?", options: ["At school", "At the park", "In a shop", "On a boat"], correct: 1 },
      ],
    },
    {
      no: 2, role: "learning", label: "Learning",
      stimulus: PASSAGE_A,
      teach: "Some words tell us how a character <b>feels</b>. Look for feeling words like <i>sad</i>, <i>happy</i>, or <i>scared</i>.",
      widgets: [
        { id: "w3", type: "mcq", prompt: "How did Sam feel when the kite got stuck?", options: ["Excited", "Sad", "Sleepy", "Hungry"], correct: 1 },
      ],
    },
    {
      no: 3, role: "guided", label: "Guided Example",
      stimulus: PASSAGE_A,
      teach: "Let's try one together. The word <b>oak</b> is a type of tree. Use clues in the sentence to help you choose.",
      widgets: [
        { id: "w4", type: "mcq", prompt: "What does the word “oak” mean in this story?", options: ["A kind of tree", "A type of kite", "A park keeper", "A strong wind"], correct: 0, hint: "The kite got stuck in the tallest ____ tree." },
      ],
    },
    {
      no: 4, role: "practice", label: "Practice",
      stimulus: PASSAGE_A,
      teach: "Now you try on your own.",
      widgets: [
        { id: "w5", type: "mcq", prompt: "Why was Sam able to get his kite back?", options: ["The wind stopped", "Mia had an idea to use the ladder", "The kite fell by itself", "He climbed the tree"], correct: 1 },
        { id: "w6", type: "text", prompt: "Write one word that describes Mia.", placeholder: "Type a word…" },
      ],
    },
    {
      no: 5, role: "practice", label: "Practice",
      stimulus: PASSAGE_B,
      teach: "Here is a new part of the story. Read it, then answer.",
      widgets: [
        { id: "w7", type: "mcq", prompt: "In this part, whose kite got stuck?", options: ["Sam's", "Mia's", "The park keeper's", "Nobody's"], correct: 1 },
        { id: "w8", type: "order", prompt: "Put the steps in order:", options: ["They freed the kite", "Sam said “Hold this side”", "Mia's kite got tangled"], correctOrder: [2, 1, 0] },
      ],
    },
    {
      no: 6, role: "exit", label: "Exit Ticket",
      stimulus: PASSAGE_B,
      teach: "Last one! This shows your coach what you learned today.",
      widgets: [
        { id: "w9", type: "mcq", prompt: "What is the BIG message (theme) of the whole story?", options: ["Kites are dangerous", "Good friends help each other", "Trees are very tall", "Parks are fun"], correct: 1 },
        { id: "w10", type: "text", prompt: "Tell about a time a friend helped you. (1–2 sentences)", placeholder: "Write your answer…", long: true },
      ],
    },
  ],
};

// A previously-submitted lesson (for Performance Review demo) — answers + feedback
const REVIEW: Review = {
  answers: { w1: 0, w2: 1, w3: 1, w4: 0, w5: 1, w6: "kind", w7: 1, w8: [2, 1, 0], w9: 1, w10: "My friend Leo helped me find my shoe when I lost it at school. I was happy." },
  score: { correct: 8, total: 9 },
  wrong: ["w8"],
  feedback: "Wonderful work, Maya! You really understood how Sam and Mia helped each other. For Item 5, check the order of the steps once more — read slowly. Your writing about Leo was lovely. ⭐",
  grade: "Mastered",
};

const HOMEWORK: HomeworkItem[] = [
  { id: "hw1", title: "Reading: The Lost Kite — Practice", skill: "reading", assigned: "Mon", dueDay: 3, dueLabel: "Wed", status: "todo", items: 6 },
  { id: "hw2", title: "Writing: My Best Day", skill: "writing", assigned: "Mon", dueDay: 2, dueLabel: "Tue", status: "todo", items: 3 },
  { id: "hw3", title: "Listening: The Weather Report", skill: "listening", assigned: "Sun", dueDay: 1, dueLabel: "Today", status: "todo", items: 5 },
];

const RESUME: ResumeItem[] = [
  { id: "reading-l6-le2", skill: "reading", title: "Maya's Garden", level: 6, item: 3, total: 6 },
  { id: "speaking-l5-le1", skill: "speaking", title: "Tell Me About You", level: 5, item: 2, total: 4 },
];

const VOCAB: Vocab = {
  word: "tangled",
  pos: "adjective",
  meaning: "twisted together in a messy way",
  example: "The kite string was all tangled in the branches.",
  progress: { done: 3, total: 5 },
};

const NEXT_CLASS: NextClass = {
  coach: "Coach Liza",
  when: "Today",
  time: "4:00 PM",
  tz: "your time",
  inMins: 95,
};

const SKILL_STATUS: Record<SkillId, { mastered: number; practised: number }> = {
  reading: { mastered: 5, practised: 0 },
  listening: { mastered: 2, practised: 1 },
  writing: { mastered: 2, practised: 1 },
  speaking: { mastered: 4, practised: 1 },
};
const progressSkills: ProgressSkill[] = SKILLS.map((s) => {
  const st = SKILL_STATUS[s.id] || { mastered: 0, practised: 0 };
  const open = Math.max(0, s.level - st.mastered - st.practised);
  const locked = 8 - s.level;
  return { ...s, mastered: st.mastered, practised: st.practised, open, locked };
});
const PROGRESS: Progress = {
  termsCompleted: 0, termsTotal: 3, currentTerm: 1, termName: "Foundations",
  levelsPerSkill: 8,
  levelsUnlocked: progressSkills.reduce((a, s) => a + s.level, 0),
  levelsMastered: progressSkills.reduce((a, s) => a + s.mastered, 0),
  skills: progressSkills,
  milestones: [
    { label: "Joined Cueword", date: "Mar 24", done: true },
    { label: "First lesson complete", date: "Mar 28", done: true },
    { label: "Reading reached Level 5", date: "May 2", done: true },
    { label: "Term 1 Assessment", date: "Jun 20", done: false },
    { label: "End-of-term showcase", date: "Jun 24", done: false },
  ],
  weeks: [2, 3, 3, 4, 2, 5, 4, 6],
};

const WORKS: WorkItem[] = [
  { id: "wk1", type: "spoken", title: "Speaking Exercise", topic: "My Favourite Place", date: "Apr 22", dur: "0:48", skill: "speaking" },
  {
    id: "wk6", type: "reading", title: "Reading Exercise", topic: "The Lost Kite", date: "Apr 20", skill: "reading",
    level: 6, score: { correct: 8, total: 9 },
    questions: [
      { q: "Who is the main character in this story?", your: "Sam", correct: true },
      { q: "Where does the story happen?", your: "At the park", correct: true },
      { q: "How did Sam feel when the kite got stuck?", your: "Sad", correct: true },
      { q: "What does the word “oak” mean?", your: "A kind of tree", correct: true },
      { q: "Why was Sam able to get his kite back?", your: "Mia had an idea to use the ladder", correct: true },
      { q: "Write one word that describes Mia.", your: "Kind", correct: true },
      { q: "In the second part, whose kite got stuck?", your: "Mia's", correct: true },
      { q: "Put the steps of the story in order", your: "Last two swapped", correct: false },
      { q: "What is the BIG message of the story?", your: "Good friends help each other", correct: true },
    ],
  },
  {
    id: "wk2", type: "writing", title: "Writing Exercise", topic: "My Best Day", date: "Apr 14", words: 62, skill: "writing",
    excerpt: "My best day was when we went to the beach. I built a giant sandcastle with my dad and we found three crabs…",
  },
  {
    id: "wk7", type: "listening", title: "Listening Exercise", topic: "The Forest Walk", date: "Apr 11", skill: "listening",
    level: 4, dur: "1:24", score: { correct: 6, total: 7 },
    questions: [
      { q: "Where did the children go for their walk?", your: "Into the forest", correct: true },
      { q: "What sound did they hear first?", your: "A woodpecker", correct: true },
      { q: "What colour was the fox they saw?", your: "Brown", correct: true },
      { q: "Why did they stop walking?", your: "To eat lunch", correct: true },
      { q: "How did the children feel at the end?", your: "Tired but happy", correct: true },
      { q: "How many birds did they count?", your: "Five", correct: true },
      { q: "What did they find near the stream?", your: "A nest", correct: false },
    ],
  },
  { id: "wk3", type: "spoken", title: "Speaking Exercise", topic: "Retell the Story", date: "Apr 8", dur: "1:02", skill: "speaking" },
  {
    id: "wk4", type: "writing", title: "Writing Exercise", topic: "A Letter to a Friend", date: "Mar 30", words: 54, skill: "writing",
    excerpt: "Dear Sofia, I hope you are having fun at your new school. I miss playing tag with you at lunch…",
  },
  {
    id: "wk8", type: "reading", title: "Reading Exercise", topic: "Mia's Turn", date: "Mar 28", skill: "reading",
    level: 5, score: { correct: 5, total: 5 },
    questions: [
      { q: "Whose kite got tangled in this part?", your: "Mia's", correct: true },
      { q: "Who had the idea to help?", your: "Sam", correct: true },
      { q: "What did they use to reach the kite?", your: "A ladder", correct: true },
      { q: "How did Mia feel afterwards?", your: "Grateful", correct: true },
      { q: "What is a good title for this part?", your: "Helping Mia", correct: true },
    ],
  },
  { id: "wk5", type: "spoken", title: "Speaking Exercise", topic: "Show & Tell", date: "Mar 26", dur: "0:39", skill: "speaking" },
];

// ---- Term-led curriculum (My Lessons rework) ----
const skillRotation: SkillId[] = ["reading", "listening", "writing", "speaking"];
const lessonTopics: Record<SkillId, string[]> = {
  reading: ["The Lost Kite", "Maya's Garden", "Tide Pools", "Grandpa's Map", "The Friendly Robot", "Snow in the City"],
  listening: ["At the Market", "The Weather Report", "A Phone Call", "Directions to the Park", "The Animal Show"],
  writing: ["My Best Day", "A Letter to a Friend", "The Mystery Box", "Describe Your Pet", "My Invention"],
  speaking: ["Tell Me About You", "My Favourite Place", "Show & Tell", "Give Directions", "Retell the Story"],
};
const ITEM_SEQ = ["Learning", "Guided", "Practice", "Exit Ticket"];

const OUTCOMES: Record<SkillId, string[]> = {
  reading: [
    "Spot the main character and where the story happens",
    "Use clues in the text to work out new words",
    "Explain how a character feels and why",
    "Find the big idea (theme) of a story",
  ],
  listening: [
    "Listen carefully for key details",
    "Follow spoken instructions in order",
    "Notice the speaker's tone and feeling",
    "Retell the main message in your own words",
  ],
  writing: [
    "Plan your ideas before you write",
    "Write clear, complete sentences",
    "Add describing words to paint a picture",
    "Join ideas with words like 'because' and 'so'",
  ],
  speaking: [
    "Speak clearly in full sentences",
    "Describe things with lots of detail",
    "Retell a story out loud in order",
    "Share your opinion and give a reason",
  ],
};
const ABOUT: Record<SkillId, string> = {
  reading: "Read a short story and answer questions that build your reading skills step by step.",
  listening: "Listen to a clip, then answer questions that grow your listening skills.",
  writing: "Learn a writing idea, see an example, then write your own piece.",
  speaking: "Learn a speaking skill, hear an example, then record yourself trying it.",
};
const outcomesFor = (skill: SkillId, n: number): string[] => (OUTCOMES[skill] || OUTCOMES.reading).slice(0, Math.max(3, Math.min(4, n - 2)));

function buildTerm(): CurriculumLevel[] {
  const levelMeta = [
    { lvl: 1, title: "Story Basics", state: "done" },
    { lvl: 2, title: "Listening & Looking", state: "done" },
    { lvl: 3, title: "Finding Meaning", state: "current" },
    { lvl: 4, title: "Putting It Together", state: "locked" },
    { lvl: 5, title: "Show What You Know", state: "locked" },
    { lvl: 6, title: "Deeper Thinking", state: "locked" },
    { lvl: 7, title: "Author's Craft", state: "locked" },
    { lvl: 8, title: "Bringing It Together", state: "locked" },
  ];
  const STORIES_PER_LEVEL = 10;
  let n = 0;
  let rot = 0;
  const futureClasses = ["Sat, Jun 13 · 10:00 AM", "Wed, Jun 17 · 4:00 PM", "Sat, Jun 20 · 10:00 AM"];
  return levelMeta.map((lm) => {
    const lessons: CurriculumLesson[] = Array.from({ length: STORIES_PER_LEVEL }, (_, i) => {
      n += 1;
      const skill = skillRotation[rot % skillRotation.length];
      rot += 1;
      const topicArr = lessonTopics[skill];
      const title = topicArr[i % topicArr.length];
      const items = [6, 5, 7, 4, 6][(n - 1) % 5];
      let status: string;
      let hw: string;
      let classAt: string | null;
      if (lm.state === "done") {
        status = "done";
        hw = "done";
        classAt = "Completed";
      } else if (lm.state === "current") {
        if (i < 6) {
          status = "done";
          hw = "done";
          classAt = "Completed";
        } else if (i === 6) {
          status = "done";
          hw = "due";
          classAt = "Mon, Jun 9 · 4:00 PM";
        } else if (i === 7) {
          status = "today";
          hw = "afterclass";
          classAt = "Today · 4:00 PM";
        } else {
          status = "upcoming";
          hw = "afterclass";
          classAt = futureClasses[i - 8] || "Next week";
        }
      } else {
        status = "locked";
        hw = "locked";
        classAt = null;
      }
      return {
        code: `L${n}`, no: n, title, skill, items, status, hw, classAt,
        hwDue: hw === "due" ? "Wed" : null,
        seq: ITEM_SEQ, outcomes: outcomesFor(skill, items), about: ABOUT[skill],
        mins: items * 3 + 6,
      };
    });
    const doneCount = lessons.filter((l) => l.status === "done").length;
    const workout: CurriculumWorkout = {
      items: 12,
      state: lm.state === "done" ? "done" : lm.state === "current" ? (doneCount >= 6 ? "open" : "locked") : "locked",
      score: lm.state === "done" ? "11/12" : null,
    };
    return { ...lm, lessons, workout };
  });
}

const TERM_CURRICULUM: TermCurriculum = {
  assignedTerm: 1,
  levelsPerTerm: 8,
  storiesPerLevel: 10,
  terms: [
    { n: 1, name: "Term 1", sub: "Foundations", state: "assigned", levels: buildTerm() },
    { n: 2, name: "Term 2", sub: "Building", state: "locked", lessons: 80 },
    { n: 3, name: "Term 3", sub: "Mastery", state: "locked", lessons: 80 },
  ],
};

// ---- Gamification: dual Belt + Level system with multi-skill gates ----
const BELTS: Belt[] = [
  { name: "White", color: "#ECE6D6", ink: "#5A4A2A" },
  { name: "Yellow", color: "#F4C95D", ink: "#5A3D0A" },
  { name: "Orange", color: "#E89B5C", ink: "#5A2E0A" },
  { name: "Green", color: "#6FA86A", ink: "#FFFFFF" },
  { name: "Blue", color: "#5B8FB9", ink: "#FFFFFF" },
  { name: "Purple", color: "#8B6BB1", ink: "#FFFFFF" },
  { name: "Brown", color: "#8B6F4E", ink: "#FFFFFF" },
  { name: "Red", color: "#C9594F", ink: "#FFFFFF" },
  { name: "Grey", color: "#5C6B7A", ink: "#FFFFFF" },
  { name: "Black", color: "#2A2A33", ink: "#F4C95D" },
];
const GAMIFY: Gamify = {
  belts: BELTS,
  beltIndex: 1,
  // Single belt-points scale used everywhere (Progress + Story finish): the
  // student earns points from stories & workouts toward a 1,000-point belt gate.
  points: 720,
  beltTarget: 1000,
  gateTarget: 600,
  skills: [
    { id: "reading", name: "Reading", pts: 720, icon: "book", color: "var(--reading)", wash: "var(--reading-wash)" },
    { id: "comprehension", name: "Comprehension", pts: 650, icon: "ear", color: "var(--listening)", wash: "var(--listening-wash)" },
    { id: "writing", name: "Writing", pts: 430, icon: "pencil", color: "var(--writing)", wash: "var(--writing-wash)" },
    { id: "speaking", name: "Speaking", pts: 610, icon: "mic", color: "var(--speaking)", wash: "var(--speaking-wash)" },
  ],
  level: { current: 3, total: 8, storiesDone: 7, storiesTotal: 10 },
  alerts: [
    { icon: "book", tone: "level", text: "3 more stories to reach Level 4" },
    { icon: "pencil", tone: "gate", text: "280 points to go to earn your Orange belt" },
    { icon: "flag", tone: "milestone", text: "10 days until your Term 1 Assessment" },
  ],
};

// ---- My Workouts — three workout types (per platform spec) ----
const WORKOUTS: Workouts = {
  categories: [
    {
      id: "vocabulary", name: "Vocabulary", icon: "sparkle", mode: "auto",
      color: "var(--vocab)", wash: "var(--vocab-wash)",
      blurb: "Quick drills to build and lock in new words.",
      drills: [
        {
          id: "v1", title: "Word Meanings · Set 4", items: 5, level: 3, status: "todo",
          questions: [
            { q: "What does <b>tangled</b> mean?", opts: ["Twisted together in a messy way", "Very tall", "Bright and shiny"], correct: 0 },
            { q: "What does <b>stranded</b> mean?", opts: ["Left behind, unable to leave", "Moving quickly", "Feeling sleepy"], correct: 0 },
            { q: "Choose the word that fits: “The kite was ___ in the branches.”", opts: ["tangled", "kind", "sunny"], correct: 0 },
            { q: "What does <b>navigate</b> mean?", opts: ["To find your way", "To fall asleep", "To shout loudly"], correct: 0 },
            { q: "Which word means the opposite of <b>calm</b>?", opts: ["panicked", "quiet", "still"], correct: 0 },
          ],
        },
        { id: "v2", title: "Synonyms & Opposites", items: 4, level: 3, status: "done", score: { correct: 4, total: 4 }, questions: [] },
        {
          id: "v3", title: "Word in a Sentence", items: 5, level: 2, status: "todo",
          questions: [
            { q: "Pick the sentence that uses <b>brave</b> correctly.", opts: ["The brave firefighter ran in.", "I brave my lunch.", "It was a brave colour."], correct: 0 },
            { q: "Pick the sentence that uses <b>gentle</b> correctly.", opts: ["She gave the puppy a gentle pat.", "The car was very gentle fast.", "I gentle to school."], correct: 0 },
            { q: "Pick the sentence that uses <b>curious</b> correctly.", opts: ["The curious cat peeked inside.", "I ate a curious sandwich.", "It rained curious."], correct: 0 },
          ],
        },
      ],
    },
    {
      id: "comprehension", name: "Reading & Listening Comprehension", icon: "ear", mode: "auto",
      color: "var(--listening)", wash: "var(--listening-wash)",
      blurb: "Answer the questions — your score is worked out instantly.",
      drills: [
        {
          id: "c1", title: "Reading: The Lost Kite", items: 5, level: 3, status: "todo",
          passage: PASSAGE_A.body,
          questions: [
            { q: "Who is the main character?", opts: ["Sam", "The park keeper", "A dog"], correct: 0 },
            { q: "Where does the story happen?", opts: ["At the park", "At school", "On a boat"], correct: 0 },
            { q: "How did Sam feel when the kite got stuck?", opts: ["Sad", "Excited", "Sleepy"], correct: 0 },
            { q: "Why was Sam able to get his kite back?", opts: ["Mia had an idea to use the ladder", "The wind stopped", "He climbed the tree"], correct: 0 },
            { q: "What is the big message of the story?", opts: ["Good friends help each other", "Kites are dangerous", "Trees are tall"], correct: 0 },
          ],
        },
        { id: "c2", title: "Listening: The Weather Report", items: 4, level: 3, status: "done", score: { correct: 3, total: 4 }, flagged: 1, questions: [] },
        {
          id: "c3", title: "Reading: Maya's Garden", items: 6, level: 2, status: "todo",
          passage: `<p>Maya loved her little garden behind the house. One spring morning, she planted sunflower seeds in the soft brown soil.</p>
<p>Every morning before school, Maya watered the garden so the plants would grow tall and strong. Her grandpa helped her pull out the weeds and showed her the sunniest spots.</p>
<p>Then one day, the very first sunflower bloomed — bright and yellow. Maya felt so proud. All her hard work had paid off.</p>`,
          questions: [
            { q: "What did Maya plant first?", opts: ["Sunflower seeds", "A tree", "Carrots"], correct: 0 },
            { q: "Why did Maya water the garden every morning?", opts: ["So the plants would grow", "To make mud", "Because it was hot"], correct: 0 },
            { q: "Who helped Maya in the garden?", opts: ["Her grandpa", "A robot", "Nobody"], correct: 0 },
            { q: "How did Maya feel when the first flower bloomed?", opts: ["Proud", "Bored", "Scared"], correct: 0 },
          ],
        },
      ],
    },
    {
      id: "expression", name: "Speaking & Writing", icon: "mic", mode: "coach",
      color: "var(--speaking)", wash: "var(--speaking-wash)",
      blurb: "Open-ended practice your coach reads and gives feedback on.",
      drills: [
        { id: "e1", title: "Speaking: My Favourite Place", items: 1, level: 3, kind: "speaking", status: "feedback", feedback: "Lovely clear voice, Maya! You spoke in full sentences. Next time, add one more reason why you like it. ⭐", coach: "Coach Liza" },
        { id: "e2", title: "Writing: A Letter to a Friend", items: 1, level: 3, kind: "writing", status: "awaiting" },
        { id: "e3", title: "Speaking: Retell the Story", items: 1, level: 2, kind: "speaking", status: "todo" },
        { id: "e4", title: "Writing: My Best Day", items: 1, level: 2, kind: "writing", status: "todo" },
      ],
    },
  ],
};

// ---- Flagged review queue — mistakes auto-pushed to the coach for next class ----
const FLAGGED: FlaggedItem[] = [
  { id: "f1", skill: "reading", title: "The Lost Kite", item: "Putting the story events in order", from: "Reading workout", date: "Jun 9" },
  { id: "f2", skill: "listening", title: "The Weather Report", item: "What to wear on Friday", from: "Listening workout", date: "Jun 8" },
];

// ---- Schedule (student week view). Bounded to exactly 2 slots per week. ----
const SCHEDULE: Schedule = {
  tz: "PT (Los Angeles)",
  coachTz: "Coach is in Manila (PHT)",
  weekLabel: "Jun 8 – Jun 14",
  slotsPerWeek: 2,
  slotsFilled: 2,
  cancelWindowHours: 4,
  zoomAuto: true,
  days: [
    { d: "Mon", date: 8, classes: [] },
    { d: "Tue", date: 9, classes: [] },
    { d: "Wed", date: 10, classes: [{ time: "4:00 PM", coach: "Coach Liza", skill: "Reading", today: true, startsInHours: 1.5 }] },
    { d: "Thu", date: 11, classes: [] },
    { d: "Fri", date: 12, classes: [] },
    { d: "Sat", date: 13, classes: [{ time: "10:00 AM", coach: "Coach Liza", skill: "Writing", startsInHours: 74 }] },
    { d: "Sun", date: 14, classes: [] },
  ],
  hours: ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM"],
};

// ---- Parent dashboard data ----
const PARENT: Parent = {
  attendance: { attended: 11, total: 12 },
  stories: { done: 27, total: 80 },
  workouts: { done: 9, assigned: 11 },
  storyAccuracy: 88,
  workoutAccuracy: 84,
  avgScore: 86,
  recentFeedback: [
    { date: "Jun 9", skill: "reading", coach: "Coach Liza", lesson: "The Lost Kite", text: "Maya understood how characters help each other. Working on reading more slowly for tricky steps." },
    { date: "Jun 6", skill: "writing", coach: "Coach Liza", lesson: "My Best Day", text: "Lovely descriptive words! Reminding her to start sentences with a capital letter." },
  ],
  nextMilestone: { label: "Level 4 upgrade", date: "Jun 20", daysAway: 10, lessonsLeft: 3 },
};

// ---- Pre-class connection check — just internet speed + mic permission ----
const NETCHECK: NetCheckStep[] = [
  { id: "net", label: "Internet speed", detail: "Checking your speed…", ok: "Good · 48 Mbps", icon: "wifi" },
  { id: "mic", label: "Microphone access", detail: "Checking mic permission…", ok: "Permission granted", icon: "mic" },
];

export const DATA: StudentData = {
  SKILLS, TERMS, LEVEL_TITLES, lessonsFor, LESSON, REVIEW, HOMEWORK, RESUME, VOCAB, NEXT_CLASS, PROGRESS, WORKS,
  TERM_CURRICULUM, SCHEDULE, PARENT, NETCHECK, GAMIFY, BELTS, WORKOUTS, FLAGGED,
  student: {
    name: "Maya", first: "Maya", grade: 4, coins: 240, coach: "Coach Liza", term: 1,
    zoomUrl: "https://zoom.us/j/94945601041?pwd=kwiv9XebE7z06u0iVyaqbaKIpTMMq3.1",
  },
};
