import { useState } from "react";

// Session view: tempo, time signature, set name, and a compact track/clip grid
// from the SessionSnapshot (CONTRACT Section 4). Tracks are columns and scenes
// are rows, matching how Live's session view reads.
export default function SessionView({ snapshot, request, onSnapshot }) {
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  async function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    setError(null);
    try {
      const res = await request("session.refresh");
      onSnapshot(res.payload.snapshot);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  if (!snapshot) {
    return <div className="py-16 text-center text-sm text-faint">Reading the session</div>;
  }

  const { tempo, timeSignature, isPlaying, setName, tracks, selected } = snapshot;
  const sceneCount = Math.max(
    1,
    ...tracks.map((t) => (t.clips.length ? Math.max(...t.clips.map((c) => c.sceneIndex)) + 1 : 0))
  );
  const scenes = Array.from({ length: sceneCount }, (_, i) => i);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-stretch gap-3">
        <Stat label="Set">
          <span className="text-lg font-medium">{setName}</span>
        </Stat>
        <Stat label="Tempo">
          <span className="font-mono text-lg">{Number(tempo).toFixed(1)}</span>
          <span className="ml-1.5 text-xs text-faint">BPM</span>
        </Stat>
        <Stat label="Time signature">
          <span className="font-mono text-lg">
            {timeSignature.numerator}/{timeSignature.denominator}
          </span>
        </Stat>
        <Stat label="Transport">
          <span className="flex items-center gap-2 text-sm">
            <span
              className={
                "h-1.5 w-1.5 rounded-full " + (isPlaying ? "bg-ok" : "bg-faint")
              }
              aria-hidden="true"
            />
            {isPlaying ? "Playing" : "Stopped"}
          </span>
        </Stat>
        <button onClick={refresh} disabled={refreshing} className="btn ml-auto self-center">
          {refreshing ? "Reading" : "Refresh"}
        </button>
      </div>

      {error ? <p className="text-sm text-warn">Could not refresh: {error}</p> : null}

      <div className="panel overflow-x-auto">
        <div
          className="grid min-w-max"
          style={{
            gridTemplateColumns: "3rem repeat(" + tracks.length + ", minmax(10rem, 1fr))",
          }}
        >
          <div className="border-b border-edge px-3 py-2" />
          {tracks.map((track) => (
            <div
              key={track.index}
              className="flex items-baseline justify-between gap-2 border-b border-l border-edge px-3 py-2"
            >
              <span className="truncate text-sm font-medium">{track.name}</span>
              <span className="label">{track.isMidi ? "midi" : "audio"}</span>
            </div>
          ))}

          {scenes.map((sceneIndex) => (
            <SceneRow
              key={sceneIndex}
              sceneIndex={sceneIndex}
              tracks={tracks}
              selected={selected}
            />
          ))}
        </div>
      </div>

      <p className="text-xs text-faint">
        Note counts come from the last session read. Refresh after editing clips in Live.
      </p>
    </div>
  );
}

function SceneRow({ sceneIndex, tracks, selected }) {
  return (
    <>
      <div className="flex items-center justify-center border-b border-edge px-2 py-2 font-mono text-xs text-faint">
        {sceneIndex + 1}
      </div>
      {tracks.map((track) => {
        const clip = track.clips.find((c) => c.sceneIndex === sceneIndex);
        const isSelected =
          selected &&
          selected.trackIndex === track.index &&
          selected.sceneIndex === sceneIndex;
        return (
          <div
            key={track.index}
            className={
              "border-b border-l border-edge px-3 py-2 " +
              (isSelected ? "bg-accent/5" : "")
            }
          >
            {clip ? (
              <div
                className={
                  "rounded border px-2 py-1.5 " +
                  (isSelected ? "border-accent/60 bg-accent/10" : "border-edge2 bg-raised")
                }
              >
                <div className="truncate text-sm">{clip.name}</div>
                <div className="mt-0.5 font-mono text-[11px] text-faint">
                  {track.isMidi ? clip.noteCount + " notes" : "audio"}
                  {" · "}
                  {clip.lengthBeats} beats
                </div>
              </div>
            ) : (
              <div className="h-[46px] rounded border border-dashed border-edge/70" />
            )}
          </div>
        );
      })}
    </>
  );
}

function Stat({ label, children }) {
  return (
    <div className="panel px-4 py-2.5">
      <div className="label mb-1">{label}</div>
      <div className="flex items-baseline">{children}</div>
    </div>
  );
}
