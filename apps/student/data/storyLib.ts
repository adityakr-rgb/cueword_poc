// ============================================================
// Cueword — Self-serve Story library (ported from window.STORY_LIB).
// Each story weaves Listen → Read → Speak → Write into one arc,
// with inline vocabulary and a celebratory finish. Mock content.
// The My Stories list maps each curriculum slot to one of these.
// ============================================================

export type SceneKind = "space" | "rome" | "nature" | "time" | "ocean" | "storm";

export interface ListenLine {
  text: string;
  quote?: boolean;
}

export interface PassageSegment {
  t?: string;
  vocab?: string;
  def?: string;
}

export interface ReadOption {
  t: string;
  correct: boolean;
}

export interface RubricRow {
  name: string;
  score: number;
  note?: string;
}

export interface SpeakFeedback {
  score: string;
  label: string;
  rubric: RubricRow[];
  praise: string;
  tip: string;
}

export interface Story {
  id: string;
  title: string;
  theme: string;
  themeColor: string;
  cover: string;
  sceneKind: SceneKind;
  chapter: string;
  blurb: string;
  duration: string;
  points: string;
  sceneCaption: string;
  listen: { meta: string; lines: ListenLine[] };
  read: {
    label: string;
    passage: PassageSegment[];
    question: { q: string; opts: ReadOption[] };
  };
  speak: { prompt: string; hints: string[]; feedback: SpeakFeedback };
  write: {
    prompt: string;
    min: string;
    planHints: string[];
    sample: string[];
    words: number;
    paras: number;
    feedback: SpeakFeedback;
  };
  complete: { vocab: string[]; points: number };
}

export interface StoryLib {
  STORIES: Story[];
  byId: Record<string, Story>;
}

