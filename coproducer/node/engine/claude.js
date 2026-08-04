"use strict";

// LLM layer for the suggestion engine, per docs/CONTRACT.md Section 5.
// askClaude() returns a Suggestion-shaped object (without id and source,
// the engine stamps those) or null on refusal, API error, missing key, or
// invalid output. The rules layer is always the fallback, so this module
// never throws to its caller.

const KINDS = ["chord-progression", "structure", "production"];

// JSON schema mirroring the CONTRACT Suggestion shape minus id and source.
// json_schema output mode does not support numeric minimum/maximum, so the
// 0 to 127 pitch and 1 to 127 velocity ranges are validated in code below.
const NOTE_EVENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["pitch", "startBeats", "durationBeats", "velocity", "muted"],
  properties: {
    pitch: { type: "integer", description: "MIDI pitch, 0 to 127, 60 is middle C" },
    startBeats: { type: "number", description: "Offset from clip start in beats, non-negative" },
    durationBeats: { type: "number", description: "Duration in beats, greater than zero" },
    velocity: { type: "integer", description: "MIDI velocity, 1 to 127" },
    muted: { type: "boolean" },
  },
};

const SUGGESTION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["kind", "genre", "summary", "detail", "theory", "clip"],
  properties: {
    kind: { type: "string", enum: KINDS },
    genre: { type: "string" },
    summary: {
      type: "string",
      description: "One short line a producer would say, e.g. Try i to bVI to iv to v in Bb minor for the chorus",
    },
    detail: {
      type: "string",
      description: "Two to four sentences of concrete guidance in plain language",
    },
    theory: {
      type: "string",
      description: "One sentence of real music theory on why this works",
    },
    clip: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: ["lengthBeats", "suggestedTrackIndex", "notes"],
          properties: {
            lengthBeats: { type: "number" },
            suggestedTrackIndex: { type: "integer" },
            notes: { type: "array", items: NOTE_EVENT_SCHEMA },
          },
        },
      ],
    },
  },
};

let client = null;

// Construct the Anthropic client lazily, and only when an API key exists.
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) {
    const { Anthropic } = require("@anthropic-ai/sdk");
    client = new Anthropic();
  }
  return client;
}

function renderSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    return "No session data available.";
  }
  const lines = [];
  lines.push(
    "Set: " + (snapshot.setName || "Untitled") +
    " | Tempo: " + (snapshot.tempo != null ? snapshot.tempo + " BPM" : "unknown") +
    " | Time signature: " +
    (snapshot.timeSignature
      ? snapshot.timeSignature.numerator + "/" + snapshot.timeSignature.denominator
      : "unknown") +
    " | Playing: " + (snapshot.isPlaying ? "yes" : "no")
  );
  if (Array.isArray(snapshot.tracks)) {
    snapshot.tracks.forEach(function (t) {
      const clips = Array.isArray(t.clips)
        ? t.clips
            .map(function (c) {
              return (c.name || "clip") + " (scene " + c.sceneIndex + ", " +
                c.lengthBeats + " beats, " + c.noteCount + " notes)";
            })
            .join("; ")
        : "";
      lines.push(
        "Track " + t.index + ' "' + t.name + '" ' + (t.isMidi ? "[MIDI]" : "[audio]") +
        (clips ? ": " + clips : ": no clips")
      );
    });
  }
  if (snapshot.selected) {
    lines.push(
      "Selected: track " + snapshot.selected.trackIndex +
      ", scene " + snapshot.selected.sceneIndex
    );
  }
  return lines.join("\n");
}

