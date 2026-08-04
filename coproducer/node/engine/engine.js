"use strict";

// Suggestion engine per docs/CONTRACT.md Section 5.
// createEngine({ packsDir }) returns { suggest, getSuggestion, listGenres }.
// suggest() always computes a rules suggestion first, then lets the Claude
// layer improve on it when possible, and never rejects for a missing API
// key, bad LLM output, or a network failure. It rejects only for genuinely
// unusable requests: an unknown genre, or no packs to work from.

const fs = require("fs");
const path = require("path");

const { buildRulesSuggestion, makeSuggestionId, inferKind } = require("./rules");
const defaultAskClaude = require("./claude").askClaude;

const RECENTS_LIMIT = 20;
const GENRE_NAME_RE = /^[a-z0-9-]+$/i;

function createEngine(options) {
  const opts = options || {};
  const packsDir = opts.packsDir;
  // Test seam: engine tests inject a stub here. Production wiring omits it
  // and gets the real Claude layer, which self-gates on ANTHROPIC_API_KEY.
  const askClaude = typeof opts.askClaude === "function" ? opts.askClaude : defaultAskClaude;

  const packCache = new Map();
  const recents = []; // ring buffer, newest last, capped at RECENTS_LIMIT

  function listGenres() {
    let entries;
    try {
      entries = fs.readdirSync(packsDir);
    } catch (err) {
      return [];
    }
    return entries
      .filter(function (name) { return name.endsWith(".json"); })
      .map(function (name) { return name.slice(0, -".json".length); })
      .filter(function (name) { return GENRE_NAME_RE.test(name); })
      .sort();
  }

  function loadPack(genre) {
    if (typeof genre !== "string" || !GENRE_NAME_RE.test(genre)) {
      throw new Error("unknown_genre: " + String(genre));
    }
    if (packCache.has(genre)) return packCache.get(genre);
    const file = path.join(packsDir, genre + ".json");
    let raw;
    try {
      raw = fs.readFileSync(file, "utf8");
    } catch (err) {
      if (listGenres().length === 0) {
        throw new Error("no_packs: no style packs found in " + String(packsDir));
      }
      throw new Error("unknown_genre: " + genre);
    }
    const pack = JSON.parse(raw);
    packCache.set(genre, pack);
    return pack;
  }

  function remember(suggestion) {
    recents.push(suggestion);
    while (recents.length > RECENTS_LIMIT) recents.shift();
  }

  async function suggest(request, sessionSnapshot) {
    if (!request || typeof request !== "object") {
      throw new Error("bad_request: suggest needs a request object");
    }
    const pack = loadPack(request.genre); // throws unknown_genre / no_packs

    // Rules first, always. This is the guaranteed answer.
    const rulesSuggestion = buildRulesSuggestion(request, sessionSnapshot, pack);

    // Then try the LLM layer with the rules suggestion as the anchor. The
    // default implementation returns null when no API key is set; injected
    // stubs are called unconditionally so tests can drive both paths.
    let claudeResult = null;
    try {
      claudeResult = await askClaude({
        question: request.question,
        genre: request.genre,
        kind: inferKind(request.question, request.kind),
        pack: pack,
        snapshot: sessionSnapshot,
        anchors: [rulesSuggestion],
      });
    } catch (err) {
      claudeResult = null; // any LLM failure falls back to rules
    }

    let suggestion;
    if (claudeResult) {
      suggestion = Object.assign({}, claudeResult, {
        id: makeSuggestionId(),
        source: "claude",
      });
    } else {
      suggestion = rulesSuggestion; // already carries id and source "rules"
    }

    remember(suggestion);
    return suggestion;
  }

  function getSuggestion(suggestionId) {
    for (let i = recents.length - 1; i >= 0; i--) {
      if (recents[i].id === suggestionId) return recents[i];
    }
    return null;
  }

  return {
    suggest: suggest,
    getSuggestion: getSuggestion,
    listGenres: listGenres,
  };
}

module.exports = { createEngine };
