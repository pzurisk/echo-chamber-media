"use strict";

const test = require("node:test");
const assert = require("node:assert");
const WebSocket = require("ws");
const { createServer } = require("./main");

const SNAPSHOT = {
  tempo: 120,
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
          clipPath: "live_set tracks 0 clip_slots 0 clip"
        }
      ]
    }
  ],
  selected: { trackIndex: 0, sceneIndex: 0 }
};

const SUGGESTION = {
  id: "sug_1",
  kind: "chord-progression",
  genre: "deftones",
  summary: "Try i to bVI to iv to v",
  detail: "Concrete guidance.",
  theory: "Why it works.",
  clip: {
    lengthBeats: 16,
    suggestedTrackIndex: 0,
    notes: [{ pitch: 60, startBeats: 0, durationBeats: 1, velocity: 96, muted: false }]
  },
  source: "rules"
};

function makeStubs() {
  const calls = [];
  const gameCallbacks = { onChange: null, onLessonUnlocked: null };
  const lom = {
    getSession: async function () {
      calls.push(["getSession"]);
      return SNAPSHOT;
    },
    createClip: async function (trackIndex, sceneIndex, lengthBeats) {
      calls.push(["createClip", trackIndex, sceneIndex, lengthBeats]);
      return {
        clipPath: "live_set tracks " + trackIndex + " clip_slots " + sceneIndex + " clip",
        trackIndex: trackIndex,
        sceneIndex: sceneIndex
      };
    },
    setNotes: async function (clipPath, notes) {
      calls.push(["setNotes", clipPath, notes]);
    },
    getNotes: async function () {
      return [];
    },
    roundtripTest: async function () {
      return { ok: true, written: [], read: [] };
    }
  };
  const engine = {
    suggest: async function (params, snapshot) {
      calls.push(["suggest", params, snapshot]);
      return SUGGESTION;
    },
    getSuggestion: function (id) {
      calls.push(["getSuggestion", id]);
      return id === SUGGESTION.id ? SUGGESTION : null;
    },
    listGenres: function () {
      return ["deftones"];
    }
  };
  const gameState = { xp: 10, level: 1, streak: { count: 1, lastActiveDate: "2026-08-03" }, lessonsCompleted: [], songs: {} };
  const game = {
    getState: function () {
      return gameState;
    },
    listLessons: function () {
      return [];
    },
    completeLesson: function (lessonId) {
      calls.push(["completeLesson", lessonId]);
      if (lessonId === "locked-lesson") {
        throw new Error("locked");
      }
      return gameState;
    },
    setMilestone: function (songId, milestone) {
      calls.push(["setMilestone", songId, milestone]);
      return gameState;
    },
    recordEvent: function (evt) {
      calls.push(["recordEvent", evt]);
    },
    onChange: function (cb) {
      gameCallbacks.onChange = cb;
    },
    onLessonUnlocked: function (cb) {
      gameCallbacks.onLessonUnlocked = cb;
    }
  };
  return { lom: lom, engine: engine, game: game, calls: calls, gameCallbacks: gameCallbacks };
}

function connect(port) {
  return new Promise(function (resolve, reject) {
    const ws = new WebSocket("ws://127.0.0.1:" + port);
    ws.on("open", function () {
      resolve(ws);
    });
    ws.on("error", reject);
  });
}

function request(ws, frame, timeoutMs) {
  return new Promise(function (resolve, reject) {
    const timer = setTimeout(function () {
      ws.off("message", onMessage);
      reject(new Error("no reply for " + frame.id + " within " + (timeoutMs || 1000) + " ms"));
    }, timeoutMs || 1000);
    function onMessage(data) {
      const msg = JSON.parse(String(data));
      if (msg.id === frame.id) {
        clearTimeout(timer);
        ws.off("message", onMessage);
        resolve(msg);
      }
    }
    ws.on("message", onMessage);
    ws.send(JSON.stringify(frame));
  });
}

function nextMessage(ws, predicate, timeoutMs) {
  return new Promise(function (resolve, reject) {
    const timer = setTimeout(function () {
      ws.off("message", onMessage);
      reject(new Error("expected message did not arrive"));
    }, timeoutMs || 1000);
    function onMessage(data) {
      const msg = JSON.parse(String(data));
      if (!predicate || predicate(msg)) {
        clearTimeout(timer);
        ws.off("message", onMessage);
        resolve(msg);
      }
    }
    ws.on("message", onMessage);
  });
}

async function withServer(t, overrides, fn) {
  const stubs = makeStubs();
  const deps = Object.assign(
    { lom: stubs.lom, engine: stubs.engine, game: stubs.game, port: 0, log: function () {} },
    overrides || {}
  );
  const server = await createServer(deps);
  t.after(function () {
    return server.close();
  });
  const ws = await connect(server.port);
  t.after(function () {
    ws.terminate();
  });
  await fn({ server: server, ws: ws, stubs: stubs });
}

test("session.refresh round trips and echoes the request id", async function (t) {
  await withServer(t, null, async function (ctx) {
    const reply = await request(ctx.ws, { v: 1, id: "t1", type: "session.refresh", payload: {} });
    assert.strictEqual(reply.v, 1);
    assert.strictEqual(reply.id, "t1");
    assert.strictEqual(reply.type, "session.state");
    assert.deepStrictEqual(reply.payload.snapshot, SNAPSHOT);
  });
});

