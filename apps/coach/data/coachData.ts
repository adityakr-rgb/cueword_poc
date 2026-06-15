/* ============================================================
   Cueword Coach — sample data (ported verbatim from the prototype's
   app/data.js window.CW IIFE → typed ESM module). All sample values
   are identical to the mockup; only the shape is typed.
   ============================================================ */

export type SkillKey = "vocab" | "read" | "listen" | "write" | "speak";
export type SkillStatus = "locked" | "unlocked" | "progress" | "mastered";

export interface SkillState {
  level: string;
  status: SkillStatus;
  appSync: string;
  score: number | null;
}
export type StudentSkills = Record<SkillKey, SkillState>;

export interface StudentPosition {
  term: number;
  level: number;
  story: number;
}

export interface Student {
  id: string;
  first: string;
  last: string;
  name: string;
  grade: number;
  color: string;
  tz: string;
  tzCity: string;
  term: number;
  enrolled: string;
  parent: string;
  parentChannel: string;
  next: string;
  nextShort: string;
  skills: StudentSkills;
  pos: StudentPosition;
}

export type SessionStatus = "done" | "live" | "scheduled";
export interface Session {
  id: string;
  studentId: string;
  skill: SkillKey;
  level: string;
  lesson: string;
  time: string;
  dur: number;
  status: SessionStatus;
  zoom: string;
}

export interface AICriterion {
  name: string;
  score: number;
  max: number;
  note: string;
}
export interface AIScore {
  overall: number;
  criteria: AICriterion[];
  feedback: string;
}
export interface Submission {
  id: string;
  studentId: string;
  skill: SkillKey;
  level: string;
  type: string;
  title: string;
  lesson: string;
  date: string;
  aiReady: boolean;
  body?: string;
  transcript?: string;
  duration?: string;
  ai: AIScore | null;
}

export interface HistoryEntry {
  date: string;
  skill: SkillKey;
  level: string;
  status: SkillStatus;
  note: string;
}

export type HomeworkStatus = "toassign" | "assigned" | "completed" | "overdue";
export interface HomeworkItem {
  task: string;
  skill: SkillKey;
  due: string;
  status: HomeworkStatus;
}

export interface CommsEntry {
  studentId: string;
  last: string;
  method: "WhatsApp" | "Email";
  template: string;
  note: string;
}

export interface Template {
  id: string;
  label: string;
}

export interface StoryMeta {
  n: number;
  id: string;
  title: string;
  genre: string;
  steps: number;
  flow: { listen: number; read: number; speak: number; write: number };
}
export interface CurriculumLevel {
  level: number;
  unit: string;
  stories: StoryMeta[];
}
export interface CurriculumTerm {
  term: number;
  name: string;
  levels: CurriculumLevel[];
}

export interface LiveCoachNote {
  do?: string;
  look: string;
  watch: string;
}
export interface LiveStep {
  phase: string;
  kind: string;
  label: string;
  student: string;
  expects?: string;
  said?: string;
  coach: LiveCoachNote;
}
export interface LivePhase {
  skill: SkillKey;
  dur: string;
  checks: number;
}
export interface LiveSession {
  sessionId: string;
  studentId: string;
  term: number;
  level: number;
  story: number;
  unit: string;
  title: string;
  genre: string;
  intro: string;
  coverCaption: string;
  elapsed: number;
  current: number;
  whoDriving: string;
  phases: LivePhase[];
  steps: LiveStep[];
  aiDraft: string;
}

export interface CoachProfile {
  name: string;
  initials: string;
  role: string;
  location: string;
  color: string;
  email: string;
  phone: string;
  timezone: string;
  coachId: string;
  joined: string;
  tenure: string;
  languages: string[];
  grades: number[];
  certs: string;
  workingDays: string;
  workingHours: string;
  defaultZoom: string;
  stats: { students: number; sessionsTaught: number; attendance: string; rating: number };
  prefs: {
    showStudentTz: boolean;
    autoFeedback: boolean;
    reminders: boolean;
    weeklyDigest: boolean;
    soundAlerts: boolean;
  };
}

export type AttendanceStatus = "present" | "late" | "absent" | "scheduled";
export interface AttendanceLogEntry {
  date: string;
  skill: SkillKey;
  status: AttendanceStatus;
}
export interface AttendanceRecord {
  log: AttendanceLogEntry[];
  present: number;
  late: number;
  absent: number;
  total: number;
  rate: number;
}

