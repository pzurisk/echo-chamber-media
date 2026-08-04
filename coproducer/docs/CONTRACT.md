# CoProducer Interface Contract (v1)

Held by the orchestrator. This is the single source of truth for every interface between the four workstreams. Build against it exactly. If something here turns out to be impossible in your layer, do NOT change this file; implement the closest working version and report the deviation in your final summary so the orchestrator can reconcile.

Writing rule for every file in this project (code comments, docs, UI copy, lesson text): no em dashes, ever. Use periods, commas, or parentheses. Plain, specific language.

---

## 1. File and directory ownership

| Path | Owner | Contents |
|---|---|---|
| `coproducer/device/` | M4L/LOM agent | Max patcher source, `lom-bridge.js` (Max `js` object, ES5), build docs |
| `coproducer/node/main.js` | M4L/LOM agent | Node for Max entry: WebSocket server, Max bridge, wiring |
| `coproducer/node/lom/` | M4L/LOM agent | Node-side LOM command helpers and request correlation |
| `coproducer/node/engine/` | Genre/AI agent | Suggestion engine: rules layer, Claude client, grounding |
| `coproducer/packs/` | Genre/AI agent | `SCHEMA.md`, `deftones.json`, `nin.json`, `pop-punk.json` |
| `coproducer/node/game/` | Gamification agent | XP, streak, milestone, lesson-progress logic and persistence |
| `coproducer/lessons/` | Gamification agent | `catalog.json` lesson content plus authoring notes |
| `coproducer/ui/` | UI agent | Vite + React + Tailwind app (own `package.json` inside `ui/`) |
| `coproducer/package.json`, `SPEC.md`, `docs/`, `README.md`, `.env.example` | Orchestrator | Shared config and docs |
| `coproducer/data/` | Runtime only | User state JSON, gitignored except `.gitkeep` |

Do not create or edit files outside your owned paths. If you need a change elsewhere (a new npm dependency, a contract fix), list it in your final report.

Node-side shared dependencies are already declared in `coproducer/package.json`: `ws`, `@anthropic-ai/sdk`, `dotenv`. Tests use the built-in `node:test` runner (`npm test` runs `node --test node/**/*.test.js` from `coproducer/`). Everything under `coproducer/node/` is plain CommonJS JavaScript (`require`), Node 18+ compatible, because Node for Max embeds its own Node runtime. The UI is the only place with a build step.

---

## 2. Transport A: UI (jweb) to Node, WebSocket

- URL: `ws://127.0.0.1:7400`. Port comes from `COPRODUCER_WS_PORT` in `.env`, default 7400. Node hosts the server; the UI is the client and reconnects with backoff.
- Every frame is one JSON object:

```json
{ "v": 1, "id": "m_17", "type": "domain.action", "payload": {} }
```

- `id` is set by the sender of a request and echoed back on the matching response so the UI can correlate. Server-initiated pushes use their own fresh `id`.
- On failure of any request, Node replies `{ "v": 1, "id": "<same id>", "type": "error", "payload": { "code": "string", "message": "string" } }`. Error codes: `lom_unavailable`, `lom_timeout`, `engine_error`, `llm_unavailable`, `bad_request`, `internal`.

### Requests (UI to Node) and their responses

| Request `type` | Request `payload` | Response `type` | Response `payload` |
|---|---|---|---|
| `session.refresh` | `{}` | `session.state` | `{ snapshot: SessionSnapshot }` |
| `suggest.request` | `{ question: string, genre: "deftones"\|"nin"\|"pop-punk", kind?: "chord-progression"\|"structure"\|"production", context?: { trackIndex?: number, clipPath?: string } }` | `suggest.result` | `{ suggestion: Suggestion }` |
| `suggest.commit` | `{ suggestionId: string, trackIndex?: number, sceneIndex?: number }` | `suggest.committed` | `{ clipPath: string, trackIndex: number, sceneIndex: number }` |
| `game.get` | `{}` | `game.state` | `{ game: GameState }` |
| `lesson.list` | `{}` | `lesson.catalog` | `{ lessons: Lesson[] }` |
| `lesson.complete` | `{ lessonId: string }` | `game.state` | `{ game: GameState }` |
| `milestone.set` | `{ songId: string, milestone: Milestone }` | `game.state` | `{ game: GameState }` |

### Pushes (Node to UI, no request)

| Push `type` | `payload` | When |
|---|---|---|
| `game.state` | `{ game: GameState }` | After any XP, streak, or milestone change |
| `lesson.unlocked` | `{ lesson: Lesson }` | When a milestone or event unlocks a lesson |
| `session.state` | `{ snapshot: SessionSnapshot }` | On device load and after a committed clip write |

