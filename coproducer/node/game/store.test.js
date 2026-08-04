"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { createStore, defaultState, STATE_FILE, BAD_FILE, TMP_PREFIX } = require("./store");

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "coproducer-store-"));
}

function tempFilesIn(dir) {
  return fs.readdirSync(dir).filter(function (name) {
    return name.startsWith(TMP_PREFIX);
  });
}

test("missing dataDir is created and a missing file yields the fresh default", function () {
  const dataDir = path.join(tmpRoot(), "nested", "data");
  assert.equal(fs.existsSync(dataDir), false);
  const store = createStore(dataDir);
  const state = store.load();
  assert.equal(fs.existsSync(dataDir), true);
  assert.deepEqual(state, defaultState());
});

test("save then load round trips the state", function () {
  const dataDir = path.join(tmpRoot(), "data");
  const store = createStore(dataDir);
  const state = defaultState();
  state.xp = 230;
  state.level = 2;
  state.streak = { count: 3, lastActiveDate: "2026-08-03" };
  state.lessonsCompleted = ["chorus-lift"];
  state.songs = {
    "My Song": {
      milestones: { verse: true, chorus: true, bridge: false, arrangement: false, mix: false, export: false }
    }
  };
  state.notifiedUnlocks = ["finish-ugly-first", "chorus-lift"];
  store.save(state);
  assert.deepEqual(store.load(), state);
});

test("corrupt state file is backed up to state.json.bad and load starts fresh", function () {
  const dataDir = path.join(tmpRoot(), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const garbage = "{{{ this is not json";
  fs.writeFileSync(path.join(dataDir, STATE_FILE), garbage);
  const store = createStore(dataDir);
  const state = store.load();
  assert.deepEqual(state, defaultState());
  const badPath = path.join(dataDir, BAD_FILE);
  assert.equal(fs.existsSync(badPath), true);
  assert.equal(fs.readFileSync(badPath, "utf8"), garbage);
  assert.equal(fs.existsSync(path.join(dataDir, STATE_FILE)), false);
});

test("valid JSON that is not an object also counts as corrupt", function () {
  const dataDir = path.join(tmpRoot(), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, STATE_FILE), "42");
  const store = createStore(dataDir);
  assert.deepEqual(store.load(), defaultState());
  assert.equal(fs.existsSync(path.join(dataDir, BAD_FILE)), true);
});

test("a partial older file is filled in with defaults, not treated as corrupt", function () {
  const dataDir = path.join(tmpRoot(), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(
    path.join(dataDir, STATE_FILE),
    JSON.stringify({ xp: 50, streak: { count: 2, lastActiveDate: "2026-08-01" } })
  );
  const store = createStore(dataDir);
  const state = store.load();
  assert.equal(state.xp, 50);
  assert.equal(state.streak.count, 2);
  assert.deepEqual(state.lessonsCompleted, []);
  assert.deepEqual(state.notifiedUnlocks, []);
  assert.deepEqual(state.songs, {});
  assert.equal(fs.existsSync(path.join(dataDir, BAD_FILE)), false);
});

test("atomic write: no temp files remain and state.json always parses", function () {
  const dataDir = path.join(tmpRoot(), "data");
  const store = createStore(dataDir);
  for (let i = 1; i <= 5; i++) {
    const state = defaultState();
    state.xp = i * 100;
    store.save(state);
    assert.deepEqual(tempFilesIn(dataDir), []);
    const onDisk = JSON.parse(fs.readFileSync(path.join(dataDir, STATE_FILE), "utf8"));
    assert.equal(onDisk.xp, i * 100);
  }
});

test("a failed save cleans up its temp file and leaves the old state intact", function () {
  const dataDir = path.join(tmpRoot(), "data");
  const store = createStore(dataDir);
  const good = defaultState();
  good.xp = 777;
  store.save(good);
  // A circular reference makes JSON.stringify throw before any file lands.
  const circular = defaultState();
  circular.self = circular;
  assert.throws(function () { store.save(circular); });
  assert.deepEqual(tempFilesIn(dataDir), []);
  const onDisk = JSON.parse(fs.readFileSync(path.join(dataDir, STATE_FILE), "utf8"));
  assert.equal(onDisk.xp, 777);
});

test("a stale temp file left by a crashed writer does not break load or save", function () {
  const dataDir = path.join(tmpRoot(), "data");
  const store = createStore(dataDir);
  const state = defaultState();
  state.xp = 10;
  store.save(state);
  fs.writeFileSync(path.join(dataDir, TMP_PREFIX + "99999-crashed"), "partial garbage");
  assert.equal(store.load().xp, 10);
  state.xp = 20;
  store.save(state);
  assert.equal(store.load().xp, 20);
});
