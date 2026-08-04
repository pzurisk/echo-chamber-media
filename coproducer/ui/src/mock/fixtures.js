// Mock mode fixtures for the CoProducer UI.
//
// Every object in this file matches the shapes in docs/CONTRACT.md Section 4
// exactly, so the file doubles as documentation of what the Node side sends.
// If a shape changes in the contract, change it here in the same commit.
//
// The mock server (mockServer.js) clones these on startup and mutates the
// clones, so the exports stay pristine for tests.

// SessionSnapshot (CONTRACT Section 4). setName doubles as the songId used
// by GameState.songs and milestone.set.
export const sessionSnapshot = {
  tempo: 92.0,
  timeSignature: { numerator: 4, denominator: 4 },
  isPlaying: false,
  setName: "Night Shift",
  tracks: [
    {
      index: 0,
      name: "Guitar",
      isMidi: true,
      clips: [
        {
          sceneIndex: 0,
          name: "verse riff",
          lengthBeats: 16,
          noteCount: 24,
          clipPath: "live_set tracks 0 clip_slots 0 clip",
        },
        {
          sceneIndex: 1,
          name: "verse alt",
          lengthBeats: 16,
          noteCount: 18,
          clipPath: "live_set tracks 0 clip_slots 1 clip",
        },
      ],
    },
    {
      index: 1,
      name: "Bass",
      isMidi: true,
      clips: [
        {
          sceneIndex: 0,
          name: "verse bass",
          lengthBeats: 16,
          noteCount: 12,
          clipPath: "live_set tracks 1 clip_slots 0 clip",
        },
      ],
    },
    {
      index: 2,
      name: "Drums",
      isMidi: true,
      clips: [
        {
          sceneIndex: 0,
          name: "verse beat",
          lengthBeats: 8,
          noteCount: 32,
          clipPath: "live_set tracks 2 clip_slots 0 clip",
        },
        {
          sceneIndex: 2,
          name: "half time",
          lengthBeats: 8,
          noteCount: 16,
          clipPath: "live_set tracks 2 clip_slots 2 clip",
        },
      ],
    },
    {
      index: 3,
      name: "Vox",
      isMidi: false,
      clips: [
        {
          sceneIndex: 0,
          name: "scratch take",
          lengthBeats: 16,
          noteCount: 0,
          clipPath: "live_set tracks 3 clip_slots 0 clip",
        },
      ],
    },
  ],
  selected: { trackIndex: 0, sceneIndex: 0 },
};

// GameState (CONTRACT Section 4). xp 340 puts the demo at level 2
// (floor(sqrt(340 / 100)) + 1) with the next level at 400 XP.
export const gameState = {
  xp: 340,
  level: 2,
  streak: { count: 4, lastActiveDate: "2026-08-03" },
  lessonsCompleted: ["start-with-eight-bars"],
  songs: {
    "Night Shift": {
      milestones: {
        verse: true,
        chorus: false,
        bridge: false,
        arrangement: false,
        mix: false,
        export: false,
      },
    },
    "Basement Tape": {
      milestones: {
        verse: true,
        chorus: true,
        bridge: false,
        arrangement: false,
        mix: false,
        export: false,
      },
    },
  },
};

