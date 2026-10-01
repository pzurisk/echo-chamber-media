// Kind words. Every quote is a real Google review, word for word.
// The two wedding reviews are excerpts: whole sentences only, with "..." where sentences are skipped.
// Do not add reviews that are not on Google, and do not add rating schema
// (self-serving review markup is against Google's guidelines and the repo rule).
// There are two Google listings. This one holds the wedding reviews. The three older
// reviews sit on the other one (https://g.page/r/CeKYhZnRAYC1EBM) until Google merges them.
const GOOGLE_REVIEWS_URL = "https://www.google.com/maps?cid=16237565028279391507";

// Luciano and Muriel, the couple in the featured film. Shown first and wider.
const weddingReviews = [
  {
    quote:
      "We couldn't be happier with our wedding video! ... The final video turned out absolutely beautiful. It captured not only the big moments, but also all the little details, emotions, and memories that made our day so special.",
    name: "Luciano Pontiroli",
    source: "Google review",
  },
  {
    quote:
      "Big thanks to Billy (the videographer) for making me feel comfortable the entire time; he was incredibly kind and professional. ... The final results were even better than expected and I've received so many lovely compliments from my family and friends.",
    name: "Muriel Parra",
    source: "Google review",
  },
];

const reviews = [
  {
    quote:
      "The way Billy can capture the ideas you have and put it into videos, or photos, or even movies is incredible! This company should be your only go-to!",
    name: "Blair Lee",
    source: "Google review",
  },
  {
    quote: "These guys are great. Hollywood all the way.",
    name: "This is the way Las Vegas",
    source: "Google review",
  },
  {
    quote:
      "Echo Chamber Media is awesome! They far exceded my expectations. Very professional company and amazing quality. I highly recommend!",
    name: "Pete Miceli",
    // FTC disclosure: Pete worked on The Classified Mind with us. Keep it.
    source: "Google review · Collaborator on The Classified Mind",
  },
];

export default function Reviews() {
  return (
    <section id="reviews" className="bg-champagne text-ink px-4 py-16 md:px-16 md:py-[104px]">
      <div className="mx-auto max-w-[1312px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="font-display text-4xl md:text-[56px] font-normal leading-none">
            Kind <span className="italic text-gilt">words</span>
          </h2>
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-[15px] font-semibold text-gilt hover:text-gilt-hover transition-colors"
          >
            5.0 on Google · Read the reviews →
          </a>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-6">
          {[
            ...weddingReviews.map((r) => ({ ...r, span: "md:col-span-3" })),
            ...reviews.map((r) => ({ ...r, span: "md:col-span-2" })),
          ].map((r) => (
            <figure
              key={r.name}
              className={`m-0 flex flex-col gap-5 rounded-lg bg-ivory p-8 md:p-9 ${r.span}`}
            >
              <span className="text-gilt text-base tracking-[0.2em]" aria-label="5 stars">
                ★★★★★
              </span>
              <blockquote className="m-0 flex-grow font-display italic text-[22px] md:text-[26px] leading-[1.35] text-ink">
                &ldquo;{r.quote}&rdquo;
              </blockquote>
              <figcaption className="flex flex-col gap-1 font-sans">
                <span className="text-base font-semibold">{r.name}</span>
                <span className="text-sm text-muted">{r.source}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
