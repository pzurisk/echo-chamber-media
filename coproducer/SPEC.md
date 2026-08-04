# CoProducer, Handoff Spec

**One-liner:** A Max for Live device that acts like Duolingo for music production. It lives inside Ableton Live, teaches production and theory through bite-size tasks, and helps you get unstuck (for example "I have a chord progression, I need a chorus") by generating suggestions in the style of Deftones, Nine Inch Nails, or pop punk. Goal: help someone with limited musical knowledge finish tracks, faster, while actually learning.

**Scope:** Personal tool for Billy first. No accounts, licensing, or payment system. Single-user, local-first.

---

## 1. Architecture

Ableton Live is closed-source, so this is NOT a DAW clone. It's a device that runs inside Live via **Max for Live (M4L)**, using:

- **Max for Live device** (`.amxd`): the shell that loads into a Live track.
- **Live Object Model (LOM)**: Max's API into Live. Read and write tracks, clips, MIDI notes, devices, mixer, arrangement. This is how the device reads session state and writes generated MIDI back into clips.
- **`jweb` object**: an embedded Chromium webview inside the M4L device. This is where the actual UI lives (React, HTML, CSS) instead of Max's native UI objects. This is the standard modern approach for anything beyond a few knobs.
- **Node for Max (`node.script`)**: a Node.js process embedded in the M4L device, used for:
  - Calling the Claude API (LLM suggestions)
  - Reading and writing local JSON files (genre style packs, user progress and XP)
  - Bridging between the `jweb` UI and the Max/LOM side (via outlet and inlet messages or a local WebSocket)

**Data flow:**

```
jweb UI (React)  <-->  node.script (Node.js: LLM calls, file I/O, game logic)  <-->  Max patch  <-->  LOM (reads and writes the Live session)
```

The UI never talks to Live directly. It goes through Node, which goes through Max, which talks to the LOM. Node and the UI talk directly over a local WebSocket for speed (recommended) rather than round-tripping every UI event through Max messages.

---

## 2. Core features (MVP)

### A. Session awareness

On load, the device reads the current Live set via LOM: track count, clip contents (notes, if any), tempo, existing arrangement markers. This gives the AI context without the user having to explain their song.

### B. Decision helper ("I'm stuck")

User flags where they're stuck (for example "I have a verse chord progression, need a chorus"). Hybrid engine:

1. **Rule-based layer**: genre style packs contain curated chord banks, common progressions, and song-structure templates idiomatic to Deftones, NIN, and pop punk (not transcriptions of real songs; see Section 5, legal note).
2. **LLM layer**: the Claude API takes the current chord and note data, the selected genre pack, and the "what's next" question, and returns a specific suggestion (for example a chord progression, or a structural move like "drop to half-time for 8 bars then build"), grounded in the rule-based bank so it stays genre-authentic instead of generic.
3. The suggestion gets rendered as actual MIDI and written into a new clip via LOM (`LiveAPI` calls to create a clip and insert notes), so the user can audition it immediately, not just read text.

### C. Gamification layer (all three, combined)

- **Streaks**: daily and per-session streak for opening the device and doing at least one task.
- **Lessons**: short, contextual micro-lessons (60 to 90 seconds, text plus maybe an audio example) that unlock when relevant. For example, finishing a verse triggers a lesson on what makes a chorus feel bigger. Completing a lesson grants XP.
- **Milestones**: XP tied to song-structure progress, not busywork. Verse written, chorus written, arrangement complete, mixed, exported. This is the primary loop; streaks and lessons support it.
- A local JSON file tracks XP, streak count, completed lessons, and per-song milestone state. No backend needed for v1.

---

## 3. Genre style packs

Each genre pack is a structured JSON file, not a black box. This makes it easy to add genres later (Deftones, NIN, and pop punk to start).

```json
{
  "genre": "deftones",
  "tempoRange": [80, 100],
  "commonKeys": ["Bb minor", "D minor"],
  "chordVocabulary": ["min7", "maj7#11", "sus2", "add9"],
  "progressionTemplates": [
    { "name": "verse-tension", "roman": ["i", "bVI", "iv", "v"] }
  ],
  "songStructures": [
    { "name": "quiet-loud", "sections": ["intro", "verse-clean", "prechorus-build", "chorus-heavy", "verse-clean", "chorus-heavy", "bridge-atmospheric", "chorus-heavy-out"] }
  ],
  "productionNotes": [
    "Heavy use of clean/distorted guitar layering",
    "Wide, atmospheric reverb sends on choruses",
    "Drums often pull back in verses, hit hard in choruses"
  ]
}
```

