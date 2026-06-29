import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';

export const metadata: Metadata = {
  title: 'Best Las Vegas Wedding Venues for Cinematic Video (2026)',
  description:
    'A Las Vegas wedding videographer ranks the venues that film best in 2026, from rooftops above the Strip to Red Rock desert gardens, and what to ask before you book.',
  alternates: { canonical: 'https://echochambermedia.com/blog/best-las-vegas-wedding-venues-for-video' },
  keywords:
    'best Las Vegas wedding venues, Las Vegas wedding venues for video, cinematic wedding venues Las Vegas, outdoor wedding venues Las Vegas, wedding videographer Las Vegas, Echo Chamber Media',
  openGraph: {
    title: 'Best Las Vegas Wedding Venues for Cinematic Video (2026)',
    description:
      'The Las Vegas wedding venues that film best in 2026, picked by a working videographer, plus what to ask before you book.',
    url: 'https://echochambermedia.com/blog/best-las-vegas-wedding-venues-for-video',
    type: 'article',
    locale: 'en_US',
  },
};

const venues = [
  {
    name: 'Chapel in the Clouds at The STRAT',
    tag: 'High above the Strip',
    note: 'Perched roughly 800 feet over the Strip with floor-to-ceiling windows and an open-air observation deck with 360 degree views. The window light is soft and flattering during the day, and the city turns into a glowing backdrop at night. Hard to beat for a skyline film.',
  },
  {
    name: 'GhostBar at The Palms',
    tag: 'High above the Strip',
    note: 'Fifty-five floors up, moody and upscale, with ambient lighting that already looks cinematic before we touch it. Great for couples who want a sleek, modern, after-dark feel.',
  },
  {
    name: "Cactus Joe's Desert Garden and Nursery",
    tag: 'Desert and natural',
    note: 'Seven acres near Blue Diamond with towering cacti, sculptural succulents, and Red Rock Canyon in the distance. At golden hour the light bounces off the metal sculptures and the whole place glows. One of the most filmable outdoor spots in the valley.',
  },
  {
    name: 'GreenGale Farms',
    tag: 'Desert and natural',
    note: 'A 40 acre family-owned farm with sunlit meadows, olive groves, and palm forests, a few minutes from the Strip but a world away from it. Rescue animals sometimes wander into frame, which sounds chaotic and is actually charming on camera.',
  },
  {
    name: 'Emerald at Queensridge',
    tag: 'Luxury ballrooms',
    note: 'A purpose-built luxury ballroom in Summerlin with tall ceilings, crystal chandeliers, and floor-to-ceiling windows looking out over a lake and the Spring Mountains. Clean, bright, and built to look expensive without any help from us.',
  },
  {
    name: 'The Venetian',
    tag: 'Luxury ballrooms',
    note: 'Canals, gondolas, and the Grand Canal Shoppes piazza, where the diffused overhead light gives you natural framing and even skin tones all day. A classic for a reason.',
  },
  {
    name: 'Nelson Ghost Town',
    tag: 'Off the beaten path',
    note: 'About an hour from the Strip, full of rundown saloons, abandoned vintage cars, and old west texture. Built for couples who want a film with grit instead of glamour. One of my favorite places to shoot an elopement.',
  },
];

const faqs = [
  {
    q: 'What is the best Las Vegas wedding venue for video?',
    a: 'There is no single best one, it depends on the film you want. For a glowing skyline look, the Chapel in the Clouds at The STRAT is hard to beat. For natural light and desert texture, Cactus Joe\'s is a favorite. For grit and character, Nelson Ghost Town. The right venue is the one that matches the feeling you want your film to have.',
  },
  {
    q: 'Do outdoor Las Vegas venues allow drone footage?',
    a: 'Some do and some do not, and it can depend on proximity to the airport and Strip airspace. Always confirm drone rules with your venue before the day, and ask your videographer whether your location is in restricted airspace. We check this for every shoot.',
  },
  {
    q: 'Does the venue really change how the video looks?',
    a: 'Yes, a lot. Light, space to move, and backdrops do half the work. A venue with good natural light and room to set up shots gives you a more cinematic film with less equipment and less fuss on your wedding day.',
  },
];