The UI must also run without a live socket: if the connection fails, switch to a visible "mock mode" backed by fixture data shaped exactly like these payloads, so the UI can be developed and demoed outside Live.

---

## 3. Transport B: Node to Max to LOM

Node for Max cannot call LiveAPI directly. All LOM access lives in `device/lom-bridge.js`, running in a Max `js` object (ES5 only, no `let`, `const`, arrow functions, or template literals). `node/main.js` talks to it through the node.script outlet and inlet.

Wire format: two-element Max messages `[cmd, jsonString]`.

Node to Max (via `Max.outlet(cmd, jsonString)`):

| `cmd` | JSON payload |
|---|---|
| `lom_get_session` | `{ reqId }` |
| `lom_create_clip` | `{ reqId, trackIndex, sceneIndex, lengthBeats }` |
| `lom_set_notes` | `{ reqId, clipPath, notes: NoteEvent[] }` |
| `lom_get_notes` | `{ reqId, clipPath }` |
| `lom_roundtrip_test` | `{ reqId }` (writes 4 known notes to a scratch clip, reads them back, compares timing; see SPEC Section 5 risk 2) |

Max to Node (via `Max.addHandler("lom_result", ...)`):

| `cmd` | JSON payload |
|---|---|
| `lom_result` | `{ reqId, ok: true, data: object }` or `{ reqId, ok: false, error: string }` |

`node/lom/` wraps this in promises keyed by `reqId` with a 5 second timeout (reject with code `lom_timeout`). Data for `lom_get_session` is a `SessionSnapshot`. Data for `lom_create_clip` is `{ clipPath, trackIndex, sceneIndex }`. Data for `lom_get_notes` is `{ notes: NoteEvent[] }`.

LOM specifics the bridge targets: Live 11+ note API (`add_new_notes` with note dictionaries, `get_notes_extended`), clip paths like `live_set tracks N clip_slots M clip`.

---

## 4. Shared data shapes

### NoteEvent

```json
{ "pitch": 60, "startBeats": 0.0, "durationBeats": 1.0, "velocity": 96, "muted": false }
```

`pitch` 0 to 127 (60 is middle C), `startBeats` is a float offset from clip start in beats, `velocity` 1 to 127. Maps to the Live 11 note dictionary `{ pitch, start_time, duration, velocity, mute }`.

### SessionSnapshot

```json
{
  "tempo": 120.0,
  "timeSignature": { "numerator": 4, "denominator": 4 },
  "isPlaying": false,
  "setName": "Untitled",
  "tracks": [
    {
      "index": 0,
      "name": "Guitar",
      "isMidi": true,
      "clips": [
        { "sceneIndex": 0, "name": "verse", "lengthBeats": 16, "noteCount": 24, "clipPath": "live_set tracks 0 clip_slots 0 clip" }
      ]
    }
  ],
  "selected": { "trackIndex": 0, "sceneIndex": 0 }
}
```

`setName` doubles as the `songId` for milestones.

### Suggestion

```json
{
  "id": "sug_1712345678_1",
  "kind": "chord-progression",
  "genre": "deftones",
  "summary": "Try i to bVI to iv to v in Bb minor for the chorus lift",
  "detail": "Two to four sentences of concrete guidance in plain language.",
  "theory": "One sentence on why this works, used as lesson fodder.",
  "clip": {
    "lengthBeats": 16,
    "suggestedTrackIndex": 0,
    "notes": []
  },
  "source": "rules"
}
```

`kind` is one of `chord-progression`, `structure`, `production`. `clip` is `null` for suggestions with nothing to audition (most `production` and some `structure` suggestions). `notes` is a `NoteEvent[]`. `source` is `rules` or `claude`. The engine keeps the last 20 suggestions in memory so `suggest.commit` can find them by id.

### Style pack (summary; full schema in `packs/SCHEMA.md`)

Exactly the shape in SPEC Section 3: `genre`, `tempoRange`, `commonKeys`, `chordVocabulary`, `progressionTemplates` (each `{ name, roman }` with roman numerals like `i`, `bVI`, `IV`, `v7`), `songStructures` (each `{ name, sections }`), `productionNotes`. Packs encode idiomatic patterns only, never transcriptions of real songs. State that in `SCHEMA.md`.

### GameState

```json
{
  "xp": 0,
  "level": 1,
  "streak": { "count": 0, "lastActiveDate": "2026-08-03" },
  "lessonsCompleted": [],
  "songs": {
    "Untitled": { "milestones": { "verse": false, "chorus": false, "bridge": false, "arrangement": false, "mix": false, "export": false } }
  }
}
```

`Milestone` is one of `verse`, `chorus`, `bridge`, `arrangement`, `mix`, `export`. Dates are local `YYYY-MM-DD`. Persisted at `coproducer/data/state.json` with atomic writes (write temp file, rename).

