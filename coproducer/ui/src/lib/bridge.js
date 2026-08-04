// Connection bridge between the UI and the Node side of the device.
//
// Live mode: WebSocket client for ws://127.0.0.1:7400 per docs/CONTRACT.md
// Section 2, with request/response correlation by id and capped exponential
// backoff reconnects. Frames whose id matches no pending request are pushes.
//
// Mock mode: while the socket is down, requests route to the in-browser mock
// server so the whole UI keeps working outside Ableton. Reconnect attempts
// keep running in the background; when one lands, the app flips back to live.

import { createCorrelator, backoffDelay, isValidFrame, makeError } from "./protocol.js";
import { createMockServer } from "../mock/mockServer.js";

export const WS_URL = "ws://127.0.0.1:7400";

const CONNECT_TIMEOUT_MS = 4000;
const DEFAULT_REQUEST_TIMEOUT_MS = 10000;

// Modes: "connecting" (first attempt, nothing settled yet), "live", "mock".
export function createBridge({ url = WS_URL, onStatus, onPush } = {}) {
  const correlator = createCorrelator();
  let mode = "connecting";
  let ws = null;
  let attempt = 0;
  let retryTimer = null;
  let connectTimer = null;
  let disposed = false;

  const mock = createMockServer({
    onPush(type, payload) {
      // Suppress stale mock pushes if the real socket connected meanwhile.
      if (mode !== "live" && typeof onPush === "function") onPush(type, payload);
    },
  });

  function setMode(next) {
    if (mode === next) return;
    mode = next;
    if (typeof onStatus === "function") onStatus(next);
  }

  function clearTimers() {
    if (retryTimer) clearTimeout(retryTimer);
    if (connectTimer) clearTimeout(connectTimer);
    retryTimer = null;
    connectTimer = null;
  }

  function scheduleReconnect() {
    if (disposed || retryTimer) return;
    const delay = backoffDelay(attempt) * (0.85 + Math.random() * 0.3);
    attempt += 1;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      openSocket();
    }, delay);
  }

  function handleSocketDown() {
    if (connectTimer) clearTimeout(connectTimer);
    connectTimer = null;
    ws = null;
    correlator.rejectAll(makeError("internal", "Connection to Live was lost"));
    if (disposed) return;
    setMode("mock");
    scheduleReconnect();
  }

  function openSocket() {
    if (disposed) return;
    let socket;
    try {
      socket = new WebSocket(url);
    } catch (err) {
      handleSocketDown();
      return;
    }
    ws = socket;

    connectTimer = setTimeout(() => {
      // Connection is hanging. Close it; onclose runs the down path.
      try {
        socket.close();
      } catch (err) {
        handleSocketDown();
      }
    }, CONNECT_TIMEOUT_MS);

    socket.onopen = () => {
      if (disposed || ws !== socket) return;
      clearTimeout(connectTimer);
      connectTimer = null;
      attempt = 0;
      setMode("live");
    };

    socket.onmessage = (event) => {
      if (ws !== socket) return;
      let frame;
      try {
        frame = JSON.parse(event.data);
      } catch (err) {
        return;
      }
      if (!isValidFrame(frame)) return;
      if (correlator.handleFrame(frame)) return;
      if (typeof onPush === "function") onPush(frame.type, frame.payload);
    };

    socket.onclose = () => {
      if (ws !== socket) return;
      handleSocketDown();
    };
  }

  function request(type, payload = {}, { timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS } = {}) {
    if (mode === "live" && ws && ws.readyState === WebSocket.OPEN) {
      const { id, frame, promise } = correlator.createRequest(type, payload);
      const timer = setTimeout(() => {
        correlator.abort(id, makeError("timeout", "No response from the device"));
      }, timeoutMs);
      try {
        ws.send(JSON.stringify(frame));
      } catch (err) {
        clearTimeout(timer);
        correlator.abort(id, makeError("internal", "Could not send to the device"));
      }
      return promise.finally(() => clearTimeout(timer));
    }
    return mock.request(type, payload);
  }

  return {
    start: openSocket,
    request,
    getMode: () => mode,
    dispose() {
      disposed = true;
      clearTimers();
      correlator.rejectAll(makeError("internal", "Bridge disposed"));
      if (ws) {
        try {
          ws.close();
        } catch (err) {
          // Already closed, nothing to do.
        }
        ws = null;
      }
    },
  };
}
