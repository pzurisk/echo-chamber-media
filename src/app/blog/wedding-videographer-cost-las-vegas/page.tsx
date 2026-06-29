import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';

export const metadata: Metadata = {
  title: 'How Much Does a Wedding Videographer Cost in Las Vegas? (2026 Guide)',
  description:
    'A straight answer on what a wedding videographer costs in Las Vegas in 2026, what drives the price, and how to tell a real package from a cheap one. Get a free quote.',
  alternates: { canonical: 'https://echochambermedia.com/blog/wedding-videographer-cost-las-vegas' },
  keywords:
    'wedding videographer cost Las Vegas, how much does a wedding videographer cost, Las Vegas wedding video pricing, wedding videography packages Las Vegas, Echo Chamber Media',
  openGraph: {
    title: 'How Much Does a Wedding Videographer Cost in Las Vegas? (2026 Guide)',
    description:
      'What a wedding videographer really costs in Las Vegas in 2026, what drives the price, and how to spot a package worth paying for.',
    url: 'https://echochambermedia.com/blog/wedding-videographer-cost-las-vegas',
    type: 'article',
    locale: 'en_US',
  },
};

const faqs = [
  {
    q: 'How much does a wedding videographer cost in Las Vegas?',
    a: 'Most couples in Las Vegas pay between $1,500 and $5,000 for wedding videography in 2026. Budget coverage starts around $1,000 to $1,500, standard packages run $2,000 to $3,500, and premium multi-camera production with full-day coverage runs $4,000 and up. The national average sits between $2,500 and $3,500.',
  },
  {
    q: 'Why is wedding videography priced the way it is?',
    a: 'Price tracks four things: how many hours the team is on site, how many shooters and how much gear are involved, how much editing the final films take, and what you actually receive. A two-camera shoot with professional audio and a fully color-graded film takes far more time than one person with one camera and a quick edit.',
  },
  {
    q: 'Is the cheapest wedding videographer a good idea?',
    a: 'You get one wedding day, and there is no reshoot. The lowest quotes usually mean one shooter with no backup, no second angle, weak audio, and a templated edit. If something fails, the moment is gone. It is worth paying for redundancy and a real editing process on the footage you can never recapture.',
  },
  {
    q: 'When should I book my Las Vegas wedding videographer?',
    a: 'Book as soon as you set your date. Popular Las Vegas dates fill quickly, and early booking means you get the videographer you want instead of whoever is left.',
  },
];

