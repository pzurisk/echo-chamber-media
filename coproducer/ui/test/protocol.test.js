import test from "node:test";
import assert from "node:assert/strict";
import {
  PROTOCOL_VERSION,
  isValidFrame,
  createCorrelator,
  backoffDelay,
} from "../src/lib/protocol.js";

test("createRequest builds a v1 envelope with a unique id", () => {
  const c = createCorrelator();
  const a = c.createRequest("session.refresh", {});
  const b = c.createRequest("game.get", {});
  assert.equal(a.frame.v, PROTOCOL_VERSION);
  assert.equal(a.frame.type, "session.refresh");
  assert.deepEqual(a.frame.payload, {});
  assert.notEqual(a.id, b.id);
  assert.equal(c.pendingCount, 2);
});

test("a response frame resolves the matching pending request", async () => {
  const c = createCorrelator();
  const req = c.createRequest("game.get", {});
  const consumed = c.handleFrame({
    v: 1,
    id: req.id,
    type: "game.state",
    payload: { game: { xp: 10 } },
  });
  assert.equal(consumed, true);
  const res = await req.promise;
  assert.equal(res.type, "game.state");
  assert.equal(res.payload.game.xp, 10);
  assert.equal(c.pendingCount, 0);
});

test("an error frame rejects with the contract error code", async () => {
  const c = createCorrelator();
  const req = c.createRequest("suggest.request", { question: "x", genre: "nin" });
  c.handleFrame({
    v: 1,
    id: req.id,
    type: "error",
    payload: { code: "llm_unavailable", message: "No key" },
  });
  await assert.rejects(req.promise, (err) => {
    assert.equal(err.code, "llm_unavailable");
    assert.equal(err.message, "No key");
    return true;
  });
});

test("frames that match nothing pending are pushes, not responses", () => {
  const c = createCorrelator();
  c.createRequest("game.get", {});
  const consumed = c.handleFrame({
    v: 1,
    id: "srv_9",
    type: "game.state",
    payload: { game: {} },
  });
  assert.equal(consumed, false);
  assert.equal(c.pendingCount, 1);
});

test("invalid frames are ignored", () => {
  const c = createCorrelator();
  assert.equal(c.handleFrame(null), false);
  assert.equal(c.handleFrame({ id: "m_1", type: "x" }), false);
  assert.equal(c.handleFrame({ v: 2, id: "m_1", type: "x" }), false);
  assert.equal(isValidFrame({ v: 1, id: "m_1", type: "x" }), true);
});

test("rejectAll clears every pending request", async () => {
  const c = createCorrelator();
  const a = c.createRequest("game.get", {});
  const b = c.createRequest("lesson.list", {});
  c.rejectAll(new Error("Connection lost"));
  await assert.rejects(a.promise, /Connection lost/);
  await assert.rejects(b.promise, /Connection lost/);
  assert.equal(c.pendingCount, 0);
});

test("backoffDelay grows exponentially and caps", () => {
  assert.equal(backoffDelay(0), 500);
  assert.equal(backoffDelay(1), 1000);
  assert.equal(backoffDelay(2), 2000);
  assert.equal(backoffDelay(4), 8000);
  assert.equal(backoffDelay(10), 15000);
  assert.equal(backoffDelay(100), 15000);
});
