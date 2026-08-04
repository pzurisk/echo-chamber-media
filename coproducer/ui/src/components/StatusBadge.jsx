// Connection indicator. Mock mode has to be unmissable because everything on
// screen is fixture data, not the user's actual Live set.
export default function StatusBadge({ mode }) {
  if (mode === "live") {
    return (
      <span className="flex items-center gap-2 text-xs text-dim">
        <span className="h-1.5 w-1.5 rounded-full bg-ok" aria-hidden="true" />
        Connected to Live
      </span>
    );
  }
  if (mode === "mock") {
    return (
      <span className="flex items-center gap-2 rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" aria-hidden="true" />
        Mock data, not connected to Live
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2 text-xs text-faint">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-faint" aria-hidden="true" />
      Connecting
    </span>
  );
}
