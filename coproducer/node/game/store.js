"use strict";

// JSON persistence for the CoProducer game state.
// State lives at dataDir/state.json. Writes are atomic: the new state is
// written to a temp file in the same directory, then renamed over state.json,
// so a crash mid-write leaves either the old file or the new file, never a
// torn one. See docs/CONTRACT.md Section 4 (GameState).

const fs = require("fs");
const path = require("path");

const STATE_FILE = "state.json";
const BAD_FILE = "state.json.bad";
const TMP_PREFIX = ".state.json.tmp-";

// Fresh GameState per the contract. notifiedUnlocks is an additive field that
// records which lesson unlock notifications have already fired, so callbacks
// fire exactly once per lesson even across restarts.
function defaultState() {
  return {
    xp: 0,
    level: 1,
    streak: { count: 0, lastActiveDate: null },
    lessonsCompleted: [],
    songs: {},
    notifiedUnlocks: []
  };
}

const MILESTONE_KEYS = ["verse", "chorus", "bridge", "arrangement", "mix", "export"];

// Takes whatever JSON.parse produced and returns a valid GameState, filling
// any missing fields from defaults (forward compatible with older files).
// Returns null when the value is not a plain object, which the loader treats
// the same as unparseable JSON.
function normalize(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const state = defaultState();

  if (typeof raw.xp === "number" && Number.isFinite(raw.xp) && raw.xp >= 0) {
    state.xp = raw.xp;
  }
  if (typeof raw.level === "number" && Number.isFinite(raw.level) && raw.level >= 1) {
    state.level = raw.level;
  }
  if (raw.streak && typeof raw.streak === "object" && !Array.isArray(raw.streak)) {
    if (typeof raw.streak.count === "number" && Number.isFinite(raw.streak.count) && raw.streak.count >= 0) {
      state.streak.count = Math.floor(raw.streak.count);
    }
    if (typeof raw.streak.lastActiveDate === "string") {
      state.streak.lastActiveDate = raw.streak.lastActiveDate;
    }
  }
  if (Array.isArray(raw.lessonsCompleted)) {
    state.lessonsCompleted = raw.lessonsCompleted.filter(function (id) {
      return typeof id === "string";
    });
  }
  if (Array.isArray(raw.notifiedUnlocks)) {
    state.notifiedUnlocks = raw.notifiedUnlocks.filter(function (id) {
      return typeof id === "string";
    });
  }
  if (raw.songs && typeof raw.songs === "object" && !Array.isArray(raw.songs)) {
    for (const songId of Object.keys(raw.songs)) {
      const entry = raw.songs[songId];
      const milestones = {};
      for (const key of MILESTONE_KEYS) {
        milestones[key] =
          !!(entry && entry.milestones && entry.milestones[key] === true);
      }
      state.songs[songId] = { milestones };
    }
  }
  return state;
}

function createStore(dataDir) {
  if (typeof dataDir !== "string" || dataDir.length === 0) {
    throw new Error("createStore requires a dataDir path");
  }
  const statePath = path.join(dataDir, STATE_FILE);
  let tmpCounter = 0;

  function ensureDir() {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Returns a valid GameState. Missing file: fresh default. Corrupt file:
  // backed up to state.json.bad, warning logged, fresh default returned.
  function load() {
    ensureDir();
    let text;
    try {
      text = fs.readFileSync(statePath, "utf8");
    } catch (err) {
      if (err && err.code === "ENOENT") return defaultState();
      throw err;
    }

    let state = null;
    try {
      state = normalize(JSON.parse(text));
    } catch (err) {
      state = null;
    }
    if (state !== null) return state;

    const badPath = path.join(dataDir, BAD_FILE);
    try {
      fs.renameSync(statePath, badPath);
      console.warn(
        "[coproducer:game] " + STATE_FILE + " was corrupt. Backed it up to " +
        BAD_FILE + " and started fresh."
      );
    } catch (err) {
      console.warn(
        "[coproducer:game] " + STATE_FILE + " was corrupt and could not be backed up (" +
        err.message + "). Starting fresh."
      );
    }
    return defaultState();
  }

  // Atomic write: temp file in the same directory, then rename. The temp file
  // is removed if anything fails before the rename lands.
  function save(state) {
    ensureDir();
    tmpCounter += 1;
    const tmpPath = path.join(
      dataDir,
      TMP_PREFIX + process.pid + "-" + Date.now() + "-" + tmpCounter
    );
    const body = JSON.stringify(state, null, 2) + "\n";
    try {
      fs.writeFileSync(tmpPath, body, "utf8");
      fs.renameSync(tmpPath, statePath);
    } catch (err) {
      try {
        fs.unlinkSync(tmpPath);
      } catch (cleanupErr) {
        // The temp file may never have been created. Nothing to clean up.
      }
      throw err;
    }
  }

  return { load, save, statePath };
}

module.exports = { createStore, defaultState, STATE_FILE, BAD_FILE, TMP_PREFIX };
