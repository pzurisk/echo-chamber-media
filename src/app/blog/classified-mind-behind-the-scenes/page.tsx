import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';

export const metadata: Metadata = {
  title: 'Behind The Classified Mind: How We Made an Award-Winning Indie Horror',
  description:
    'The production story behind The Classified Mind — an Echo Chamber Media indie feature that won Best Horror and Best Film Score at Las Vegas Indie Film Festival, took home Award Winner at The Dunwich Horror Fest, and became a Finalist at the RED Movie Awards. Written, shot, and edited in-house.',
  alternates: {
    canonical: 'https://echochambermedia.com/blog/classified-mind-behind-the-scenes',
  },
  keywords:
    'The Classified Mind, indie horror film Las Vegas, indie feature filmmaking, DJI Ronin 4D, Pete Miceli, Billy Zurisk, Echo Chamber Media, Las Vegas Indie Film Festival, psychological horror short, indie cinematography Las Vegas',
  openGraph: {
    title: 'Behind The Classified Mind — An Echo Chamber Media Production',
    description:
      'The production story behind our award-winning indie horror. Multi-festival winner. Shot on the DJI Ronin 4D, edited in-house, scored by Tim Legvold.',
    url: 'https://echochambermedia.com/blog/classified-mind-behind-the-scenes',
    type: 'article',
    locale: 'en_US',
  },
};

const FILM_YOUTUBE_ID = 'wGoX4MbAKCw';

const laurels = [
  { festival: 'The Dunwich Horror Fest', type: 'Award Winner' },
  { festival: 'Las Vegas Indie Film Festival 2026', type: 'Best Horror' },
  { festival: 'Las Vegas Indie Film Festival 2026', type: 'Best Film Score' },
  { festival: 'Golden Nugget International Film Festival 2026', type: 'Best Short' },
  { festival: 'RED Movie Awards 2027', type: 'Finalist' },
  { festival: 'Golden Nugget International Film Festival 2026', type: 'Official Selection' },
  { festival: 'Indie Vegas Film Festival 2026', type: 'Official Selection' },
  { festival: 'Bocas Film Fest 2026', type: 'Official Selection' },
];

