const steps = [
  { n: "1", title: "Check your date", text: "Tell me your date and where you are thinking. I reply within 24 hours, and a free 20 minute call is one click away." },
  { n: "2", title: "Hold it", text: "A $500 deposit and a signed agreement hold your date. The balance is due right after the shoot." },
  { n: "3", title: "Just be together", text: "No stiff posing. I guide you a little and catch the moments you did not know were happening." },
  { n: "4", title: "Get it in 10 days", text: "Your finished videos and photos arrive within 10 days of the shoot, color graded and ready to share." },
];

export default function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 bg-ivory px-4 py-16 md:px-16 md:py-[104px]">
      <div className="mx-auto max-w-[1312px]">
        <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gilt">How it works</p>
        <h2 className="font-display text-4xl text-ink md:text-6xl">Booking is easy.</h2>
        <ol className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-6">
          {steps.map((s) => (
            <li key={s.n} className="border-t border-gilt/30 pt-5">
              <span className="font-display text-5xl leading-none text-gilt">{s.n}</span>
              <h3 className="mt-3 font-sans text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 font-sans text-base leading-[1.6] text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
