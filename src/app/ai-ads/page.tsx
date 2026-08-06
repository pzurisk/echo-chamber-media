import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AI Ad Production Las Vegas | Echo Chamber Media',
  description: 'AI-generated commercials directed like film. See real spec work and get your ad made fast.',
  alternates: { canonical: 'https://echochambermedia.com/ai-ads' },
  keywords: 'AI ad production Las Vegas, AI generated commercials, AI video ads, AI advertising Las Vegas, AI commercial production',
  openGraph: {
    title: 'AI Ad Production Las Vegas | Echo Chamber Media',
    description: 'AI-generated commercials directed like film. See real spec work and get your ad made fast.',
    url: 'https://echochambermedia.com/ai-ads',
    type: 'website',
    locale: 'en_US',
  },
};

const CONTACT_EMAIL = 'sales@echochambermedia.com';
const BOOKING_LINK = 'https://calendar.app.google/V6EFC7Cv3rJHxAdGA';
const MAILTO = `mailto:${CONTACT_EMAIL}?subject=AI%20Ad%20Inquiry`;

export default function AIAdsPage() {
  return (
    <>
      <main className="bg-brand-black text-brand-off-white min-h-screen">
        {/* Minimal header, no site nav on purpose */}
        <header className="px-6 py-6 flex items-center justify-between max-w-6xl mx-auto">
          <Link href="/" className="font-heading text-sm uppercase tracking-editorial text-brand-gold">
            Echo Chamber Media
          </Link>
          <a
            href={MAILTO}
            className="text-xs uppercase tracking-editorial text-brand-black bg-brand-gold px-5 py-2.5 font-body font-semibold hover:bg-brand-gold-hover transition-all"
          >
            Get Started
          </a>
        </header>

        {/* Hero */}
        <section className="relative flex items-center justify-center overflow-hidden pt-16 pb-20 px-6">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-charcoal to-brand-black" />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <p className="text-sm uppercase tracking-editorial text-brand-gold font-body mb-4">
              AI Ad Production
            </p>
            <h1 className="font-heading text-5xl lg:text-7xl font-black mb-6 text-brand-gold tracking-editorial leading-tight">
              AI-GENERATED ADS, DIRECTED LIKE FILM
            </h1>
            <p className="font-body text-xl lg:text-2xl text-brand-off-white mb-10 leading-relaxed max-w-2xl mx-auto">
              Concept through finished spot, built with AI tools and directed with the same instincts I bring to a real set. Fast turnaround, no crew to schedule.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={MAILTO}
                className="inline-block bg-brand-gold text-brand-black font-heading font-bold py-4 px-8 rounded-lg hover:bg-opacity-90 transition-all"
              >
                Get Your Ad Made
              </a>
              <a
                href={BOOKING_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block border-2 border-brand-gold text-brand-gold font-heading font-bold py-4 px-8 rounded-lg hover:bg-brand-gold hover:text-brand-black transition-all"
              >
                Book a Call
              </a>
            </div>
          </div>
        </section>

        {/* Proof section */}
        <section id="work" className="py-20 px-6 bg-brand-charcoal">
          <div className="max-w-5xl mx-auto">
            <p className="text-sm uppercase tracking-editorial text-brand-gold font-body mb-4 text-center">
              Recent Spec Work
            </p>
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-off-white mb-6 text-center tracking-editorial">
              Three Spec Ads Built With AI
            </h2>
            <p className="font-body text-brand-gray text-center max-w-2xl mx-auto mb-16">
              Not client work. Made to show what AI production looks like when someone who knows how to direct is running it.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-brand-black/60 border border-brand-gold/10">
                <div className="relative w-full aspect-video">
                  <iframe
                    src="https://www.youtube.com/embed/7BB_ZpFpaB8"
                    title="Angels with Filthy Souls, Coca-Cola spec ad by Echo Chamber Media"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-heading text-lg font-bold text-brand-gold mb-2">
                    Angels with Filthy Souls
                  </h3>
                  <p className="font-body text-sm text-brand-off-white leading-relaxed">
                    A Coca-Cola holiday spec ad. A black and white 1930s gangster film plays on an old TV while a family watches from the living room. Color bleeds into the frame as someone opens a Coke, until the whole scene is in full color.
                  </p>
                </div>
              </div>

              <div className="bg-brand-black/60 border border-brand-gold/10">
                <div className="relative w-full aspect-video">
                  <iframe
                    src="https://www.youtube.com/embed/G-ibKvYynZY"
                    title="Never Go Full Stats, Tropic Thunder styled spec ad by Echo Chamber Media"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-heading text-lg font-bold text-brand-gold mb-2">
                    Never Go Full Stats
                  </h3>
                  <p className="font-body text-sm text-brand-off-white leading-relaxed">
                    A fast cut stat reel styled after Tropic Thunder&apos;s over the top action energy. Bold numbers, hard transitions, and a dramatic voiceover deliver the data like a war movie trailer.
                  </p>
                </div>
              </div>

              <div className="bg-brand-black/60 border border-brand-gold/10">
                <div className="relative w-full aspect-video">
                  <iframe
                    src="https://www.youtube.com/embed/iziyh6RuwSk"
                    title="Hollow Oak Bourbon Distillery spec ad by Echo Chamber Media"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-heading text-lg font-bold text-brand-gold mb-2">
                    Hollow Oak Bourbon
                  </h3>
                  <p className="font-body text-sm text-brand-off-white leading-relaxed">
                    A voiceover driven distillery spec ad. Shots move through the distillery floor and rows of aging barrels while the narration tells the story of the brand and the patience behind it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 px-6 bg-brand-black">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-16 text-center tracking-editorial">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-brand-charcoal p-8 border border-brand-gold border-opacity-30">
                <p className="font-heading text-brand-gold text-sm uppercase tracking-editorial mb-3">Step One</p>
                <h3 className="font-heading text-xl font-bold text-brand-off-white mb-3">Concept and Script</h3>
                <p className="font-body text-brand-gray leading-relaxed">
                  We lock the idea, the tone, and the script before anything gets generated. Same prep work as a real shoot.
                </p>
              </div>
              <div className="bg-brand-charcoal p-8 border border-brand-gold border-opacity-30">
                <p className="font-heading text-brand-gold text-sm uppercase tracking-editorial mb-3">Step Two</p>
                <h3 className="font-heading text-xl font-bold text-brand-off-white mb-3">AI Production</h3>
                <p className="font-body text-brand-gray leading-relaxed">
                  Shots get generated and directed frame by frame. I run the AI tools the way I&apos;d run a camera, with intent behind every choice.
                </p>
              </div>
              <div className="bg-brand-charcoal p-8 border border-brand-gold border-opacity-30">
                <p className="font-heading text-brand-gold text-sm uppercase tracking-editorial mb-3">Step Three</p>
                <h3 className="font-heading text-xl font-bold text-brand-off-white mb-3">Finishing and Delivery</h3>
                <p className="font-body text-brand-gray leading-relaxed">
                  Edit, sound, and color pass in DaVinci Resolve, the same finishing process as any Echo Chamber production. Delivered in the formats you need.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="contact" className="py-20 px-6 bg-brand-charcoal">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-6 tracking-editorial">
              Have an Idea for an Ad?
            </h2>
            <p className="font-body text-brand-off-white text-lg mb-10 leading-relaxed">
              Send me what you&apos;re thinking and I&apos;ll tell you what&apos;s possible and what it takes to get it made. I answer these myself, so expect to hear back fast.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={MAILTO}
                className="inline-block bg-brand-gold text-brand-black font-heading font-bold py-4 px-8 rounded-lg hover:bg-opacity-90 transition-all"
              >
                Email Your Idea
              </a>
              <a
                href={BOOKING_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block border-2 border-brand-gold text-brand-gold font-heading font-bold py-4 px-8 rounded-lg hover:bg-brand-gold hover:text-brand-black transition-all"
              >
                Book a Call Now
              </a>
            </div>
            <p className="font-body text-sm text-brand-gray mt-8">
              Or call <a href="tel:+19893081633" className="text-brand-gold hover:underline">(989) 308-1633</a>
            </p>
          </div>
        </section>

        {/* Minimal footer, no full sitemap */}
        <footer className="px-6 py-10 text-center border-t border-brand-charcoal">
          <Link href="/" className="font-body text-xs text-brand-gray hover:text-brand-gold transition-colors">
            Back to echochambermedia.com
          </Link>
          <p className="font-body text-xs text-brand-gray mt-3">
            &copy; 2026 Echo Chamber Media. Las Vegas, NV.
          </p>
        </footer>
      </main>

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'Echo Chamber Media - AI Ad Production',
            image: 'https://echochambermedia.com/og-image.jpg',
            description: 'AI-generated commercial and ad production in Las Vegas, directed and finished by a working filmmaker.',
            telephone: '+1-989-308-1633',
            email: 'sales@echochambermedia.com',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Las Vegas',
              addressRegion: 'NV',
              addressCountry: 'US',
            },
            areaServed: {
              '@type': 'City',
              name: 'Las Vegas',
            },
            url: 'https://echochambermedia.com/ai-ads',
            sameAs: [
              'https://instagram.com/chunkdude',
              'https://www.tiktok.com/@billyzurisk',
            ],
            profession: ['Video Producer', 'AI Ad Producer', 'Director'],
            knowsAbout: [
              'AI Video Generation',
              'AI Commercial Production',
              'Concept Advertising',
              'Video Editing',
              'Color Grading',
              'Las Vegas Video Production',
            ],
            service: {
              '@type': 'Service',
              name: 'AI Ad Production',
              description: 'AI-generated commercial and advertising video production, concept through delivery.',
              areaServed: {
                '@type': 'City',
                name: 'Las Vegas',
              },
              provider: {
                '@type': 'Organization',
                name: 'Echo Chamber Media',
              },
            },
          }),
        }}
      />
    </>
  );
}