export interface SkillDef {
  key: SkillKey;
  label: string;
  short: string;
}

const SKILLS: SkillDef[] = [
  { key: "vocab", label: "Vocab", short: "Voc" },
  { key: "read", label: "Read", short: "Rd" },
  { key: "listen", label: "Listen", short: "Lis" },
  { key: "write", label: "Write", short: "Wr" },
  { key: "speak", label: "Speak", short: "Sp" },
];

// status: locked | unlocked | progress | mastered
// appSync: which level the student's mobile practice app has unlocked
type SkillTriple = [string, SkillStatus, string];
function skills(
  v: SkillTriple,
  r: SkillTriple,
  l: SkillTriple,
  w: SkillTriple,
  s: SkillTriple,
): StudentSkills {
  return {
    vocab: { level: v[0], status: v[1], appSync: v[2], score: null },
    read: { level: r[0], status: r[1], appSync: r[2], score: null },
    listen: { level: l[0], status: l[1], appSync: l[2], score: null },
    write: { level: w[0], status: w[1], appSync: w[2], score: null },
    speak: { level: s[0], status: s[1], appSync: s[2], score: null },
  };
}

const students: Student[] = [
  {
    id: "maya",
    first: "Maya",
    last: "Chen",
    name: "Maya Chen",
    grade: 4,
    color: "#2D7FF9",
    tz: "PST · UTC−8",
    tzCity: "San Jose, CA",
    term: 1,
    enrolled: "Sep 3, 2025",
    parent: "Grace Chen",
    parentChannel: "WhatsApp",
    next: "Today · 5:30 PM",
    nextShort: "Today 5:30 PM",
    skills: skills(
      ["L4", "progress", "L3"],
      ["L3", "mastered", "L3"],
      ["L4", "progress", "L3"],
      ["L3", "progress", "L2"],
      ["L2", "unlocked", "L2"],
    ),
    pos: { term: 1, level: 3, story: 4 },
  },
  {
    id: "diego",
    first: "Diego",
    last: "Ramos",
    name: "Diego Ramos",
    grade: 3,
    color: "#EC5A8D",
    tz: "CST · UTC−6",
    tzCity: "Austin, TX",
    term: 1,
    enrolled: "Sep 9, 2025",
    parent: "Sofia Ramos",
    parentChannel: "WhatsApp",
    next: "Today · 8:30 PM",
    nextShort: "Today 8:30 PM",
    skills: skills(
      ["L3", "progress", "L3"],
      ["L2", "mastered", "L2"],
      ["L3", "unlocked", "L2"],
      ["L2", "progress", "L2"],
      ["L3", "progress", "L2"],
    ),
    pos: { term: 1, level: 2, story: 7 },
  },
  {
    id: "amara",
    first: "Amara",
    last: "Okafor",
    name: "Amara Okafor",
    grade: 5,
    color: "#11A974",
    tz: "EST · UTC−5",
    tzCity: "Atlanta, GA",
    term: 1,
    enrolled: "Aug 28, 2025",
    parent: "Ngozi Okafor",
    parentChannel: "Email",
    next: "Today · 9:30 PM",
    nextShort: "Today 9:30 PM",
    skills: skills(
      ["L5", "mastered", "L5"],
      ["L5", "progress", "L4"],
      ["L4", "progress", "L4"],
      ["L4", "progress", "L3"],
      ["L4", "mastered", "L4"],
    ),
    pos: { term: 1, level: 5, story: 2 },
  },
  {
    id: "liam",
    first: "Liam",
    last: "O'Brien",
    name: "Liam O'Brien",
    grade: 4,
    color: "#EE9612",
    tz: "MST · UTC−7",
    tzCity: "Denver, CO",
    term: 1,
    enrolled: "Sep 14, 2025",
    parent: "Sean O'Brien",
    parentChannel: "WhatsApp",
    next: "Tue · 7:30 PM",
    nextShort: "Tue 7:30 PM",
    skills: skills(
      ["L3", "progress", "L2"],
      ["L3", "progress", "L3"],
      ["L2", "mastered", "L2"],
      ["L3", "unlocked", "L2"],
      ["L2", "progress", "L2"],
    ),
    pos: { term: 1, level: 3, story: 3 },
  },
  {
    id: "sofia",
    first: "Sofia",
    last: "Martins",
    name: "Sofia Martins",
    grade: 5,
    color: "#7C5CFC",
    tz: "EST · UTC−5",
    tzCity: "Boston, MA",
    term: 1,
    enrolled: "Aug 25, 2025",
    parent: "Beatriz Martins",
    parentChannel: "WhatsApp",
    next: "Wed · 8:30 PM",
    nextShort: "Wed 8:30 PM",
    skills: skills(
      ["L4", "mastered", "L4"],
      ["L5", "progress", "L4"],
      ["L4", "progress", "L4"],
      ["L5", "progress", "L4"],
      ["L4", "progress", "L3"],
    ),
    pos: { term: 1, level: 6, story: 1 },
  },
  {
    id: "noah",
    first: "Noah",
    last: "Williams",
    name: "Noah Williams",
    grade: 3,
    color: "#06AFC4",
    tz: "PST · UTC−8",
    tzCity: "Portland, OR",
    term: 1,
    enrolled: "Sep 18, 2025",
    parent: "Tasha Williams",
    parentChannel: "Email",
    next: "Thu · 9:30 PM",
    nextShort: "Thu 9:30 PM",
    skills: skills(
      ["L2", "progress", "L2"],
      ["L2", "progress", "L2"],
      ["L2", "unlocked", "L1"],
      ["L1", "progress", "L1"],
      ["L2", "unlocked", "L1"],
    ),
    pos: { term: 1, level: 1, story: 8 },
  },
];

