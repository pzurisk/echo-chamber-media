const steps = [
  {
    n: "One",
    title: "Pick your Vegas",
    body: "A chapel, the downtown lights, the Strip at night, or the desert at golden hour. We plan the route and timing around the light.",
  },
  {
    n: "Two",
    title: "Just be together",
    body: "No stiff posing. We follow you, guide you a little, and catch the moments you did not know were happening.",
  },
  {
    n: "Three",
    title: "Get your film",
    body: "Edited, color graded, and set to licensed music. Delivered in 2 weeks (ask about rush delivery), ready for everyone who could not be there.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-ivory px-4 pt-16 pb-12 md:px-16 md:pt-[120px] md:pb-[72px]">
      <div className="mx-auto flex max-w-[1312px] flex-col gap-10 md:gap-16">
        <h2 className="font-display text-5xl font-normal leading-[1.02] tracking-[-0.01em] text-ink md:text-[68px]">
          Eloping is easy. <span className="italic text-gilt">Here&apos;s how.</span>
        </h2>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
          {steps.map((s) => (
            <div key={s.n} className="flex flex-col gap-3.5 border-t border-gilt/35 pt-7">
              <span className="font-display text-2xl italic text-gilt">{s.n}</span>
              <span className="font-display text-[30px] font-medium leading-tight text-ink md:text-[34px]">{s.title}</span>
              <span className="font-sans text-[17px] leading-[1.6] text-muted">{s.body}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
