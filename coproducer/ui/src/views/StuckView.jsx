import { useState } from "react";
import { SuggestionBody, HistoryRow, kindLabel } from "../components/SuggestionCard";

const GENRES = [
  { id: "deftones", label: "Deftones" },
  { id: "nin", label: "NIN" },
  { id: "pop-punk", label: "Pop punk" },
];

const KINDS = [
  { id: "any", label: "Any" },
  { id: "chord-progression", label: "Chord progression" },
  { id: "structure", label: "Structure" },
  { id: "production", label: "Production" },
];

const EXAMPLES = [
  "I have a verse progression, need a chorus",
  "The song stays flat, the chorus never lifts",
  "Verse and chorus exist, no idea what the bridge is",
];

// The "I'm stuck" flow. Sends suggest.request, renders the Suggestion, and
// offers suggest.commit when the suggestion carries a clip to audition.
export default function StuckView({ request, snapshot, history, setHistory }) {
  const [question, setQuestion] = useState("");
  const [genre, setGenre] = useState("deftones");
  const [kind, setKind] = useState("any");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    const payload = { question: q, genre };
    if (kind !== "any") payload.kind = kind;
    try {
      const res = await request("suggest.request", payload, { timeoutMs: 30000 });
      setHistory((h) => [
        { suggestion: res.payload.suggestion, at: Date.now(), committed: null },
        ...h,
      ]);
    } catch (err) {
      setError(err.message + (err.code ? " (" + err.code + ")" : ""));
    } finally {
      setLoading(false);
    }
  }

  async function commit(suggestion) {
    const res = await request("suggest.commit", { suggestionId: suggestion.id });
    const committed = res.payload;
    setHistory((h) =>
      h.map((entry) =>
        entry.suggestion.id === suggestion.id ? { ...entry, committed } : entry
      )
    );
    return committed;
  }

  const [latest, ...earlier] = history;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">I'm stuck</h2>
        <p className="mt-1 text-sm text-dim">
          Say where the song is and what you need next. You get one concrete move, grounded
          in the genre pack, and a clip to audition when there are notes to play.
        </p>
      </div>

      <form onSubmit={submit} className="panel space-y-4 p-4">
        <div>
          <label htmlFor="stuck-question" className="label mb-1.5 block">
            Where are you stuck
          </label>
          <textarea
            id="stuck-question"
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={EXAMPLES[0]}
            className="w-full resize-none rounded border border-edge bg-raised px-3 py-2 text-sm
              placeholder:text-faint focus:border-accent/60 focus:outline-none"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setQuestion(example)}
                className="rounded-full border border-edge px-2.5 py-0.5 text-xs text-faint
                  transition-colors hover:border-edge2 hover:text-dim"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <fieldset>
            <legend className="label mb-1.5">Genre</legend>
            <Segmented options={GENRES} value={genre} onChange={setGenre} />
          </fieldset>
          <fieldset>
            <legend className="label mb-1.5">Looking for (optional)</legend>
            <Segmented options={KINDS} value={kind} onChange={setKind} />
          </fieldset>
        </div>

        <div className="flex items-center gap-3 border-t border-edge pt-4">
          <button type="submit" disabled={!question.trim() || loading} className="btn-accent">
            {loading ? "Working on it" : "Get a suggestion"}
          </button>
          {loading ? (
            <span className="text-xs text-faint">
              Checking the {kind === "any" ? "genre pack" : kindLabel(kind).toLowerCase() + " bank"} first,
              then the model if it helps
            </span>
          ) : null}
          {error ? <span className="text-sm text-warn">{error}</span> : null}
        </div>
      </form>

      {loading ? (
        <div className="panel animate-pulse p-5">
          <div className="h-3 w-40 rounded bg-raised" />
          <div className="mt-4 h-5 w-3/4 rounded bg-raised" />
          <div className="mt-3 h-3 w-full rounded bg-raised" />
          <div className="mt-2 h-3 w-5/6 rounded bg-raised" />
        </div>
      ) : null}

      {latest && !loading ? (
        <div className="panel border-edge2 p-5">
          <SuggestionBody
            key={latest.suggestion.id}
            entry={latest}
            snapshot={snapshot}
            onCommit={commit}
          />
        </div>
      ) : null}

      {earlier.length > 0 ? (
        <div>
          <div className="label mb-2">Earlier this session</div>
          <div className="space-y-2">
            {earlier.map((entry) => (
              <HistoryRow
                key={entry.suggestion.id}
                entry={entry}
                snapshot={snapshot}
                onCommit={commit}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex overflow-hidden rounded border border-edge">
      {options.map((opt, i) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={
            "px-3 py-1.5 text-sm transition-colors duration-150 " +
            (i > 0 ? "border-l border-edge " : "") +
            (value === opt.id
              ? "bg-raised text-accent"
              : "bg-panel text-dim hover:text-ink")
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
