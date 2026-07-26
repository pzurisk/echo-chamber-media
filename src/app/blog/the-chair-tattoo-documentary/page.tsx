import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';

export const metadata: Metadata = {
  title: 'Behind The Chair: Shooting a Short Documentary in a Tattoo Shop',
  description:
    'The making of The Chair, an Echo Chamber Media short documentary about Las Vegas tattoo artist Melissa Zurisk. Access, sound in a loud room, cutting from a transcript, and why a short doc beats an ad.',
  alternates: {
    canonical: 'https://echochambermedia.com/blog/the-chair-tattoo-documentary',
  },
  keywords:
    'The Chair documentary, short documentary Las Vegas, documentary production Las Vegas, tattoo documentary, Melissa Zurisk, Club Tattoo LINQ, Sony FX6 documentary, Billy Zurisk, Echo Chamber Media',
  openGraph: {
    title: 'Behind The Chair, an Echo Chamber Media Documentary',
    description:
      'How we made a short documentary portrait of a Las Vegas tattoo artist. Access, sound, structure, and the reason a doc outperforms an ad.',
    url: 'https://echochambermedia.com/blog/the-chair-tattoo-documentary',
    type: 'article',
    locale: 'en_US',
    images: [
      {
        url: 'https://i.ytimg.com/vi/QXUg9BVl2yo/maxresdefault.jpg',
        width: 1280,
        height: 720,
        alt: 'The Chair, a documentary by Echo Chamber Media',
      },
    ],
  },
};

const CHAIR_YOUTUBE_ID = 'QXUg9BVl2yo';