function buildSystemPrompt(pack, anchors, snapshot) {
  const anchorList = (anchors || []).slice(0, 2).map(function (a) {
    // Strip engine bookkeeping so the model sees pure musical content.
    return {
      kind: a.kind,
      genre: a.genre,
      summary: a.summary,
      detail: a.detail,
      theory: a.theory,
      clip: a.clip,
    };
  });

  return [
    "You are CoProducer, a producer's assistant living inside Ableton Live. You help someone with limited musical knowledge finish tracks while actually learning. You answer with exactly one Suggestion JSON object matching the provided schema.",
    "",
    "STYLE PACK (ground truth for this genre, verbatim):",
    JSON.stringify(pack, null, 2),
    "",
    "RULE-BASED CANDIDATE SUGGESTIONS (anchors). These were generated from the pack and are known to be idiomatic. Stay in this musical territory. You may refine, re-voice, or pick a different template from the pack, but do not drift into generic writing that ignores the pack:",
    JSON.stringify(anchorList, null, 2),
    "",
    "CURRENT LIVE SESSION:",
    renderSnapshot(snapshot),
    "",
    "Rules:",
    "- Stay inside the pack's chordVocabulary, progressionTemplates, songStructures, and productionNotes. Recombining and re-voicing pack material is good. Inventing outside it is not.",
    "- Be concrete. Name chords, keys, bar counts, and specific moves. No hype, no filler, no hollow taglines. Write summary and detail the way a working producer talks.",
    "- theory is exactly one sentence of real music theory explaining why the suggestion works.",
    "- Never reproduce a real song's riff, melody, lyrics, or any note-for-note passage from an existing recording. Idiomatic patterns only.",
    "- For kind chord-progression, fill clip with block chord notes: MIDI pitch 0 to 127 with chord roots around 48 to 60, velocity 96, muted false, one chord per 4 beats unless the question implies otherwise, and lengthBeats equal to the end of the last note.",
    "- For kind structure and kind production, set clip to null unless there is genuinely something to audition.",
    "- Respect the session snapshot: reference the user's tempo and tracks when relevant, and keep suggestedTrackIndex pointing at a MIDI track if one is known.",
    "- Never use em dashes in any text you write. Use periods, commas, or parentheses. Write ranges as 80 to 100.",
  ].join("\n");
}

function isFiniteNumber(v) {
  return typeof v === "number" && isFinite(v);
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

// Validate the parsed model output against the contract shape and the
// numeric ranges the JSON schema cannot express.
function validateSuggestionShape(s) {
  if (!s || typeof s !== "object" || Array.isArray(s)) return false;
  if (!KINDS.includes(s.kind)) return false;
  if (!isNonEmptyString(s.genre)) return false;
  if (!isNonEmptyString(s.summary)) return false;
  if (!isNonEmptyString(s.detail)) return false;
  if (!isNonEmptyString(s.theory)) return false;
  if (s.clip === null || s.clip === undefined) return true;

  const clip = s.clip;
  if (typeof clip !== "object" || Array.isArray(clip)) return false;
  if (!isFiniteNumber(clip.lengthBeats) || clip.lengthBeats <= 0) return false;
  if (!Number.isInteger(clip.suggestedTrackIndex) || clip.suggestedTrackIndex < 0) return false;
  if (!Array.isArray(clip.notes)) return false;
  for (const note of clip.notes) {
    if (!note || typeof note !== "object") return false;
    if (!Number.isInteger(note.pitch) || note.pitch < 0 || note.pitch > 127) return false;
    if (!Number.isInteger(note.velocity) || note.velocity < 1 || note.velocity > 127) return false;
    if (!isFiniteNumber(note.startBeats) || note.startBeats < 0) return false;
    if (!isFiniteNumber(note.durationBeats) || note.durationBeats <= 0) return false;
    if (typeof note.muted !== "boolean") return false;
  }
  return true;
}

/**
 * Ask Claude for a Suggestion grounded on the style pack and anchors.
 * params: { question, genre, kind, pack, snapshot, anchors }
 * Resolves to a Suggestion-shaped object without id and source, or null.
 */
async function askClaude(params) {
  const api = getClient();
  if (!api) return null;

  try {
    const userLines = [
      "Genre: " + params.genre,
      params.kind ? "Requested suggestion kind: " + params.kind : "Suggestion kind: infer from the question",
      "Where I am stuck: " + params.question,
    ];
    const response = await api.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 8000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        format: { type: "json_schema", schema: SUGGESTION_JSON_SCHEMA },
      },
      system: buildSystemPrompt(params.pack, params.anchors, params.snapshot),
      messages: [{ role: "user", content: userLines.join("\n") }],
    });

    if (response.stop_reason === "refusal") return null;

    const textBlock = (response.content || []).find(function (b) {
      return b.type === "text";
    });
    if (!textBlock || !textBlock.text) return null;

    const parsed = JSON.parse(textBlock.text);
    if (!validateSuggestionShape(parsed)) return null;
    return parsed;
  } catch (err) {
    // Any thrown error (typed SDK errors, network failures, bad JSON) means
    // fall back to the rules layer. Catch broadly on purpose.
    return null;
  }
}

module.exports = {
  askClaude,
  validateSuggestionShape,
  buildSystemPrompt,
  renderSnapshot,
  SUGGESTION_JSON_SCHEMA,
};
