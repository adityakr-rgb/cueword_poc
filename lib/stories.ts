// ============================================================================
// Story content — ported verbatim from the prototype's data.js (GRADE_STORIES).
// This is the single content source rendered client-side; the DB only syncs a
// pointer (story_key + step). To add a story: add an entry here + a stories row.
// ============================================================================
import type { Story, StoryKey } from "./types";

export const GRADE_STORIES: Record<StoryKey, Story> = {
  K: {
    grade: "Grade K",
    gradeShort: "K",
    title: "Pip the Lost Penguin",
    theme: "Animals · Antarctica",
    themeColor: "#5B8FB9",
    chapter: "Chapter 1 — Where is Mama?",
    duration: "~6 min",
    about:
      "A little penguin wakes up and can't find his mama. Help Pip search the cold, white ice.",
    cover: "🐧",
    scene: {
      bg: "linear-gradient(165deg,#cdeaf7 0%,#e8f5fb 55%,#ffffff 100%)",
      main: "🐧",
      accents: ["❄️", "☀️", "🧊"],
      caption: "Antarctica · early morning",
    },
    fact: 'Did you know? Penguins cannot fly in the air, but they "fly" underwater by flapping their flippers!',
    listen: {
      clipMeta: "Voice: warm narrator · 0:30",
      transcript: `Pip was a little penguin. One morning, Pip woke up and could not find his mama. "Where is Mama?" said Pip. The snow was white and cold. So Pip began to waddle across the ice…`,
      questions: [
        {
          level: 1,
          rung: "Recall",
          type: "mcq",
          q: "Who is the story about?",
          opts: ["🐧 Pip", "🦭 a seal", "🐟 a fish"],
          correct: 0,
          hint: "Listen for the first name you heard.",
        },
        {
          level: 1,
          rung: "Recall",
          type: "truefalse",
          q: "Pip could not find his mama.",
          answer: true,
          hint: "Did Pip find his mama, or not?",
        },
        {
          level: 2,
          rung: "Detail",
          type: "mcq",
          q: "What was the snow like?",
          opts: ["warm", "cold", "soft"],
          correct: 1,
          hint: "The story said the snow was white and ____.",
        },
        {
          level: 3,
          rung: "Feeling",
          type: "mcq",
          q: "How does Pip feel?",
          opts: ["🙁 worried", "😀 happy", "😴 sleepy"],
          correct: 0,
          hint: "He lost his mama — how would you feel?",
        },
      ],
    },
    read: {
      label: "Read along · big text, follow the words",
      passage: [
        { text: "Pip waddled past a big " },
        { text: "iceberg", vocab: true, def: "a big mountain of ice in the sea" },
        { text: '. "' },
        { text: "Mama", highlight: true },
        { text: '!" he called, and flapped his little ' },
        { text: "flipper", vocab: true, def: "a penguin's arm for swimming" },
        {
          text: '. A friendly seal popped up. "I will help you look," she said. Together they ',
        },
        { text: "waddled", vocab: true, def: "to walk side to side like a penguin" },
        { text: " over the snow, looking and looking." },
      ],
      vocab: [
        {
          word: "waddle",
          def: "to walk side to side like a penguin",
          ex: [
            "The duck began to waddle to the pond.",
            "Babies waddle when they first learn to walk.",
          ],
        },
        {
          word: "flipper",
          def: "a penguin's arm for swimming",
          ex: ["A seal pushes the water with its flipper.", "The penguin flapped one flipper."],
        },
        {
          word: "iceberg",
          def: "a big mountain of ice in the sea",
          ex: [
            "The ship sailed past a giant iceberg.",
            "Only the top of an iceberg shows above the water.",
          ],
        },
      ],
      questions: [
        {
          level: 1,
          rung: "Locate",
          type: "tap",
          q: "Find Pip's special word in the story.",
          target: "Mama",
          hint: "It is the person Pip is looking for.",
        },
        {
          level: 2,
          rung: "Vocabulary",
          type: "mcq",
          q: "What does waddle mean?",
          opts: ["to walk side to side", "to swim fast", "to fall asleep"],
          correct: 0,
          hint: "It is the funny way a penguin walks.",
        },
        {
          level: 2,
          rung: "Detail",
          type: "cloze",
          q: "Finish the sentence with the right word:",
          text: "Together they ___ over the snow.",
          opts: ["waddled", "jumped", "drove"],
          correct: 0,
          hint: "Use the word you just learned.",
        },
        {
          level: 3,
          rung: "Feeling",
          type: "mcq",
          q: "Find the face that shows how Pip feels.",
          opts: ["🙁", "🙂", "😡"],
          correct: 0,
          hint: "He is all alone in the cold snow.",
        },
      ],
    },
    speak: {
      label: "Be Pip",
      prompt: "Be Pip. Call out for your mama — what do you say?",
      hints: ["Say one whole sentence", "Use your Pip voice", "Tell one thing Pip sees"],
    },
    write: {
      label: "Trace + draw",
      mode: "trace",
      prompt: "Trace the words, then draw a picture to finish the page.",
      trace: "Pip found his mama.",
      drawPrompt: "Draw Pip and his mama together.",
    },
    srs: ["waddle", "flipper"],
    calibration:
      "Listening: confirm understanding + key details (SL.K.2). Reading: characters / setting / key details with support; sight words (RL.K.1–3). Speaking: one audible complete sentence (SL.K.6). Writing: trace + draw to tell an event (W.K.3). Vocab: tier-2 words with picture support (L.K.5–6).",
  },

  G3: {
    grade: "Grade 3",
    gradeShort: "3",
    title: "The First Flight",
    theme: "Nonfiction · The Story of Flight",
    themeColor: "#6FA86A",
    chapter: "A True Story — December 17, 1903",
    duration: "~12 min",
    about: "Two brothers who fixed bicycles believed people could fly. This is how they did it.",
    cover: "✈️",
    scene: {
      bg: "linear-gradient(165deg,#d6e6cf 0%,#eaf2e4 55%,#f7faf3 100%)",
      main: "✈️",
      accents: ["🌬️", "🦅", "⚙️"],
      caption: "The first powered flight · Kitty Hawk, 1903",
      image: "/assets/wright-first-flight.jpg",
      imgPos: "center 42%",
    },
    fact: "Did you know? That first flight lasted just 12 seconds and went 120 feet — shorter than the wingspan of a modern jumbo jet.",
    listen: {
      clipMeta: "Voice: narrator · 0:45",
      transcript: `Orville and Wilbur Wright fixed bicycles in Ohio, but they had a much bigger dream — they wanted to fly. Many people laughed and said flying was impossible. The brothers did not listen. They watched birds for hours, learning how wings tilt and turn in the wind. Then they began to build.`,
      questions: [
        {
          level: 1,
          rung: "Locate",
          type: "mcq",
          q: "What was the brothers' job?",
          opts: ["They fixed bicycles", "They were pilots", "They were teachers"],
          correct: 0,
          hint: "Listen to the very first sentence.",
        },
        {
          level: 2,
          rung: "Detail",
          type: "multi",
          q: "Pick the TWO things the brothers did to learn about flying.",
          opts: [
            "Watched birds for hours",
            "Began to build",
            "Gave up on the dream",
            "Bought a plane",
          ],
          correct: [0, 1],
          hint: "What did they do instead of listening to the doubters?",
        },
        {
          level: 3,
          rung: "Sequence",
          type: "sequence",
          q: "Put these events in the order they happened.",
          items: [
            "The brothers fixed bicycles",
            "They dreamed of flying",
            "They watched how birds fly",
            "They began to build",
          ],
          hint: "What came first, before the dream grew?",
        },
        {
          level: 4,
          rung: "Infer",
          type: "mcq",
          q: "Why did the brothers keep going after people laughed?",
          opts: [
            "They believed flying was possible",
            "They wanted to sell more bikes",
            "A teacher told them to",
          ],
          correct: 0,
          hint: "Think about how much they wanted their dream.",
        },
      ],
    },
    read: {
      label: "Read this part · 2 min",
      passage: [
        {
          text: "The brothers traveled to Kitty Hawk, where strong winds and soft sand were perfect for testing. First they flew a ",
        },
        { text: "glider", vocab: true, def: "an aircraft with wings but no engine" },
        { text: " with no " },
        {
          text: "engine",
          vocab: true,
          def: "a machine that makes power to move something",
        },
        {
          text: ". After years of work, they added a small engine and two spinning ",
        },
        {
          text: "propellers",
          vocab: true,
          def: "spinning blades that push an aircraft forward",
        },
        { text: ". Their flying machine was a daring " },
        {
          text: "invention",
          vocab: true,
          def: "a new thing someone makes for the first time",
        },
        { text: "." },
      ],
      vocab: [
        {
          word: "glider",
          def: "an aircraft with wings but no engine",
          ex: ["The glider floated quietly on the wind.", "A paper plane is a tiny glider."],
        },
        {
          word: "engine",
          def: "a machine that makes power to move something",
          ex: ["The car's engine roared to life.", "A train needs a powerful engine."],
        },
        {
          word: "propeller",
          def: "spinning blades that push an aircraft forward",
          ex: ["The propeller spun into a blur.", "A boat can have a propeller too."],
        },
        {
          word: "invention",
          def: "a new thing someone makes for the first time",
          ex: ["The light bulb was a famous invention.", "Her invention won the science fair."],
        },
      ],
      questions: [
        {
          level: 2,
          rung: "Vocabulary",
          type: "mcq",
          q: "What is a glider?",
          opts: ["An aircraft with wings but no engine", "A kind of bird", "A spinning blade"],
          correct: 0,
          hint: "Look at how the word is used in the passage.",
        },
        {
          level: 2,
          rung: "Vocabulary",
          type: "match",
          q: "Match each word to its meaning.",
          pairs: [
            ["engine", "a machine that makes power"],
            ["propeller", "spinning blades that push it forward"],
            ["invention", "a new thing made for the first time"],
          ],
          hint: "Use the way each word was used in the story.",
        },
        {
          level: 4,
          rung: "Infer",
          type: "mcq",
          q: "Why was Kitty Hawk a good place to test?",
          opts: [
            "Strong winds and soft sand helped",
            "It was close to Ohio",
            "It already had an airport",
          ],
          correct: 0,
          hint: "What two things does the passage say were perfect there?",
        },
        {
          level: 5,
          rung: "Main idea",
          type: "mcq",
          q: "What is this part mostly about?",
          opts: [
            "Building and improving their flying machine",
            "Fixing bicycles",
            "Watching birds at the beach",
          ],
          correct: 0,
          hint: "What are all the sentences working toward?",
        },
        {
          level: 4,
          rung: "Evidence",
          type: "short",
          q: "Find words in the text that show their machine was new and bold.",
          stem: 'The text calls their flying machine a "___".',
          look: "Look for a word that means something made for the first time.",
          sample: 'The text calls their flying machine a "daring invention."',
        },
      ],
    },
    speak: {
      label: "You are there",
      prompt:
        "You are on the beach watching the brothers. Tell us what you see and hear as the machine gets ready to fly. Talk for about 30 seconds.",
      hints: ["Describe what you see", "Use one word from today", "Tell how the crowd feels"],
    },
    write: {
      label: "Write the moment · 4–6 sentences",
      prompt:
        "Write about the moment the machine lifts off the ground. Use one sound word and one feeling word. End with what the brothers might say.",
      sample:
        'The engine coughed and the propellers blurred. WHOOSH — the machine lifted off the sand! My heart pounded as it floated above the beach. "We did it!" Orville shouted.',
    },
    end: "On December 17, 1903, Orville lay flat on the lower wing as the engine roared. The machine rose and flew for 12 seconds — 120 feet through the cold, windy air. It was the first time a powered machine had ever carried a person into the sky. The brothers flew three more times that day, and the world was never the same again.",
    srs: ["glider", "engine", "propeller", "invention"],
    calibration:
      "Listening: main idea + key details, ask/answer about a speaker (SL.3.2–3.3). Reading: answer referring explicitly to text; main idea + supporting details (RI.3.1–3). Speaking: report with descriptive detail at a clear pace (SL.3.4). Writing: narrative with detail and closure, ~100–150 words (W.3.3). Vocab: context clues (L.3.4).",
  },

  G6: {
    grade: "Grade 6",
    gradeShort: "6",
    title: "What Killed the Dinosaurs?",
    theme: "Nonfiction · Science Detective",
    themeColor: "#8B6BB1",
    chapter: "A True Mystery — Solved by Evidence",
    duration: "~18 min",
    about:
      "Dinosaurs ruled for 165 million years, then vanished. For decades, no one could prove why.",
    cover: "☄️",
    scene: {
      bg: "linear-gradient(165deg,#e4dcef 0%,#ece4dc 55%,#f6f1e8 100%)",
      main: "☄️",
      accents: ["🦕", "🪨", "🌋"],
      caption: "A Tyrannosaurus rex skeleton",
      image: "/assets/dinosaur-skeleton.jpg",
      imgPos: "center 18%",
    },
    fact: "Did you know? The asteroid was about 10 kilometres wide — the size of a city — and struck with the force of billions of atomic bombs.",
    listen: {
      clipMeta: "Voice: narrator · 1:00",
      transcript: `For 165 million years, dinosaurs ruled the Earth. Then, about 66 million years ago, they vanished — almost overnight in the long story of our planet. For a long time, no one could explain why.

Then a father and son, Luis and Walter Alvarez, noticed something strange. In a thin layer of clay found all over the world, they measured high levels of iridium — a metal that is rare on Earth but common in asteroids.`,
      questions: [
        {
          level: 2,
          rung: "Detail",
          type: "mcq",
          q: "What unusual thing did the Alvarezes measure in the clay layer?",
          opts: ["High levels of iridium", "Dinosaur bones", "Volcanic ash"],
          correct: 0,
          hint: "Listen for the rare metal they named.",
        },
        {
          level: 4,
          rung: "Infer",
          type: "mcq",
          q: "Why did the iridium make them think of space?",
          opts: [
            "It is rare on Earth but common in asteroids",
            "It glows in the dark",
            "It is only found in volcanoes",
          ],
          correct: 0,
          hint: "Where does the clip say iridium is usually found?",
        },
        {
          level: 5,
          rung: "Evaluate",
          type: "multi",
          q: "Which statements are FACTS they could measure (not yet guesses)? Select all.",
          opts: [
            "The clay layer is found around the world",
            "The iridium levels are high",
            "An asteroid wiped out the dinosaurs",
          ],
          correct: [0, 1],
          hint: "A fact can be measured now; a hypothesis still needs proof.",
        },
        {
          level: 5,
          rung: "Summarize",
          type: "short",
          q: "Summarize the clue the Alvarezes found, in one sentence.",
          stem: "The Alvarezes found that ___.",
          look: "Combine where the iridium was with why it is surprising.",
          sample:
            "The Alvarezes found a worldwide layer of clay with high iridium, a metal common in asteroids but rare on Earth.",
        },
      ],
    },
    read: {
      label: "Read the evidence · 4 min",
      passage: [
        { text: "From this clue, the Alvarezes formed a bold " },
        {
          text: "hypothesis",
          vocab: true,
          def: 'a proposed explanation that must still be tested (hypo- "under" + thesis "placing")',
        },
        { text: ": a giant " },
        {
          text: "asteroid",
          vocab: true,
          def: 'a rocky body that orbits the Sun (aster "star" + -oid "like")',
        },
        { text: " had struck Earth, causing a mass " },
        {
          text: "extinction",
          vocab: true,
          def: 'the dying-out of a whole species (ex- "out" + stinguere "to put out")',
        },
        {
          text: ". Many scientists doubted it — if an asteroid hit, where was the crater? For years there was nothing to ",
        },
        {
          text: "corroborate",
          vocab: true,
          def: 'to confirm with added evidence (con- + robur "strength")',
        },
        { text: " the idea." },
      ],
      vocab: [
        {
          word: "hypothesis",
          def: 'a proposed explanation that must still be tested (hypo- "under" + thesis "placing")',
          ex: [
            "Her hypothesis was that plants grow faster in red light.",
            "A hypothesis is only the start — you must test it.",
          ],
        },
        {
          word: "asteroid",
          def: 'a rocky body that orbits the Sun (aster "star" + -oid "like")',
          ex: [
            "The asteroid passed close to Earth.",
            "Most asteroids circle the Sun between Mars and Jupiter.",
          ],
        },
        {
          word: "extinction",
          def: 'the dying-out of a whole species (ex- "out" + stinguere "to put out")',
          ex: [
            "Hunting drove the dodo to extinction.",
            "Scientists work to prevent the extinction of tigers.",
          ],
        },
        {
          word: "corroborate",
          def: 'to confirm with added evidence (con- + robur "strength")',
          ex: [
            "A second photo helped corroborate her account.",
            "No records corroborate the rumor.",
          ],
        },
      ],
      questions: [
        {
          level: 2,
          rung: "Vocabulary",
          type: "match",
          q: "Match each word to its meaning (use the roots to help).",
          pairs: [
            ["hypothesis", "a proposed explanation, not yet proven"],
            ["asteroid", "a rocky body that orbits the Sun"],
            ["extinction", "the dying-out of a whole species"],
            ["corroborate", "to confirm with more evidence"],
          ],
          hint: 'hypo- "under" + thesis "placing"; aster "star".',
        },
        {
          level: 4,
          rung: "POV",
          type: "mcq",
          q: "Why does the author mention the doubting scientists?",
          opts: [
            "To show the claim still needed proof",
            "To prove the Alvarezes were wrong",
            "To change the subject",
          ],
          correct: 0,
          hint: 'What does "where was the crater?" tell you about the evidence so far?',
        },
        {
          level: 5,
          rung: "Evaluate",
          type: "truefalse",
          q: "True or false: when first proposed, the asteroid idea was already proven.",
          answer: false,
          hint: "A hypothesis still needs evidence — and the crater was missing.",
        },
        {
          level: 5,
          rung: "Cite evidence",
          type: "multi",
          q: "Select the TWO reasons scientists doubted the idea at first.",
          opts: [
            "No crater had been found",
            "There was nothing yet to corroborate it",
            "Iridium is rare on Earth",
            "Dinosaurs were large",
          ],
          correct: [0, 1],
          hint: "What was still missing from the evidence?",
        },
        {
          level: 5,
          rung: "Evaluate",
          type: "short",
          q: "Why is a hypothesis not the same as a proven fact? Use the story to explain.",
          stem: "A hypothesis is not yet a fact because ___.",
          look: "Think about what the asteroid idea was still missing.",
          sample:
            "A hypothesis is not yet a fact because it still needs evidence to confirm it — the asteroid idea was only accepted once the crater was found.",
        },
      ],
    },
    speak: {
      label: "Make the case · formal register",
      prompt:
        "You are a scientist in 1980. Present the asteroid hypothesis to the doubters: what is your evidence, and what would prove you right? Speak for about a minute, formally.",
      hints: ["State your claim", "Give your evidence", "Say what proof you still need"],
    },
    write: {
      label: "Explain it · ~250–400 words",
      prompt:
        "Explain how scientists solved the mystery. Walk through the clue, the hypothesis, the doubt, and the proof. Use evidence from the text and at least two of today's words.",
      sample:
        "For decades, the disappearance of the dinosaurs was a mystery. The first clue was a worldwide layer of clay rich in iridium — a metal common in asteroids. From this, the Alvarezes formed a hypothesis: a giant asteroid had caused a mass extinction…",
    },
    end: "Then, in 1991, the proof appeared. Buried under the sea near Mexico, scientists found the Chicxulub crater — about 180 kilometres wide and exactly 66 million years old. At last the hypothesis was corroborated. Today most scientists agree an asteroid ended the age of the dinosaurs, though they still debate the final details — which is exactly how science is meant to work.",
    srs: ["hypothesis", "asteroid", "extinction", "corroborate"],
    calibration:
      "Listening: interpret information; distinguish claims supported by evidence from those that are not (SL.6.2–6.3). Reading: cite evidence; author's purpose / point of view; central idea (RI.6.1–6). Speaking: present a claim with evidence and reasoning, formal register (SL.6.4, 6.6). Writing: informative/explanatory with evidence and domain vocabulary (W.6.2). Vocab: Greek / Latin roots (L.6.4).",
  },
};

export const STORY_KEYS: StoryKey[] = ["K", "G3", "G6"];

export function getStory(key: string | null | undefined): Story | null {
  if (!key) return null;
  return GRADE_STORIES[key as StoryKey] ?? null;
}

/** Lightweight metadata for the admin list + DB seeding. */
export interface StoryMeta {
  key: StoryKey;
  grade: string;
  title: string;
  theme: string;
  themeColor: string;
  cover: string;
  sceneImage: string | null;
}

export const STORY_META: StoryMeta[] = STORY_KEYS.map((key) => {
  const s = GRADE_STORIES[key];
  return {
    key,
    grade: s.grade,
    title: s.title,
    theme: s.theme,
    themeColor: s.themeColor,
    cover: s.cover,
    sceneImage: s.scene.image ?? null,
  };
});