export default function BestVenuesPost() {
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'Best Las Vegas Wedding Venues for Cinematic Video (2026)',
    description:
      'A Las Vegas wedding videographer ranks the venues that film best in 2026 and what to ask before you book.',
    datePublished: '2026-06-29',
    dateModified: '2026-06-29',
    author: { '@type': 'Person', name: 'Billy Zurisk' },
    publisher: { '@type': 'Organization', name: 'Echo Chamber Media', url: 'https://echochambermedia.com' },
    mainEntityOfPage: 'https://echochambermedia.com/blog/best-las-vegas-wedding-venues-for-video',
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
          <nav className="mb-8">
            <Link href="/blog" className="text-xs uppercase tracking-editorial text-brand-gray hover:text-brand-gold font-body transition-colors">
              Back to Blog
            </Link>
          </nav>

          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-xs uppercase tracking-editorial text-brand-gold font-body bg-brand-gold/10 px-3 py-1">
                Venue Guide
              </span>
              <span className="text-xs text-brand-gray font-body">June 29, 2026</span>
              <span className="text-xs text-brand-gray font-body">8 min read</span>
            </div>
            <h1 className="font-heading text-4xl lg:text-5xl uppercase tracking-editorial text-brand-off-white mb-6 leading-tight">
              Best Las Vegas Wedding Venues for Cinematic Video
            </h1>
            <div className="h-px w-16 bg-brand-gold mb-6" />
            <p className="font-body text-lg text-brand-gray leading-relaxed">
              The venues that actually film well, picked by the person who has to shoot them.
            </p>
          </div>

          <div className="prose-ecm space-y-6">
            <p className="font-body text-brand-off-white leading-relaxed text-lg">
              Most venue lists are written for the brochure photos. This one is written by a wedding videographer who has to walk in and turn the room into a film. Where the light falls, how much space there is to move, and what sits in the background matter just as much as the couple standing in the middle of it. Here are the Las Vegas wedding venues that consistently give us a great film in 2026, grouped by the kind of look they deliver.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              How a videographer reads a venue
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              Before I love a venue for its style, I look at three things. Light, because soft natural light flatters everyone and saves us from fighting harsh shadows. Space, because room to move means more angles and more cinematic shots. And backdrops, because a great frame needs something behind the couple that adds to the story instead of distracting from it. Every venue below scores well on at least two of those.
            </p>

            {['High above the Strip', 'Desert and natural', 'Luxury ballrooms', 'Off the beaten path'].map((group) => (
              <div key={group}>
                <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
                  {group}
                </h2>
                <div className="space-y-6">
                  {venues.filter((v) => v.tag === group).map((v) => (
                    <div key={v.name}>
                      <h3 className="font-heading text-lg uppercase tracking-editorial text-brand-off-white mb-2">
                        {v.name}
                      </h3>
                      <p className="font-body text-brand-gray leading-relaxed">{v.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              What to ask before you book
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              Whatever venue you choose, ask three questions that affect your film. Can my videographer fly a drone here, or are we in restricted airspace? How much time do we have for couple portraits, and is there a quiet spot for them? And what does the light look like at my ceremony time of day? A venue that answers those well is a venue that films well. For more on packages and budgets, see our guide on <Link href="/blog/wedding-videographer-cost-las-vegas" className="text-brand-gold hover:underline">how much a wedding videographer costs in Las Vegas</Link>.
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

          <div className="mt-16 p-8 bg-brand-charcoal/40 border border-brand-gold/20 text-center">
            <h3 className="font-heading text-xl uppercase tracking-editorial text-brand-gold mb-3">
              Booked Your Venue? Let&apos;s Film It Right.
            </h3>
            <p className="font-body text-brand-gray mb-6 max-w-lg mx-auto">
              Tell us your venue and date and we&apos;ll plan a film that makes the most of the space. We scout, we coordinate, and we shoot it like a feature. See our <Link href="/services/wedding-videography" className="text-brand-gold hover:underline">Las Vegas wedding videography page</Link> for details.
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
