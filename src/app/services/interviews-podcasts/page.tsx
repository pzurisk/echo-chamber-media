import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Podcast & Interview Video Production Las Vegas',
  description:
    'Multi-camera podcast and interview video in Las Vegas. Cinema cameras, clean audio on every speaker, and lighting built for your space.',
  alternates: { canonical: 'https://echochambermedia.com/services/interviews-podcasts' },
  keywords:
    'podcast video production Las Vegas, interview videographer Las Vegas, podcast videographer, multi-camera podcast, video podcast Las Vegas, testimonial video Las Vegas',
  openGraph: {
    title: 'Podcast & Interview Video Production Las Vegas | Echo Chamber Media',
    description:
      'Multi-camera podcast and interview video in Las Vegas. Cinema cameras, clean audio on every speaker, and lighting built for your space.',
    url: 'https://echochambermedia.com/services/interviews-podcasts',
    type: 'website',
    locale: 'en_US',
  },
};

const offerings = [
  {
    title: 'Multi-camera coverage',
    body: 'A wide shot of the whole set and a clean single on each speaker, so the edit can cut between them the way a real show does.',
  },
  {
    title: 'Clean audio on every speaker',
    body: 'Wireless mics and a dedicated recorder give host and guest their own tracks, with backup audio on the cameras.',
  },
  {
    title: 'Lighting built for the room',
    body: 'A large lighting kit lets us shape the look to your style, from a bright and open set to something moody and cinematic.',
  },
  {
    title: 'Cinema cameras, one consistent look',
    body: 'Shot on a Sony FX6 and a DJI Ronin 4D, so your footage has depth and holds up in color.',
  },
  {
    title: 'Edited episodes and short clips',
    body: 'Finished episodes, plus short clips you can post on social, edited in-house.',
  },
  {
    title: 'On location or in your space',
    body: 'We bring the gear to your studio, office, or venue anywhere in the Las Vegas area.',
  },
];

const whoFor = [
  'Video podcasts and interview shows',
  'Founder, owner, and executive interviews',
  'Customer testimonials and case studies',
  'Documentary and story-driven subjects',
];

