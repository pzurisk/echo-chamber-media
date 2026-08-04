// In-browser stand-in for the Node side of the CoProducer WebSocket contract.
// Used when the app cannot reach ws://127.0.0.1:7400 (mock mode), so every UI
// feature can be demoed and tested outside Ableton.
//
// request(type, payload) resolves { type, payload } exactly like a live
// response frame would, and rejects with an Error carrying a .code from the
// contract's error code list. onPush(type, payload) delivers the push types
// (game.state, lesson.unlocked, session.state).

import {
  sessionSnapshot,
  gameState,
  lessons,
  suggestionTemplates,
} from "./fixtures.js";
import { levelForXp } from "../lib/levels.js";
import { makeError } from "../lib/protocol.js";

const MILESTONES = ["verse", "chorus", "bridge", "arrangement", "mix", "export"];
const GENRES = Object.keys(suggestionTemplates);

// XP table from CONTRACT Section 5: milestones 100 each, arrangement 150, export 200.
const MILESTONE_XP = {
  verse: 100,
  chorus: 100,
  bridge: 100,
  arrangement: 150,
  mix: 100,
  export: 200,
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

// Rough kind pick when the user leaves kind unset, keyed off the question text.
export function inferKind(question) {
  const q = String(question || "").toLowerCase();
  if (/\b(structure|arrangement|arrange|section|bridge|intro|outro|build|drop)\b/.test(q)) {
    return "structure";
  }
  if (/\b(mix|mixing|sound|tone|production|produce|texture|width|reverb|distort)\b/.test(q)) {
    return "production";
  }
  return "chord-progression";
}

export function createMockServer({ onPush } = {}) {
  const state = {
    snapshot: clone(sessionSnapshot),
    game: clone(gameState),
    lessons: clone(lessons),
    committedKinds: new Set(),
    recents: new Map(),
    suggestionSeq: 0,
  };

  function push(type, payload) {
    if (typeof onPush === "function") onPush(type, payload);
  }

  function lessonUnlocked(lesson) {
    const u = lesson.unlock || {};
    if (u.type === "always") return true;
    if (u.type === "milestone") {
      return Object.values(state.game.songs).some(
        (song) => song.milestones && song.milestones[u.milestone] === true
      );
    }
    if (u.type === "suggestion") return state.committedKinds.has(u.kind);
    return false;
  }

  function catalogWithFlags() {
    return state.lessons.map((lesson) => ({
      ...clone(lesson),
      unlocked: lessonUnlocked(lesson),
      completed: state.game.lessonsCompleted.includes(lesson.id),
    }));
  }

  function grantXp(amount) {
    state.game.xp += amount;
    state.game.level = levelForXp(state.game.xp);
  }

  // Snapshot lock states, run fn, then push lesson.unlocked for anything that
  // flipped from locked to unlocked. Mirrors game.onLessonUnlocked in the contract.
  function withUnlockCheck(fn) {
    const before = new Map(state.lessons.map((l) => [l.id, lessonUnlocked(l)]));
    fn();
    const fresh = state.lessons.filter(
      (l) => !before.get(l.id) && lessonUnlocked(l)
    );
    fresh.forEach((lesson, i) => {
      setTimeout(() => push("lesson.unlocked", { lesson: clone(lesson) }), 450 + i * 250);
    });
  }

  function gameResponse() {
    return { type: "game.state", payload: { game: clone(state.game) } };
  }

  const handlers = {
    async "session.refresh"() {
      await sleep(180);
      return { type: "session.state", payload: { snapshot: clone(state.snapshot) } };
    },

    async "game.get"() {
      await sleep(80);
      return gameResponse();
    },

    async "lesson.list"() {
      await sleep(120);
      return { type: "lesson.catalog", payload: { lessons: catalogWithFlags() } };
    },

    async "lesson.complete"(payload) {
      await sleep(150);
      const lesson = state.lessons.find((l) => l.id === payload.lessonId);
      if (!lesson) throw makeError("bad_request", "Unknown lesson id");
      if (!lessonUnlocked(lesson)) throw makeError("bad_request", "Lesson is locked");
      if (!state.game.lessonsCompleted.includes(lesson.id)) {
        state.game.lessonsCompleted.push(lesson.id);
        grantXp(lesson.xp);
      }
      return gameResponse();
    },

    async "milestone.set"(payload) {
      await sleep(150);
      const { songId, milestone } = payload || {};
      if (!songId || !MILESTONES.includes(milestone)) {
        throw makeError("bad_request", "Expected a songId and a valid milestone");
      }
      if (!state.game.songs[songId]) {
        const milestones = {};
        MILESTONES.forEach((m) => {
          milestones[m] = false;
        });
        state.game.songs[songId] = { milestones };
      }
      const song = state.game.songs[songId];
      if (!song.milestones[milestone]) {
        withUnlockCheck(() => {
          song.milestones[milestone] = true;
          grantXp(MILESTONE_XP[milestone]);
        });
      }
      return gameResponse();
    },

    async "suggest.request"(payload) {
      const { question, genre } = payload || {};
      if (!GENRES.includes(genre)) {
        throw makeError("bad_request", "Unknown genre: " + String(genre));
      }
      const kind = payload.kind || inferKind(question);
      const template = suggestionTemplates[genre] && suggestionTemplates[genre][kind];
      if (!template) throw makeError("engine_error", "No suggestion available for that combination");
      await sleep(500 + Math.random() * 500);
      state.suggestionSeq += 1;
      const suggestion = {
        id: "sug_" + Date.now() + "_" + state.suggestionSeq,
        ...clone(template),
        // Alternate sources so both badge styles are visible in the demo.
        source: state.suggestionSeq % 2 === 1 ? "rules" : "claude",
      };
      state.recents.set(suggestion.id, suggestion);
      if (state.recents.size > 20) {
        const oldest = state.recents.keys().next().value;
        state.recents.delete(oldest);
      }
      return { type: "suggest.result", payload: { suggestion: clone(suggestion) } };
    },

    async "suggest.commit"(payload) {
      await sleep(300);
      const suggestion = state.recents.get(payload && payload.suggestionId);
      if (!suggestion) throw makeError("bad_request", "Unknown suggestion id");
      if (!suggestion.clip) throw makeError("bad_request", "Suggestion has no clip to write");

      const tracks = state.snapshot.tracks;
      let trackIndex =
        payload.trackIndex ?? suggestion.clip.suggestedTrackIndex ?? 0;
      if (!tracks.some((t) => t.index === trackIndex && t.isMidi)) {
        const firstMidi = tracks.find((t) => t.isMidi);
        trackIndex = firstMidi ? firstMidi.index : 0;
      }
      const track = tracks.find((t) => t.index === trackIndex);
      const usedScenes = track ? track.clips.map((c) => c.sceneIndex) : [];
      const sceneIndex =
        payload.sceneIndex ?? (usedScenes.length ? Math.max(...usedScenes) + 1 : 0);
      const clipPath =
        "live_set tracks " + trackIndex + " clip_slots " + sceneIndex + " clip";

      if (track) {
        track.clips.push({
          sceneIndex,
          name: suggestion.genre + " idea",
          lengthBeats: suggestion.clip.lengthBeats,
          noteCount: suggestion.clip.notes.length,
          clipPath,
        });
      }

      withUnlockCheck(() => {
        state.committedKinds.add(suggestion.kind);
      });

      // Contract: push a fresh session.state after a committed clip write.
      setTimeout(
        () => push("session.state", { snapshot: clone(state.snapshot) }),
        200
      );

      return {
        type: "suggest.committed",
        payload: { clipPath, trackIndex, sceneIndex },
      };
    },
  };

  async function request(type, payload = {}) {
    const handler = handlers[type];
    if (!handler) throw makeError("bad_request", "Unknown request type: " + type);
    return handler(payload);
  }

  return { request };
}
