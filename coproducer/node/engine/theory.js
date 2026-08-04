"use strict";

// Music theory helpers for the CoProducer suggestion engine.
// Pure functions only, no I/O. See packs/SCHEMA.md for the roman numeral
// syntax these functions implement, and docs/CONTRACT.md for the NoteEvent
// shape produced by progressionToNotes.

// Pitch classes, C = 0.
const NOTE_PITCH_CLASS = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const MODES = ["major", "minor", "phrygian"];

// Scale degree intervals relative to the tonic, indexed on the major scale.
// Roman numerals in packs are major-scale relative with an explicit b prefix
// for borrowed flats (bIII, bVI, bVII, bII), whatever the key's mode.
const DEGREE_SEMITONES = {
  i: 0,
  ii: 2,
  iii: 4,
  iv: 5,
  v: 7,
  vi: 9,
  vii: 11,
};

// Longest first so "iii" wins over "ii" and "ii" over "i" when matching.
const NUMERALS_BY_LENGTH = ["iii", "vii", "ii", "iv", "vi", "i", "v"];

// Suffix name to chord tone intervals (semitones above the chord root).
// null entries mean "triad from case plus the listed extensions".
const SUFFIXES = {
  "": { fixed: null, extensions: [] },
  "5": { fixed: [0, 7, 12], extensions: [] },
  sus2: { fixed: [0, 2, 7], extensions: [] },
  sus4: { fixed: [0, 5, 7], extensions: [] },
  add9: { fixed: null, extensions: [14] },
  "7": { fixed: null, extensions: [10] },
  min7: { fixed: [0, 3, 7, 10], extensions: [] },
  maj7: { fixed: null, extensions: [11] },
  "maj7#11": { fixed: [0, 4, 7, 11, 18], extensions: [] },
};

const MAJOR_TRIAD = [0, 4, 7];
const MINOR_TRIAD = [0, 3, 7];

const DEFAULT_VELOCITY = 96;
const ROOT_FLOOR = 48; // roots land in MIDI 48 to 59

/**
 * Parse a key string like "Bb minor", "E major", or "E phrygian".
 * Returns { tonic, tonicPc, mode }. Throws on anything unparseable.
 */
function parseKey(str) {
  if (typeof str !== "string") {
    throw new Error("parseKey: key must be a string, got " + typeof str);
  }
  const match = str.trim().match(/^([A-Ga-g])([#b]?)\s+(major|minor|phrygian)$/i);
  if (!match) {
    throw new Error(
      'parseKey: cannot parse "' + str + '". Expected e.g. "Bb minor" or "E major".'
    );
  }
  const letter = match[1].toUpperCase();
  const accidental = match[2];
  const mode = match[3].toLowerCase();
  if (!MODES.includes(mode)) {
    throw new Error('parseKey: unknown mode "' + mode + '"');
  }
  let pc = NOTE_PITCH_CLASS[letter];
  if (accidental === "#") pc += 1;
  if (accidental === "b") pc -= 1;
  pc = ((pc % 12) + 12) % 12;
  return { tonic: letter + accidental, tonicPc: pc, mode };
}

/**
 * Split a roman numeral token like "bVImaj7#11" into its parts.
 * Returns { flat, numeral, isMajorCase, suffix }. Throws on invalid tokens.
 */
function parseRoman(token) {
  if (typeof token !== "string" || token.length === 0) {
    throw new Error("parseRoman: token must be a non-empty string");
  }
  let rest = token;
  let flat = false;
  if (rest[0] === "b") {
    flat = true;
    rest = rest.slice(1);
  }
  let numeral = null;
  for (const n of NUMERALS_BY_LENGTH) {
    const upper = n.toUpperCase();
    if (rest.startsWith(upper)) {
      numeral = { name: n, isMajorCase: true };
      rest = rest.slice(upper.length);
      break;
    }
    if (rest.startsWith(n)) {
      numeral = { name: n, isMajorCase: false };
      rest = rest.slice(n.length);
      break;
    }
  }
  if (!numeral) {
    throw new Error('parseRoman: no roman numeral at the start of "' + token + '"');
  }
  if (!(rest in SUFFIXES)) {
    throw new Error('parseRoman: unknown suffix "' + rest + '" in "' + token + '"');
  }
  return {
    flat,
    numeral: numeral.name,
    isMajorCase: numeral.isMajorCase,
    suffix: rest,
  };
}

/**
 * Resolve one roman numeral in a key to a concrete chord.
 * key may be a key string ("Bb minor") or the object from parseKey.
 * Returns { roman, rootPc, rootMidi, intervals, pitches }.
 * pitches are block chord MIDI notes with the root in 48 to 59.
 */
function chordFromRoman(key, roman) {
  const k = typeof key === "string" ? parseKey(key) : key;
  const parsed = parseRoman(roman);
  let rootPc = (k.tonicPc + DEGREE_SEMITONES[parsed.numeral]) % 12;
  if (parsed.flat) rootPc = (rootPc + 11) % 12;

  const spec = SUFFIXES[parsed.suffix];
  let intervals;
  if (spec.fixed) {
    intervals = spec.fixed.slice();
  } else {
    const triad = parsed.isMajorCase ? MAJOR_TRIAD : MINOR_TRIAD;
    intervals = triad.concat(spec.extensions);
  }

  const rootMidi = ROOT_FLOOR + rootPc;
  const pitches = intervals.map(function (semi) {
    return rootMidi + semi;
  });

  return {
    roman: roman,
    rootPc: rootPc,
    rootMidi: rootMidi,
    intervals: intervals,
    pitches: pitches,
  };
}

/**
 * Render a progression of roman numerals as block chord NoteEvents.
 * Each chord holds for beatsPerChord beats (default 4), velocity 96, unmuted.
 * Returns NoteEvent[] per the CONTRACT shape.
 */
function progressionToNotes(key, romans, beatsPerChord) {
  const beats = typeof beatsPerChord === "number" && beatsPerChord > 0 ? beatsPerChord : 4;
  if (!Array.isArray(romans) || romans.length === 0) {
    throw new Error("progressionToNotes: romans must be a non-empty array");
  }
  const k = typeof key === "string" ? parseKey(key) : key;
  const notes = [];
  romans.forEach(function (roman, index) {
    const chord = chordFromRoman(k, roman);
    chord.pitches.forEach(function (pitch) {
      notes.push({
        pitch: pitch,
        startBeats: index * beats,
        durationBeats: beats,
        velocity: DEFAULT_VELOCITY,
        muted: false,
      });
    });
  });
  return notes;
}

module.exports = {
  parseKey,
  parseRoman,
  chordFromRoman,
  progressionToNotes,
};