const STORIES: Story[] = [
  {
    id: "astronaut",
    title: "The Lost Astronaut",
    theme: "Science · Space", themeColor: "#1A2540",
    cover: "🚀", sceneKind: "space",
    chapter: "Chapter 3 — Silence in the Void",
    blurb: "Captain Riya floats alone in the silence of space. Her radio is broken. Earth is 240 million kilometers away. What will she do?",
    duration: "15 min", points: "+20–30 pts",
    sceneCaption: "Endeavor · drifting · 240M km from Earth",
    listen: {
      meta: "Voice: Coach Maya · 0:32",
      lines: [
        { text: "Captain Riya checked her oxygen gauge for the third time. Forty-two percent. The cabin lights flickered, casting strange shadows across the control panel." },
        { text: "Outside her window, Earth was a small blue marble, impossibly far away." },
        { text: "“Mission Control, this is Endeavor. Do you copy?”", quote: true },
        { text: "Only static answered." },
      ],
    },
    read: {
      label: "Read this part of the story · 2 min",
      passage: [
        { t: "Riya tapped the radio one more time. Nothing. Her ship had been " },
        { vocab: "stranded", def: "Left behind, unable to leave a place" },
        { t: " in this orbit for sixteen hours now, and every attempt to " },
        { vocab: "navigate", def: "To find your way through a place" },
        { t: " back to her original course had failed. The " },
        { vocab: "propulsion", def: "The force that pushes something forward" },
        { t: " system was offline, and the " },
        { vocab: "atmosphere", def: "The layer of gases around a planet" },
        { t: " filters had only six hours of life left. Riya took a slow breath. Panicking would not help." },
      ],
      question: {
        q: "Why did Riya stop trying to call Mission Control?", opts: [
          { t: "She gave up.", correct: false },
          { t: "Only static answered — no one heard her.", correct: true },
          { t: "Her radio was switched off.", correct: false },
        ],
      },
    },
    speak: {
      prompt: "You have six hours of air left and no working radio. Speak out loud — what is your plan?",
      hints: ["🎯 Talk for at least 30 seconds", "🗣️ Stay in character as Riya", "📚 Use one word from this chapter"],
      feedback: {
        score: "8.2", label: "Solid work!", rubric: [
          { name: "Grammar", score: 8, note: "Strong sentence structure throughout." },
          { name: "Structure", score: 9, note: "Great use of “First… then… finally…” to organize your plan." },
          { name: "Vocabulary", score: 8, note: "You used propulsion and atmosphere from the story." },
          { name: "Fluency", score: 8, note: "Good pace. You paused twice — both times to think." },
          { name: "Relevance", score: 9, note: "You stayed in character as Riya the whole time." },
        ], praise: "Your plan was really creative — using the antenna as a signal mirror was clever! That's the kind of thinking real astronauts do.", tip: "Vary your tone. When Riya is worried, your voice can go softer. When she has an idea, brighter.",
      },
    },
    write: {
      prompt: "Write Riya's journal entry from this moment. What is she feeling? What does she plan to do?",
      min: "4–6 sentences.",
      planHints: ["how Riya feels", "what she sees out the window", "her plan or a question"],
      sample: [
        "Day 1, hour 16. I am alone in the dark and my radio is dead. Through the window I can see Earth shining like a blue marble, so small that I could hide it behind my thumb.",
        "My oxygen is at 42 percent and I have six hours of clean air left. I am scared, but my trainer said the mind is the only real instrument out here, so I will use mine.",
        "Tomorrow I will try to use the antenna as a signal mirror to catch sunlight and flash a message toward Mars Station. If anyone is watching the sky, they will see me.",
      ],
      words: 97, paras: 3,
      feedback: {
        score: "8.5", label: "Beautiful writing.", rubric: [
          { name: "Grammar", score: 9 }, { name: "Structure", score: 8 }, { name: "Vocabulary", score: 8 }, { name: "Conventions", score: 9 },
        ], praise: "“Earth shining like a blue marble” — that's a writer's sentence. You showed Riya's feelings instead of just telling us.", tip: "Try one short sentence after a long one. A short sentence hits hard. Like this.",
      },
    },
    complete: { vocab: ["stranded", "navigate", "propulsion", "atmosphere"], points: 24 },
  },

  {
    id: "rome",
    title: "Diary of a Roman Kid",
    theme: "History · Ancient Rome", themeColor: "#8B3A2A",
    cover: "🏛️", sceneKind: "rome",
    chapter: "Chapter 1 — The Mountain Smokes",
    blurb: "Marcus is twelve. He lives in Rome, year 79 AD. Today his teacher says something strange is happening at Mount Vesuvius.",
    duration: "12 min", points: "+15–25 pts",
    sceneCaption: "Pompeii · morning · year 79 AD",
    listen: {
      meta: "Voice: Coach Maya · 0:28",
      lines: [
        { text: "Marcus woke to the smell of bread and the sound of cart wheels on stone. It was an ordinary morning in Pompeii — or so he thought." },
        { text: "His mother pointed at the mountain. A thin grey line of smoke rose from its peak." },
        { text: "“The mountain has never done that before,” she said quietly.", quote: true },
        { text: "Marcus felt a strange chill, even in the warm sun." },
      ],
    },
    read: {
      label: "Read this part of the story · 2 min",
      passage: [
        { t: "By midday the streets were full of nervous talk. A merchant said the well water tasted of " },
        { vocab: "sulphur", def: "A yellow mineral with a strong, rotten-egg smell" },
        { t: ". Marcus's teacher called the smoke an " },
        { vocab: "omen", def: "A sign that something is about to happen" },
        { t: ". Some families began to load carts and " },
        { vocab: "flee", def: "To run away from danger" },
        { t: " the city, while others stayed, sure the gods would protect them. Marcus wanted to be " },
        { vocab: "courageous", def: "Brave when facing something frightening" },
        { t: ", but his hands would not stop shaking." },
      ],
      question: {
        q: "Why did some families begin to load their carts?", opts: [
          { t: "They were going to market.", correct: false },
          { t: "They were frightened and wanted to flee the city.", correct: true },
          { t: "It was a festival day.", correct: false },
        ],
      },
    },
    speak: {
      prompt: "You are Marcus. The mountain is smoking and people are arguing about whether to leave. Speak out loud — what do you tell your family?",
      hints: ["🎯 Talk for at least 30 seconds", "🗣️ Stay in character as Marcus", "📚 Use one word from this chapter"],
      feedback: {
        score: "8.0", label: "Well done!", rubric: [
          { name: "Grammar", score: 8, note: "Clear, complete sentences." },
          { name: "Structure", score: 8, note: "You gave a reason for your choice — nice." },
          { name: "Vocabulary", score: 8, note: "You worked in the word omen." },
          { name: "Fluency", score: 7, note: "A little fast in the middle — take a breath." },
          { name: "Relevance", score: 9, note: "You really sounded like a worried Roman boy." },
        ], praise: "You made a decision AND explained why — that's exactly what good speakers do under pressure.", tip: "Add one detail you can see or smell. It pulls the listener into the scene.",
      },
    },
    write: {
      prompt: "Write Marcus's diary entry for this day. What did he see? How did he feel? What did his family decide?",
      min: "4–6 sentences.",
      planHints: ["the smoke on the mountain", "what people in the street said", "what your family chose to do"],
      sample: [
        "Today the mountain began to smoke, and no one in Pompeii could speak of anything else. The well water smelled of sulphur and my teacher called the smoke an omen.",
        "I was frightened, but I did not want to show it. Some families loaded their carts to flee, while others stayed and prayed.",
        "Father says we will leave at dawn if the smoke grows. I hope the mountain is only sleeping.",
      ],
      words: 84, paras: 3,
      feedback: {
        score: "8.3", label: "Lovely entry.", rubric: [
          { name: "Grammar", score: 8 }, { name: "Structure", score: 9 }, { name: "Vocabulary", score: 8 }, { name: "Conventions", score: 8 },
        ], praise: "Your last line — “I hope the mountain is only sleeping” — gives the whole entry a feeling. Beautiful.", tip: "Try starting one sentence with a sound or smell to put us right there.",
      },
    },
    complete: { vocab: ["sulphur", "omen", "flee", "courageous"], points: 21 },
  },

  {
    id: "birds",
    title: "How Birds Sing",
    theme: "Nature · Biology", themeColor: "#2D5F3F",
    cover: "🐦", sceneKind: "nature",
    chapter: "Chapter 2 — The Secret Voice",
    blurb: "Why do birds sing at dawn? Why do some copy human voices? A scientist discovers the secret language of the forest.",
    duration: "10 min", points: "+15–20 pts",
    sceneCaption: "Dawn chorus · the forest edge",
    listen: {
      meta: "Voice: Coach Maya · 0:26",
      lines: [
        { text: "Dr. Lena crept into the forest before sunrise, her recorder ready. As the first light touched the leaves, the whole forest seemed to wake up at once." },
        { text: "First one robin, then a hundred voices, layered into a wall of song." },
        { text: "“They're not just singing,” she whispered. “They're talking.”", quote: true },
        { text: "She pressed record and began to listen for patterns." },
      ],
    },
    read: {
      label: "Read this part of the story · 2 min",
      passage: [
        { t: "Lena learned that a bird's song comes from a special organ called the " },
        { vocab: "syrinx", def: "The voice organ deep in a bird's chest" },
        { t: ". Unlike humans, a bird can sing two notes at once. Each species has its own " },
        { vocab: "dialect", def: "A local version of a language or song" },
        { t: ", and young birds must " },
        { vocab: "mimic", def: "To copy a sound or action closely" },
        { t: " the adults to learn it. The dawn chorus, she realised, was not random noise but a careful " },
        { vocab: "ritual", def: "Something done the same way each time, with meaning" },
        { t: " of greetings, warnings, and songs to mark territory." },
      ],
      question: {
        q: "What did Lena realise the dawn chorus actually was?", opts: [
          { t: "Random, meaningless noise.", correct: false },
          { t: "A careful ritual of greetings, warnings and territory songs.", correct: true },
          { t: "Only baby birds practising.", correct: false },
        ],
      },
    },
    speak: {
      prompt: "You are Dr. Lena recording the dawn chorus. Speak out loud — describe what you hear and what you think it means.",
      hints: ["🎯 Talk for at least 30 seconds", "🗣️ Speak like a curious scientist", "📚 Use one word from this chapter"],
      feedback: {
        score: "8.4", label: "Great observing!", rubric: [
          { name: "Grammar", score: 8, note: "Smooth, well-formed sentences." },
          { name: "Structure", score: 8, note: "You described, then explained — good order." },
          { name: "Vocabulary", score: 9, note: "You used dialect and mimic correctly." },
          { name: "Fluency", score: 8, note: "Calm, steady pace — just right for a scientist." },
          { name: "Relevance", score: 8, note: "You stayed focused on the birdsong." },
        ], praise: "You didn't just list facts — you wondered out loud, which is what real scientists do.", tip: "Try one question to the listener, like “Can you hear that?” It draws them in.",
      },
    },
    write: {
      prompt: "Write a short field-notes entry as Dr. Lena. What did you hear, and what do you think the birds were saying?",
      min: "4–6 sentences.",
      planHints: ["the first sound at dawn", "a pattern you noticed", "what you think it means"],
      sample: [
        "Field notes, 5:42 AM. The forest was silent until the first ray of light, and then a single robin began. Within a minute, a hundred voices had joined.",
        "I noticed the same three-note phrase repeating from different trees, as if the birds were answering one another. Each species seemed to have its own dialect.",
        "I believe the dawn chorus is a ritual — a way for the birds to say ‘I am here, this is my place.’ Tomorrow I will record again to test my idea.",
      ],
      words: 92, paras: 3,
      feedback: {
        score: "8.6", label: "Excellent notes.", rubric: [
          { name: "Grammar", score: 9 }, { name: "Structure", score: 9 }, { name: "Vocabulary", score: 8 }, { name: "Conventions", score: 8 },
        ], praise: "Ending with “tomorrow I will test my idea” shows real scientific thinking. Lovely.", tip: "Add one exact number or time — it makes field notes feel real.",
      },
    },
    complete: { vocab: ["syrinx", "dialect", "mimic", "ritual"], points: 18 },
  },

  {
    id: "time",
    title: "The Time Machine Letter",
    theme: "Fantasy · Sci-fi", themeColor: "#4A3B6B",
    cover: "📜", sceneKind: "time",
    chapter: "Chapter 1 — A Letter From 1923",
    blurb: "A letter arrives at your door. The envelope is from 1923. The handwriting is yours. How is that possible?",
    duration: "18 min", points: "+20–30 pts",
    sceneCaption: "The hallway · an impossible envelope",
    listen: {
      meta: "Voice: Coach Maya · 0:30",
      lines: [
        { text: "The envelope was yellow with age, the stamp from a country that no longer existed. But the handwriting on the front was unmistakable — it was mine." },
        { text: "Inside, a single line: ‘Do not open the blue door before noon.’" },
        { text: "“This can't be real,” I said to the empty room.", quote: true },
        { text: "The clock on the wall read 11:54." },
      ],
    },
    read: {
      label: "Read this part of the story · 2 min",
      passage: [
        { t: "I turned the letter over, searching for any clue. The paper felt " },
        { vocab: "brittle", def: "Hard but easily broken or cracked" },
        { t: ", as if it might crumble in my hands. The message was a clear " },
        { vocab: "warning", def: "Something that tells you danger is ahead" },
        { t: ", but from whom? The whole thing was a " },
        { vocab: "paradox", def: "Something that seems impossible because it contradicts itself" },
        { t: " — how could I have written a letter before I was born? My curiosity began to " },
        { vocab: "overwhelm", def: "To become too strong to control" },
        { t: " my fear. The clock now read 11:57." },
      ],
      question: {
        q: "Why does the narrator call the letter a paradox?", opts: [
          { t: "It is written in a strange language.", correct: false },
          { t: "They seem to have written it before they were even born.", correct: true },
          { t: "It has no stamp.", correct: false },
        ],
      },
    },
    speak: {
      prompt: "You found a letter in your own handwriting from 1923, warning you not to open the blue door. Speak out loud — what do you decide, and why?",
      hints: ["🎯 Talk for at least 30 seconds", "🗣️ Speak as yourself in the story", "📚 Use one word from this chapter"],
      feedback: {
        score: "8.1", label: "Nice thinking!", rubric: [
          { name: "Grammar", score: 8, note: "Well-controlled sentences." },
          { name: "Structure", score: 8, note: "You weighed two choices before deciding." },
          { name: "Vocabulary", score: 8, note: "You used the word paradox." },
          { name: "Fluency", score: 8, note: "Confident pace with good pauses." },
          { name: "Relevance", score: 8, note: "You kept the mystery at the centre." },
        ], praise: "You argued with yourself out loud — ‘part of me wants to… but…’ — which makes the decision feel real.", tip: "End on the clock. Coming back to the time builds suspense.",
      },
    },
    write: {
      prompt: "Write what happens in the next three minutes, before noon. Do you open the blue door? Tell it as a story.",
      min: "5–7 sentences.",
      planHints: ["what the clock says", "what you decide", "the very last second before noon"],
      sample: [
        "The clock read 11:57, and the blue door at the end of the hall seemed to hum. I read the letter one more time: do not open the blue door before noon.",
        "Part of me wanted to fling it open and end the mystery, but the handwriting was mine, and surely I had a reason. So I sat on the cold floor and waited, counting each second.",
        "At 11:59 the door handle began to turn on its own. I held my breath. Whatever was on the other side, it would have to wait for noon — and so would I.",
      ],
      words: 108, paras: 3,
      feedback: {
        score: "8.4", label: "Gripping!", rubric: [
          { name: "Grammar", score: 8 }, { name: "Structure", score: 9 }, { name: "Vocabulary", score: 8 }, { name: "Conventions", score: 9 },
        ], praise: "“The door handle began to turn on its own” is a perfect cliffhanger. You built real suspense.", tip: "Try a one-word sentence at the tensest moment. ‘Noon.’ It lands hard.",
      },
    },
    complete: { vocab: ["brittle", "warning", "paradox", "overwhelm"], points: 26 },
  },

  {
    id: "ocean",
    title: "The Deep Blue",
    theme: "Science · Ocean", themeColor: "#155E75",
    cover: "🐋", sceneKind: "ocean",
    chapter: "Chapter 2 — Where Light Ends",
    blurb: "A research submarine sinks past the last ray of sunlight, into a world no human has ever seen with their own eyes.",
    duration: "14 min", points: "+15–25 pts",
    sceneCaption: "Submersible Nautla · 1,000 m down",
    listen: {
      meta: "Voice: Coach Maya · 0:29",
      lines: [
        { text: "At three hundred metres, the last blue light faded and the ocean turned to ink. Pilot Sara switched on the submarine's lamps." },
        { text: "Out of the darkness drifted a creature that seemed made of glass and lightning." },
        { text: "“Are you seeing this?” she breathed into the radio.", quote: true },
        { text: "Far above, the surface team had gone completely silent." },
      ],
    },
    read: {
      label: "Read this part of the story · 2 min",
      passage: [
        { t: "Sara guided the sub deeper, where the water pressure could crush steel. Many creatures here make their own light, a trick called " },
        { vocab: "bioluminescence", def: "Light made by a living thing" },
        { t: ". A jelly pulsed past, almost completely " },
        { vocab: "transparent", def: "See-through; letting light pass clearly" },
        { t: ". The deep sea is the planet's last great " },
        { vocab: "frontier", def: "A place that is still unknown or unexplored" },
        { t: ", and every dive can reveal a creature no one has ever " },
        { vocab: "documented", def: "Recorded with notes, photos or film" },
        { t: " before. Sara reached for the camera with a shaking hand." },
      ],
      question: {
        q: "Why is every deep-sea dive so exciting for scientists?", opts: [
          { t: "The water is warmer down there.", correct: false },
          { t: "Each dive can reveal a creature never documented before.", correct: true },
          { t: "It is an easy place to explore.", correct: false },
        ],
      },
    },
    speak: {
      prompt: "You are pilot Sara, a kilometre underwater, seeing a glowing creature for the first time. Speak out loud — describe it to your team above.",
      hints: ["🎯 Talk for at least 30 seconds", "🗣️ Stay in character as Sara", "📚 Use one word from this chapter"],
      feedback: {
        score: "8.3", label: "Vivid!", rubric: [
          { name: "Grammar", score: 8, note: "Clear sentences under pressure." },
          { name: "Structure", score: 8, note: "You described shape, then light, then movement." },
          { name: "Vocabulary", score: 9, note: "You used bioluminescence — impressive!" },
          { name: "Fluency", score: 8, note: "Good awe in your voice, steady pace." },
          { name: "Relevance", score: 8, note: "You kept describing the creature, not yourself." },
        ], praise: "Your description let us SEE the creature — ‘glass and lightning' is wonderful word-painting.", tip: "Compare it to something familiar. ‘As big as a bus' helps a listener picture size.",
      },
    },
    write: {
      prompt: "Write Sara's log entry from this dive. What did she see, and how did it feel to be the first human to see it?",
      min: "4–6 sentences.",
      planHints: ["how dark and deep it was", "what the creature looked like", "how being first felt"],
      sample: [
        "Dive log, 1,000 metres. Above three hundred metres the blue light died, and below it the ocean became pure ink. I switched on the lamps and waited.",
        "Then it appeared — a creature of glass and lightning, glowing with its own bioluminescence, almost transparent against the black water.",
        "No human had ever seen this animal alive. My hands shook as I reached for the camera. For one moment, this corner of the deep frontier belonged only to me.",
      ],
      words: 96, paras: 3,
      feedback: {
        score: "8.5", label: "Beautiful log.", rubric: [
          { name: "Grammar", score: 9 }, { name: "Structure", score: 8 }, { name: "Vocabulary", score: 9 }, { name: "Conventions", score: 8 },
        ], praise: "“This corner of the deep frontier belonged only to me” — you captured the feeling, not just the facts.", tip: "Add one sound (or the lack of it). Silence is powerful a kilometre down.",
      },
    },
    complete: { vocab: ["bioluminescence", "transparent", "frontier", "documented"], points: 22 },
  },

  {
    id: "storm",
    title: "The Storm Chaser",
    theme: "Science · Weather", themeColor: "#6D28A3",
    cover: "🌪️", sceneKind: "storm",
    chapter: "Chapter 1 — Reading the Sky",
    blurb: "Priya races across the open plains, chasing the most dangerous storms on Earth — to learn how to keep people safe.",
    duration: "13 min", points: "+15–25 pts",
    sceneCaption: "The Great Plains · a wall of cloud",
    listen: {
      meta: "Voice: Coach Maya · 0:27",
      lines: [
        { text: "Priya watched the western sky turn an eerie green. To most people it was just a dark afternoon, but to her it was a warning written in cloud." },
        { text: "The radio crackled with a fresh alert. A rotating storm was forming forty miles ahead." },
        { text: "“Okay,” she said, gripping the wheel. “Let's go meet it — carefully.”", quote: true },
        { text: "She pressed the accelerator and the chase began." },
      ],
    },
    read: {
      label: "Read this part of the story · 2 min",
      passage: [
        { t: "Priya's instruments measured the falling " },
        { vocab: "pressure", def: "The push of the air; it drops fast before a big storm" },
        { t: ". A sudden drop often means a storm is about to " },
        { vocab: "intensify", def: "To become stronger or more severe" },
        { t: ". She watched for a " },
        { vocab: "funnel", def: "A spinning cone of cloud reaching toward the ground" },
        { t: " dipping from the storm's base. Her job was not to be reckless but to gather data and give people enough warning to " },
        { vocab: "evacuate", def: "To leave a dangerous place for safety" },
        { t: ". Every minute of warning could save a life." },
      ],
      question: {
        q: "What is the real purpose of Priya's dangerous work?", opts: [
          { t: "To take exciting photos.", correct: false },
          { t: "To gather data and give people enough warning to evacuate.", correct: true },
          { t: "To win a race against other chasers.", correct: false },
        ],
      },
    },
    speak: {
      prompt: "You are Priya, watching a storm form on the horizon. Speak out loud — what do you see, and what will you do to keep people safe?",
      hints: ["🎯 Talk for at least 30 seconds", "🗣️ Stay in character as Priya", "📚 Use one word from this chapter"],
      feedback: {
        score: "8.2", label: "Strong work!", rubric: [
          { name: "Grammar", score: 8, note: "Clear and confident sentences." },
          { name: "Structure", score: 8, note: "You described the danger, then your plan." },
          { name: "Vocabulary", score: 8, note: "You used the word evacuate." },
          { name: "Fluency", score: 8, note: "Urgent but controlled — nicely judged." },
          { name: "Relevance", score: 9, note: "You kept safety at the centre of your answer." },
        ], praise: "You balanced excitement with responsibility — ‘carefully' is the most important word a storm chaser can say.", tip: "Slow down on the safety line. The calmest voice is the one people trust in danger.",
      },
    },
    write: {
      prompt: "Write Priya's report after the chase. What did she observe, and what warning did she send to the towns ahead?",
      min: "4–6 sentences.",
      planHints: ["the colour of the sky", "what your instruments showed", "the warning you sent"],
      sample: [
        "Chase report, 3:50 PM. The western sky turned green and the air pressure dropped faster than I have ever recorded. These are the signs of a storm about to intensify.",
        "At 4:10 a funnel dipped from the cloud base and touched the ground three miles east of the highway. I radioed the data straight to the weather service.",
        "Thanks to the early warning, two towns had nearly twenty minutes to evacuate. The storm did damage, but every family got to shelter in time.",
      ],
      words: 98, paras: 3,
      feedback: {
        score: "8.4", label: "Clear and brave.", rubric: [
          { name: "Grammar", score: 8 }, { name: "Structure", score: 9 }, { name: "Vocabulary", score: 8 }, { name: "Conventions", score: 9 },
        ], praise: "Ending on ‘every family got to shelter in time' shows WHY the work matters. Powerful.", tip: "Use exact times like ‘4:10'. In a report, precise details build trust.",
      },
    },
    complete: { vocab: ["pressure", "intensify", "funnel", "evacuate"], points: 22 },
  },
];

const byId: Record<string, Story> = {};
STORIES.forEach((s) => {
  byId[s.id] = s;
});

export const STORY_LIB: StoryLib = { STORIES, byId };
