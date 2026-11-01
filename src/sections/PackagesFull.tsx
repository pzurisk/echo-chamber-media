import { PACKAGES, INCLUDED, ADDONS, BOOKING_TERMS } from "@/lib/packages";
import Button from "@/components/Button";

const ALWAYS = ["Planning help", "Cinema camera coverage", "Color graded film", "Licensed music"];

export default function PackagesFull() {
  return (
    <section id="packages" className="scroll-mt-24 bg-ivory px-4 py-16 md:px-16 md:py-[112px]">
      <div className="mx-auto flex max-w-[1312px] flex-col gap-10 md:gap-14">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="font-sans text-xs uppercase tracking-[0.3em] text-gilt">Simple pricing</span>
          <h2 className="font-display text-5xl font-normal leading-none tracking-[-0.01em] text-ink md:text-[72px]">
            Pick your <span className="text-gilt">package.</span>
          </h2>
          <p className="max-w-[620px] font-sans text-[17px] leading-[1.6] text-muted md:text-lg">{INCLUDED}</p>
          <ul className="flex flex-wrap justify-center gap-2.5">
            {ALWAYS.map((a) => (
              <li
                key={a}
                className="rounded-full border border-gilt/30 px-4 py-1.5 font-sans text-[13px] text-ink"
              >
                {a}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
          {PACKAGES.map((p) => (
            <div
              key={p.id}
              className={`relative flex flex-col gap-4 rounded-xl border p-8 md:p-10 ${
                p.badge ? "border-gilt bg-champagne" : "border-gilt/20 bg-champagne"
              }`}
            >
              {p.badge && (
                <span className="absolute -top-[15px] left-8 flex h-[30px] items-center rounded-full bg-gilt px-3.5 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-ivory md:left-10">
                  {p.badge}
                </span>
              )}
              <h3 className="font-sans text-xs font-normal uppercase tracking-[0.3em] text-gilt">{p.name}</h3>
              <span className="font-display text-[56px] leading-none text-ink">{p.priceLabel}</span>
              <span className="font-sans text-base leading-[1.55] text-muted">{p.tagline}</span>
              <ul className="mt-2 flex flex-col gap-2.5 border-t border-gilt/25 pt-5 font-sans text-[15px] leading-[1.45] text-ink">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-3">
                    <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gilt-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={p.badge ? "ink" : "ink-outline"}
                href={`#date`}
                className="mt-auto w-full"
              >
                Check this date
              </Button>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-gilt/20 bg-champagne p-8 md:p-10">
          <h3 className="font-sans text-xs font-normal uppercase tracking-[0.3em] text-gilt">Add-ons</h3>
          <ul className="mt-5 grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2">
            {ADDONS.map((a) => (
              <li key={a.name} className="flex items-baseline justify-between gap-4 border-b border-gilt/15 pb-4 font-sans">
                <span>
                  <span className="block text-[15px] font-semibold text-ink">{a.name}</span>
                  <span className="block text-sm text-muted">{a.note}</span>
                </span>
                <span className="shrink-0 text-[15px] font-semibold text-gilt">{a.price}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 font-sans text-sm text-muted">{BOOKING_TERMS}</p>
        </div>
      </div>
    </section>
  );
}
