const items = [
  { label: "5.0 on Google", stars: true },
  { label: "6 festival selections" },
  { label: "Award-winning filmmaker" },
  { label: "Chapel, downtown, or desert" },
];

export default function TrustStrip() {
  return (
    <section aria-label="Credibility highlights" className="bg-champagne px-4 py-6 md:px-16 md:py-0">
      <ul className="mx-auto flex max-w-[1312px] flex-wrap items-center justify-center gap-x-6 gap-y-2.5 font-sans text-[11px] uppercase tracking-[0.16em] text-muted md:h-20 md:flex-nowrap md:gap-x-0 md:text-[12px] md:tracking-[0.18em]">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center">
            {i > 0 && <span className="mx-8 hidden h-[5px] w-[5px] rounded-full bg-gilt-accent md:block" aria-hidden="true" />}
            <span className="whitespace-nowrap">
              {item.stars && <span className="mr-2 text-gilt" aria-label="5 stars">★★★★★</span>}
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
