"use strict";

// Rule-based suggestion layer. Given a request, a SessionSnapshot, and a
// loaded style pack, build a complete Suggestion (docs/CONTRACT.md Section 4)
// without touching the network. This is both the offline fallback and the
// anchor material the Claude layer is grounded on.

const { progressionToNotes, parseRoman } = require("./theory");

const KINDS = ["chord-progression", "structure", "production"];

let idCounter = 0;
function makeSuggestionId() {
  idCounter += 1;
  return "sug_" + Date.now() + "_" + idCounter;
}

// Small deterministic hash so the same question always picks the same
// template and key (stable for tests), while different questions vary.
function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

const PRODUCTION_WORDS = [
  "mix",
  "mixing",
  "production",
  "produce",
  "reverb",
  "delay",
  "distortion",
  "tone",
  "texture",
  "sound design",
  "drum sound",
  "drums sound",
  "vocal sound",
  "eq",
  "compress",
  "layer",
  "layering",
];

const STRUCTURE_WORDS = [
  "structure",
  "arrangement",
  "arrange",
  "section",
  "sections",
  "song map",
  "what comes next",
  "what should come next",
  "next part",
  "order of",
  "how long",
];

// "prechorus" before "chorus" because "chorus" is a substring of it.
const SECTION_WORDS = ["prechorus", "chorus", "verse", "bridge", "intro", "outro"];

/**
 * Resolve the suggestion kind. An explicit valid kind wins, otherwise the
 * question text is scanned: production words, then structure words, then
 * section words (chorus, verse, bridge) imply a chord progression, which is
 * also the default.
 */
function inferKind(question, kind) {
  if (KINDS.includes(kind)) return kind;
  const q = String(question || "").toLowerCase();
  if (PRODUCTION_WORDS.some(function (w) { return q.includes(w); })) {
    return "production";
  }
  if (STRUCTURE_WORDS.some(function (w) { return q.includes(w); })) {
    return "structure";
  }
  return "chord-progression";
}

function findSectionWord(question) {
  const q = String(question || "").toLowerCase();
  for (const word of SECTION_WORDS) {
    if (q.includes(word)) return word;
  }
  return null;
}

function pickFrom(list, seedString) {
  return list[hashString(seedString) % list.length];
}

function pickKey(pack, question) {
  return pickFrom(pack.commonKeys, "key:" + pack.genre + ":" + question);
}

function pickProgressionTemplate(pack, question) {
  const section = findSectionWord(question);
  if (section) {
    // Token match on the kebab-case name so a "chorus" question does not
    // also match "prechorus-climb" by substring.
    const matching = pack.progressionTemplates.filter(function (t) {
      return t.name.toLowerCase().split("-").includes(section);
    });
    if (matching.length > 0) {
      return pickFrom(matching, "tpl:" + pack.genre + ":" + question);
    }
  }
  return pickFrom(pack.progressionTemplates, "tpl:" + pack.genre + ":" + question);
}

function romanListToText(romans) {
  return romans.join(" to ");
}

/**
 * One real sentence of music theory about a progression, derived from what
 * is actually in it. Used as the Suggestion.theory field and lesson fodder.
 */
function theoryForProgression(keyString, romans) {
  const parsed = romans.map(parseRoman);
  const flats = parsed.filter(function (p) { return p.flat; });
  const hasFlatTwo = flats.some(function (p) { return p.numeral === "ii"; });
  const suspended = parsed.some(function (p) {
    return p.suffix === "sus2" || p.suffix === "sus4" || p.suffix === "add9" || p.suffix === "maj7#11";
  });
  const allPower = parsed.every(function (p) { return p.suffix === "5"; });

  if (hasFlatTwo) {
    return "bII sits a half step above the tonic, the classic phrygian move, so it creates maximum pull back to i.";
  }
  if (allPower) {
    return "Power chords have no third, so the progression reads as major or minor only through the melody you put on top.";
  }
  if (suspended) {
    return "Sus and add chords blur or decorate the third, so the harmony floats instead of resolving, which is where the tension lives.";
  }
  if (flats.length > 0) {
    const names = flats.map(function (p) {
      return "b" + p.numeral.toUpperCase();
    });
    const unique = names.filter(function (n, i) { return names.indexOf(n) === i; });
    if (unique.length === 1) {
      return unique[0] + " comes straight from the natural minor scale, so it adds weight and color without ever leaving the key.";
    }
    const joined = unique.length === 2
      ? unique[0] + " and " + unique[1]
      : unique.slice(0, -1).join(", ") + ", and " + unique[unique.length - 1];
    return joined + " come straight from the natural minor scale, so they add weight and color without ever leaving the key.";
  }
  return "Every chord here is diatonic to " + keyString + ", so the loop resolves cleanly back to the tonic and repeats without friction.";
}