// today's sessions (Manila evening = US daytime/afternoon)
const sessions: Session[] = [
  { id: "s1", studentId: "amara", skill: "write", level: "L4", lesson: "Lesson 12 · Persuasive paragraph", time: "6:00 PM", dur: 60, status: "done", zoom: "#" },
  { id: "s2", studentId: "maya", skill: "read", level: "L3", lesson: "Lesson 9 · Inference & clues", time: "5:30 PM", dur: 60, status: "live", zoom: "#" },
  { id: "s3", studentId: "diego", skill: "speak", level: "L3", lesson: "Lesson 7 · Retell a story", time: "8:30 PM", dur: 60, status: "scheduled", zoom: "#" },
  { id: "s4", studentId: "noah", skill: "vocab", level: "L2", lesson: "Lesson 5 · Synonyms & shades", time: "9:30 PM", dur: 60, status: "scheduled", zoom: "#" },
];

// submissions awaiting marking
const submissions: Submission[] = [
  {
    id: "m1",
    studentId: "maya",
    skill: "write",
    level: "L3",
    type: "Writing piece",
    title: "My Best Day Ever",
    lesson: "Lesson 8 · Personal narrative",
    date: "Jun 9",
    aiReady: true,
    body: `The best day of my life was when my family went to the beach for my birthday. We woke up super early, before the sun was even up, and packed the car with towels, snacks, and my new orange kite.\n\nWhen we got there the sand was warm and the waves were so loud. My little brother and I built the biggest sandcastle we ever made. It had four towers and a moat that the water filled up by itself. After lunch my dad helped me fly my kite and it went so high it looked like a tiny dot in the sky.\n\nI will never forget that day because my whole family was together and everyone was laughing. It made me feel happy and lucky at the same time.`,
    ai: {
      overall: 82,
      criteria: [
        { name: "Structure", score: 4, max: 5, note: "Clear beginning, middle, end." },
        { name: "Detail", score: 5, max: 5, note: "Strong sensory details (warm sand, loud waves)." },
        { name: "Voice", score: 4, max: 5, note: "Genuine, age-appropriate enthusiasm." },
        { name: "Conventions", score: 3, max: 5, note: "Two run-on sentences; comma splices in para 2." },
      ],
      feedback:
        "Wonderful narrative, Maya! Your sensory details really put the reader on the beach — I could almost feel the warm sand. Your story has a clear beginning, middle, and end. Next time, let's work on splitting long sentences so each idea gets its own space. Try reading paragraph two aloud and adding a period where you pause to breathe. Keep writing!",
    },
  },
  {
    id: "m2",
    studentId: "diego",
    skill: "speak",
    level: "L3",
    type: "Spoken story",
    title: "Retell: The Lion and the Mouse",
    lesson: "Lesson 6 · Story retelling",
    date: "Jun 9",
    aiReady: true,
    duration: "1:48",
    transcript: `Okay so there was a big lion sleeping in the jungle and a tiny little mouse runned across his nose by accident. The lion woke up super angry and grabbed the mouse and said I'm gonna eat you. But the mouse said please let me go and maybe someday I will help you. The lion laughed because the mouse was so small but he let him go anyway.\n\nThen later the lion got caught in a hunter's net and he couldn't get out and he was roaring really loud. The little mouse heard him and came and chewed the ropes with his teeth until the lion was free. So the lesson is even small friends can help you and you should always be kind.`,
    ai: {
      overall: 78,
      criteria: [
        { name: "Fluency", score: 4, max: 5, note: "Steady pace, few long pauses." },
        { name: "Accuracy", score: 4, max: 5, note: "All plot points retold in order." },
        { name: "Vocabulary", score: 4, max: 5, note: "Good range; used 'net', 'roaring'." },
        { name: "Grammar", score: 3, max: 5, note: "'runned' → ran; tense slips." },
      ],
      feedback:
        "Great retelling, Diego! You kept all the events in the right order and remembered the lesson at the end. Your voice was clear and confident. One thing to practice: the past tense of 'run' is 'ran', not 'runned'. Let's play a quick verb game next session. Awesome work!",
    },
  },
];