export default function TheChairPost() {
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'Behind The Chair: Shooting a Short Documentary in a Tattoo Shop',
    description:
      'The making of The Chair, an Echo Chamber Media short documentary about Las Vegas tattoo artist Melissa Zurisk. Access, sound, structure, and why a short doc works harder than an ad.',
    datePublished: '2026-07-26',
    dateModified: '2026-07-26',
    image: `https://i.ytimg.com/vi/${CHAIR_YOUTUBE_ID}/maxresdefault.jpg`,
    author: { '@type': 'Person', name: 'Billy Zurisk' },
    publisher: {
      '@type': 'Organization',
      name: 'Echo Chamber Media',
      url: 'https://echochambermedia.com',
    },
    mainEntityOfPage:
      'https://echochambermedia.com/blog/the-chair-tattoo-documentary',
  };

  const videoLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: 'The Chair, a documentary by Echo Chamber Media',
    description:
      'A short documentary portrait of Melissa Zurisk, a tattoo artist at Club Tattoo inside The LINQ in Las Vegas. About the craft, the trust between an artist and a stranger, and what it costs to carry other people’s stories all day.',
    thumbnailUrl: `https://i.ytimg.com/vi/${CHAIR_YOUTUBE_ID}/maxresdefault.jpg`,
    uploadDate: '2026-07-26',
    contentUrl: `https://www.youtube.com/watch?v=${CHAIR_YOUTUBE_ID}`,
    embedUrl: `https://www.youtube.com/embed/${CHAIR_YOUTUBE_ID}`,
    director: { '@type': 'Person', name: 'Billy Zurisk' },
    publisher: {
      '@type': 'Organization',
      name: 'Echo Chamber Media',
      url: 'https://echochambermedia.com',
    },
  };

  return (
    <>
      <Navbar />
      <main className="bg-brand-black text-brand-off-white min-h-screen pt-32 pb-20 px-6">
        <article className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <Link
              href="/blog"
              className="text-xs uppercase tracking-editorial text-brand-gray hover:text-brand-gold font-body transition-colors"
            >
              Back to Blog
            </Link>
          </nav>

          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <span className="text-xs uppercase tracking-editorial text-brand-gold font-body bg-brand-gold/10 px-3 py-1">
                Case Study
              </span>
              <span className="text-xs text-brand-gray font-body">July 26, 2026</span>
              <span className="text-xs text-brand-gray font-body">6 min read</span>
            </div>
            <h1 className="font-heading text-4xl lg:text-5xl uppercase tracking-editorial text-brand-off-white mb-6 leading-tight">
              Behind The Chair
            </h1>
            <div className="h-px w-16 bg-brand-gold mb-6" />
            <p className="font-body text-lg text-brand-gray leading-relaxed">
              A short documentary about a tattoo artist, shot on a working shop floor on the Las Vegas Strip. Here is how it came together.
            </p>
          </div>

          {/* Video */}
          <div className="mb-12">
            <p className="text-xs uppercase tracking-editorial text-brand-gold font-body mb-3">
              Watch the film
            </p>
            <div className="relative w-full aspect-video border border-brand-gold/20">
              <iframe
                src={`https://www.youtube.com/embed/${CHAIR_YOUTUBE_ID}`}
                title="The Chair, a documentary by Echo Chamber Media"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>

          {/* Article Body */}
          <div className="prose-ecm space-y-6">
            <p className="font-body text-brand-off-white leading-relaxed text-lg">
              People sit in Melissa&apos;s chair for hours. They tell her everything. That was the whole film before a single frame got shot, and every decision after it came back to that one idea.
            </p>
            <p className="font-body text-brand-off-white leading-relaxed">
              The Chair is a short portrait of Melissa Zurisk, a tattoo artist at Club Tattoo inside The LINQ in Las Vegas. It is about the craft, the trust that builds between an artist and a stranger, and what it costs to carry other people&apos;s stories on your hands all day. I directed, shot, and edited it.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              Find the Sentence First
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              Most short docs die because nobody decided what the film is about. You end up with a nice-looking profile of a person doing their job, and it has no reason to exist. So before we scheduled anything, we wrote the one line the film had to prove. Then we built the structure around it: a cold open, then four movements. The craft. The trust. The weight. The why.
            </p>
            <p className="font-body text-brand-off-white leading-relaxed">
              Those four words were the shot list, the interview outline, and the edit map at the same time. When you are on a shop floor with limited time and no ability to reset a scene, knowing exactly which of those four buckets a shot belongs to is what keeps you from going home with two hours of pretty nothing.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              Shooting Around Real Work
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              A tattoo shop on the Strip is a working business, not a set. There are appointments on the books, clients under the needle, and a floor full of people who did not sign up to be in a movie. You cannot stop a tattoo halfway through because you want a different angle.
            </p>
            <p className="font-body text-brand-off-white leading-relaxed">
              That means the camera moves around the artist and never the other way. We shot on the Sony FX6, mostly handheld and close, working with the light the shop already has instead of dragging in a grip package that would have taken the room over. Tight on the hands. Tight on the machine. The wider frames are there to give you the room, not to show off the room.
            </p>
            <p className="font-body text-brand-off-white leading-relaxed">
              The same rule applies to client work. If we are shooting your kitchen, your warehouse, or your surgical suite, the shoot has to bend around the operation. Business first, camera second. It is also the only way you get behavior on camera that looks like behavior instead of performance.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              Sound Is the Part People Skip
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              A tattoo shop is loud. Machines, music, conversation, foot traffic off the casino floor. The on-camera mic is fine as a reference track for syncing, and it is useless for anything you actually want a viewer to hear.
            </p>
            <p className="font-body text-brand-off-white leading-relaxed">
              So the interview ran dual system: a dedicated mic on its own channel at a real level, with the camera mic riding along purely as a scratch track. That one decision is the difference between a film you can cut and a film you have to apologize for. Nobody watching a documentary ever says the sound was great. They just keep watching, which is the whole point.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              Cutting From the Page, Not the Timeline
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              We came back with about an hour of interview and a couple of hours of b-roll. That is a normal ratio for a short doc, and it is also the moment most projects stall out, because scrubbing through hours of footage looking for a story is a terrible way to find one.
            </p>
            <p className="font-body text-brand-off-white leading-relaxed">
              Instead, the interview got transcribed and the film got built on the page first. Pull the lines that carry weight, sort them into the four movements, read the whole thing out loud, cut anything that repeats an idea you already landed. Only then does it go on a timeline in Premiere. By the time the first clip hit the sequence, the shape of the film was already decided and the edit was mostly about rhythm and pictures.
            </p>
            <p className="font-body text-brand-off-white leading-relaxed">
              There is no narrator. Melissa carries it in her own words, which is the only version that would have been worth making. A voice of god telling you a tattoo artist is thoughtful is not the same as hearing her say the thing that proves it.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              Why a Short Doc Beats an Ad
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              An ad tells people you are good. A documentary lets them decide you are good, which is a much harder thing to argue with. Nothing in The Chair asks anyone to book an appointment. It just shows what the work actually looks like and what it takes out of the person doing it, and a viewer who watches the whole thing already trusts her more than any testimonial could manage.
            </p>
            <p className="font-body text-brand-off-white leading-relaxed">
              That is the format we push for owner-operated businesses, trades, nonprofits, and anyone whose value is hard to explain in thirty seconds of copy. It runs on a website, on YouTube, in a pitch deck, on a wall at an event. It also does not expire the way an ad campaign does. A good portrait of your business is still good three years from now.
            </p>
            <p className="font-body text-brand-off-white leading-relaxed">
              If you want to see more of Melissa&apos;s work, it lives at{' '}
              <a
                href="https://www.melissazurisktattoo.com"
                target="_blank"
                rel="noopener"
                className="text-brand-gold border-b border-brand-gold/30 hover:border-brand-gold transition-colors"
              >
                melissazurisktattoo.com
              </a>
              . If you want one of these made about your business, that part is on us.
            </p>
          </div>

          {/* Credits */}
          <div className="mt-16 p-8 bg-brand-charcoal/40 border border-brand-gold/20">
            <h3 className="font-heading text-sm uppercase tracking-editorial text-brand-gold mb-6 text-center">
              The Chair, Credits
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {[
                { role: 'Directed by', name: 'Billy Zurisk' },
                { role: 'Cinematography', name: 'Billy Zurisk' },
                { role: 'Edited by', name: 'Billy Zurisk' },
                { role: 'Featuring', name: 'Melissa Zurisk' },
                { role: 'Shot on', name: 'Sony FX6' },
                { role: 'Produced by', name: 'Echo Chamber Media, Las Vegas' },
              ].map((c) => (
                <div key={c.role}>
                  <span className="text-xs uppercase tracking-editorial text-brand-gray font-body">
                    {c.role}
                  </span>
                  <p className="text-brand-off-white font-body text-sm mt-0.5">{c.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 p-8 bg-brand-charcoal/40 border border-brand-gold/20 text-center">
            <h3 className="font-heading text-xl uppercase tracking-editorial text-brand-gold mb-3">
              Want a Documentary About Your Business?
            </h3>
            <p className="font-body text-brand-gray mb-6 max-w-lg mx-auto">
              We shoot short docs for owner-operated businesses, trades, and nonprofits in Las Vegas and anywhere else worth flying to. Concept through final delivery, handled in house.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services/documentary"
                className="inline-block px-8 py-3 border border-brand-gold/60 text-brand-off-white font-body text-sm uppercase tracking-editorial hover:bg-brand-gold/10 transition-all duration-500"
              >
                Documentary Production
              </Link>
              <Link
                href="/#contact"
                className="inline-block px-8 py-3 border border-brand-gold/60 text-brand-off-white font-body text-sm uppercase tracking-editorial hover:bg-brand-gold/10 transition-all duration-500"
              >
                Tell Us About Your Project
              </Link>
            </div>
          </div>
        </article>
      </main>
      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoLd) }}
      />
    </>
  );
}
