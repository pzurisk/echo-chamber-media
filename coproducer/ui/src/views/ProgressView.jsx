import { useState } from "react";
import { levelProgress } from "../lib/levels";

// Milestone order and copy. XP values mirror CONTRACT Section 5:
// milestones 100 each, arrangement 150, export 200.
const MILESTONES = [
  { id: "verse", label: "Verse written", xp: 100 },
  { id: "chorus", label: "Chorus written", xp: 100 },
  { id: "bridge", label: "Bridge written", xp: 100 },
  { id: "arrangement", label: "Arrangement complete", xp: 150 },
  { id: "mix", label: "Mixed", xp: 100 },
  { id: "export", label: "Exported", xp: 200 },
];

// Progress view: XP, level, streak, and per-song milestone checklists from
// GameState (CONTRACT Section 4). Setting a milestone sends milestone.set and
// takes the returned game.state as the new truth.
export default function ProgressView({ game, request, onGame }) {
  const [pending, setPending] = useState(null);
  const [error, setError] = useState(null);

  if (!game) {
    return <div className="py-16 text-center text-sm text-faint">Loading progress</div>;
  }

  const progress = levelProgress(game.xp);
  const songs = Object.entries(game.songs);

  async function setMilestone(songId, milestone) {
    const key = songId + ":" + milestone;
    if (pending) return;
    setPending(key);
    setError(null);
    try {
      const res = await request("milestone.set", { songId, milestone });
      onGame(res.payload.game);
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <div className="panel min-w-[9rem] flex-1 px-4 py-3">
          <div className="label mb-1">Total XP</div>
          <div className="font-mono text-2xl">{game.xp}</div>
        </div>
        <div className="panel min-w-[9rem] flex-1 px-4 py-3">
          <div className="label mb-1">Level</div>
          <div className="font-mono text-2xl">{progress.level}</div>
          <div className="mt-0.5 text-xs text-faint">next at {progress.ceil} XP</div>
        </div>
        <div className="panel min-w-[9rem] flex-1 px-4 py-3">
          <div className="label mb-1">Streak</div>
          <div className="font-mono text-2xl">
            {game.streak.count}
            <span className="ml-1.5 font-sans text-sm text-dim">
              {game.streak.count === 1 ? "day" : "days"}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-faint">
            last active {game.streak.lastActiveDate}
          </div>
        </div>
      </div>

      <div className="panel p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm">Level {progress.level}</span>
          <span className="text-sm text-dim">Level {progress.level + 1}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-raised">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: (progress.fraction * 100).toFixed(1) + "%" }}
          />
        </div>
        <div className="mt-2 font-mono text-xs text-faint">
          {progress.into} / {progress.span} XP this level, {progress.remaining} to go
        </div>
      </div>

      {error ? <p className="text-sm text-warn">Could not set the milestone: {error}</p> : null}

      <div>
        <div className="label mb-2">Songs</div>
        <div className="grid gap-3 md:grid-cols-2">
          {songs.map(([songId, song]) => (
            <SongCard
              key={songId}
              songId={songId}
              milestones={song.milestones}
              pending={pending}
              onSet={setMilestone}
            />
          ))}
        </div>
        {songs.length === 0 ? (
          <p className="text-sm text-faint">
            No songs tracked yet. The current set name becomes a song the first time you set
            a milestone.
          </p>
        ) : null}
        <p className="mt-3 text-xs text-faint">
          Milestones lock in when set. XP is granted once per song and milestone.
        </p>
      </div>
    </div>
  );
}

function SongCard({ songId, milestones, pending, onSet }) {
  const done = MILESTONES.filter((m) => milestones[m.id]).length;
  return (
    <div className="panel p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium">{songId}</h3>
        <span className="font-mono text-xs text-faint">
          {done} of {MILESTONES.length}
        </span>
      </div>
      <ul className="mt-3 space-y-1">
        {MILESTONES.map((m) => {
          const isDone = Boolean(milestones[m.id]);
          const isPending = pending === songId + ":" + m.id;
          return (
            <li key={m.id}>
              <button
                onClick={() => onSet(songId, m.id)}
                disabled={isDone || Boolean(pending)}
                className={
                  "flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left text-sm " +
                  "transition-colors duration-150 " +
                  (isDone
                    ? "text-ink"
                    : "text-dim hover:bg-raised hover:text-ink disabled:hover:bg-transparent")
                }
              >
                <span
                  className={
                    "flex h-4 w-4 items-center justify-center rounded-sm border " +
                    (isDone
                      ? "border-accent bg-accent/20 text-accent"
                      : "border-edge2 " + (isPending ? "animate-pulse" : ""))
                  }
                  aria-hidden="true"
                >
                  {isDone ? (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6.5L4.5 9L10 3.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </span>
                {m.label}
                <span className="ml-auto font-mono text-[11px] text-faint">+{m.xp}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
