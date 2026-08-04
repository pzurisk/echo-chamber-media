import { useState } from "react";

const KIND_LABELS = {
  "chord-progression": "Chord progression",
  structure: "Structure",
  production: "Production",
};

const GENRE_LABELS = {
  deftones: "Deftones",
  nin: "NIN",
  "pop-punk": "Pop punk",
};

export function kindLabel(kind) {
  return KIND_LABELS[kind] || kind;
}

export function genreLabel(genre) {
  return GENRE_LABELS[genre] || genre;
}

function trackName(snapshot, trackIndex) {
  const track = snapshot && snapshot.tracks.find((t) => t.index === trackIndex);
  return track ? track.name : "track " + trackIndex;
}

function Pill({ children, tone = "default" }) {
  const cls =
    tone === "accent"
      ? "border-accent/40 bg-accent/10 text-accent"
      : "border-edge bg-raised text-dim";
  return (
    <span className={"rounded-full border px-2.5 py-0.5 text-xs " + cls}>{children}</span>
  );
}

// Full rendering of one Suggestion (CONTRACT Section 4): summary large, detail
// below, theory as a "why this works" note, source shown subtly, and a commit
// button when the suggestion carries a clip.
export function SuggestionBody({ entry, snapshot, onCommit }) {
  const { suggestion, committed } = entry;
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState(null);

  async function commit() {
    if (writing || committed) return;
    setWriting(true);
    setError(null);
    try {
      await onCommit(suggestion);
    } catch (err) {
      setError(err.message);
    } finally {
      setWriting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <Pill tone="accent">{kindLabel(suggestion.kind)}</Pill>
        <Pill>{genreLabel(suggestion.genre)}</Pill>
        <span className="ml-auto font-mono text-[11px] text-faint">
          via {suggestion.source}
        </span>
      </div>

      <h3 className="mt-3 text-xl font-medium leading-snug">{suggestion.summary}</h3>
      <p className="mt-2 text-sm leading-relaxed text-dim">{suggestion.detail}</p>

      <div className="mt-4 border-l-2 border-accent/60 pl-3">
        <div className="label mb-1">Why this works</div>
        <p className="text-sm leading-relaxed text-ink/90">{suggestion.theory}</p>
      </div>

      {suggestion.clip ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-edge pt-4">
          <span className="font-mono text-xs text-faint">
            {suggestion.clip.lengthBeats} beats, {suggestion.clip.notes.length} notes
          </span>
          {committed ? (
            <span className="ml-auto flex items-center gap-2 text-sm text-ok">
              <CheckIcon />
              Written to {trackName(snapshot, committed.trackIndex)}, scene{" "}
              {committed.sceneIndex + 1}
            </span>
          ) : (
            <button onClick={commit} disabled={writing} className="btn-accent ml-auto">
              {writing ? "Writing clip" : "Write it into a clip"}
            </button>
          )}
        </div>
      ) : null}

      {committed ? (
        <div className="mt-1.5 text-right font-mono text-[11px] text-faint">
          {committed.clipPath}
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 text-right text-sm text-warn">Could not write the clip: {error}</p>
      ) : null}
    </div>
  );
}

// Collapsed row for the session history list, expandable to the full body.
export function HistoryRow({ entry, snapshot, onCommit }) {
  const [expanded, setExpanded] = useState(false);
  const { suggestion, committed, at } = entry;
  const time = new Date(at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="panel px-4 py-3">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="font-mono text-xs text-faint">{time}</span>
        <span className="truncate text-sm">{suggestion.summary}</span>
        <span className="ml-auto flex shrink-0 items-center gap-2">
          {committed ? (
            <span className="flex items-center gap-1 text-xs text-ok">
              <CheckIcon />
              in clip
            </span>
          ) : null}
          <span className="text-xs text-faint">{genreLabel(suggestion.genre)}</span>
          <Chevron open={expanded} />
        </span>
      </button>
      {expanded ? (
        <div className="mt-3 border-t border-edge pt-3">
          <SuggestionBody entry={entry} snapshot={snapshot} onCommit={onCommit} />
        </div>
      ) : null}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2 6.5L4.5 9L10 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Chevron({ open }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={"text-faint transition-transform duration-150 " + (open ? "rotate-180" : "")}
    >
      <path
        d="M2.5 4.5L6 8L9.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
