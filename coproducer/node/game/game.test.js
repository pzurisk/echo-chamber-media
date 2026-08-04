"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { createGame, computeLevel } = require("./game");
const { STATE_FILE, TMP_PREFIX } = require("./store");

// Fixture catalog, independent of the shipped lessons/catalog.json so lesson
// content edits never break these behavioral tests.
const FIXTURE_LESSONS = [
  { id: "starter", title: "Starter", body: "Body.", xp: 20, unlock: { type: "always" } },
  { id: "verse-lesson", title: "Verse lesson", body: "Body.", xp: 20, unlock: { type: "milestone", milestone: "verse" } },
  { id: "structure-lesson", title: "Structure lesson", body: "Body.", xp: 25, unlock: { type: "suggestion", kind: "structure" } },
  { id: "any-suggestion-lesson", title: "Any suggestion", body: "Body.", unlock: { type: "suggestion" } }
];

function makeEnv(catalog) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "coproducer-game-"));
  const dataDir = path.join(root, "data");
  const lessonsDir = path.join(root, "lessons");
  fs.mkdirSync(lessonsDir, { recursive: true });
  fs.writeFileSync(
    path.join(lessonsDir, "catalog.json"),
    JSON.stringify(catalog || FIXTURE_LESSONS, null, 2)
  );
  return { root, dataDir, lessonsDir };
}

// Injectable clock. Times are local noon so local date math is unambiguous.
function makeClock(startIso) {
  let current = new Date(startIso);
  return {
    now: function () { return new Date(current.getTime()); },
    set: function (iso) { current = new Date(iso); }
  };
}

function makeGame(env, clock) {
  return createGame({ dataDir: env.dataDir, lessonsDir: env.lessonsDir, now: clock.now });
}

test("streak: first ever activity sets count to 1 and grants the daily 10 XP bonus", function () {
  const env = makeEnv();
  const clock = makeClock("2026-08-03T12:00:00");
  const game = makeGame(env, clock);
  const state = game.recordEvent({ type: "session-open" });
  assert.equal(state.streak.count, 1);
  assert.equal(state.streak.lastActiveDate, "2026-08-03");
  assert.equal(state.xp, 10);
});

test("streak: same-day activity changes nothing", function () {
  const env = makeEnv();
  const clock = makeClock("2026-08-03T09:00:00");
  const game = makeGame(env, clock);
  game.recordEvent({ type: "session-open" });
  clock.set("2026-08-03T22:30:00");
  const state = game.recordEvent({ type: "session-open" });
  assert.equal(state.streak.count, 1);
  assert.equal(state.streak.lastActiveDate, "2026-08-03");
  assert.equal(state.xp, 10);
});

test("streak: exactly one day later increments, a longer gap resets to 1", function () {
  const env = makeEnv();
  const clock = makeClock("2026-08-03T12:00:00");
  const game = makeGame(env, clock);
  game.recordEvent({ type: "session-open" });

  clock.set("2026-08-04T12:00:00");
  let state = game.recordEvent({ type: "session-open" });
  assert.equal(state.streak.count, 2);
  assert.equal(state.streak.lastActiveDate, "2026-08-04");
  assert.equal(state.xp, 20);

  clock.set("2026-08-05T12:00:00");
  state = game.recordEvent({ type: "session-open" });
  assert.equal(state.streak.count, 3);

  clock.set("2026-08-10T12:00:00");
  state = game.recordEvent({ type: "session-open" });
  assert.equal(state.streak.count, 1);
  assert.equal(state.streak.lastActiveDate, "2026-08-10");
  assert.equal(state.xp, 40);
});

test("streak: month boundary counts as consecutive days", function () {
  const env = makeEnv();
  const clock = makeClock("2026-08-31T12:00:00");
  const game = makeGame(env, clock);
  game.recordEvent({ type: "session-open" });
  clock.set("2026-09-01T12:00:00");
  const state = game.recordEvent({ type: "session-open" });
  assert.equal(state.streak.count, 2);
});

