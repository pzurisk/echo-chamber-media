"use strict";

// CoProducer Node for Max entry point.
//
// Runs inside node.script in the Max device (see device/CoProducer.maxpat).
// Hosts the WebSocket server for the jweb UI (Transport A, CONTRACT Section 2)
// and routes requests to the lom, engine, and game modules (CONTRACT Section 5).
//
// Also runs standalone (node node/main.js) for development outside Live.
// In that mode max-api is absent, so LOM calls fail fast with lom_unavailable
// and the UI can fall back to its mock mode.
//
// Exports createServer(deps) so tests can inject stub lom, engine, and game.

const path = require("path");
const fs = require("fs");
const http = require("http");

const PROJECT_ROOT = path.join(__dirname, "..");
const DEFAULT_PORT = 7400;
const UI_DIR = path.join(PROJECT_ROOT, "ui", "dist");

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png"
};

// Serve the built UI to jweb. This exists because jweb cannot load the bundle
// from file://: Vite emits <script type="module">, and Chromium refuses to load
// ES modules over file:// (the origin is null, so the CORS check always fails).
// Over HTTP the page has a real origin, so modules load and the WebSocket
// connection is same origin as well.
function serveStatic(req, res) {
  let rel;
  try {
    rel = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
  } catch (err) {
    res.writeHead(400);
    return res.end("bad request");
  }
  if (rel === "/" || rel === "") rel = "/index.html";

  // Resolve inside UI_DIR and reject anything that escapes it, so a crafted
  // path cannot read the rest of the disk.
  const target = path.resolve(UI_DIR, "." + rel);
  if (target !== UI_DIR && !target.startsWith(UI_DIR + path.sep)) {
    res.writeHead(403);
    return res.end("forbidden");
  }

  fs.readFile(target, function (err, data) {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end(
        "CoProducer UI not found at " + target + "\n\n" +
          "Build it first: cd ui && npm install && npm run build"
      );
    }
    const type = CONTENT_TYPES[path.extname(target).toLowerCase()] ||
      "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
}

try {
  require("dotenv").config({ path: path.join(PROJECT_ROOT, ".env") });
} catch (err) {
  // dotenv missing is not fatal, env vars can come from the shell.
}

const KNOWN_ERROR_CODES = new Set([
  "lom_unavailable",
  "lom_timeout",
  "engine_error",
  "llm_unavailable",
  "bad_request",
  "internal"
]);

// Inside node.script, console output goes to the Max Console window, which is
// not written to any file. When the backend fails to start there is then
// nothing to read anywhere. Mirror every log line to data/backend.log so a
// failed start can be diagnosed after the fact.
const LOG_FILE = path.join(PROJECT_ROOT, "data", "backend.log");

function fileLog(message) {
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, new Date().toISOString() + " " + message + "\n");
  } catch (err) {
    // Logging must never be the thing that takes the backend down.
  }
}

function defaultLog(message) {
  // eslint-disable-next-line no-console
  console.log("[coproducer] " + message);
  fileLog(message);
}

function envPort() {
  const raw = process.env.COPRODUCER_WS_PORT;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : DEFAULT_PORT;
}

