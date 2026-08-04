import { useCallback, useEffect, useRef, useState } from "react";
import { createBridge } from "./lib/bridge";
import SessionView from "./views/SessionView";
import StuckView from "./views/StuckView";
import ProgressView from "./views/ProgressView";
import LessonsView from "./views/LessonsView";
import StatusBadge from "./components/StatusBadge";
import Toasts from "./components/Toasts";

const VIEWS = [
  { id: "session", label: "Session" },
  { id: "stuck", label: "Stuck" },
  { id: "progress", label: "Progress" },
  { id: "lessons", label: "Lessons" },
];

let toastSeq = 0;

export default function App() {
  const [mode, setMode] = useState("connecting");
  const [view, setView] = useState("stuck");
  const [snapshot, setSnapshot] = useState(null);
  const [game, setGame] = useState(null);
  const [lessons, setLessons] = useState(null);
  const [history, setHistory] = useState([]);
  const [toasts, setToasts] = useState([]);

  const bridgeRef = useRef(null);
  const pushRef = useRef(() => {});

  const request = useCallback((type, payload = {}, opts) => {
    const bridge = bridgeRef.current;
    if (!bridge) return Promise.reject(new Error("Bridge not ready"));
    return bridge.request(type, payload, opts);
  }, []);

  const addToast = useCallback((title, body) => {
    toastSeq += 1;
    const id = toastSeq;
    setToasts((t) => [...t, { id, title, body }]);
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id));
    }, 4500);
  }, []);

  const refreshLessons = useCallback(() => {
    request("lesson.list")
      .then((res) => setLessons(res.payload.lessons))
      .catch(() => {});
  }, [request]);

  // Keep the push handler fresh without re-creating the bridge.
  pushRef.current = (type, payload) => {
    if (type === "game.state") {
      setGame(payload.game);
    } else if (type === "session.state") {
      setSnapshot(payload.snapshot);
    } else if (type === "lesson.unlocked") {
      addToast("Lesson unlocked", payload.lesson.title);
      refreshLessons();
    }
  };

  useEffect(() => {
    const bridge = createBridge({
      onStatus: (m) => setMode(m),
      onPush: (type, payload) => pushRef.current(type, payload),
    });
    bridgeRef.current = bridge;
    bridge.start();
    return () => bridge.dispose();
  }, []);

  // Initial load once the connection settles, and a re-sync whenever the
  // transport flips between live and mock.
  useEffect(() => {
    if (mode === "connecting") return;
    let cancelled = false;
    Promise.allSettled([
      request("session.refresh"),
      request("game.get"),
      request("lesson.list"),
    ]).then(([s, g, l]) => {
      if (cancelled) return;
      if (s.status === "fulfilled") setSnapshot(s.value.payload.snapshot);
      if (g.status === "fulfilled") setGame(g.value.payload.game);
      if (l.status === "fulfilled") setLessons(l.value.payload.lessons);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, request]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-edge bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm bg-accent" aria-hidden="true" />
            <span className="text-sm font-semibold tracking-wide">CoProducer</span>
          </div>
          <nav className="flex items-center gap-1">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={
                  "rounded px-3 py-1.5 text-sm transition-colors duration-150 " +
                  (view === v.id
                    ? "bg-raised text-accent"
                    : "text-dim hover:bg-panel hover:text-ink")
                }
              >
                {v.label}
              </button>
            ))}
          </nav>
          <div className="ml-auto">
            <StatusBadge mode={mode} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6">
        {view === "session" && (
          <SessionView snapshot={snapshot} request={request} onSnapshot={setSnapshot} />
        )}
        {view === "stuck" && (
          <StuckView
            request={request}
            snapshot={snapshot}
            history={history}
            setHistory={setHistory}
          />
        )}
        {view === "progress" && (
          <ProgressView game={game} request={request} onGame={setGame} />
        )}
        {view === "lessons" && (
          <LessonsView
            lessons={lessons}
            request={request}
            onGame={setGame}
            onLessons={setLessons}
            addToast={addToast}
          />
        )}
      </main>

      <footer className="border-t border-edge">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-2.5">
          <span className="font-mono text-[11px] text-faint">coproducer ui v0.1</span>
          <span className="font-mono text-[11px] text-faint">ws://127.0.0.1:7400</span>
        </div>
      </footer>

      <Toasts toasts={toasts} />
    </div>
  );
}
