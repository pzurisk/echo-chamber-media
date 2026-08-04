// Wire protocol helpers for the CoProducer WebSocket contract (docs/CONTRACT.md Section 2).
// Every frame is one JSON object: { v: 1, id, type, payload }.
// Pure logic with no DOM or socket references, so node --test can exercise it directly.

export const PROTOCOL_VERSION = 1;

export function isValidFrame(obj) {
  return (
    obj !== null &&
    typeof obj === "object" &&
    obj.v === PROTOCOL_VERSION &&
    typeof obj.id === "string" &&
    typeof obj.type === "string"
  );
}

// Builds request frames and matches incoming frames back to the promise that
// is waiting on them. The sender sets id, the responder echoes it, and a frame
// whose id matches nothing pending is a server push.
export function createCorrelator(prefix = "m") {
  let seq = 0;
  const pending = new Map();

  function createRequest(type, payload = {}) {
    seq += 1;
    const id = prefix + "_" + seq;
    const frame = { v: PROTOCOL_VERSION, id, type, payload };
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    pending.set(id, { resolve, reject });
    return { id, frame, promise };
  }

  // Returns true when the frame answered a pending request, false when the
  // caller should treat it as a push.
  function handleFrame(frame) {
    if (!isValidFrame(frame)) return false;
    const entry = pending.get(frame.id);
    if (!entry) return false;
    pending.delete(frame.id);
    if (frame.type === "error") {
      const p = frame.payload || {};
      const err = new Error(p.message || "Request failed");
      err.code = p.code || "internal";
      entry.reject(err);
    } else {
      entry.resolve({ type: frame.type, payload: frame.payload });
    }
    return true;
  }

  function abort(id, error) {
    const entry = pending.get(id);
    if (!entry) return false;
    pending.delete(id);
    entry.reject(error || makeError("internal", "Request aborted"));
    return true;
  }

  function rejectAll(error) {
    const err = error || makeError("internal", "Connection lost");
    for (const entry of pending.values()) entry.reject(err);
    pending.clear();
  }

  return {
    createRequest,
    handleFrame,
    abort,
    rejectAll,
    get pendingCount() {
      return pending.size;
    },
  };
}

export function makeError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

// Capped exponential backoff for reconnect attempts. Deterministic on purpose,
// callers add jitter if they want it.
export function backoffDelay(attempt, { base = 500, factor = 2, cap = 15000 } = {}) {
  const n = Math.max(0, Math.floor(attempt));
  return Math.min(cap, base * Math.pow(factor, n));
}