// ============ Curriculum: 3 Terms × 8 Levels × 10 Stories ============
// Stories replace lessons. Every story runs a Listen → Read → Speak → Write flow.
// Content is pushed from the admin side; the coach assigns & sequences (read-only otherwise).
const STORY_FLOW: SkillKey[] = ["listen", "read", "speak", "write"];

const UNIT_TITLES: Record<number, string[]> = {
  1: ["All About Me", "Animal Friends", "The Story of Flight", "Our Blue Planet", "Myths & Legends", "Inventors & Ideas", "World Tales", "Heroes & Helpers"],
  2: ["Journeys & Maps", "Weather Watch", "Ancient Worlds", "The Human Body", "Space Explorers", "Music & Rhythm", "Food Around the World", "Forests & Jungles"],
  3: ["Great Inventions", "Ocean Deep", "Stories in Verse", "Citizens & Community", "Earth's Treasures", "The Digital World", "Art & Colour", "Looking Forward"],
};

const STORY_TITLES: Record<string, string[]> = {
  "1-1": ["My Favourite Day", "The Best Pet", "A Family Recipe", "My Secret Hideout", "When I Grow Up", "The Lost Tooth", "My Noisy Neighbour", "A Rainy Saturday", "The New Kid", "My Superpower"],
  "1-2": ["The Brave Little Mouse", "Penguins on Parade", "The Wolf Who Cried", "Octopus Tricks", "The Loyal Dog", "Bats at Night", "The Busy Bees", "Elephant Memory", "The Clever Crow", "Whale Songs"],
  "1-3": ["Wings in Nature", "The Dream of Flying", "Kites and Balloons", "The First Flight", "Amelia's Big Adventure", "Into the Jet Age", "The Helicopter Mystery", "Rockets to Space", "A Letter from Mars", "Flight of the Future"],
  "1-4": ["The Water Cycle", "Coral Reefs", "The Deepest Sea", "Rivers to the Ocean", "Saving the Turtles", "Storm at Sea", "The Tide Pool", "Plastic Island", "The Lighthouse Keeper", "The Blue Whale"],
  "1-5": ["King Midas", "The Trojan Horse", "Anansi the Spider", "Thor's Hammer", "The Phoenix", "Pandora's Box", "The Minotaur", "Sun and Moon", "The Mermaid's Song", "Dragon of the East"],
  "1-6": ["The Light Bulb", "Wheels and Roads", "The Telephone Call", "Printing the News", "The Tiny Chip", "Vaccines for All", "The Bicycle", "Bridges High", "The Internet", "Robots at Work"],
  "1-7": ["The Bamboo Princess", "Stone Soup", "The Jasmine Garden", "Drum of the Savanna", "The Snow Sister", "Market Day in Marrakech", "The Kite Festival", "Grandmother's Quilt", "The River Spirit", "Songs of the Andes"],
  "1-8": ["The Firefighter", "A Nurse's Day", "The Lifeguard", "Letters to a Soldier", "The Teacher Who Cared", "Search and Rescue", "The Crossing Guard", "Helpers Without Borders", "The Volunteer", "Everyday Heroes"],
};
const GENRES = ["Nonfiction", "Fiction", "Fable", "Biography", "Poem", "Folk tale"];