// Lesson[] (CONTRACT Section 4). These are the pure catalog shapes. The wire
// response for lesson.list adds boolean `unlocked` and `completed` per lesson
// (CONTRACT Section 5); the mock server computes those the same way the real
// game module does, from unlock rules plus gameState.lessonsCompleted.
export const lessons = [
  {
    id: "start-with-eight-bars",
    title: "Start with eight bars",
    body:
      "Do not open a blank set and try to write a song. Write eight bars you like: one chord loop, one drum idea, one sound. Eight bars is small enough to finish in a sitting and big enough to tell you if the idea works. Once the loop holds up on repeat, you have a verse candidate, and everything after that is a series of decisions instead of a blank page.",
    xp: 20,
    unlock: { type: "always" },
  },
  {
    id: "chorus-lift",
    title: "What makes a chorus feel bigger",
    body:
      "A chorus feels bigger because something measurable changes, not because you turn everything up. The usual levers: move the chord roots higher or start the progression on a different chord, open the drums from closed hats to open hats or crash washes, add one new layer (a pad, an octave guitar, a vocal double), and let notes ring longer. Pick two of those levers, not all four. If the verse is busy, a chorus can also lift by simplifying.",
    xp: 20,
    unlock: { type: "milestone", milestone: "verse" },
  },
  {
    id: "commit-and-audition",
    title: "Audition ideas as clips, not opinions",
    body:
      "When CoProducer writes a suggestion into a clip, loop it against your existing parts before you judge it. Ears beat descriptions. Keep the clip if it changes how you hear the song, delete it if it does not, and either way you have learned something about the track in under a minute. Never keep an idea just because it took effort to generate.",
    xp: 20,
    unlock: { type: "suggestion", kind: "chord-progression" },
  },
  {
    id: "arrangement-subtraction",
    title: "Arrange by subtraction",
    body:
      "Once verse and chorus exist, arrangement is mostly deciding what to remove and when. Copy your fullest section across the whole timeline, then carve: drop the bass for the first verse, cut the drums for two bars before the chorus, strip the last chorus to half its layers then slam everything back. Silence and absence create the contrast that makes sections land.",
    xp: 20,
    unlock: { type: "milestone", milestone: "chorus" },
  },
  {
    id: "mix-bus-basics",
    title: "Rough mix in three moves",
    body:
      "Before any plugins, get balance, panning, and one volume automation pass. Balance: pull every fader down and bring tracks up in order of importance, vocals or lead first. Panning: keep kick, snare, bass, and lead center, push doubles and colors out wide. Automation: ride the one element that carries each section. A rough mix that does these three things beats an untreated mix with expensive plugins on it.",
    xp: 20,
    unlock: { type: "milestone", milestone: "arrangement" },
  },
  {
    id: "export-checklist",
    title: "Export without regrets",
    body:
      "Check three things before you bounce: the loop brace covers the whole song plus two bars of tail, no clip is soloed or muted by accident, and the master peaks below 0 dB. Export a WAV, then listen to the bounce start to finish on something that is not your studio monitors (phone speaker, car, earbuds). If you only fix one thing after that listen, fix the thing you noticed first.",
    xp: 20,
    unlock: { type: "milestone", milestone: "mix" },
  },
];

