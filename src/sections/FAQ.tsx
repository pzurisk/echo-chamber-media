// Plain <details> accordion, no client JS. FAQS also feeds the FAQPage JSON-LD on /elopements.
export const FAQS = [
  {
    q: "Do you work with chapels?",
    a: "Yes. Book any chapel you like and we'll coordinate with them on timing and camera rules.",
  },
  {
    q: "Can we elope without a chapel?",
    a: "Yes. Bring an officiant and your license and we'll help you pick a spot. Downtown, the desert, a rooftop.",
  },
  {
    q: "What about the marriage license?",
    a: "You get it from the Clark County Marriage License Bureau. We'll send you a simple checklist when you book.",
  },
  {
    q: "Do you shoot photos too?",
    a: "Yes. Photos are a $500 add-on to any film package, shot in the same session.",
  },
  {
    q: "How long until we get everything?",
    a: "Your finished videos and photos arrive within 10 days of the shoot.",
  },
  {
    q: "How does booking and the deposit work?",
    a: "A $500 deposit and a signed agreement hold your date. The balance is due right after the shoot.",
  },
  {
    q: "What if we need to reschedule?",
    a: "Rescheduling is free with at least 7 days notice. With 72 hours to 7 days notice it is a $100 fee. Under 72 hours counts as a cancellation.",
  },
  {
    q: "How long are the videos?",
    a: "Each finished video runs up to 1 minute 30 seconds. Longer videos are available, and you see the price before any editing starts.",
  },
  {
    q: "How far out should we book?",
    a: "As soon as you know your date. Planning last minute? Reach out anyway. Short notice dates often still work.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="scroll-mt-24 bg-ivory px-4 py-16 md:px-16 md:py-[104px]">
      <div className="mx-auto flex max-w-[860px] flex-col gap-10 md:gap-12">
        <h2 className="text-center font-display text-5xl font-normal leading-none tracking-[-0.01em] text-ink md:text-[64px]">
          Good <span className="text-gilt">questions.</span>
        </h2>
        <div className="flex flex-col border-t border-gilt/25">
          {FAQS.map((f) => (
            <details key={f.q} className="group border-b border-gilt/25 py-5 md:py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-sans text-lg font-semibold leading-[1.35] text-ink md:text-xl [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden="true"
                  className="font-sans text-2xl leading-none text-gilt transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-[680px] font-sans text-base leading-[1.65] text-muted md:text-[17px]">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