export default function InterviewsPodcastsPage() {
  return (
    <>
      <Navbar />
      <main className="bg-brand-black text-brand-off-white">
        {/* Hero */}
        <section className="relative flex items-center justify-center overflow-hidden pt-32 pb-16 px-6">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-charcoal to-brand-black"></div>
          </div>
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-5xl lg:text-7xl font-black mb-6 text-brand-gold tracking-editorial leading-tight">
              PODCAST & INTERVIEW VIDEO IN LAS VEGAS
            </h1>
            <p className="font-body text-xl lg:text-2xl text-brand-off-white mb-8 leading-relaxed max-w-2xl mx-auto">
              Multi-camera shoots with clean audio and a look built around you. Shot on cinema cameras, lit for your space, and edited in-house.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#reel"
                className="inline-block bg-brand-gold text-brand-black font-heading font-bold py-4 px-8 rounded-lg hover:bg-opacity-90 transition-all"
              >
                Watch the Reel
              </a>
              <a
                href="#contact"
                className="inline-block border-2 border-brand-gold text-brand-gold font-heading font-bold py-4 px-8 rounded-lg hover:bg-brand-gold hover:text-brand-black transition-all"
              >
                Plan a Shoot
              </a>
            </div>
          </div>
        </section>

        {/* Reel */}
        <section id="reel" className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-brand-gold border-opacity-30 bg-brand-charcoal">
              <video
                className="absolute inset-0 w-full h-full"
                controls
                playsInline
                preload="metadata"
                poster="/images/interviews-reel-poster.jpg"
              >
                <source src="/video/interviews-reel.mp4" type="video/mp4" />
              </video>
            </div>
            <p className="font-body text-brand-gray text-sm text-center mt-4">
              Two interview setups from the Echo Chamber Media reel, one moody and one bright. Press play with sound on.
            </p>
          </div>
        </section>

        {/* What you get */}
        <section className="py-20 px-6 bg-brand-charcoal">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-16 text-center tracking-editorial">
              WHAT YOU GET
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {offerings.map((item) => (
                <div
                  key={item.title}
                  className="bg-brand-black p-6 rounded-lg border border-brand-gold border-opacity-30"
                >
                  <h3 className="font-heading text-xl font-black text-brand-gold mb-3 tracking-editorial">
                    {item.title}
                  </h3>
                  <p className="font-body text-brand-off-white leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-10 text-center tracking-editorial">
              WHO THIS IS FOR
            </h2>
            <ul className="space-y-4">
              {whoFor.map((line) => (
                <li key={line} className="font-body text-lg text-brand-off-white flex gap-3">
                  <span className="text-brand-gold">&#9679;</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Related */}
        <section className="py-16 px-6 bg-brand-charcoal">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
            <Link
              href="/services/documentary"
              className="block bg-brand-black p-6 rounded-lg border border-brand-gold border-opacity-30 hover:border-opacity-80 transition-all"
            >
              <h3 className="font-heading text-xl font-black text-brand-gold mb-2 tracking-editorial">Documentary</h3>
              <p className="text-brand-gray text-sm">Story-driven films built around real people and real interviews.</p>
            </Link>
            <Link
              href="/services/corporate"
              className="block bg-brand-black p-6 rounded-lg border border-brand-gold border-opacity-30 hover:border-opacity-80 transition-all"
            >
              <h3 className="font-heading text-xl font-black text-brand-gold mb-2 tracking-editorial">Corporate Video</h3>
              <p className="text-brand-gray text-sm">Brand films, commercials, and company stories.</p>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section id="contact" className="py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-6 tracking-editorial">
              Planning an Interview or Podcast Shoot?
            </h2>
            <p className="font-body text-brand-off-white text-lg mb-10 leading-relaxed">
              Tell us about your show or project. We will talk through the look, the audio setup, and what you need delivered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={`mailto:${SITE.email}`}
                className="inline-block bg-brand-gold text-brand-black font-heading font-bold py-4 px-8 rounded-lg hover:bg-opacity-90 transition-all"
              >
                Email Us
              </a>
              <a
                href={SITE.booking}
                className="inline-block border-2 border-brand-gold text-brand-gold font-heading font-bold py-4 px-8 rounded-lg hover:bg-brand-gold hover:text-brand-black transition-all"
              >
                Book a Call
              </a>
              <a
                href={SITE.phoneTel}
                className="inline-block border-2 border-brand-gold text-brand-gold font-heading font-bold py-4 px-8 rounded-lg hover:bg-brand-gold hover:text-brand-black transition-all"
              >
                {SITE.phoneDisplay}
              </a>
            </div>
          </div>
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Service',
                name: 'Podcast and Interview Video Production',
                serviceType: 'Video production',
                description:
                  'Multi-camera podcast and interview video production in Las Vegas with clean audio and custom lighting.',
                url: 'https://echochambermedia.com/services/interviews-podcasts',
                areaServed: { '@type': 'City', name: 'Las Vegas' },
                provider: {
                  '@type': 'ProfessionalService',
                  name: 'Echo Chamber Media',
                  url: 'https://echochambermedia.com',
                  email: SITE.email,
                  address: {
                    '@type': 'PostalAddress',
                    addressLocality: 'Las Vegas',
                    addressRegion: 'NV',
                    addressCountry: 'US',
                  },
                },
              },
              {
                '@type': 'VideoObject',
                name: 'Interview and podcast reel',
                description: 'Two interview setups from the Echo Chamber Media reel, one moody and one bright.',
                thumbnailUrl: 'https://echochambermedia.com/images/interviews-reel-poster.jpg',
                contentUrl: 'https://echochambermedia.com/video/interviews-reel.mp4',
                uploadDate: '2026-11-08',
                duration: 'PT23S',
              },
            ],
          }),
        }}
      />

      <Footer />
    </>
  );
}