export default function ClassifiedMindPost() {
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'Behind The Classified Mind: How We Made an Award-Winning Indie Horror',
    description:
      'The production story behind The Classified Mind, an Echo Chamber Media indie horror short. Multi-festival winner including Best Horror and Best Film Score at Las Vegas Indie Film Festival.',
    datePublished: '2026-07-23',
    dateModified: '2026-07-23',
    author: { '@type': 'Person', name: 'Billy Zurisk' },
    publisher: {
      '@type': 'Organization',
      name: 'Echo Chamber Media',
      url: 'https://echochambermedia.com',
    },
    mainEntityOfPage:
      'https://echochambermedia.com/blog/classified-mind-behind-the-scenes',
  };

  const videoLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: 'The Classified Mind — Echo Chamber Media',
    description:
      'The Classified Mind. An Echo Chamber Media production. A psychological horror short about Gideon, alone with his theories, certain something is watching.',
    thumbnailUrl: `https://i.ytimg.com/vi/${FILM_YOUTUBE_ID}/maxresdefault.jpg`,
    uploadDate: '2026-01-01',
    contentUrl: `https://www.youtube.com/watch?v=${FILM_YOUTUBE_ID}`,
    embedUrl: `https://www.youtube.com/embed/${FILM_YOUTUBE_ID}`,
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
              <span className="text-xs text-brand-gray font-body">July 23, 2026</span>
              <span className="text-xs text-brand-gray font-body">7 min read</span>
            </div>
            <h1 className="font-heading text-4xl lg:text-5xl uppercase tracking-editorial text-brand-off-white mb-6 leading-tight">
              Behind The Classified Mind
            </h1>
            <div className="h-px w-16 bg-brand-gold mb-6" />
            <p className="font-body text-lg text-brand-gray leading-relaxed">
              How we built an award-winning indie horror in-house — writing, shooting, cutting, scoring, and finishing under one roof.
            </p>
          </div>

          {/* Poster */}
          <div className="mb-12 max-w-md mx-auto">
            <div className="relative aspect-[2/3] overflow-hidden border border-brand-gold/20">
              <Image
                src="/images/the classified mind poster.png"
                alt="The Classified Mind Official Movie Poster"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
                priority
              />
            </div>
          </div>

          {/* Video */}
          <div className="mb-12">
            <p className="text-xs uppercase tracking-editorial text-brand-gold font-body mb-3">
              Watch the film
            </p>
            <div className="relative w-full aspect-video border border-brand-gold/20">
              <iframe
                src={`https://www.youtube.com/embed/${FILM_YOUTUBE_ID}`}
                title="The Classified Mind — Echo Chamber Media"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>

          {/* Article Body */}
          <div className="prose-ecm space-y-6">
            <p className="font-body text-brand-off-white leading-relaxed text-lg">
              The Classified Mind started as a question Pete Miceli and I kept coming back to — what happens when you get so close to a theory that you can&apos;t tell the difference between paranoia and pattern recognition anymore. We wrote it, shot it, cut it, scored it, and finished it in-house at Echo Chamber Media. That kind of vertical control is rare on an indie feature, and it&apos;s the reason the film ended up looking and sounding exactly like what we heard in our heads on day one.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              The Story
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              Gideon lives in his mother&apos;s basement, alone with his theories. The boards are covered. The patterns are there. He knows something is watching. He can feel it. But the closer he gets to the truth, the less certain he becomes of what the truth actually is. He might be wrong about everything. Then again, he might not be.
            </p>
            <p className="font-body text-brand-off-white leading-relaxed">
              We wanted to write a horror piece where the horror doesn&apos;t come from a monster you can point at. The horror comes from doubt — the moment you realize the person you trust least is yourself. Genre horror has room for that. We just needed to build a world tight enough that the audience felt the walls closing in the same way Gideon does.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              The Team
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              Pete Miceli directed and co-wrote with me. He also did the alien performance work, which we&apos;ll get to. Mark Vanis and Milla Dawn carry the film as Gideon and the woman he can&apos;t figure out. Tim Legvold scored the whole thing from scratch — that score ended up winning Best Film Score at Las Vegas Indie Film Festival, which is not a small deal in a room full of filmmakers who watch every credit. Anastasia Shuvayeva handled the sound mix. Melissa Phillips ran the gaff and shared production design with me and Pete.
            </p>
            <p className="font-body text-brand-off-white leading-relaxed">
              I produced, shot, and handled the special effects, and we finished the film out of our own edit suite. Small crew, sharp roles, no waiting on a vendor to get back to us. When the director wanted a change at 2am, we made it at 2am.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              The Look
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              We shot on the DJI Ronin 4D. Compact enough for the tight basement geography we needed, cinematic enough to hold up against anything in the festival circuit. The interiors called for close, claustrophobic framing — Gideon&apos;s conspiracy boards feel like they&apos;re watching him too, and the camera had to sell that without leaning on tricks. Practical lighting where we could, motivated sources everywhere else. Melissa gaffed a lot of the setups with fixtures we&apos;d already spent hundreds of hours getting to know on commercial work.
            </p>
            <p className="font-body text-brand-off-white leading-relaxed">
              We color graded in DaVinci Resolve. The grade pushes cool and desaturated for Gideon&apos;s reality, and shifts warmer when the film wants you to trust what you&apos;re seeing — which, in this film, is usually a bad sign. The grade is the last argument the film makes about what&apos;s real and what isn&apos;t.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              The Score
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              Tim Legvold wrote the score to picture. He and Pete traded ideas early on — texture, tempo, when to let a scene breathe without music at all. The result is a score that acts like a second narrator. It tells you Gideon is unstable before Gideon knows it, then drops away right when you expect it to lean in. When Best Film Score came in at Las Vegas Indie, it validated exactly what Tim was going for.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              Practical Effects
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              We did as much practical as we could. When you feel a texture on screen — a light flicker, a physical creature move, a real shadow — the audience believes it in a way they don&apos;t believe CG. Pete gave the alien performance himself. We built the movement, the silhouettes, and the reveals as practical elements first, then extended the ones that needed more in post. The point of doing it that way is that the human eye can tell the difference between a real thing and a fake thing even when it can&apos;t articulate why. We wanted the audience feeling that gut disturbance rather than watching a rendered effect.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              The Festival Run
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed mb-4">
              Where it&apos;s landed so far:
            </p>
            <ul className="font-body text-brand-off-white leading-relaxed space-y-2 pl-6 list-disc marker:text-brand-gold">
              <li><span className="text-brand-gold">Award Winner</span> — The Dunwich Horror Fest</li>
              <li><span className="text-brand-gold">Best Horror</span> — Las Vegas Indie Film Festival 2026</li>
              <li><span className="text-brand-gold">Best Film Score</span> — Las Vegas Indie Film Festival 2026</li>
              <li><span className="text-brand-gold">Best Short</span> — Golden Nugget International Film Festival 2026</li>
              <li><span className="text-brand-gold">Finalist</span> — RED Movie Awards 2027</li>
              <li><span className="text-brand-gold">Official Selection</span> — Golden Nugget International Film Festival 2026</li>
              <li><span className="text-brand-gold">Official Selection</span> — Indie Vegas Film Festival 2026</li>
              <li><span className="text-brand-gold">Official Selection</span> — Bocas Film Fest 2026</li>
            </ul>
            <p className="font-body text-brand-off-white leading-relaxed">
              Every festival is a different audience — a different room, a different set of judges, a different crowd reaction. Watching the film play to eight different rooms taught us more about what worked and what didn&apos;t than a year of edit-room notes ever could. A film that only lands in one room isn&apos;t as strong as one that lands in all of them for different reasons.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              Why This Matters for Client Work
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              People ask why an indie horror short belongs on the same page as our wedding and commercial work. Because the same crew, the same gear, the same edit suite, and the same standards go into all of it. If we can carry a psychological horror through eight festival juries — including a win for cinematography-adjacent categories like Best Horror and Best Film Score — we can absolutely carry your wedding, your brand film, or your commercial. Nothing we bring to a client project is less rigorous than what we brought to this.
            </p>
            <p className="font-body text-brand-off-white leading-relaxed">
              That&apos;s the whole point of shooting narrative alongside the commercial slate. It sharpens the craft. It gives us the practice reps a spec commercial or a wedding never quite gives you. And when a client hires us for a brand film that needs to feel like a story instead of a slideshow, this is the muscle they&apos;re actually paying for.
            </p>
          </div>

          {/* Laurels display */}
          <div className="mt-16 p-8 bg-brand-charcoal/40 border border-brand-gold/20">
            <h3 className="font-heading text-sm uppercase tracking-editorial text-brand-gold font-body mb-6 text-center">
              Festival Laurels
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {laurels.map((l) => (
                <div
                  key={`${l.festival}-${l.type}`}
                  className="flex items-start gap-3 p-3 bg-brand-black/40 border border-brand-gold/10"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-brand-gold flex-shrink-0 mt-0.5"
                  >
                    <path
                      d="M12 2L9 7L3 8.5L7 13L6 19L12 16L18 19L17 13L21 8.5L15 7L12 2Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div>
                    <span className="block text-[10px] uppercase tracking-editorial text-brand-gold font-body">
                      {l.type}
                    </span>
                    <span className="text-xs text-brand-off-white font-body">
                      {l.festival}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 p-8 bg-brand-charcoal/40 border border-brand-gold/20 text-center">
            <h3 className="font-heading text-xl uppercase tracking-editorial text-brand-gold mb-3">
              Need Narrative-Grade Production in Las Vegas?
            </h3>
            <p className="font-body text-brand-gray mb-6 max-w-lg mx-auto">
              Whether it&apos;s a brand film, a commercial that needs to feel like a story, or a wedding you want treated like a short — the same crew and craft that made The Classified Mind is what shows up on your shoot.
            </p>
            <Link
              href="/#contact"
              className="inline-block px-8 py-3 border border-brand-gold/60 text-brand-off-white font-body text-sm uppercase tracking-editorial hover:bg-brand-gold/10 transition-all duration-500"
            >
              Tell Us About Your Project
            </Link>
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
