"use strict";

const test = require("node:test");
const assert = require("node:assert");
const { createLom } = require("./index");

function stubMaxApi() {
  const sent = [];
  const handlers = {};
  return {
    sent: sent,
    handlers: handlers,
    outlet: function () {
      sent.push(Array.prototype.slice.call(arguments));
    },
    addHandler: function (name, fn) {
      handlers[name] = fn;
    },
    reply: function (obj) {
      handlers.lom_result(JSON.stringify(obj));
    }
  };
}

test("registers a lom_result handler on creation", function () {
  const max = stubMaxApi();
  createLom(max);
  assert.strictEqual(typeof max.handlers.lom_result, "function");
});

test("lom_get_session goes out as exactly [cmd, jsonString]", async function () {
  const max = stubMaxApi();
  const lom = createLom(max);
  const promise = lom.getSession();
  assert.deepStrictEqual(max.sent, [["lom_get_session", "{\"reqId\":\"lom_1\"}"]]);
  max.reply({ reqId: "lom_1", ok: true, data: { tempo: 120 } });
  const data = await promise;
  assert.deepStrictEqual(data, { tempo: 120 });
});

test("createClip sends reqId plus trackIndex, sceneIndex, lengthBeats", async function () {
  const max = stubMaxApi();
  const lom = createLom(max);
  const promise = lom.createClip(1, 2, 8);
  assert.deepStrictEqual(max.sent, [[
    "lom_create_clip",
    "{\"reqId\":\"lom_1\",\"trackIndex\":1,\"sceneIndex\":2,\"lengthBeats\":8}"
  ]]);
  max.reply({
    reqId: "lom_1",
    ok: true,
    data: { clipPath: "live_set tracks 1 clip_slots 2 clip", trackIndex: 1, sceneIndex: 2 }
  });
  const data = await promise;
  assert.strictEqual(data.clipPath, "live_set tracks 1 clip_slots 2 clip");
});

test("correlates out of order replies by reqId", async function () {
  const max = stubMaxApi();
  const lom = createLom(max);
  const first = lom.getNotes("live_set tracks 0 clip_slots 0 clip");
  const second = lom.getNotes("live_set tracks 0 clip_slots 1 clip");
  assert.strictEqual(max.sent.length, 2);
  // Answer the second request first.
  max.reply({ reqId: "lom_2", ok: true, data: { notes: [{ pitch: 62 }] } });
  max.reply({ reqId: "lom_1", ok: true, data: { notes: [{ pitch: 60 }] } });
  const firstNotes = await first;
  const secondNotes = await second;
  assert.deepStrictEqual(firstNotes, [{ pitch: 60 }]);
  assert.deepStrictEqual(secondNotes, [{ pitch: 62 }]);
});

test("times out with Error.code lom_timeout when no reply arrives", async function () {
  const max = stubMaxApi();
  const lom = createLom(max, { timeoutMs: 25 });
  await assert.rejects(
    function () { return lom.getSession(); },
    function (err) {
      assert.strictEqual(err.code, "lom_timeout");
      assert.match(err.message, /lom_get_session/);
      return true;
    }
  );
});

test("rejects ok:false replies with the error string and code lom_unavailable", async function () {
  const max = stubMaxApi();
  const lom = createLom(max);
  const promise = lom.roundtripTest();
  max.reply({ reqId: "lom_1", ok: false, error: "No MIDI track in this set. Add a MIDI track and rerun the test." });
  await assert.rejects(promise, function (err) {
    assert.strictEqual(err.code, "lom_unavailable");
    assert.match(err.message, /No MIDI track/);
    return true;
  });
});

test("setNotes resolves undefined and sends clipPath plus notes", async function () {
  const max = stubMaxApi();
  const lom = createLom(max);
  const notes = [{ pitch: 60, startBeats: 0, durationBeats: 1, velocity: 96, muted: false }];
  const promise = lom.setNotes("live_set tracks 0 clip_slots 0 clip", notes);
  const wire = max.sent[0];
  assert.strictEqual(wire[0], "lom_set_notes");
  const payload = JSON.parse(wire[1]);
  assert.strictEqual(payload.reqId, "lom_1");
  assert.strictEqual(payload.clipPath, "live_set tracks 0 clip_slots 0 clip");
  assert.deepStrictEqual(payload.notes, notes);
  max.reply({ reqId: "lom_1", ok: true, data: { count: 1 } });
  const result = await promise;
  assert.strictEqual(result, undefined);
});

test("getNotes unwraps data.notes", async function () {
  const max = stubMaxApi();
  const lom = createLom(max);
  const promise = lom.getNotes("live_set tracks 0 clip_slots 0 clip");
  max.reply({
    reqId: "lom_1",
    ok: true,
    data: { notes: [{ pitch: 60, startBeats: 0, durationBeats: 0.5, velocity: 100, muted: false }] }
  });
  const notes = await promise;
  assert.strictEqual(notes.length, 1);
  assert.strictEqual(notes[0].pitch, 60);
});

test("reassembles a lom_result symbol that Max split on spaces", async function () {
  const max = stubMaxApi();
  const lom = createLom(max);
  const promise = lom.getSession();
  const full = JSON.stringify({ reqId: "lom_1", ok: true, data: { setName: "My Song" } });
  // Simulate Max splitting the symbol at its spaces.
  const parts = full.split(" ");
  assert.ok(parts.length > 1, "fixture should actually contain spaces");
  max.handlers.lom_result.apply(null, parts);
  const data = await promise;
  assert.strictEqual(data.setName, "My Song");
});

test("ignores unknown reqIds and junk without crashing", async function () {
  const max = stubMaxApi();
  const lom = createLom(max);
  max.reply({ reqId: "lom_999", ok: true, data: {} });
  max.handlers.lom_result("this is not json");
  // A real request still works afterwards.
  const promise = lom.getSession();
  max.reply({ reqId: "lom_1", ok: true, data: { tempo: 90 } });
  const data = await promise;
  assert.strictEqual(data.tempo, 90);
});

test("a late reply after timeout is dropped silently", async function () {
  const max = stubMaxApi();
  const lom = createLom(max, { timeoutMs: 10 });
  const promise = lom.getSession();
  await assert.rejects(promise, function (err) {
    return err.code === "lom_timeout";
  });
  // The late reply must not throw.
  max.reply({ reqId: "lom_1", ok: true, data: { tempo: 120 } });
});
