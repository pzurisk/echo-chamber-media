import { PACKAGES, INCLUDED } from "@/lib/packages";
import Button from "@/components/Button";

export default function PackagesTeaser() {
  return (
    <section id="packages" className="scroll-mt-24 bg-ivory px-4 pt-12 pb-16 md:px-16 md:pt-[72px] md:pb-[112px]">
      <div className="mx-auto flex max-w-[1312px] flex-col gap-10 md:gap-14">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="font-sans text-xs uppercase tracking-[0.3em] text-gilt">2026 season pricing</span>
          <h2 className="font-display text-5xl font-normal leading-none tracking-[-0.01em] text-ink md:text-[72px]">
            Pick your <span className="italic text-gilt">Vegas.</span>
          </h2>
          <p className="max-w-[620px] font-sans text-[17px] leading-[1.6] text-muted md:text-lg">{INCLUDED}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
          {PACKAGES.map((p) => (
            <a
              key={p.id}
              href="/elopements#packages"
              className={`relative flex flex-col gap-4 rounded-xl border p-8 transition-shadow hover:shadow-[0_12px_40px_rgba(43,33,26,0.08)] md:p-10 ${
                p.badge ? "border-gilt-accent bg-champagne" : "border-gilt/20 bg-white"
              }`}
            >
              {p.badge && (
                <span className="absolute -top-[15px] left-8 flex h-[30px] items-center rounded-full bg-ink px-3.5 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-ivory md:left-10">
                  {p.badge}
                </span>
              )}
              <span className="font-sans text-xs uppercase tracking-[0.3em] text-gilt">{p.name}</span>
              <span className="font-display text-[56px] leading-none text-ink">{p.priceLabel}</span>
              <span className="font-sans text-base leading-[1.55] text-muted">{p.tagline}</span>
              <span className="mt-auto border-t border-gilt/25 pt-4 font-sans text-[15px] text-ink">{p.summary}</span>
            </a>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3">
          <Button variant="ink" href="/elopements#packages">See what&apos;s included</Button>
          <span className="font-sans text-sm text-muted">Planning last minute? Reach out anyway. Short notice dates often still work.</span>
        </div>
      </div>
    </section>
  );
}