function storyMeta(term: number, level: number, i: number): StoryMeta {
  const titles = STORY_TITLES[term + "-" + level];
  const title = titles ? titles[i] : `${UNIT_TITLES[term][level - 1]} · Story ${i + 1}`;
  return {
    n: i + 1,
    id: `t${term}l${level}s${i + 1}`,
    title,
    genre: GENRES[(level + i) % GENRES.length],
    steps: 14 + ((level + i) % 4), // 14–17 steps
    flow: { listen: 4, read: 5, speak: 2, write: 1 }, // checks per phase
  };
}

// 3 terms × 8 levels (level = unit). Story/level status is computed per student.
const TERMS: CurriculumTerm[] = [1, 2, 3].map((t) => ({
  term: t,
  name: "Term " + t,
  levels: [1, 2, 3, 4, 5, 6, 7, 8].map((lv) => ({
    level: lv,
    unit: UNIT_TITLES[t][lv - 1],
    stories: Array.from({ length: 10 }, (_, i) => storyMeta(t, lv, i)),
  })),
}));

export type StoryStatus = "done" | "current" | "locked";
function storyStatus(pos: StudentPosition, term: number, level: number, n: number): StoryStatus {
  if (term < pos.term) return "done";
  if (term > pos.term) return "locked";
  if (level < pos.level) return "done";
  if (level > pos.level) return "locked";
  if (n < pos.story) return "done";
  if (n === pos.story) return "current";
  return "locked";
}
export type LevelStatus = "mastered" | "current" | "locked";
function levelStatus(pos: StudentPosition, term: number, level: number): LevelStatus {
  if (term < pos.term) return "mastered";
  if (term > pos.term) return "locked";
  if (level < pos.level) return "mastered";
  if (level === pos.level) return "current";
  return "locked";
}

// session history per student (used in detail)
const history: Record<string, HistoryEntry[]> = {
  maya: [
    { date: "Jun 9", skill: "write", level: "L3", status: "progress", note: "Drafted 'My Best Day Ever' — strong details, watch run-ons." },
    { date: "Jun 5", skill: "read", level: "L3", status: "progress", note: "Inference worksheet; needs more text evidence." },
    { date: "Jun 2", skill: "vocab", level: "L4", status: "progress", note: "Started prefixes; un-, re-, pre- solid." },
    { date: "May 29", skill: "read", level: "L3", status: "mastered", note: "Mastered sequence; moved to inference." },
  ],
  diego: [
    { date: "Jun 9", skill: "speak", level: "L3", status: "progress", note: "Lion & Mouse retell — fix past-tense verbs." },
    { date: "Jun 4", skill: "vocab", level: "L3", status: "progress", note: "Context clues; enjoyed the detective game." },
    { date: "May 30", skill: "read", level: "L2", status: "mastered", note: "Mastered story structure." },
  ],
  amara: [
    { date: "Jun 9", skill: "write", level: "L4", status: "progress", note: "Persuasive paragraph; great hook, needs counter-point." },
    { date: "Jun 6", skill: "read", level: "L5", status: "progress", note: "Comparing two articles on space travel." },
    { date: "Jun 2", skill: "vocab", level: "L5", status: "mastered", note: "Mastered idioms — aced the quiz." },
  ],
  liam: [
    { date: "Jun 7", skill: "read", level: "L3", status: "progress", note: "Inference; improving but rushes answers." },
    { date: "Jun 3", skill: "vocab", level: "L3", status: "progress", note: "Context clues; needs more practice." },
  ],
  sofia: [
    { date: "Jun 8", skill: "write", level: "L5", status: "progress", note: "Research writing on rainforests — excellent sources." },
    { date: "Jun 4", skill: "read", level: "L5", status: "progress", note: "Strong evidence citation." },
  ],
  noah: [
    { date: "Jun 8", skill: "vocab", level: "L2", status: "progress", note: "Synonyms exit ticket; building confidence." },
    { date: "Jun 5", skill: "write", level: "L1", status: "progress", note: "Sentence capitals & periods improving." },
  ],
};

