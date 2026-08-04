"use strict";

// CoProducer gamification core: XP, level, streak, milestones, lessons.
// Implements the module contract in docs/CONTRACT.md Section 5.
//
// Streak rules: any XP-granting action or a session-open counts as activity.
// Same day as lastActiveDate changes nothing. Exactly one day later increments
// the count. A longer gap resets the count to 1. First ever activity sets the
// count to 1. The first activity of a given day also grants a 10 XP bonus
// (that is how "first task of the day grants 10 XP" is realized; the bonus is
// coupled to the day advance so it is granted exactly once per day).
//
// Unlock notifications fire exactly once per lesson, ever. The state file
// records which lessons have fired under notifiedUnlocks (an additive field),
// so recreating the game from the same dataDir never re-notifies.

const fs = require("fs");
const path = require("path");
const { createStore } = require("./store");

const MILESTONES = ["verse", "chorus", "bridge", "arrangement", "mix", "export"];
const MILESTONE_XP = {
  verse: 100,
  chorus: 100,
  bridge: 100,
  arrangement: 150,
  mix: 100,
  export: 200
};
const DEFAULT_LESSON_XP = 20;
const DAILY_STREAK_BONUS_XP = 10;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function computeLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// Local calendar date as YYYY-MM-DD, per the contract (dates are local).
function localDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

// Whole calendar days from one YYYY-MM-DD string to another. Uses UTC math on
// the date parts so daylight saving shifts cannot produce off-by-one results.
function daysBetween(fromStr, toStr) {
  const a = fromStr.split("-").map(Number);
  const b = toStr.split("-").map(Number);
  const from = Date.UTC(a[0], a[1] - 1, a[2]);
  const to = Date.UTC(b[0], b[1] - 1, b[2]);
  return Math.round((to - from) / MS_PER_DAY);
}

// State is plain JSON, so a JSON round trip is a safe deep clone.
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isValidLesson(entry) {
  return (
    entry &&
    typeof entry === "object" &&
    typeof entry.id === "string" && entry.id.length > 0 &&
    typeof entry.title === "string" &&
    typeof entry.body === "string" &&
    entry.unlock &&
    typeof entry.unlock === "object" &&
    typeof entry.unlock.type === "string"
  );
}

// Loads lessonsDir/catalog.json. Accepts a bare array or { lessons: [...] }.
// Invalid entries and duplicate ids are skipped with a warning instead of
// crashing the Node for Max process inside Live.
function loadCatalog(lessonsDir) {
  const catalogPath = path.join(lessonsDir, "catalog.json");
  let text;
  try {
    text = fs.readFileSync(catalogPath, "utf8");
  } catch (err) {
    console.warn(
      "[coproducer:game] could not read lesson catalog at " + catalogPath +
      " (" + err.message + "). Continuing with zero lessons."
    );
    return [];
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    console.warn(
      "[coproducer:game] lesson catalog at " + catalogPath +
      " is not valid JSON (" + err.message + "). Continuing with zero lessons."
    );
    return [];
  }

  const rawList = Array.isArray(parsed)
    ? parsed
    : (parsed && Array.isArray(parsed.lessons) ? parsed.lessons : null);
  if (rawList === null) {
    console.warn(
      "[coproducer:game] lesson catalog must be an array of lessons (or { lessons: [...] }). Continuing with zero lessons."
    );
    return [];
  }

  const lessons = [];
  const seen = new Set();
  for (const entry of rawList) {
    if (!isValidLesson(entry)) {
      console.warn("[coproducer:game] skipping invalid lesson catalog entry: " + JSON.stringify(entry));
      continue;
    }
    if (seen.has(entry.id)) {
      console.warn("[coproducer:game] skipping duplicate lesson id: " + entry.id);
      continue;
    }
    seen.add(entry.id);
    lessons.push(clone(entry));
  }
  return lessons;
}