// Suggestion templates keyed by genre then kind. The mock server stamps id and
// source on a clone before returning it, so the full object matches the
// Suggestion shape in CONTRACT Section 4. clip.notes is a NoteEvent[]:
// { pitch, startBeats, durationBeats, velocity, muted }, pitch 60 is middle C.
// clip is null for suggestions with nothing to audition.
export const suggestionTemplates = {
  deftones: {
    "chord-progression": {
      kind: "chord-progression",
      genre: "deftones",
      summary: "Try i to bVI to iv to v in B flat minor for the chorus lift",
      detail:
        "Keep the verse riff where it is and move the chorus roots to Bb minor, Gb, Eb minor, F minor, four beats each. Let the guitars ring open over the changes instead of chugging, and push the drums from a tight verse pattern to open crashes. The bVI is where the lift lives, so lean on it.",
      theory:
        "Borrowing the major bVI inside a minor key brightens the chorus without leaving the key, which is why it lifts instead of just getting louder.",
      clip: {
        lengthBeats: 16,
        suggestedTrackIndex: 0,
        notes: [
          { pitch: 58, startBeats: 0.0, durationBeats: 4.0, velocity: 92, muted: false },
          { pitch: 61, startBeats: 0.0, durationBeats: 4.0, velocity: 88, muted: false },
          { pitch: 65, startBeats: 0.0, durationBeats: 4.0, velocity: 85, muted: false },
          { pitch: 54, startBeats: 4.0, durationBeats: 4.0, velocity: 92, muted: false },
          { pitch: 58, startBeats: 4.0, durationBeats: 4.0, velocity: 88, muted: false },
          { pitch: 61, startBeats: 4.0, durationBeats: 4.0, velocity: 85, muted: false },
          { pitch: 63, startBeats: 8.0, durationBeats: 4.0, velocity: 92, muted: false },
          { pitch: 66, startBeats: 8.0, durationBeats: 4.0, velocity: 88, muted: false },
          { pitch: 70, startBeats: 8.0, durationBeats: 4.0, velocity: 85, muted: false },
          { pitch: 65, startBeats: 12.0, durationBeats: 4.0, velocity: 94, muted: false },
          { pitch: 68, startBeats: 12.0, durationBeats: 4.0, velocity: 90, muted: false },
          { pitch: 72, startBeats: 12.0, durationBeats: 4.0, velocity: 87, muted: false },
        ],
      },
    },
    structure: {
      kind: "structure",
      genre: "deftones",
      summary: "Drop to half time for 8 bars after the second chorus, then build back",
      detail:
        "Cut the tempo feel in half right where the second chorus ends: drums to half time, bass to whole notes, one clean guitar carrying a two chord figure. Hold that for 8 bars, then bring layers back one per bar into the final chorus. The drop resets the listener's ears so the last chorus hits harder than the first two.",
      theory:
        "Contrast is relative, so making the final chorus feel bigger is cheaper by making the section before it smaller.",
      clip: null,
    },
    production: {
      kind: "production",
      genre: "deftones",
      summary: "Layer a clean guitar under the distorted take and pan them apart",
      detail:
        "Duplicate the chorus guitar part onto a clean, chorused amp tone. Pan the distorted take 40 percent left and the clean take 40 percent right, then send the clean one to a long, wide reverb. Keep the clean layer 6 to 9 dB under the distorted one, felt more than heard.",
      theory:
        "The clean layer fills the frequency gaps distortion carves out, which reads as width and air instead of a second guitar.",
      clip: null,
    },
  },
  nin: {
    "chord-progression": {
      kind: "chord-progression",
      genre: "nin",
      summary: "Try i to bVI to bVII back to i in A minor over a static bass pedal",
      detail:
        "Run Am, F, G, Am with two beats of tension on the G, while the bass synth holds a low A through the whole cycle. The pedal keeps it menacing while the chords move above it. Play the chords as tight stabs on a cold synth rather than sustained pads.",
      theory:
        "Holding the tonic in the bass under moving chords creates tension without changing key, a core trick of dark electronic writing.",
      clip: {
        lengthBeats: 16,
        suggestedTrackIndex: 0,
        notes: [
          { pitch: 45, startBeats: 0.0, durationBeats: 16.0, velocity: 78, muted: false },
          { pitch: 57, startBeats: 0.0, durationBeats: 4.0, velocity: 90, muted: false },
          { pitch: 60, startBeats: 0.0, durationBeats: 4.0, velocity: 86, muted: false },
          { pitch: 64, startBeats: 0.0, durationBeats: 4.0, velocity: 84, muted: false },
          { pitch: 53, startBeats: 4.0, durationBeats: 4.0, velocity: 90, muted: false },
          { pitch: 57, startBeats: 4.0, durationBeats: 4.0, velocity: 86, muted: false },
          { pitch: 60, startBeats: 4.0, durationBeats: 4.0, velocity: 84, muted: false },
          { pitch: 55, startBeats: 8.0, durationBeats: 4.0, velocity: 92, muted: false },
          { pitch: 59, startBeats: 8.0, durationBeats: 4.0, velocity: 88, muted: false },
          { pitch: 62, startBeats: 8.0, durationBeats: 4.0, velocity: 86, muted: false },
          { pitch: 57, startBeats: 12.0, durationBeats: 4.0, velocity: 90, muted: false },
          { pitch: 60, startBeats: 12.0, durationBeats: 4.0, velocity: 86, muted: false },
          { pitch: 64, startBeats: 12.0, durationBeats: 4.0, velocity: 84, muted: false },
        ],
      },
    },
    structure: {
      kind: "structure",
      genre: "nin",
      summary: "Strip to drums and one synth for 8 bars, then stack layers back one per bar",
      detail:
        "After your current section, cut everything except the drum loop and the single most hostile synth you have. Hold that skeleton for 8 bars, then re-enter one layer per bar: bass, pad, second synth, vocal texture. The rebuild becomes the arrangement instead of a paste of the same wall of sound.",
      theory:
        "Additive layering over a fixed loop turns repetition into a build, so the section moves without the harmony changing at all.",
      clip: null,
    },
    production: {
      kind: "production",
      genre: "nin",
      summary: "Distort the drum bus and blend it under the clean kit",
      detail:
        "Send the whole drum group to a return with heavy saturation or a guitar amp sim, low pass it around 5 kHz, and blend it in under the clean drums until they feel angry but still punch. Automate the blend up in choruses. Start with the return about 10 dB under the dry bus.",
      theory:
        "Parallel distortion adds sustain and grit while the dry signal keeps the transients, which is how drums get nasty without turning to mush.",
      clip: null,
    },
  },
  "pop-punk": {
    "chord-progression": {
      kind: "chord-progression",
      genre: "pop-punk",
      summary: "Try I to V to vi to IV in E major, eighth note downstrokes throughout",
      detail:
        "Run E, B, C sharp minor, A, four beats each, with relentless eighth note downstrokes and palm muting on the verses that opens up for the chorus. Keep the bass locked to the guitar roots. If the verse already uses this loop, start the chorus on the IV instead so the sections read differently.",
      theory:
        "The I V vi IV loop keeps every chord inside the key with maximum familiarity, so the energy comes from rhythm and register, not harmonic surprise.",
      clip: {
        lengthBeats: 16,
        suggestedTrackIndex: 0,
        notes: [
          { pitch: 52, startBeats: 0.0, durationBeats: 4.0, velocity: 98, muted: false },
          { pitch: 56, startBeats: 0.0, durationBeats: 4.0, velocity: 94, muted: false },
          { pitch: 59, startBeats: 0.0, durationBeats: 4.0, velocity: 92, muted: false },
          { pitch: 59, startBeats: 4.0, durationBeats: 4.0, velocity: 98, muted: false },
          { pitch: 63, startBeats: 4.0, durationBeats: 4.0, velocity: 94, muted: false },
          { pitch: 66, startBeats: 4.0, durationBeats: 4.0, velocity: 92, muted: false },
          { pitch: 61, startBeats: 8.0, durationBeats: 4.0, velocity: 96, muted: false },
          { pitch: 64, startBeats: 8.0, durationBeats: 4.0, velocity: 92, muted: false },
          { pitch: 68, startBeats: 8.0, durationBeats: 4.0, velocity: 90, muted: false },
          { pitch: 57, startBeats: 12.0, durationBeats: 4.0, velocity: 98, muted: false },
          { pitch: 61, startBeats: 12.0, durationBeats: 4.0, velocity: 94, muted: false },
          { pitch: 64, startBeats: 12.0, durationBeats: 4.0, velocity: 92, muted: false },
        ],
      },
    },
    structure: {
      kind: "structure",
      genre: "pop-punk",
      summary: "Add a 4 bar pre chorus that doubles the snare and climbs to the V",
      detail:
        "Between verse and chorus, insert 4 bars where the snare moves to every beat, the guitars switch from palm muted to open, and the last chord lands on the V of your key. Keep the vocal melody rising through it. The chorus then arrives as a release instead of just the next section.",
      theory:
        "Ending the pre chorus on the dominant creates a pull the chorus resolves, which is the cheapest tension and release move in the book.",
      clip: null,
    },
    production: {
      kind: "production",
      genre: "pop-punk",
      summary: "Double track the rhythm guitars and pan them hard left and right",
      detail:
        "Record or duplicate the rhythm guitar part twice with real variation between takes (or nudge timing and pick a different amp preset on the copy). Pan one hard left, one hard right, and keep the center for bass, kick, snare, and vocal. Do not add stereo widener plugins on top, the two takes are the width.",
      theory:
        "Two different performances panned apart decorrelate the channels, which is what actually reads as a wide wall of guitars.",
      clip: null,
    },
  },
};

// Example error frame payload, for reference (CONTRACT Section 2):
// { code: "lom_unavailable" | "lom_timeout" | "engine_error" | "llm_unavailable" | "bad_request" | "internal", message: string }