// homework per student
// status: toassign (recommended, not yet given) | assigned (pending) | completed | overdue
const homework: Record<string, HomeworkItem[]> = {
  maya: [
    { task: "Revise 'My Best Day Ever' — fix 2 run-ons", skill: "write", due: "Jun 11", status: "assigned" },
    { task: "Read 'The Lost Key' & answer 3 inference Qs", skill: "read", due: "Jun 10", status: "completed" },
    { task: "Vocab app: prefixes set 2", skill: "vocab", due: "Jun 9", status: "completed" },
  ],
  diego: [
    { task: "Record a retell of 'The Tortoise & Hare'", skill: "speak", due: "Jun 12", status: "toassign" },
    { task: "Context-clues worksheet p.14", skill: "vocab", due: "Jun 8", status: "overdue" },
  ],
  amara: [{ task: "Finish persuasive paragraph (add counter-point)", skill: "write", due: "Jun 11", status: "assigned" }],
  liam: [
    { task: "Inference app level 3, 10 questions", skill: "read", due: "Jun 9", status: "completed" },
    { task: "Re-read & summarize 'The Brave Knight'", skill: "read", due: "Jun 13", status: "toassign" },
  ],
  sofia: [{ task: "Cite 3 sources for rainforest report", skill: "write", due: "Jun 12", status: "assigned" }],
  noah: [{ task: "Synonyms matching game x2", skill: "vocab", due: "Jun 10", status: "overdue" }],
};

// parent comms log
const comms: CommsEntry[] = [
  { studentId: "maya", last: "Jun 6", method: "WhatsApp", template: "Progress update", note: "Shared narrative writing progress." },
  { studentId: "diego", last: "Jun 2", method: "WhatsApp", template: "Homework reminder", note: "Reminded about context-clues worksheet." },
  { studentId: "amara", last: "May 30", method: "Email", template: "Level completed", note: "Vocab L5 idioms mastered 🎉" },
  { studentId: "liam", last: "Jun 4", method: "WhatsApp", template: "Session reschedule", note: "Moved Tue session 30 min later." },
  { studentId: "sofia", last: "Jun 1", method: "WhatsApp", template: "Progress update", note: "Research writing going great." },
  { studentId: "noah", last: "May 28", method: "Email", template: "Progress update", note: "Welcome + first 2 weeks summary." },
];

const templates: Template[] = [
  { id: "progress", label: "Progress update" },
  { id: "homework", label: "Homework reminder" },
  { id: "reschedule", label: "Session reschedule" },
  { id: "level", label: "Level completed" },
];