### Lesson

```json
{
  "id": "chorus-lift",
  "title": "What makes a chorus feel bigger",
  "body": "Plain-language lesson text, 60 to 90 seconds of reading.",
  "xp": 20,
  "unlock": { "type": "milestone", "milestone": "verse" }
}
```

`unlock.type` is `milestone` (fires when that milestone is set on any song), `always` (available from the start), or `suggestion` (fires the first time a suggestion of `unlock.kind` is committed).

---

## 5. Node module contracts (so main.js can wire everything)

All CommonJS. `main.js` requires these and must not reach into their internals.

### `node/engine/index.js` (Genre/AI agent)

```js
const { createEngine } = require("./engine");
const engine = createEngine({ packsDir: "/abs/path/to/packs" });
// returns Promise<Suggestion>. Never throws for missing API key; falls back to rules.
engine.suggest({ question, genre, kind, context }, sessionSnapshot);
// returns Suggestion | null from the in-memory recents buffer
engine.getSuggestion(suggestionId);
// returns string[] of available genres discovered from packsDir
engine.listGenres();
```

Claude API details (from the current Anthropic docs, do not trust older training priors): npm package `@anthropic-ai/sdk`, model `claude-opus-5`, key from `ANTHROPIC_API_KEY` loaded via dotenv from `coproducer/.env`. Use `client.beta.messages.create` with `betas: ["server-side-fallback-2026-07-01"]`, `fallbacks: "default"`, `max_tokens: 8000`, and structured output via `output_config: { format: { type: "json_schema", schema } }` so the model returns a Suggestion-shaped JSON body (schema objects need `additionalProperties: false` and `required`). Do not pass `temperature` or a `thinking` config (thinking is on by default for this model and sampling params are rejected). Check `response.stop_reason === "refusal"` before reading content and fall back to the rules layer on refusal or any API error. The system prompt embeds the selected style pack JSON verbatim as ground truth plus 1 or 2 rule-based candidate progressions, and instructs: stay inside the pack's vocabulary, never reproduce a real song's specific riff or melody.

### `node/game/index.js` (Gamification agent)

```js
const { createGame } = require("./game");
const game = createGame({ dataDir: "/abs/path/to/data", lessonsDir: "/abs/path/to/lessons" });
game.getState();                          // GameState (also ticks the streak for today)
game.listLessons();                       // Lesson[] with an added boolean `unlocked` and `completed` per lesson
game.completeLesson(lessonId);            // GameState, throws Error("locked") or Error("unknown_lesson")
game.setMilestone(songId, milestone);     // GameState, grants XP once per song+milestone
game.recordEvent(evt);                    // evt: { type: "suggestion-committed", kind, genre } | { type: "session-open" }
game.onChange(cb);                        // cb(gameState) after any state change
game.onLessonUnlocked(cb);                // cb(lesson) when an unlock triggers
```

XP values: milestones 100 each (arrangement 150, export 200), lessons as authored (default 20), first task of the day 10. Level: `level = Math.floor(Math.sqrt(xp / 100)) + 1`.

### `node/lom/index.js` (M4L/LOM agent)

```js
const { createLom } = require("./lom");
const lom = createLom(maxApi); // maxApi is the max-api module inside Node for Max, or a stub in tests
lom.getSession();                                  // Promise<SessionSnapshot>
lom.createClip(trackIndex, sceneIndex, lengthBeats); // Promise<{ clipPath, trackIndex, sceneIndex }>
lom.setNotes(clipPath, notes);                     // Promise<void>
lom.getNotes(clipPath);                            // Promise<NoteEvent[]>
lom.roundtripTest();                               // Promise<{ ok, written, read }>
```

`main.js` wires: WebSocket requests to engine, game, and lom per the Section 2 table; `suggest.commit` = `engine.getSuggestion` then `lom.createClip` then `lom.setNotes` then `game.recordEvent({ type: "suggestion-committed", ... })` then push fresh `session.state`. When required modules are missing at runtime (partial build), main.js logs a clear warning and serves `error` frames with code `internal` rather than crashing.

---

## 6. Testing expectations

- Everything testable without Ableton Live gets a `*.test.js` beside it using `node:test` (roman numeral to MIDI conversion, game state transitions, streak day math, engine fallback path with the Claude client stubbed, WebSocket message routing with a stubbed max-api).
- The LOM bridge itself cannot run in CI. It ships with `lom_roundtrip_test` wired to a button in the device plus a `device/BUILD.md` checklist for validating inside Live (SPEC build order steps 1 to 3).
- Mock mode in the UI counts as its test surface, plus fixtures matching the shapes here byte for byte.
