import test from "node:test";
import assert from "node:assert/strict";
import { createMockServer, inferKind } from "../src/mock/mockServer.js";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("mock responses carry the contract response types and shapes", async () => {
  const server = createMockServer({});
  const session = await server.request("session.refresh", {});
  assert.equal(session.type, "session.state");
  assert.ok(Array.isArray(session.payload.snapshot.tracks));
  assert.equal(typeof session.payload.snapshot.tempo, "number");

  const game = await server.request("game.get", {});
  assert.equal(game.type, "game.state");
  assert.equal(typeof game.payload.game.xp, "number");
  assert.ok(game.payload.game.streak.lastActiveDate.match(/^\d{4}-\d{2}-\d{2}$/));

  const catalog = await server.request("lesson.list", {});
  assert.equal(catalog.type, "lesson.catalog");
  for (const lesson of catalog.payload.lessons) {
    assert.equal(typeof lesson.unlocked, "boolean");
    assert.equal(typeof lesson.completed, "boolean");
    assert.equal(typeof lesson.xp, "number");
  }
});

test("milestone.set grants XP once and fires lesson.unlocked pushes", async () => {
  const pushes = [];
  const server = createMockServer({ onPush: (type, payload) => pushes.push({ type, payload }) });
  const before = (await server.request("game.get", {})).payload.game;

  // No fixture song has the arrangement milestone yet, so setting it is a
  // fresh unlock for the mix-bus-basics lesson (worth 150 XP per the contract).
  const first = await server.request("milestone.set", {
    songId: "Night Shift",
    milestone: "arrangement",
  });
  assert.equal(first.payload.game.xp, before.xp + 150);
  assert.equal(first.payload.game.songs["Night Shift"].milestones.arrangement, true);

  const again = await server.request("milestone.set", {
    songId: "Night Shift",
    milestone: "arrangement",
  });
  assert.equal(again.payload.game.xp, before.xp + 150, "no double XP");

  await wait(900);
  const unlocked = pushes.filter((p) => p.type === "lesson.unlocked");
  assert.ok(
    unlocked.some((p) => p.payload.lesson.id === "mix-bus-basics"),
    "arrangement milestone unlocks the rough mix lesson"
  );
});

test("suggest.request then suggest.commit writes a clip into the snapshot", async () => {
  const pushes = [];
  const server = createMockServer({ onPush: (type, payload) => pushes.push({ type, payload }) });
  const res = await server.request("suggest.request", {
    question: "I have a verse progression, need a chorus",
    genre: "deftones",
    kind: "chord-progression",
  });
  const suggestion = res.payload.suggestion;
  assert.equal(res.type, "suggest.result");
  assert.match(suggestion.id, /^sug_/);
  assert.ok(["rules", "claude"].includes(suggestion.source));
  assert.ok(suggestion.clip && suggestion.clip.notes.length > 0);

  const committed = await server.request("suggest.commit", { suggestionId: suggestion.id });
  assert.equal(committed.type, "suggest.committed");
  assert.match(
    committed.payload.clipPath,
    /^live_set tracks \d+ clip_slots \d+ clip$/
  );

  await wait(400);
  const sessionPush = pushes.find((p) => p.type === "session.state");
  assert.ok(sessionPush, "commit pushes a fresh session.state");
  const track = sessionPush.payload.snapshot.tracks.find(
    (t) => t.index === committed.payload.trackIndex
  );
  assert.ok(
    track.clips.some((c) => c.clipPath === committed.payload.clipPath),
    "new clip appears in the pushed snapshot"
  );
});

test("errors use contract error codes", async () => {
  const server = createMockServer({});
  await assert.rejects(
    server.request("suggest.request", { question: "x", genre: "polka" }),
    (err) => err.code === "bad_request"
  );
  await assert.rejects(
    server.request("suggest.commit", { suggestionId: "sug_nope" }),
    (err) => err.code === "bad_request"
  );
  await assert.rejects(
    server.request("lesson.complete", { lessonId: "mix-bus-basics" }),
    (err) => err.code === "bad_request" && /locked/i.test(err.message)
  );
});

test("inferKind routes plain questions to a sensible kind", () => {
  assert.equal(inferKind("I have a verse progression, need a chorus"), "chord-progression");
  assert.equal(inferKind("How should I arrange the bridge section"), "structure");
  assert.equal(inferKind("The mix sounds thin and narrow"), "production");
});
