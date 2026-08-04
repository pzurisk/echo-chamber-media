import { useState } from "react";
import { kindLabel } from "../components/SuggestionCard";

const MILESTONE_NAMES = {
  verse: "verse",
  chorus: "chorus",
  bridge: "bridge",
  arrangement: "arrangement",
  mix: "mix",
  export: "export",
};

function unlockHint(lesson) {
  const u = lesson.unlock || {};
  if (u.type === "milestone") {
    return "Unlocks when a song hits the " + (MILESTONE_NAMES[u.milestone] || u.milestone) + " milestone";
  }
  if (u.type === "suggestion") {
    return "Unlocks the first time you write a " + kindLabel(u.kind).toLowerCase() + " suggestion into a clip";
  }
  return "Available from the start";
}

// Lessons view: cards from lesson.list with locked/unlocked/completed state,
// expandable body text, and a complete action that sends lesson.complete.
export default function LessonsView({ lessons, request, onGame, onLessons, addToast }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  if (!lessons) {
    return <div className="py-16 text-center text-sm text-faint">Loading lessons</div>;
  }

  async function complete(lesson) {
    if (busy) return;
    setBusy(lesson.id);
    setError(null);
    try {
      const res = await request("lesson.complete", { lessonId: lesson.id });
      onGame(res.payload.game);
      onLessons(
        lessons.map((l) => (l.id === lesson.id ? { ...l, completed: true } : l))
      );
      addToast("+" + lesson.xp + " XP", lesson.title);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  const unlockedCount = lessons.filter((l) => l.unlocked && !l.completed).length;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-lg font-medium">Lessons</h2>
          <p className="mt-1 text-sm text-dim">
            Each one is 60 to 90 seconds of reading, unlocked by what you actually do in the
            song.
          </p>
        </div>
        <span className="font-mono text-xs text-faint">{unlockedCount} ready</span>
      </div>

      {error ? <p className="text-sm text-warn">{error}</p> : null}

      <div className="space-y-2">
        {lessons.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            busy={busy === lesson.id}
            onComplete={() => complete(lesson)}
          />
        ))}
      </div>
    </div>
  );
}

function LessonCard({ lesson, busy, onComplete }) {
  const [expanded, setExpanded] = useState(false);
  const locked = !lesson.unlocked;
  const status = lesson.completed ? "Done" : locked ? "Locked" : "Ready";

  return (
    <div className={"panel px-4 py-3 " + (locked ? "opacity-70" : "")}>
      <button
        onClick={() => !locked && setExpanded((e) => !e)}
        className={"flex w-full items-center gap-3 text-left " + (locked ? "cursor-default" : "")}
      >
        <StatusPill status={status} />
        <span className={"truncate text-sm " + (locked ? "text-dim" : "font-medium")}>
          {lesson.title}
        </span>
        <span className="ml-auto shrink-0 font-mono text-xs text-faint">+{lesson.xp} XP</span>
      </button>

      {locked ? (
        <p className="mt-1.5 pl-[3.75rem] text-xs text-faint">{unlockHint(lesson)}</p>
      ) : null}

      {expanded && !locked ? (
        <div className="mt-3 border-t border-edge pt-3">
          <p className="text-sm leading-relaxed text-dim">{lesson.body}</p>
          {!lesson.completed ? (
            <div className="mt-3 flex justify-end">
              <button onClick={onComplete} disabled={busy} className="btn-accent">
                {busy ? "Saving" : "Mark complete, +" + lesson.xp + " XP"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function StatusPill({ status }) {
  const cls =
    status === "Done"
      ? "border-edge text-faint"
      : status === "Ready"
        ? "border-accent/40 bg-accent/10 text-accent"
        : "border-edge text-faint";
  return (
    <span className={"w-14 shrink-0 rounded-full border py-0.5 text-center text-[11px] " + cls}>
      {status}
    </span>
  );
}