This file is the ground truth the LLM is grounded against. It prevents generic AI suggestions and keeps things genre-authentic.

---

## 4. Tech stack

| Layer | Choice | Why |
|---|---|---|
| DAW integration | Max for Live (M4L) | Only real way to get read and write access inside Live |
| UI | React plus Tailwind, rendered in `jweb` | Needed for a real gamified UI (progress bars, XP, lesson cards). Max's native UI can't do this well |
| Local backend | Node.js via `node.script` (Node for Max) | Handles LLM calls, file I/O, game-state logic |
| LLM | Claude API (Anthropic) | Billy already has access; strong at structured reasoning over music theory plus style constraints |
| Session and game state | Local JSON files | No backend needed for a personal-tool v1 |
| MIDI generation | LOM `LiveAPI` calls from Max, triggered by Node via message passing | Standard M4L pattern for writing notes into clips |

---

## 5. Open questions and risks

1. **Legal and IP**: Genre style packs must encode idiomatic patterns (common chord types, structures, production techniques associated with a genre or era), never transcriptions of specific copyrighted songs. This is stated explicitly in the style pack docs so nobody accidentally embeds an actual Deftones riff.
2. **LOM note-writing quirks**: Writing MIDI notes into clips via LiveAPI has known timing and quantization edge cases. The build includes a test clip round trip early (write 4 notes, read them back, confirm timing) before building the full suggestion pipeline on top.
3. **API key handling**: The Node for Max process holds the Claude API key locally. Store it in a gitignored `.env`, not hardcoded, even for a personal tool.
4. **jweb performance**: Embedded Chromium views in older Live and Max versions have had memory and performance quirks with large webviews. Confirm the current Max version (Max 8.5+ / Live 11+) supports this cleanly before committing to a heavy React UI.

---

## 6. Build order

1. **Skeleton M4L device**: an `.amxd` with `jweb` loading a static "Hello CoProducer" React page. Confirm the Node to Max to LOM to UI round trip works (read the current track name, display it in the UI).
2. **Session read**: pull clip, note, and tempo data from the current Live set into the UI.
3. **MIDI write-back**: hardcode one test chord progression, write it into a new clip via LOM. Validate the write path before touching AI.
4. **One style pack (pick one genre)**: build the JSON schema, load it in Node, wire the "I'm stuck" button to return a rule-based (no LLM yet) suggestion.
5. **LLM layer**: add the Claude API call grounded on the style pack, replacing the rule-based-only suggestion.
6. **Gamification v1**: local JSON XP and streak tracking plus one milestone (finish a chorus) and one lesson.
7. **Second and third genre packs** (NIN, pop punk) once the pipeline is proven on one.

---

## 7. Multi-agent build orchestration

Billy wants Claude Fable running this as the orchestrator, delegating the actual build work to specialized sub-agents rather than one agent doing everything serially. The split, mapped to the build order in Section 6:

| Agent | Owns | Depends on |
|---|---|---|
| **Fable (orchestrator)** | Sequencing, reviewing each agent's output before the next starts, resolving cross-agent conflicts (for example the Node to Max message contract), keeping this spec as the single source of truth | (none) |
| **M4L/LOM agent** | `.amxd` device skeleton, `jweb` embed, `node.script` setup, all Live Object Model read and write calls (session read, MIDI write-back, clip creation) | Fable kickoff |
| **UI agent** | React and Tailwind UI inside `jweb`: session view, "I'm stuck" flow, lesson cards, XP, streak, and milestone displays | The M4L/LOM message contract (needs to know what data Node sends) |
| **Genre/AI agent** | Style pack JSON schema plus Deftones, NIN, and pop punk content, Claude API integration for the decision helper, grounding logic | The M4L/LOM MIDI write-back path (needs a place to send suggestions) |
| **Gamification agent** | Local JSON XP, streak, milestone, and lesson-progress logic, lesson content authoring, milestone trigger rules | The UI agent (needs UI hooks to display state) |

**Delegation contract**: each sub-agent gets (1) this full spec, (2) the specific sections it owns, and (3) the interface it must expose or consume. The interface doc is `docs/CONTRACT.md`, held by the orchestrator as the single source of truth. Sub-agents build against it rather than guessing at each other's contracts.

Build order stays as Section 6, but steps 1 to 3 (skeleton, session read, MIDI write-back) are the M4L/LOM agent working mostly solo. Everything downstream forks out to the UI and Genre/AI agents once that foundation is real and tested.

---

*Prepared for handoff to Claude Fable as orchestrator, delegating to sub-agents per Section 7. Personal tool, single user, local-first. No auth or payment layer needed for v1.*