test("milestone XP is granted exactly once per song plus milestone pair", function () {
  const env = makeEnv();
  const clock = makeClock("2026-08-03T12:00:00");
  const game = makeGame(env, clock);
  game.recordEvent({ type: "session-open" }); // absorb the daily 10 XP bonus

  let state = game.setMilestone("Song A", "verse");
  assert.equal(state.xp, 110);
  assert.equal(state.songs["Song A"].milestones.verse, true);
  assert.equal(state.songs["Song A"].milestones.chorus, false);

  // Idempotent on repeat: no extra XP, no state change.
  state = game.setMilestone("Song A", "verse");
  assert.equal(state.xp, 110);

  // Weighted milestones: arrangement 150, export 200, others 100.
  state = game.setMilestone("Song A", "arrangement");
  assert.equal(state.xp, 260);
  state = game.setMilestone("Song A", "export");
  assert.equal(state.xp, 460);
  state = game.setMilestone("Song A", "mix");
  assert.equal(state.xp, 560);

  // The same milestone on a different song grants again.
  state = game.setMilestone("Song B", "verse");
  assert.equal(state.xp, 660);
  assert.equal(state.songs["Song B"].milestones.verse, true);
});

test("setMilestone validates the milestone against the enum", function () {
  const env = makeEnv();
  const game = makeGame(env, makeClock("2026-08-03T12:00:00"));
  assert.throws(function () { game.setMilestone("Song A", "hook"); }, /unknown_milestone/);
  assert.throws(function () { game.setMilestone("", "verse"); }, /bad_song_id/);
});

test("level thresholds: 0 XP is level 1, 100 is level 2, 400 is level 3", function () {
  assert.equal(computeLevel(0), 1);
  assert.equal(computeLevel(99), 1);
  assert.equal(computeLevel(100), 2);
  assert.equal(computeLevel(399), 2);
  assert.equal(computeLevel(400), 3);
  assert.equal(computeLevel(899), 3);
  assert.equal(computeLevel(900), 4);

  // And through the API: crossing 100 XP moves the state to level 2.
  const env = makeEnv();
  const game = makeGame(env, makeClock("2026-08-03T12:00:00"));
  let state = game.getState();
  assert.equal(state.level, 1); // 10 XP from the first-activity bonus
  state = game.setMilestone("Song A", "verse");
  assert.equal(state.xp, 110);
  assert.equal(state.level, 2);
});

test("completeLesson throws for unknown and locked ids and grants XP once", function () {
  const env = makeEnv();
  const clock = makeClock("2026-08-03T12:00:00");
  const game = makeGame(env, clock);

  assert.throws(function () { game.completeLesson("nope"); }, /unknown_lesson/);
  assert.throws(function () { game.completeLesson("verse-lesson"); }, /locked/);

  // First completion: 10 XP daily bonus plus the lesson's 20.
  let state = game.completeLesson("starter");
  assert.equal(state.xp, 30);
  assert.deepEqual(state.lessonsCompleted, ["starter"]);

  // Repeat completion is a no-op.
  state = game.completeLesson("starter");
  assert.equal(state.xp, 30);
  assert.deepEqual(state.lessonsCompleted, ["starter"]);

  // Unlock it, then it completes fine.
  game.setMilestone("Song A", "verse");
  state = game.completeLesson("verse-lesson");
  assert.equal(state.lessonsCompleted.indexOf("verse-lesson") !== -1, true);
  assert.equal(state.xp, 30 + 100 + 20);
});

test("listLessons reports unlocked and completed flags", function () {
  const env = makeEnv();
  const game = makeGame(env, makeClock("2026-08-03T12:00:00"));
  let byId = new Map(game.listLessons().map(function (l) { return [l.id, l]; }));
  assert.equal(byId.get("starter").unlocked, true);
  assert.equal(byId.get("starter").completed, false);
  assert.equal(byId.get("verse-lesson").unlocked, false);
  assert.equal(byId.get("structure-lesson").unlocked, false);
  assert.equal(byId.get("any-suggestion-lesson").unlocked, false);

  game.setMilestone("Song A", "verse");
  game.completeLesson("starter");
  byId = new Map(game.listLessons().map(function (l) { return [l.id, l]; }));
  assert.equal(byId.get("starter").completed, true);
  assert.equal(byId.get("verse-lesson").unlocked, true);
  assert.equal(byId.get("verse-lesson").completed, false);
});

