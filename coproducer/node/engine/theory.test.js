"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { parseKey, chordFromRoman, progressionToNotes } = require("./theory");

test("parseKey handles flats, sharps, and modes", function () {
  assert.deepEqual(parseKey("Bb minor"), { tonic: "Bb", tonicPc: 10, mode: "minor" });
  assert.deepEqual(parseKey("E major"), { tonic: "E", tonicPc: 4, mode: "major" });
  assert.deepEqual(parseKey("E phrygian"), { tonic: "E", tonicPc: 4, mode: "phrygian" });
  assert.equal(parseKey("F# minor").tonicPc, 6);
  assert.equal(parseKey("  d minor ").tonicPc, 2);
});

test("parseKey rejects garbage", function () {
  assert.throws(function () { parseKey("H minor"); });
  assert.throws(function () { parseKey("Bb"); });
  assert.throws(function () { parseKey("Bb dorian"); });
  assert.throws(function () { parseKey(42); });
});

test("chordFromRoman: i in Bb minor is a Bb minor triad", function () {
  const chord = chordFromRoman("Bb minor", "i");
  assert.equal(chord.rootPc, 10);
  assert.deepEqual(chord.pitches, [58, 61, 65]); // Bb, Db, F
});

test("chordFromRoman: bVI in Bb minor is Gb major (borrowed flat)", function () {
  const chord = chordFromRoman("Bb minor", "bVI");
  assert.equal(chord.rootPc, 6);
  assert.deepEqual(chord.pitches, [54, 58, 61]); // Gb, Bb, Db
});

test("chordFromRoman: IV in E major is A major", function () {
  const chord = chordFromRoman("E major", "IV");
  assert.equal(chord.rootPc, 9);
  assert.deepEqual(chord.pitches, [57, 61, 64]); // A, C#, E
});

test("chordFromRoman: v in Bb minor is F minor", function () {
  const chord = chordFromRoman("Bb minor", "v");
  assert.equal(chord.rootPc, 5);
  assert.deepEqual(chord.pitches, [53, 56, 60]); // F, Ab, C
});

test("chordFromRoman: imin7 in Bb minor adds the minor seventh", function () {
  const chord = chordFromRoman("Bb minor", "imin7");
  assert.deepEqual(chord.pitches, [58, 61, 65, 68]); // Bb, Db, F, Ab
});

test("chordFromRoman: I5 in E major is a power chord (root, fifth, octave)", function () {
  const chord = chordFromRoman("E major", "I5");
  assert.deepEqual(chord.pitches, [52, 59, 64]); // E, B, E
});

test("chordFromRoman: bVImaj7#11 and bII parse and resolve", function () {
  const lush = chordFromRoman("Bb minor", "bVImaj7#11");
  assert.deepEqual(lush.intervals, [0, 4, 7, 11, 18]);
  const phrygian = chordFromRoman("E phrygian", "bII");
  assert.equal(phrygian.rootPc, 5); // F major, a half step above E
});

test("chordFromRoman rejects invalid tokens", function () {
  assert.throws(function () { chordFromRoman("Bb minor", "viii"); });
  assert.throws(function () { chordFromRoman("Bb minor", "Ix"); });
  assert.throws(function () { chordFromRoman("Bb minor", ""); });
  assert.throws(function () { chordFromRoman("Bb minor", "iMin7x"); });
});

test("progressionToNotes produces correctly timed block chord NoteEvents", function () {
  const notes = progressionToNotes("Bb minor", ["i", "bVI"], 4);
  assert.equal(notes.length, 6); // two triads

  const first = notes.slice(0, 3);
  const second = notes.slice(3);
  for (const n of first) assert.equal(n.startBeats, 0);
  for (const n of second) assert.equal(n.startBeats, 4);
  for (const n of notes) {
    assert.equal(n.durationBeats, 4);
    assert.equal(n.velocity, 96);
    assert.equal(n.muted, false);
    assert.ok(Number.isInteger(n.pitch) && n.pitch >= 0 && n.pitch <= 127);
  }
  assert.deepEqual(first.map(function (n) { return n.pitch; }), [58, 61, 65]);
  assert.deepEqual(second.map(function (n) { return n.pitch; }), [54, 58, 61]);
});

test("progressionToNotes defaults to 4 beats per chord and validates input", function () {
  const notes = progressionToNotes("E major", ["I5"]);
  assert.equal(notes[0].durationBeats, 4);
  assert.throws(function () { progressionToNotes("E major", []); });
  assert.throws(function () { progressionToNotes("E major", "I V vi IV"); });
});