export default function WeddingVideographerCostPost() {
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'How Much Does a Wedding Videographer Cost in Las Vegas? (2026 Guide)',
    description:
      'What a wedding videographer costs in Las Vegas in 2026, what drives the price, and how to tell a real package from a cheap one.',
    datePublished: '2026-06-29',
    dateModified: '2026-06-29',
    author: { '@type': 'Person', name: 'Billy Zurisk' },
    publisher: {
      '@type': 'Organization',
      name: 'Echo Chamber Media',
      url: 'https://echochambermedia.com',
    },
    mainEntityOfPage: 'https://echochambermedia.com/blog/wedding-videographer-cost-las-vegas',
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <Navbar />
      <main className="bg-brand-black text-brand-off-white min-h-screen pt-32 pb-20 px-6">
        <article className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <Link href="/blog" className="text-xs uppercase tracking-editorial text-brand-gray hover:text-brand-gold font-body transition-colors">
              ← Back to Blog
            </Link>
          </nav>

          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-xs uppercase tracking-editorial text-brand-gold font-body bg-brand-gold/10 px-3 py-1">
                Pricing Guide
              </span>
              <span className="text-xs text-brand-gray font-body">June 29, 2026</span>
              <span className="text-xs text-brand-gray font-body">7 min read</span>
            </div>
            <h1 className="font-heading text-4xl lg:text-5xl uppercase tracking-editorial text-brand-off-white mb-6 leading-tight">
              How Much Does a Wedding Videographer Cost in Las Vegas?
            </h1>
            <div className="h-px w-16 bg-brand-gold mb-6" />
            <p className="font-body text-lg text-brand-gray leading-relaxed">
              A straight answer on 2026 pricing, what actually drives the number, and how to tell a real package from a cheap one.
            </p>
          </div>

          {/* Article Body */}
          <div className="prose-ecm space-y-6">
            <p className="font-body text-brand-off-white leading-relaxed text-lg">
              If you are planning a Las Vegas wedding, you have probably noticed that videography quotes are all over the map. One company says $1,000, another says $6,000, and nobody really explains the gap. Here is the honest version, with no sales spin, so you know what you are paying for before you sign anything.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              The short answer
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              In 2026, most couples in Las Vegas pay between $1,500 and $5,000 for wedding videography. The national average lands between $2,500 and $3,500. Budget coverage in town starts around $1,000 to $1,500, standard packages run $2,000 to $3,500, and premium production with multiple cameras and full-day coverage goes $4,000 and up. Where you land inside that range comes down to a few specific things.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              What you are actually paying for
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              The price is not random. It tracks four things. First, hours on site: a four-hour ceremony package costs less than all-day coverage from getting ready through the last dance. Second, the team and gear: one shooter with one camera is cheaper than two shooters running multiple angles, lav microphones, and lighting. Third, the edit: a quick highlight reel takes a fraction of the time that a color-graded teaser, highlights film, and full feature take. Fourth, the deliverables: more films, longer runtimes, and extras like a same-day edit all add hours.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              The three price tiers in Las Vegas
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              <strong className="text-brand-off-white">Budget, roughly $1,000 to $1,500.</strong> One videographer, a few hours of coverage, and a short highlight reel around ten to fifteen minutes. Fine for a small chapel ceremony where you mainly want a record of the day.
            </p>
            <p className="font-body text-brand-off-white leading-relaxed">
              <strong className="text-brand-off-white">Standard, roughly $2,000 to $3,500.</strong> This is where most couples land. Expect fuller coverage, better audio, a proper color grade, and a teaser plus a highlights film. The quality jump from budget to standard is the biggest one you will feel.
            </p>
            <p className="font-body text-brand-off-white leading-relaxed">
              <strong className="text-brand-off-white">Premium, $4,000 and up.</strong> Multiple shooters, all-day coverage, cinema cameras, drone where the venue allows it, and a full set of films built like a short feature. This is for couples who want their wedding to look like a film, not a recording.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              Why the cheapest quote can cost you the most
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              Here is the part nobody tells you. You get one wedding day, and there is no reshoot. The lowest quotes usually mean one person with one camera, no backup gear, no second angle, and a templated edit pushed out fast. If a card fails or the audio drops during your vows, that moment is simply gone. Paying a little more for a second camera, backup equipment, and someone who actually edits your footage instead of dropping it into a preset is not an upsell. It is insurance on memories you cannot recapture.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              What we include at Echo Chamber Media
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              We shoot weddings the way we shoot films. Cinema cameras, real lighting, lav audio for the vows, and multiple angles, then weeks of editing, color grading, and sound design to turn it into a teaser, a highlights film, and a full wedding film. Our packages start around $1,500 and scale based on coverage and deliverables. You can see the full breakdown on our <Link href="/services/wedding-videography" className="text-brand-gold hover:underline">Las Vegas wedding videography page</Link>.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              Common questions
            </h2>
            <div className="space-y-6">
              {faqs.map((f) => (
                <div key={f.q}>
                  <h3 className="font-heading text-lg uppercase tracking-editorial text-brand-off-white mb-2">
                    {f.q}
                  </h3>
                  <p className="font-body text-brand-gray leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 p-8 bg-brand-charcoal/40 border border-brand-gold/20 text-center">
            <h3 className="font-heading text-xl uppercase tracking-editorial text-brand-gold mb-3">
              Want a Real Quote for Your Date?
            </h3>
            <p className="font-body text-brand-gray mb-6 max-w-lg mx-auto">
              Tell us your date, venue, and what you want the film to feel like. We reply within 24 hours with a custom quote. No pressure, no prep needed.
            </p>
            <Link
              href="/services/wedding-videography#contact"
              className="inline-block px-8 py-3 border border-brand-gold/60 text-brand-off-white font-body text-sm uppercase tracking-editorial hover:bg-brand-gold/10 transition-all duration-500"
            >
              Book a Free Consultation
            </Link>
          </div>
        </article>
      </main>
      <Footer />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </>
  );
}