test("suggestion-committed unlocks by kind, grants no XP, does not touch the streak", function () {
  const env = makeEnv();
  const game = makeGame(env, makeClock("2026-08-03T12:00:00"));
  const unlockedIds = [];
  game.onLessonUnlocked(function (lesson) { unlockedIds.push(lesson.id); });

  // Kind mismatch: only the kindless lesson unlocks. The always lesson also
  // gets its one-time notification on this first evaluation.
  let state = game.recordEvent({ type: "suggestion-committed", kind: "chord-progression", genre: "deftones" });
  assert.deepEqual(unlockedIds, ["any-suggestion-lesson", "starter"]);
  assert.equal(state.xp, 0);
  assert.equal(state.streak.count, 0);
  assert.equal(state.streak.lastActiveDate, null);

  // Matching kind unlocks the structure lesson, exactly once.
  state = game.recordEvent({ type: "suggestion-committed", kind: "structure", genre: "nin" });
  assert.deepEqual(unlockedIds, ["any-suggestion-lesson", "starter", "structure-lesson"]);
  game.recordEvent({ type: "suggestion-committed", kind: "structure", genre: "nin" });
  assert.equal(unlockedIds.length, 3);

  // Once unlocked, the lesson completes without throwing. This completion is
  // the first XP-granting action of the day, so it also ticks the streak.
  state = game.completeLesson("structure-lesson");
  assert.equal(state.lessonsCompleted.indexOf("structure-lesson") !== -1, true);
  assert.equal(state.xp, 10 + 25);
  assert.equal(state.streak.count, 1);

  // A lesson with no authored xp grants the default 20.
  state = game.completeLesson("any-suggestion-lesson");
  assert.equal(state.xp, 10 + 25 + 20);
});

test("unknown event types are rejected", function () {
  const env = makeEnv();
  const game = makeGame(env, makeClock("2026-08-03T12:00:00"));
  assert.throws(function () { game.recordEvent({ type: "mystery" }); }, /unknown_event/);
  assert.throws(function () { game.recordEvent(null); }, /bad_event/);
});

test("unlock callback fires exactly once per lesson, including across restarts", function () {
  const env = makeEnv();
  const clock = makeClock("2026-08-03T12:00:00");

  const game1 = makeGame(env, clock);
  const first = [];
  game1.onLessonUnlocked(function (lesson) { first.push(lesson.id); });
  game1.setMilestone("Song A", "verse");
  assert.deepEqual(first, ["starter", "verse-lesson"]);

  // More activity in the same session re-notifies nothing.
  game1.getState();
  game1.listLessons();
  game1.setMilestone("Song A", "verse");
  assert.deepEqual(first, ["starter", "verse-lesson"]);
  const xpAfterFirstSession = game1.getState().xp;

  // Restart: a new game on the same dataDir must not re-notify.
  const game2 = makeGame(env, clock);
  const second = [];
  game2.onLessonUnlocked(function (lesson) { second.push(lesson.id); });
  game2.getState();
  game2.listLessons();
  game2.setMilestone("Song A", "verse");
  game2.recordEvent({ type: "session-open" });
  assert.deepEqual(second, []);

  // And the persisted XP and milestones survived the restart.
  const state = game2.getState();
  assert.equal(state.xp, xpAfterFirstSession);
  assert.equal(state.songs["Song A"].milestones.verse, true);

  // A brand new unlock still notifies the restarted game, once. The kindless
  // suggestion lesson also fires here, since no suggestion was ever committed
  // during the first session.
  game2.recordEvent({ type: "suggestion-committed", kind: "structure", genre: "nin" });
  assert.deepEqual(second, ["structure-lesson", "any-suggestion-lesson"]);
  game2.recordEvent({ type: "suggestion-committed", kind: "structure", genre: "nin" });
  assert.deepEqual(second, ["structure-lesson", "any-suggestion-lesson"]);
});