test("unknown request type gets a bad_request error frame with the id echoed", async function (t) {
  await withServer(t, null, async function (ctx) {
    const reply = await request(ctx.ws, { v: 1, id: "t2", type: "nope.nothing", payload: {} });
    assert.strictEqual(reply.id, "t2");
    assert.strictEqual(reply.type, "error");
    assert.strictEqual(reply.payload.code, "bad_request");
    assert.match(reply.payload.message, /nope\.nothing/);
  });
});

test("malformed JSON gets a bad_request error frame with id null", async function (t) {
  await withServer(t, null, async function (ctx) {
    const pendingError = nextMessage(ctx.ws, function (msg) {
      return msg.type === "error";
    });
    ctx.ws.send("this is not json");
    const reply = await pendingError;
    assert.strictEqual(reply.id, null);
    assert.strictEqual(reply.payload.code, "bad_request");
  });
});

test("suggest.commit runs getSuggestion, createClip, setNotes, recordEvent and replies suggest.committed", async function (t) {
  await withServer(t, null, async function (ctx) {
    const reply = await request(ctx.ws, {
      v: 1,
      id: "t3",
      type: "suggest.commit",
      payload: { suggestionId: "sug_1", trackIndex: 0, sceneIndex: 1 }
    });
    assert.strictEqual(reply.id, "t3");
    assert.strictEqual(reply.type, "suggest.committed");
    assert.deepStrictEqual(reply.payload, {
      clipPath: "live_set tracks 0 clip_slots 1 clip",
      trackIndex: 0,
      sceneIndex: 1
    });
    const names = ctx.stubs.calls.map(function (c) { return c[0]; });
    assert.ok(names.includes("getSuggestion"));
    assert.ok(names.includes("createClip"));
    assert.ok(names.includes("setNotes"));
    const recordCall = ctx.stubs.calls.find(function (c) { return c[0] === "recordEvent" && c[1].type === "suggestion-committed"; });
    assert.ok(recordCall, "recordEvent(suggestion-committed) should be called");
    assert.strictEqual(recordCall[1].kind, "chord-progression");
    assert.strictEqual(recordCall[1].genre, "deftones");
  });
});

test("suggest.commit with an unknown suggestion id replies engine_error", async function (t) {
  await withServer(t, null, async function (ctx) {
    const reply = await request(ctx.ws, {
      v: 1,
      id: "t4",
      type: "suggest.commit",
      payload: { suggestionId: "sug_missing" }
    });
    assert.strictEqual(reply.type, "error");
    assert.strictEqual(reply.payload.code, "engine_error");
  });
});

test("requests needing a missing module reply with code internal", async function (t) {
  await withServer(t, { engine: null }, async function (ctx) {
    const reply = await request(ctx.ws, {
      v: 1,
      id: "t5",
      type: "suggest.request",
      payload: { question: "need a chorus", genre: "deftones" }
    });
    assert.strictEqual(reply.id, "t5");
    assert.strictEqual(reply.type, "error");
    assert.strictEqual(reply.payload.code, "internal");
    assert.match(reply.payload.message, /engine/);
  });
});

test("lom errors map to their own code, not internal", async function (t) {
  const failingLom = {
    getSession: async function () {
      const err = new Error("LOM request timed out after 5000 ms: lom_get_session");
      err.code = "lom_timeout";
      throw err;
    }
  };
  await withServer(t, { lom: failingLom }, async function (ctx) {
    const reply = await request(ctx.ws, { v: 1, id: "t6", type: "session.refresh", payload: {} });
    assert.strictEqual(reply.type, "error");
    assert.strictEqual(reply.payload.code, "lom_timeout");
  });
});

test("lesson.complete on a locked lesson replies bad_request", async function (t) {
  await withServer(t, null, async function (ctx) {
    const reply = await request(ctx.ws, {
      v: 1,
      id: "t7",
      type: "lesson.complete",
      payload: { lessonId: "locked-lesson" }
    });
    assert.strictEqual(reply.type, "error");
    assert.strictEqual(reply.payload.code, "bad_request");
    assert.match(reply.payload.message, /locked/);
  });
});

test("game.onChange fires a game.state push to connected clients", async function (t) {
  await withServer(t, null, async function (ctx) {
    assert.strictEqual(typeof ctx.stubs.gameCallbacks.onChange, "function");
    const pendingPush = nextMessage(ctx.ws, function (msg) {
      return msg.type === "game.state" && String(msg.id).indexOf("srv_") === 0;
    });
    ctx.stubs.gameCallbacks.onChange({ xp: 999, level: 4, streak: { count: 2, lastActiveDate: "2026-08-03" }, lessonsCompleted: [], songs: {} });
    const push = await pendingPush;
    assert.strictEqual(push.payload.game.xp, 999);
  });
});

test("game.get replies with the game state and echoes the id", async function (t) {
  await withServer(t, null, async function (ctx) {
    const reply = await request(ctx.ws, { v: 1, id: "t8", type: "game.get", payload: {} });
    assert.strictEqual(reply.id, "t8");
    assert.strictEqual(reply.type, "game.state");
    assert.strictEqual(reply.payload.game.xp, 10);
  });
});
