"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { buildRulesSuggestion, inferKind, KINDS } = require("./rules");
const { chordFromRoman } = require("./theory");

const PACKS_DIR = path.join(__dirname, "..", "..", "packs");
const GENRES = ["deftones", "nin", "pop-punk"];

function loadPack(genre) {
  return JSON.parse(fs.readFileSync(path.join(PACKS_DIR, genre + ".json"), "utf8"));
}

const snapshot = {
  tempo: 92.0,
  timeSignature: { numerator: 4, denominator: 4 },
  isPlaying: false,
  setName: "Untitled",
  tracks: [
    {
      index: 0,
      name: "Guitar",
      isMidi: true,
      clips: [
        {
          sceneIndex: 0,
          name: "verse",
          lengthBeats: 16,
          noteCount: 24,
          clipPath: "live_set tracks 0 clip_slots 0 clip",
        },
      ],
    },
  ],
  selected: { trackIndex: 0, sceneIndex: 0 },
};

function assertValidSuggestion(s, pack, expectedKind) {
  assert.equal(typeof s.id, "string");
  assert.ok(s.id.startsWith("sug_"), "id should start with sug_, got " + s.id);
  assert.equal(s.kind, expectedKind);
  assert.equal(s.genre, pack.genre);
  assert.equal(s.source, "rules");
  for (const field of ["summary", "detail", "theory"]) {
    assert.equal(typeof s[field], "string");
    assert.ok(s[field].trim().length > 0, field + " must be non-empty");
    assert.ok(!s[field].includes("\u2014"), field + " must not contain em dashes");
  }

  if (expectedKind === "chord-progression") {
    assert.ok(s.clip, "chord-progression suggestions must carry a clip");
    assert.ok(s.clip.lengthBeats > 0);
    assert.ok(Number.isInteger(s.clip.suggestedTrackIndex));
    assert.ok(Array.isArray(s.clip.notes) && s.clip.notes.length > 0);
    let maxEnd = 0;
    for (const n of s.clip.notes) {
      assert.ok(Number.isInteger(n.pitch) && n.pitch >= 0 && n.pitch <= 127);
      assert.ok(Number.isInteger(n.velocity) && n.velocity >= 1 && n.velocity <= 127);
      assert.ok(n.startBeats >= 0);
      assert.ok(n.durationBeats > 0);
      assert.equal(n.muted, false);
      maxEnd = Math.max(maxEnd, n.startBeats + n.durationBeats);
    }
    assert.equal(s.clip.lengthBeats, maxEnd, "lengthBeats must match the last note end");
  } else {
    assert.equal(s.clip, null, expectedKind + " suggestions should have a null clip");
  }
}

for (const genre of GENRES) {
  test("every progression template in " + genre + " parses against every common key", function () {
    const pack = loadPack(genre);
    for (const key of pack.commonKeys) {
      for (const template of pack.progressionTemplates) {
        for (const roman of template.roman) {
          const chord = chordFromRoman(key, roman);
          for (const pitch of chord.pitches) {
            assert.ok(pitch >= 0 && pitch <= 127);
          }
        }
      }
    }
  });

  for (const kind of KINDS) {
    test(genre + " produces a valid " + kind + " suggestion", function () {
      const pack = loadPack(genre);
      const s = buildRulesSuggestion(
        { question: "I have a verse going, what should I do next?", genre: genre, kind: kind, context: {} },
        snapshot,
        pack
      );
      assertValidSuggestion(s, pack, kind);
    });
  }
}

test("kind inference from question keywords", function () {
  assert.equal(inferKind("I have a verse chord progression, need a chorus"), "chord-progression");
  assert.equal(inferKind("what order should the sections go in?"), "structure");
  assert.equal(inferKind("how should the drums sound in the verse?"), "production");
  assert.equal(inferKind("help"), "chord-progression"); // default
  assert.equal(inferKind("anything", "production"), "production"); // explicit kind wins
});

test("a chorus question picks a chorus-flavored template when one exists", function () {
  const pack = loadPack("deftones");
  const s = buildRulesSuggestion(
    { question: "I need a chorus", genre: "deftones" },
    snapshot,
    pack
  );
  assert.equal(s.kind, "chord-progression");
  assert.ok(s.summary.includes("for the chorus"), "summary was: " + s.summary);

  // The rendered progression must come from a chorus template, not from a
  // prechorus one matched by substring.
  const chorusTemplates = pack.progressionTemplates.filter(function (t) {
    return t.name.split("-").includes("chorus");
  });
  const matchesOne = chorusTemplates.some(function (t) {
    return s.summary.includes(t.roman.join(" to "));
  });
  assert.ok(matchesOne, "summary should use a chorus template: " + s.summary);
});

test("suggestedTrackIndex respects context, then snapshot, then 0", function () {
  const pack = loadPack("pop-punk");
  const withContext = buildRulesSuggestion(
    { question: "need a chorus", genre: "pop-punk", context: { trackIndex: 3 } },
    snapshot,
    pack
  );
  assert.equal(withContext.clip.suggestedTrackIndex, 3);

  const fromSnapshot = buildRulesSuggestion(
    { question: "need a chorus", genre: "pop-punk" },
    snapshot,
    pack
  );
  assert.equal(fromSnapshot.clip.suggestedTrackIndex, 0);

  const bare = buildRulesSuggestion(
    { question: "need a chorus", genre: "pop-punk" },
    undefined,
    pack
  );
  assert.equal(bare.clip.suggestedTrackIndex, 0);
});
