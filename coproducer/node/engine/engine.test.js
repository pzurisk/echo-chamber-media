"use strict";

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const { createEngine } = require("./index");

const PACKS_DIR = path.join(__dirname, "..", "..", "packs");

// The engine tests must never hit the network. The default Claude layer
// self-gates on ANTHROPIC_API_KEY, so make sure it is unset for this file.
let savedApiKey;
before(function () {
  savedApiKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
});
after(function () {
  if (savedApiKey !== undefined) process.env.ANTHROPIC_API_KEY = savedApiKey;
});

const snapshot = {
  tempo: 120.0,
  timeSignature: { numerator: 4, denominator: 4 },
  isPlaying: false,
  setName: "Untitled",
  tracks: [{ index: 0, name: "Synth", isMidi: true, clips: [] }],
  selected: { trackIndex: 0, sceneIndex: 0 },
};

test("listGenres discovers the three shipped packs", function () {
  const engine = createEngine({ packsDir: PACKS_DIR });
  assert.deepEqual(engine.listGenres(), ["deftones", "nin", "pop-punk"]);
});

test("with no API key, suggest falls back to a valid rules suggestion", async function () {
  const engine = createEngine({ packsDir: PACKS_DIR });
  const s = await engine.suggest(
    { question: "I have a verse chord progression, need a chorus", genre: "deftones" },
    snapshot
  );
  assert.equal(s.source, "rules");
  assert.equal(s.kind, "chord-progression");
  assert.equal(s.genre, "deftones");
  assert.ok(s.clip && s.clip.notes.length > 0);
});

test("suggest works without a session snapshot", async function () {
  const engine = createEngine({ packsDir: PACKS_DIR });
  const s = await engine.suggest({ question: "need a chorus", genre: "nin" });
  assert.equal(s.source, "rules");
});

test("recents buffer serves getSuggestion and caps at 20", async function () {
  const engine = createEngine({ packsDir: PACKS_DIR });
  const first = await engine.suggest({ question: "seed question", genre: "pop-punk" }, snapshot);
  assert.equal(engine.getSuggestion(first.id), first);

  let last;
  for (let i = 0; i < 20; i++) {
    last = await engine.suggest({ question: "filler " + i, genre: "pop-punk" }, snapshot);
  }
  assert.equal(engine.getSuggestion(first.id), null, "oldest entry should be evicted");
  assert.equal(engine.getSuggestion(last.id), last);
  assert.equal(engine.getSuggestion("sug_never_existed"), null);
});

test("unknown genre rejects", async function () {
  const engine = createEngine({ packsDir: PACKS_DIR });
  await assert.rejects(
    engine.suggest({ question: "need a chorus", genre: "shoegaze" }, snapshot),
    /unknown_genre/
  );
  await assert.rejects(
    engine.suggest({ question: "need a chorus", genre: "../etc/passwd" }, snapshot),
    /unknown_genre/
  );
});

test("missing packs dir: listGenres is empty and suggest rejects with no_packs", async function () {
  const engine = createEngine({ packsDir: path.join(PACKS_DIR, "does-not-exist") });
  assert.deepEqual(engine.listGenres(), []);
  await assert.rejects(
    engine.suggest({ question: "need a chorus", genre: "deftones" }, snapshot),
    /no_packs/
  );
});

test("a Claude result is preferred, stamped with a fresh id and source claude", async function () {
  let receivedAnchors = null;
  const stub = async function (params) {
    receivedAnchors = params.anchors;
    return {
      kind: "chord-progression",
      genre: params.genre,
      summary: "Try i to bVI to iv to v in Bb minor for the chorus",
      detail: "Block chords, one per bar. Keep the verses sparse so this lands.",
      theory: "bVI and bVII come from natural minor, so they add weight without leaving the key.",
      clip: null,
    };
  };
  const engine = createEngine({ packsDir: PACKS_DIR, askClaude: stub });
  const s = await engine.suggest({ question: "need a chorus", genre: "deftones" }, snapshot);

  assert.equal(s.source, "claude");
  assert.ok(s.id.startsWith("sug_"));
  assert.equal(engine.getSuggestion(s.id), s);
  assert.ok(Array.isArray(receivedAnchors) && receivedAnchors.length >= 1);
  assert.equal(receivedAnchors[0].source, "rules", "the rules suggestion anchors the LLM call");
});

test("a null Claude result falls back to rules", async function () {
  const engine = createEngine({
    packsDir: PACKS_DIR,
    askClaude: async function () { return null; },
  });
  const s = await engine.suggest({ question: "need a chorus", genre: "deftones" }, snapshot);
  assert.equal(s.source, "rules");
});

test("a throwing Claude layer falls back to rules instead of rejecting", async function () {
  const engine = createEngine({
    packsDir: PACKS_DIR,
    askClaude: async function () { throw new Error("network down"); },
  });
  const s = await engine.suggest({ question: "need a chorus", genre: "nin" }, snapshot);
  assert.equal(s.source, "rules");
  assert.equal(s.genre, "nin");
});