// live session = a STORY class running its Listen → Read → Speak → Write flow
const live: LiveSession = {
  sessionId: "s2",
  studentId: "maya",
  term: 1,
  level: 3,
  story: 4,
  unit: "The Story of Flight",
  title: "The First Flight",
  genre: "Nonfiction",
  intro: "Two brothers who fixed bicycles believed people could fly. This is how they did it.",
  coverCaption: "The first powered flight · Kitty Hawk, 1903",
  elapsed: 18 * 60 + 46,
  current: 8, // index into steps[] — where the class is right now
  whoDriving: "Maya shares & answers on her screen; you guide and can take over.",
  phases: [
    { skill: "listen", dur: "5m", checks: 4 },
    { skill: "read", dur: "8m", checks: 5 },
    { skill: "speak", dur: "6m", checks: 0 },
    { skill: "write", dur: "5m", checks: 0 },
  ],
  steps: [
    {
      phase: "intro",
      kind: "cover",
      label: "Story cover",
      student: "Cover & intro — what this story is about.",
      coach: { do: "Set the scene. Ask what Maya already knows about aeroplanes.", look: "Any prior knowledge — keep it to a minute.", watch: "Don't over-explain; let her wonder." },
    },
    {
      phase: "listen",
      kind: "prompt",
      label: "Listen",
      student: "🎧 Audio: how two brothers learned to fly (1:00).",
      coach: { do: "Play the clip. Tell Maya to listen for HOW they tested their ideas.", look: "Eyes up, listening — not reading ahead.", watch: "Replay once if she misses key facts." },
    },
    {
      phase: "listen",
      kind: "check",
      label: "Listen · Check 1",
      student: "What did the brothers fix before they built planes?",
      expects: "Bicycles.",
      coach: { do: "Quick recall.", look: "“Bicycles.”", watch: "If stuck, replay 0:05–0:15." },
    },
    {
      phase: "listen",
      kind: "check",
      label: "Listen · Check 2",
      student: "Where did the first flight happen?",
      expects: "Kitty Hawk, North Carolina.",
      coach: { do: "", look: "The place name.", watch: "Accept “a windy beach”, then nudge for the name." },
    },
    {
      phase: "listen",
      kind: "check",
      label: "Listen · Check 3",
      student: "Why choose a windy, sandy place?",
      expects: "Wind gives lift; sand is soft to land on.",
      coach: { do: "Push for reasoning, not just a fact.", look: "Links wind→lift OR sand→soft landing.", watch: "One good reason is plenty for Grade 3." },
    },
    {
      phase: "listen",
      kind: "check",
      label: "Listen · Check 4",
      student: "How long did the first flight last?",
      expects: "About 12 seconds.",
      coach: { do: "", look: "~12 seconds.", watch: "Marvel at how short it was vs flights today." },
    },
    {
      phase: "read",
      kind: "passage",
      label: "Read",
      student: "📖 Passage: “The First Flight” — 3 short paragraphs.",
      coach: { do: "Have Maya read aloud. Help with: powered, glider, control.", look: "Smooth decoding; self-corrects.", watch: "Don't fix every word — let her try first." },
    },
    {
      phase: "read",
      kind: "check",
      label: "Read · Check 1",
      student: "Find the word that means ‘a flying machine with no engine’.",
      expects: "Glider.",
      coach: { do: "Vocabulary in context.", look: "“Glider.”", watch: "Point to the sentence if needed." },
    },
    {
      phase: "read",
      kind: "check",
      label: "Read · Check 2",
      student: "Why did they test gliders before adding an engine?",
      expects: "To learn to control the wings safely before adding power.",
      said: "Because crashing with an engine would be more dangerous — they wanted to learn to steer first.",
      coach: { do: "Cause & effect.", look: "The idea of practice / control before power.", watch: "Accept “to be safe”, then deepen it." },
    },
    {
      phase: "read",
      kind: "check",
      label: "Read · Check 3",
      student: "What does ‘powered flight’ mean?",
      expects: "Flying using an engine, not just gliding.",
      coach: { do: "", look: "Engine = the key idea.", watch: "" },
    },
    {
      phase: "read",
      kind: "check",
      label: "Read · Check 4",
      student: "Put these in order: engine, glider, bicycle.",
      expects: "Bicycle → glider → engine.",
      coach: { do: "Sequencing.", look: "Correct order.", watch: "Ask “what came first?”" },
    },
    {
      phase: "read",
      kind: "check",
      label: "Read · Check 5",
      student: "How is flying today different from 1903?",
      expects: "(Open) e.g. planes are huge, fast, carry hundreds, fly for hours.",
      coach: { do: "Open question — any reasonable answer.", look: "One clear difference + a detail.", watch: "Encourage a full sentence." },
    },
    {
      phase: "speak",
      kind: "task",
      label: "Speak · Retell",
      student: "🗣 Retell the story of the first flight in your own words (3 sentences).",
      expects: "Beginning (brothers + bikes) → middle (gliders, Kitty Hawk) → end (12-second flight).",
      coach: { do: "Aim for beginning–middle–end.", look: "Order + two key facts.", watch: "Prompt with “what happened next?”" },
    },
    {
      phase: "speak",
      kind: "task",
      label: "Speak · Opinion",
      student: "🗣 Would you have been brave enough to fly that day? Why?",
      expects: "(Opinion) any view with a reason.",
      coach: { do: "Confidence builder — no wrong answer.", look: "Opinion + “because…”.", watch: "Praise the reasoning, not the choice." },
    },
    {
      phase: "write",
      kind: "task",
      label: "Write",
      student: "✍️ Write 3 sentences: why did the Wright brothers never give up?",
      expects: "Topic sentence + 2 supporting reasons (kept testing, learned from crashes, believed it was possible).",
      said: "The Wright brothers never gave up because they really believed people could fly. Every time a glider crashed they fixed it and tried again. They studied birds and made their wings better until it worked.",
      coach: { do: "This is the markable artifact. Topic sentence + 2 details.", look: "3 complete sentences on topic.", watch: "Capitals & end marks." },
    },
    {
      phase: "write",
      kind: "wrap",
      label: "Wrap + parent note",
      student: "🎉 Great work — story complete!",
      coach: { do: "Praise one specific win, then jot a parent note below.", look: "Maya can name one thing she learned.", watch: "Keep it warm — end on a high." },
    },
  ],
  aiDraft:
    "Wonderful work, Maya! You really understood why the Wright brothers kept going — you used the words ‘believed’ and ‘tried again’, which show persistence. Next time, start with one clear topic sentence and then give your two reasons. I loved your idea about studying birds. Keep it up!",
};

