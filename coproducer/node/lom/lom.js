"use strict";

// Node-side half of Transport B (docs/CONTRACT.md Sections 3 and 5).
// Wraps the [cmd, jsonString] wire protocol to the Max js LOM bridge in
// promises keyed by reqId.
//
// createLom(maxApi, options)
//   maxApi: the max-api module inside Node for Max, or a stub in tests.
//           Needs outlet(cmd, jsonString) and addHandler(name, fn).
//   options.timeoutMs: reply timeout, default 5000. Tests shrink it.
//
// Rejections carry Error.code:
//   "lom_timeout"     no lom_result arrived inside the timeout window
//   "lom_unavailable" the bridge replied ok:false (error string as message)

const DEFAULT_TIMEOUT_MS = 5000;

function createLom(maxApi, options) {
  const opts = options || {};
  const timeoutMs = typeof opts.timeoutMs === "number" ? opts.timeoutMs : DEFAULT_TIMEOUT_MS;
  const pending = new Map();
  let counter = 0;

  maxApi.addHandler("lom_result", function () {
    const parts = Array.prototype.slice.call(arguments);
    let msg = null;
    if (parts.length === 1 && parts[0] !== null && typeof parts[0] === "object") {
      // A stub (or a future max-api) may hand us the object directly.
      msg = parts[0];
    } else {
      // Max can split a symbol containing spaces into several atoms.
      // The bridge's JSON only has single spaces inside string values,
      // so a single-space rejoin restores the original string.
      const raw = parts.join(" ");
      try {
        msg = JSON.parse(raw);
      } catch (err) {
        return; // Not for us, ignore.
      }
    }
    if (!msg || typeof msg.reqId !== "string") {
      return;
    }
    const entry = pending.get(msg.reqId);
    if (!entry) {
      return; // Late reply after a timeout, or unknown reqId. Drop it.
    }
    pending.delete(msg.reqId);
    clearTimeout(entry.timer);
    if (msg.ok) {
      entry.resolve(msg.data);
    } else {
      const error = new Error(msg.error || "LOM request failed");
      error.code = "lom_unavailable";
      entry.reject(error);
    }
  });

  function send(cmd, params) {
    return new Promise(function (resolve, reject) {
      counter += 1;
      const reqId = "lom_" + counter;
      const timer = setTimeout(function () {
        pending.delete(reqId);
        const error = new Error("LOM request timed out after " + timeoutMs + " ms: " + cmd);
        error.code = "lom_timeout";
        reject(error);
      }, timeoutMs);
      pending.set(reqId, { resolve: resolve, reject: reject, timer: timer });
      const payload = Object.assign({ reqId: reqId }, params || {});
      maxApi.outlet(cmd, JSON.stringify(payload));
    });
  }

  return {
    // Promise<SessionSnapshot>
    getSession() {
      return send("lom_get_session", {});
    },
    // Promise<{ clipPath, trackIndex, sceneIndex }>
    createClip(trackIndex, sceneIndex, lengthBeats) {
      return send("lom_create_clip", {
        trackIndex: trackIndex,
        sceneIndex: sceneIndex,
        lengthBeats: lengthBeats
      });
    },
    // Promise<void>
    setNotes(clipPath, notes) {
      return send("lom_set_notes", { clipPath: clipPath, notes: notes }).then(function () {
        return undefined;
      });
    },
    // Promise<NoteEvent[]>
    getNotes(clipPath) {
      return send("lom_get_notes", { clipPath: clipPath }).then(function (data) {
        return data && Array.isArray(data.notes) ? data.notes : [];
      });
    },
    // Promise<{ ok, written, read }>
    roundtripTest() {
      return send("lom_roundtrip_test", {});
    }
  };
}

module.exports = { createLom };
