// Small top-right notifications, used for lesson unlocks and XP confirmations.
export default function Toasts({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed right-4 top-14 z-50 flex w-72 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rounded-md border border-accent/40 bg-raised px-4 py-3 shadow-lg shadow-black/50"
        >
          <div className="text-xs font-medium text-accent">{t.title}</div>
          {t.body ? <div className="mt-0.5 text-sm text-ink">{t.body}</div> : null}
        </div>
      ))}
    </div>
  );
}