function errorWithCode(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function knownCode(err) {
  if (err && typeof err.code === "string" && KNOWN_ERROR_CODES.has(err.code)) {
    return err.code;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Server factory. deps: { lom, engine, game, port, log }
// Returns Promise<{ wss, port, broadcast, close }>.
// ---------------------------------------------------------------------------

async function createServer(deps) {
  const d = deps || {};
  const log = d.log || defaultLog;
  const lom = d.lom || null;
  const engine = d.engine || null;
  const game = d.game || null;
  const port = d.port !== undefined ? d.port : envPort();

  const { WebSocketServer } = require("ws");

  // One HTTP server carries both the built UI and the WebSocket upgrade, so
  // there is a single port to configure and jweb loads the page same origin.
  const httpServer = http.createServer(serveStatic);
  const wss = new WebSocketServer({ server: httpServer });
  await new Promise(function (resolve, reject) {
    httpServer.once("error", reject);
    httpServer.listen(port, "127.0.0.1", resolve);
  });

  let pushCounter = 0;
  let lastSnapshot = null;

  function nextPushId() {
    pushCounter += 1;
    return "srv_" + pushCounter;
  }

  function sendFrame(ws, frame) {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(frame));
    }
  }

  function broadcast(type, payload) {
    const frame = { v: 1, id: nextPushId(), type: type, payload: payload };
    for (const client of wss.clients) {
      sendFrame(client, frame);
    }
    return frame;
  }

  function replyError(ws, id, code, message) {
    sendFrame(ws, {
      v: 1,
      id: id === undefined ? null : id,
      type: "error",
      payload: { code: code, message: message }
    });
  }

  function requireModule(mod, name) {
    if (!mod) {
      throw errorWithCode(
        "internal",
        "The " + name + " module is not loaded (partial build or startup failure). See the Max window or console log."
      );
    }
  }

  async function refreshSnapshot() {
    requireModule(lom, "lom");
    const snapshot = await lom.getSession();
    lastSnapshot = snapshot;
    return snapshot;
  }

  function pickTrackIndex(suggestion) {
    if (suggestion.clip && Number.isInteger(suggestion.clip.suggestedTrackIndex)) {
      return suggestion.clip.suggestedTrackIndex;
    }
    if (lastSnapshot && Array.isArray(lastSnapshot.tracks)) {
      for (const track of lastSnapshot.tracks) {
        if (track.isMidi) {
          return track.index;
        }
      }
    }
    return 0;
  }

  function pickEmptySceneIndex(trackIndex) {
    if (!lastSnapshot || !Array.isArray(lastSnapshot.tracks)) {
      return 0;
    }
    const track = lastSnapshot.tracks.find(function (t) {
      return t.index === trackIndex;
    });
    if (!track) {
      return 0;
    }
    const occupied = new Set(track.clips.map(function (c) {
      return c.sceneIndex;
    }));
    let scene = 0;
    while (occupied.has(scene)) {
      scene += 1;
    }
    return scene;
  }

  function pushSessionState() {
    refreshSnapshot()
      .then(function (snapshot) {
        broadcast("session.state", { snapshot: snapshot });
      })
      .catch(function (err) {
        log("session.state push failed: " + (err && err.message ? err.message : err));
      });
  }

  // Request handlers. Each returns { type, payload } for the reply frame,
  // or throws (Error.code picks the error frame code, default "internal").
  const handlers = {
    "session.refresh": async function () {
      const snapshot = await refreshSnapshot();
      return { type: "session.state", payload: { snapshot: snapshot } };
    },

    "suggest.request": async function (payload) {
      requireModule(engine, "engine");
      if (typeof payload.question !== "string" || typeof payload.genre !== "string") {
        throw errorWithCode("bad_request", "suggest.request needs a question string and a genre string");
      }
      let snapshot = lastSnapshot;
      if (lom) {
        try {
          snapshot = await refreshSnapshot();
        } catch (err) {
          log("suggest.request: could not refresh the session, using the cached snapshot. " + err.message);
        }
      }
      const suggestion = await engine.suggest(
        {
          question: payload.question,
          genre: payload.genre,
          kind: payload.kind,
          context: payload.context
        },
        snapshot
      );
      return { type: "suggest.result", payload: { suggestion: suggestion } };
    },

    "suggest.commit": async function (payload) {
      requireModule(engine, "engine");
      requireModule(lom, "lom");
      if (typeof payload.suggestionId !== "string") {
        throw errorWithCode("bad_request", "suggest.commit needs a suggestionId string");
      }
      const suggestion = engine.getSuggestion(payload.suggestionId);
      if (!suggestion) {
        throw errorWithCode("engine_error", "Unknown suggestion id: " + payload.suggestionId);
      }
      if (!suggestion.clip) {
        throw errorWithCode("bad_request", "Suggestion " + payload.suggestionId + " has no clip to commit");
      }
      const trackIndex = Number.isInteger(payload.trackIndex) ? payload.trackIndex : pickTrackIndex(suggestion);
      const sceneIndex = Number.isInteger(payload.sceneIndex) ? payload.sceneIndex : pickEmptySceneIndex(trackIndex);
      const created = await lom.createClip(trackIndex, sceneIndex, suggestion.clip.lengthBeats);
      await lom.setNotes(created.clipPath, suggestion.clip.notes || []);
      if (game) {
        try {
          game.recordEvent({ type: "suggestion-committed", kind: suggestion.kind, genre: suggestion.genre });
        } catch (err) {
          log("game.recordEvent failed after commit: " + err.message);
        }
      }
      pushSessionState();
      return {
        type: "suggest.committed",
        payload: {
          clipPath: created.clipPath,
          trackIndex: created.trackIndex,
          sceneIndex: created.sceneIndex
        }
      };
    },

    "game.get": async function () {
      requireModule(game, "game");
      return { type: "game.state", payload: { game: game.getState() } };
    },

    "lesson.list": async function () {
      requireModule(game, "game");
      return { type: "lesson.catalog", payload: { lessons: game.listLessons() } };
    },

    "lesson.complete": async function (payload) {
      requireModule(game, "game");
      if (typeof payload.lessonId !== "string") {
        throw errorWithCode("bad_request", "lesson.complete needs a lessonId string");
      }
      try {
        const state = game.completeLesson(payload.lessonId);
        return { type: "game.state", payload: { game: state } };
      } catch (err) {
        if (err && (err.message === "locked" || err.message === "unknown_lesson")) {
          throw errorWithCode("bad_request", "lesson.complete failed: " + err.message);
        }
        throw err;
      }
    },

    "milestone.set": async function (payload) {
      requireModule(game, "game");
      if (typeof payload.songId !== "string" || typeof payload.milestone !== "string") {
        throw errorWithCode("bad_request", "milestone.set needs a songId string and a milestone string");
      }
      return { type: "game.state", payload: { game: game.setMilestone(payload.songId, payload.milestone) } };
    }
  };

  async function handleMessage(ws, data) {
    let frame = null;
    try {
      frame = JSON.parse(String(data));
    } catch (err) {
      replyError(ws, null, "bad_request", "Frame is not valid JSON");
      return;
    }
    const id = frame && typeof frame === "object" && "id" in frame ? frame.id : null;
    if (!frame || typeof frame !== "object" || typeof frame.type !== "string") {
      replyError(ws, id, "bad_request", "Frame must be a JSON object with a string type");
      return;
    }
    const handler = handlers[frame.type];
    if (!handler) {
      replyError(ws, id, "bad_request", "Unknown request type: " + frame.type);
      return;
    }
    try {
      const result = await handler(frame.payload && typeof frame.payload === "object" ? frame.payload : {}, ws);
      sendFrame(ws, { v: 1, id: id, type: result.type, payload: result.payload });
    } catch (err) {
      const code = knownCode(err) || "internal";
      replyError(ws, id, code, err && err.message ? err.message : "Unhandled error");
      if (code === "internal") {
        log("request " + frame.type + " failed: " + (err && err.stack ? err.stack : err));
      }
    }
  }

  wss.on("connection", function (ws) {
    ws.on("error", function (err) {
      log("client socket error: " + err.message);
    });
    ws.on("message", function (data) {
      handleMessage(ws, data).catch(function (err) {
        // Last-ditch guard so one bad request can never take the process down.
        log("unhandled dispatch failure: " + (err && err.stack ? err.stack : err));
        replyError(ws, null, "internal", "Unhandled server error");
      });
    });
    // Contract Section 2: push session.state on device load. Each new client
    // gets a fresh snapshot on connect.
    if (lom) {
      refreshSnapshot()
        .then(function (snapshot) {
          sendFrame(ws, { v: 1, id: nextPushId(), type: "session.state", payload: { snapshot: snapshot } });
        })
        .catch(function (err) {
          log("initial session.state push failed: " + (err && err.message ? err.message : err));
        });
    }
  });

  // Contract Section 2 pushes driven by the game module.
  if (game && typeof game.onChange === "function") {
    game.onChange(function (state) {
      broadcast("game.state", { game: state });
    });
  }
  if (game && typeof game.onLessonUnlocked === "function") {
    game.onLessonUnlocked(function (lesson) {
      broadcast("lesson.unlocked", { lesson: lesson });
    });
  }

  return {
    wss: wss,
    port: httpServer.address().port,
    broadcast: broadcast,
    close: function () {
      for (const client of wss.clients) {
        client.terminate();
      }
      return new Promise(function (resolve) {
        wss.close(function () {
          httpServer.close(function () {
            resolve();
          });
        });
      });
    }
  };
}

// ---------------------------------------------------------------------------
// Real startup (inside node.script, or standalone via `node node/main.js`).
// ---------------------------------------------------------------------------

function tryRequire(id, label, log) {
  try {
    return require(id);
  } catch (err) {
    log("Module " + label + " is not available yet: " + err.message);
    return null;
  }
}

// Standalone stand-in for lom: rejects immediately so the UI's mock mode
// kicks in fast instead of waiting out the 5 second timeout.
function createUnavailableLom() {
  function unavailable(method) {
    return Promise.reject(errorWithCode("lom_unavailable", "LOM is unavailable outside Max (" + method + ")"));
  }
  return {
    getSession: function () { return unavailable("getSession"); },
    createClip: function () { return unavailable("createClip"); },
    setNotes: function () { return unavailable("setNotes"); },
    getNotes: function () { return unavailable("getNotes"); },
    roundtripTest: function () { return unavailable("roundtripTest"); }
  };
}

async function start() {
  const log = defaultLog;

  let maxApi = null;
  try {
    maxApi = require("max-api");
  } catch (err) {
    maxApi = null;
  }
  const insideMax = maxApi !== null;
  if (!insideMax) {
    log("max-api not found, running standalone. LOM requests will fail fast with lom_unavailable.");
  }

  let lom;
  if (insideMax) {
    const { createLom } = require("./lom");
    lom = createLom(maxApi);
  } else {
    lom = createUnavailableLom();
  }

  // engine and game are built by other agents against CONTRACT Section 5.
  // They may be missing in a partial build; requests that need them then get
  // error frames with code "internal" instead of crashing the process.
  let engine = null;
  const engineMod = tryRequire("./engine", "engine", log);
  if (engineMod && typeof engineMod.createEngine === "function") {
    try {
      engine = engineMod.createEngine({ packsDir: path.join(PROJECT_ROOT, "packs") });
    } catch (err) {
      log("engine failed to initialize: " + err.message);
    }
  } else if (engineMod) {
    log("engine module loaded but createEngine is missing, skipping it");
  }

  let game = null;
  const gameMod = tryRequire("./game", "game", log);
  if (gameMod && typeof gameMod.createGame === "function") {
    try {
      game = gameMod.createGame({
        dataDir: path.join(PROJECT_ROOT, "data"),
        lessonsDir: path.join(PROJECT_ROOT, "lessons")
      });
    } catch (err) {
      log("game failed to initialize: " + err.message);
    }
  } else if (gameMod) {
    log("game module loaded but createGame is missing, skipping it");
  }

  const server = await createServer({ lom: lom, engine: engine, game: game, port: envPort(), log: log });
  log("WebSocket server listening on ws://127.0.0.1:" + server.port);

  if (insideMax) {
    // The round trip test button in the patcher sends the message "roundtrip"
    // into node.script, which lands here.
    maxApi.addHandler("roundtrip", async function () {
      maxApi.post("CoProducer: running the LOM round trip test");
      try {
        const result = await lom.roundtripTest();
        maxApi.post("CoProducer round trip " + (result.ok ? "PASS" : "FAIL") + ": " + JSON.stringify(result));
      } catch (err) {
        maxApi.post("CoProducer round trip ERROR: " + (err && err.message ? err.message : err));
      }
    });
    maxApi.post("CoProducer node backend ready on port " + server.port);
  }

  if (game) {
    try {
      game.recordEvent({ type: "session-open" });
    } catch (err) {
      log("game.recordEvent(session-open) failed: " + err.message);
    }
  }

  return server;
}

module.exports = { createServer, start };

// Decide whether this process should start the server.
//
// `require.main === module` is true when run as `node node/main.js`, but it is
// NOT reliable inside node.script: Node for Max can load the script through its
// own bootstrap, which makes the wrapper the main module. When that happens
// start() never runs, so the device loads with no error anywhere, nothing
// listens on the port, and the round trip button reports
// Unhandled Message: "roundtrip" because addHandler was never reached.
//
// So also start when max-api resolves, which is only true inside Node for Max.
// max-api is not an installed dependency (Node for Max injects it), so this
// stays false under `npm test`, where main.test.js imports createServer only.
function shouldAutoStart() {
  if (require.main === module) return true;
  try {
    require.resolve("max-api");
    return true;
  } catch (err) {
    return false;
  }
}

if (shouldAutoStart()) {
  // Surface anything that would otherwise die silently inside node.script.
  process.on("uncaughtException", function (err) {
    defaultLog("uncaught exception: " + (err && err.stack ? err.stack : err));
  });
  process.on("unhandledRejection", function (err) {
    defaultLog("unhandled rejection: " + (err && err.stack ? err.stack : err));
  });

  fileLog("--- backend starting (pid " + process.pid + ") ---");
  start().catch(function (err) {
    defaultLog("fatal startup error: " + (err && err.stack ? err.stack : err));
    process.exitCode = 1;
  });
}