function suggestedTrackIndex(context, snapshot) {
  if (context && typeof context.trackIndex === "number") return context.trackIndex;
  if (snapshot && snapshot.selected && typeof snapshot.selected.trackIndex === "number") {
    return snapshot.selected.trackIndex;
  }
  return 0;
}

function buildChordProgressionSuggestion(request, snapshot, pack) {
  const question = String(request.question || "");
  const key = pickKey(pack, question);
  const template = pickProgressionTemplate(pack, question);
  const section = findSectionWord(question);
  const beatsPerChord = 4;
  const notes = progressionToNotes(key, template.roman, beatsPerChord);
  const lengthBeats = template.roman.length * beatsPerChord;
  const target = section ? "the " + section : "this part";

  const summary =
    "Try " + romanListToText(template.roman) + " in " + key + " for " + target;
  const detail =
    'This is the "' + template.name + '" move from the ' + pack.genre + " pack: " +
    romanListToText(template.roman) + " in " + key + ", one chord per bar over " +
    lengthBeats + " beats. Audition it as block chords first, then split it into the parts your track needs. " +
    "This style sits in the " + pack.tempoRange[0] + " to " + pack.tempoRange[1] +
    " BPM pocket, so check your session tempo before you commit.";

  return {
    id: makeSuggestionId(),
    kind: "chord-progression",
    genre: pack.genre,
    summary: summary,
    detail: detail,
    theory: theoryForProgression(key, template.roman),
    clip: {
      lengthBeats: lengthBeats,
      suggestedTrackIndex: suggestedTrackIndex(request.context, snapshot),
      notes: notes,
    },
    source: "rules",
  };
}

function pickStructure(pack, question) {
  return pickFrom(pack.songStructures, "struct:" + pack.genre + ":" + question);
}

function buildStructureSuggestion(request, snapshot, pack) {
  const question = String(request.question || "");
  const structure = pickStructure(pack, question);
  const sections = structure.sections;
  const mentioned = findSectionWord(question);

  // If the user names a section that appears in the arc, point at what
  // follows it. Otherwise recommend the arc from the top.
  let move;
  let summary;
  if (mentioned) {
    const idx = sections.findIndex(function (s) {
      return s.toLowerCase().includes(mentioned);
    });
    if (idx >= 0 && idx < sections.length - 1) {
      const next = sections[idx + 1];
      summary =
        'After the ' + mentioned + ", go to " + next + ' (the "' + structure.name + '" arc)';
      move =
        "You are at the " + sections[idx] + " point of the arc. Build " + next +
        " next, and make the change obvious in the first bar: change the density, not the chords.";
    }
  }
  if (!move) {
    summary = 'Shape the song on the "' + structure.name + '" arc: ' + sections[0] + " into " + sections[1];
    move =
      "Lay the sections out in this order and rough in 8 bars each before polishing anything. " +
      "Sections earn their names through contrast, so decide what each one adds or removes before you write it.";
  }

  const detail =
    move + " Full map: " + sections.join(", ") + ". " +
    "Mark these as arrangement locators in Live now so every part you write has an address.";

  return {
    id: makeSuggestionId(),
    kind: "structure",
    genre: pack.genre,
    summary: summary,
    detail: detail,
    theory:
      "A section reads as new when one dimension changes while the others repeat, so keep the chords and change the density, or keep the density and change the chords.",
    clip: null,
    source: "rules",
  };
}

function buildProductionSuggestion(request, snapshot, pack) {
  const question = String(request.question || "");
  const notes = pack.productionNotes;
  const first = pickFrom(notes, "prod:" + pack.genre + ":" + question);
  const second = notes[(notes.indexOf(first) + 1) % notes.length];

  const firstSentence = first.split(". ")[0].replace(/\.$/, "");
  const summary = firstSentence;
  const detail =
    first + " Also worth trying: " + second.charAt(0).toLowerCase() + second.slice(1) +
    " Do one of these at a time and A/B against your current bounce so you can hear what it actually changed.";

  return {
    id: makeSuggestionId(),
    kind: "production",
    genre: pack.genre,
    summary: summary,
    detail: detail,
    theory:
      "Perceived size comes from contrast and arrangement density, not from level, so build the dynamic before you reach for a limiter.",
    clip: null,
    source: "rules",
  };
}

/**
 * Build a complete rules-based Suggestion for a request.
 * request: { question, genre, kind?, context? }, snapshot: SessionSnapshot
 * or undefined, pack: a loaded style pack object.
 */
function buildRulesSuggestion(request, snapshot, pack) {
  const kind = inferKind(request.question, request.kind);
  if (kind === "structure") return buildStructureSuggestion(request, snapshot, pack);
  if (kind === "production") return buildProductionSuggestion(request, snapshot, pack);
  return buildChordProgressionSuggestion(request, snapshot, pack);
}

module.exports = {
  KINDS,
  makeSuggestionId,
  inferKind,
  buildRulesSuggestion,
};