test("corrupt state file: game backs it up, warns, and starts fresh", function () {
  const env = makeEnv();
  fs.mkdirSync(env.dataDir, { recursive: true });
  const garbage = "{{{ definitely not json";
  fs.writeFileSync(path.join(env.dataDir, STATE_FILE), garbage);

  const game = makeGame(env, makeClock("2026-08-03T12:00:00"));
  const state = game.getState();
  assert.equal(state.streak.count, 1); // fresh state, first tick
  assert.equal(state.xp, 10);
  assert.deepEqual(state.lessonsCompleted, []);
  assert.deepEqual(state.songs, {});

  const badPath = path.join(env.dataDir, "state.json.bad");
  assert.equal(fs.existsSync(badPath), true);
  assert.equal(fs.readFileSync(badPath, "utf8"), garbage);
});

test("atomic persistence: state.json parses after every operation, no temp files linger", function () {
  const env = makeEnv();
  const clock = makeClock("2026-08-03T12:00:00");
  const game = makeGame(env, clock);

  const ops = [
    function () { game.recordEvent({ type: "session-open" }); },
    function () { game.setMilestone("Song A", "verse"); },
    function () { game.completeLesson("starter"); },
    function () { clock.set("2026-08-04T12:00:00"); game.recordEvent({ type: "session-open" }); },
    function () { game.setMilestone("Song A", "chorus"); },
    function () { game.recordEvent({ type: "suggestion-committed", kind: "structure", genre: "pop-punk" }); }
  ];
  for (const op of ops) {
    op();
    const names = fs.readdirSync(env.dataDir);
    assert.deepEqual(names.filter(function (n) { return n.startsWith(TMP_PREFIX); }), []);
    const onDisk = JSON.parse(fs.readFileSync(path.join(env.dataDir, STATE_FILE), "utf8"));
    assert.equal(onDisk.xp, game.getState().xp);
  }
});

test("onChange fires with a snapshot after state changes and not on same-day reads", function () {
  const env = makeEnv();
  const clock = makeClock("2026-08-03T12:00:00");
  const game = makeGame(env, clock);
  const seen = [];
  game.onChange(function (state) { seen.push(state.xp); });

  game.recordEvent({ type: "session-open" }); // change: streak tick plus starter unlock notification
  const countAfterOpen = seen.length;
  assert.equal(countAfterOpen >= 1, true);
  game.recordEvent({ type: "session-open" }); // same day, nothing new
  assert.equal(seen.length, countAfterOpen);
  game.setMilestone("Song A", "verse");
  assert.equal(seen.length, countAfterOpen + 1);
  assert.equal(seen[seen.length - 1], 110);

  // Mutating a returned snapshot must not corrupt internal state.
  const snapshot = game.getState();
  snapshot.xp = 99999;
  snapshot.songs["Song A"].milestones.chorus = true;
  assert.equal(game.getState().xp, 110);
  assert.equal(game.getState().songs["Song A"].milestones.chorus, false);
});

test("the shipped lessons/catalog.json is valid and loads with all unlock types", function () {
  const shippedDir = path.join(__dirname, "..", "..", "lessons");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "coproducer-shipped-"));
  const game = createGame({
    dataDir: path.join(root, "data"),
    lessonsDir: shippedDir,
    now: makeClock("2026-08-03T12:00:00").now
  });
  const lessons = game.listLessons();
  assert.equal(lessons.length >= 8 && lessons.length <= 10, true);

  const types = new Set(lessons.map(function (l) { return l.unlock.type; }));
  assert.deepEqual(Array.from(types).sort(), ["always", "milestone", "suggestion"]);

  const ids = new Set(lessons.map(function (l) { return l.id; }));
  assert.equal(ids.size, lessons.length);

  for (const lesson of lessons) {
    const words = lesson.body.trim().split(/\s+/).length;
    assert.equal(words >= 120 && words <= 200, true, lesson.id + " body is " + words + " words");
    assert.equal(lesson.body.indexOf("—") === -1, true, lesson.id + " contains an em dash");
    assert.equal(lesson.title.indexOf("—") === -1, true, lesson.id + " title contains an em dash");
    assert.equal(lesson.body.indexOf("!") === -1, true, lesson.id + " contains an exclamation point");
    assert.equal(typeof lesson.xp === "number" && lesson.xp > 0, true);
  }

  // At least one lesson is available immediately.
  assert.equal(lessons.some(function (l) { return l.unlocked; }), true);
});