// createGame({ dataDir, lessonsDir, now }). now is an optional function
// returning a Date, injectable so streak tests are deterministic.
function createGame(options) {
  const opts = options || {};
  if (typeof opts.dataDir !== "string" || opts.dataDir.length === 0) {
    throw new Error("createGame requires a dataDir path");
  }
  if (typeof opts.lessonsDir !== "string" || opts.lessonsDir.length === 0) {
    throw new Error("createGame requires a lessonsDir path");
  }
  const now = typeof opts.now === "function" ? opts.now : function () { return new Date(); };

  const store = createStore(opts.dataDir);
  const lessons = loadCatalog(opts.lessonsDir);
  const lessonsById = new Map(lessons.map(function (l) { return [l.id, l]; }));

  const state = store.load();
  // Level is derived from XP, so recompute on load in case an older file
  // stored a stale value.
  state.level = computeLevel(state.xp);

  const changeCallbacks = [];
  const unlockCallbacks = [];

  function grantXp(amount) {
    state.xp += amount;
    state.level = computeLevel(state.xp);
  }

  // Advances the streak for today if this is the first activity of the day,
  // and grants the daily 10 XP bonus with it. Returns true when anything
  // changed, false on a same-day repeat.
  function tickStreak() {
    const today = localDateString(now());
    const last = state.streak.lastActiveDate;
    if (last === today) return false;
    if (typeof last === "string" && daysBetween(last, today) === 1) {
      state.streak.count += 1;
    } else {
      state.streak.count = 1;
    }
    state.streak.lastActiveDate = today;
    grantXp(DAILY_STREAK_BONUS_XP);
    return true;
  }

  // Unlock evaluation per Lesson.unlock. Suggestion-type lessons become
  // unlocked the moment a matching suggestion-committed event is recorded
  // (see recordEvent); notifiedUnlocks doubles as their persistent record,
  // since GameState has no other memory of committed suggestions.
  function isUnlocked(lesson) {
    const unlock = lesson.unlock || { type: "always" };
    if (unlock.type === "always") return true;
    if (unlock.type === "milestone") {
      return Object.keys(state.songs).some(function (songId) {
        const song = state.songs[songId];
        return !!(song && song.milestones && song.milestones[unlock.milestone] === true);
      });
    }
    if (unlock.type === "suggestion") {
      return state.notifiedUnlocks.indexOf(lesson.id) !== -1;
    }
    return false;
  }

  // Marks any newly unlocked lesson as notified and queues it so callbacks
  // fire after the state is persisted. Each lesson fires at most once, ever.
  function evaluateUnlocks(pending) {
    for (const lesson of lessons) {
      if (state.notifiedUnlocks.indexOf(lesson.id) !== -1) continue;
      if (isUnlocked(lesson)) {
        state.notifiedUnlocks.push(lesson.id);
        pending.push(lesson);
      }
    }
  }

  // Wraps every public operation: runs it, persists if the state changed,
  // then fires change callbacks and any queued unlock callbacks. Callbacks
  // fire after the save so a notification is never delivered unpersisted.
  function runAction(fn) {
    const before = JSON.stringify(state);
    const pending = [];
    const result = fn(pending);
    if (JSON.stringify(state) !== before) {
      store.save(state);
      const snapshot = clone(state);
      for (const cb of changeCallbacks.slice()) {
        try {
          cb(snapshot);
        } catch (err) {
          console.warn("[coproducer:game] onChange callback threw: " + err.message);
        }
      }
    }
    for (const lesson of pending) {
      const copy = clone(lesson);
      for (const cb of unlockCallbacks.slice()) {
        try {
          cb(copy);
        } catch (err) {
          console.warn("[coproducer:game] onLessonUnlocked callback threw: " + err.message);
        }
      }
    }
    return result;
  }

  // GameState. Also ticks the streak for today, per the contract.
  function getState() {
    return runAction(function (pending) {
      tickStreak();
      evaluateUnlocks(pending);
      return clone(state);
    });
  }

  // Lesson[] with added boolean unlocked and completed per lesson.
  function listLessons() {
    return runAction(function (pending) {
      evaluateUnlocks(pending);
      return lessons.map(function (lesson) {
        const out = clone(lesson);
        out.unlocked = isUnlocked(lesson);
        out.completed = state.lessonsCompleted.indexOf(lesson.id) !== -1;
        return out;
      });
    });
  }

  // GameState. Throws Error("unknown_lesson") or Error("locked").
  // Grants the lesson's authored XP (default 20) exactly once; a repeat
  // completion is a no-op.
  function completeLesson(lessonId) {
    const lesson = lessonsById.get(lessonId);
    if (!lesson) throw new Error("unknown_lesson");
    if (!isUnlocked(lesson)) throw new Error("locked");
    return runAction(function (pending) {
      if (state.lessonsCompleted.indexOf(lessonId) !== -1) return clone(state);
      tickStreak();
      state.lessonsCompleted.push(lessonId);
      const xp = (typeof lesson.xp === "number" && Number.isFinite(lesson.xp))
        ? lesson.xp
        : DEFAULT_LESSON_XP;
      grantXp(xp);
      evaluateUnlocks(pending);
      return clone(state);
    });
  }

  // GameState. Grants XP exactly once per song plus milestone pair, creates
  // the song entry on first touch, validates milestone against the enum.
  function setMilestone(songId, milestone) {
    if (typeof songId !== "string" || songId.length === 0) {
      throw new Error("bad_song_id");
    }
    if (MILESTONES.indexOf(milestone) === -1) {
      throw new Error("unknown_milestone");
    }
    return runAction(function (pending) {
      if (!state.songs[songId]) {
        const milestones = {};
        for (const key of MILESTONES) milestones[key] = false;
        state.songs[songId] = { milestones };
      }
      const song = state.songs[songId];
      if (song.milestones[milestone] === true) return clone(state);
      tickStreak();
      song.milestones[milestone] = true;
      grantXp(MILESTONE_XP[milestone]);
      evaluateUnlocks(pending);
      return clone(state);
    });
  }

  // evt: { type: "suggestion-committed", kind, genre } | { type: "session-open" }.
  // session-open counts as streak activity. suggestion-committed grants no XP
  // and does not touch the streak (it is not an XP-granting action), but it
  // unlocks suggestion-type lessons whose kind matches (or that have no kind).
  function recordEvent(evt) {
    if (!evt || typeof evt !== "object" || typeof evt.type !== "string") {
      throw new Error("bad_event");
    }
    if (evt.type === "session-open") {
      return runAction(function (pending) {
        tickStreak();
        evaluateUnlocks(pending);
        return clone(state);
      });
    }
    if (evt.type === "suggestion-committed") {
      return runAction(function (pending) {
        for (const lesson of lessons) {
          const unlock = lesson.unlock || {};
          if (unlock.type !== "suggestion") continue;
          if (state.notifiedUnlocks.indexOf(lesson.id) !== -1) continue;
          if (unlock.kind && unlock.kind !== evt.kind) continue;
          state.notifiedUnlocks.push(lesson.id);
          pending.push(lesson);
        }
        evaluateUnlocks(pending);
        return clone(state);
      });
    }
    throw new Error("unknown_event");
  }

  function onChange(cb) {
    if (typeof cb !== "function") throw new Error("onChange requires a function");
    changeCallbacks.push(cb);
    return function unsubscribe() {
      const i = changeCallbacks.indexOf(cb);
      if (i !== -1) changeCallbacks.splice(i, 1);
    };
  }

  function onLessonUnlocked(cb) {
    if (typeof cb !== "function") throw new Error("onLessonUnlocked requires a function");
    unlockCallbacks.push(cb);
    return function unsubscribe() {
      const i = unlockCallbacks.indexOf(cb);
      if (i !== -1) unlockCallbacks.splice(i, 1);
    };
  }

  return {
    getState,
    listLessons,
    completeLesson,
    setMilestone,
    recordEvent,
    onChange,
    onLessonUnlocked
  };
}

module.exports = { createGame, computeLevel, MILESTONES, MILESTONE_XP };