const coach: CoachProfile = {
  name: "Liza Reyes",
  initials: "LR",
  role: "English Coach",
  location: "Manila, PH",
  color: "#EE9612",
  email: "liza.reyes@cueword.com",
  phone: "+63 917 555 0182",
  timezone: "Asia/Manila · PH (UTC+08:00)",
  coachId: "CW-PH-0247",
  joined: "Aug 2024",
  tenure: "1 yr 10 mo",
  languages: ["English", "Filipino", "Cebuano"],
  grades: [3, 4, 5],
  certs: "TESOL · 120 hr",
  workingDays: "Mon – Sun",
  workingHours: "5:00 PM – 11:00 PM PH",
  defaultZoom: "cueword.zoom.us/j/liza-reyes",
  stats: { students: 6, sessionsTaught: 412, attendance: "96%", rating: 4.9 },
  prefs: { showStudentTz: true, autoFeedback: true, reminders: true, weeklyDigest: true, soundAlerts: false },
};

// ---- attendance: per-student recent session log + computed rate ----
function attLog(seed: number, n: number): AttendanceLogEntry[] {
  // statuses weighted: present mostly, occasional late/absent; upcoming for future
  const out: AttendanceLogEntry[] = [];
  const months = ["Jun", "May"];
  let day = 9;
  let mi = 0;
  const skillsCycle: SkillKey[] = ["read", "write", "vocab", "speak", "listen"];
  for (let i = 0; i < n; i++) {
    const roll = (seed * (i + 3) * 7) % 100;
    let status: AttendanceStatus = "present";
    if (roll < 8) status = "absent";
    else if (roll < 20) status = "late";
    out.push({ date: months[mi] + " " + day, skill: skillsCycle[(i + seed) % 5], status });
    day -= 2 + ((seed + i) % 2);
    if (day <= 0) {
      day += 30;
      mi = 1;
    }
  }
  return out;
}
const attendance: Record<string, AttendanceRecord> = {};
students.forEach((s, idx) => {
  const log = attLog(idx + 2, 12);
  const present = log.filter((l) => l.status === "present").length;
  const late = log.filter((l) => l.status === "late").length;
  const absent = log.filter((l) => l.status === "absent").length;
  const rate = Math.round(((present + late) / log.length) * 100);
  attendance[s.id] = { log, present, late, absent, total: log.length, rate };
});
// today's live/completed attendance flags (mirrors dashboard)
const todayAttendance: Record<string, string> = { amara: "present", maya: "scheduled", diego: "scheduled", noah: "scheduled" };

// per-skill score % (deterministic from status + a little spread)
function scoreFor(sid: string, skill: string, status: SkillStatus): number | null {
  const seed = (sid.charCodeAt(0) + skill.charCodeAt(0)) % 9;
  if (status === "locked") return null;
  if (status === "mastered") return 88 + (seed % 8); // 88–95
  if (status === "progress") return 70 + (seed % 13); // 70–82
  return 58 + (seed % 9); // unlocked 58–66
}
students.forEach((s) => {
  (Object.keys(s.skills) as SkillKey[]).forEach((k) => {
    s.skills[k].score = scoreFor(s.id, k, s.skills[k].status);
  });
});

export interface CWShape {
  SKILLS: SkillDef[];
  students: Student[];
  sessions: Session[];
  submissions: Submission[];
  history: Record<string, HistoryEntry[]>;
  homework: Record<string, HomeworkItem[]>;
  comms: CommsEntry[];
  templates: Template[];
  live: LiveSession;
  coach: CoachProfile;
  attendance: Record<string, AttendanceRecord>;
  todayAttendance: Record<string, string>;
  TERMS: CurriculumTerm[];
  STORY_FLOW: SkillKey[];
  UNIT_TITLES: Record<number, string[]>;
  storyStatus: typeof storyStatus;
  levelStatus: typeof levelStatus;
  byId: (id: string) => Student | undefined;
  skillLabel: (k: string) => string;
}

export const byId = (id: string): Student | undefined => students.find((s) => s.id === id);
export const skillLabel = (k: string): string => SKILLS.find((s) => s.key === k)?.label ?? k;

export const CW: CWShape = {
  SKILLS,
  students,
  sessions,
  submissions,
  history,
  homework,
  comms,
  templates,
  live,
  coach,
  attendance,
  todayAttendance,
  TERMS,
  STORY_FLOW,
  UNIT_TITLES,
  storyStatus,
  levelStatus,
  byId,
  skillLabel,
};

// Skill order used across screens (mirrors window._CW_SKILL_ORDER).
export const SKILL_ORDER: SkillKey[] = ["vocab", "read", "listen", "write", "speak"];
