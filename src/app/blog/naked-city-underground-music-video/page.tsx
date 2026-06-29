import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';

export const metadata: Metadata = {
  title: 'Las Vegas Music Video Director: Behind The Naked City Underground',
  description:
    'A Las Vegas music video director and cinematographer breaks down the Naked City Underground shoot. The U2 Numb inspired look, a DIY backdrop, anamorphic lenses, and the grade behind Everything\'s Alright and Coming To Me.',
  alternates: { canonical: 'https://echochambermedia.com/blog/naked-city-underground-music-video' },
  keywords:
    'music video director Las Vegas, Las Vegas cinematographer, music video production Las Vegas, hire music video director, Naked City Underground, Echo Chamber Media',
  openGraph: {
    title: 'Las Vegas Music Video Director: Behind The Naked City Underground',
    description:
      'How a Las Vegas music video director and cinematographer shot the Naked City Underground. Outlaw country meets surf punk, a DIY backdrop, and a 90s inspired look.',
    url: 'https://echochambermedia.com/blog/naked-city-underground-music-video',
    type: 'article',
    locale: 'en_US',
  },
};

const videos = [
  {
    id: 'UnqTEQxPWwo',
    label: "Everything's Alright",
    title: "The Naked City Underground: Everything's Alright. Music Video by Echo Chamber Media",
  },
  {
    id: 'x1yqQXmHCdY',
    label: 'Coming To Me',
    title: 'The Naked City Underground: Coming To Me. Music Video by Echo Chamber Media',
  },
];

export default function NakedCityUndergroundPost() {
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'Las Vegas Music Video Director: Behind The Naked City Underground',
    description:
      'A Las Vegas music video director and cinematographer breaks down the Naked City Underground shoot, the look, the gear, and the DIY backdrop.',
    datePublished: '2026-04-02',
    dateModified: '2026-06-29',
    author: { '@type': 'Person', name: 'Billy Zurisk' },
    publisher: { '@type': 'Organization', name: 'Echo Chamber Media', url: 'https://echochambermedia.com' },
    mainEntityOfPage: 'https://echochambermedia.com/blog/naked-city-underground-music-video',
  };

  const videoLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: videos.map((v, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'VideoObject',
        name: v.title,
        description: `${v.label} by The Naked City Underground, a music video directed and shot in Las Vegas by Echo Chamber Media.`,
        thumbnailUrl: `https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`,
        uploadDate: '2026-04-02',
        contentUrl: `https://www.youtube.com/watch?v=${v.id}`,
        embedUrl: `https://www.youtube.com/embed/${v.id}`,
        publisher: { '@type': 'Organization', name: 'Echo Chamber Media', url: 'https://echochambermedia.com' },
      },
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
              Back to Blog
            </Link>
          </nav>

          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-xs uppercase tracking-editorial text-brand-gold font-body bg-brand-gold/10 px-3 py-1">
                Case Study
              </span>
              <span className="text-xs text-brand-gray font-body">April 2, 2026</span>
              <span className="text-xs text-brand-gray font-body">6 min read</span>
            </div>
            <h1 className="font-heading text-4xl lg:text-5xl uppercase tracking-editorial text-brand-off-white mb-6 leading-tight">
              Behind The Naked City Underground
            </h1>
            <div className="h-px w-16 bg-brand-gold mb-6" />
            <p className="font-body text-lg text-brand-gray leading-relaxed">
              How I shot two music videos for one of Las Vegas&apos; most genre-bending bands, and why it&apos;s still my favorite work to date.
            </p>
          </div>

          {/* Video Embeds */}
          {videos.map((v, i) => (
            <div key={v.id} className={i === videos.length - 1 ? 'mb-12' : 'mb-6'}>
              <p className="text-xs uppercase tracking-editorial text-brand-gold font-body mb-3">&quot;{v.label}&quot;</p>
              <div className="relative w-full aspect-video border border-brand-gold/20">
                <iframe
                  src={`https://www.youtube.com/embed/${v.id}`}
                  title={v.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
          ))}

          {/* Article Body */}
          <div className="prose-ecm space-y-6">
            <p className="font-body text-brand-off-white leading-relaxed text-lg">
              The Naked City Underground came to me with songs off their album &quot;Comic Book Heroes and Honky Tonk Zeros&quot; and a simple question: what was my vision for them. So we sat down together and worked out the details. The questions I asked the band ended up doing the heavy lifting, because the answers told me what these songs were really about. That conversation is where the whole look started. As a Las Vegas music video director, that first sit-down matters more than any piece of gear.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              The Band
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              The Naked City Underground is a Las Vegas original. Two world-class flair bartenders put the bottles down, picked up instruments, and started making music straight from their souls. They teamed up with some of Sin City&apos;s best recording and live players to build a sound you can&apos;t put in a box, somewhere between Waylon Jennings, Nirvana, and Sublime. They&apos;ve been featured on KOMP 92.3&apos;s Homegrown Show, and the two tracks we shot, &quot;Everything&apos;s Alright&quot; and &quot;Coming To Me,&quot; have pulled in a combined 74,000 plus plays on Spotify.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              Building the Look for &quot;Everything&apos;s Alright&quot;
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              For &quot;Everything&apos;s Alright,&quot; the band wanted a 90s vibe. I took inspiration from the U2 &quot;Numb&quot; video, one I&apos;ve loved for years, and then we added our own elements on top of it. Crown, cup, confetti, the whole works. I had the band and my wife act out specific parts so we could build the effects we were after instead of faking them in post. It became its own thing fast, rooted in that 90s feel but unmistakably theirs.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              The DIY Backdrop
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              The biggest piece of the puzzle was the black backdrop, and we built it by hand. My wife and I broke down cardboard boxes and drilled holes through them so light could shine through and give us the effect we wanted. It was about as low budget as it gets, and I still can&apos;t believe how good it turned out. That is the part I am most proud of. A real look does not always come from expensive gear. Sometimes it comes from a stack of cardboard and a drill.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              The Gear and the Grade
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              We shot on the DJI Ronin 4D, the cinematic camera with the chicken head, on 35mm anamorphic lenses, then handled the color grade in house. The most surprising trick was speeding up the music so the band could perform to it, then slowing the footage back down. That single move did more for the final look than anything else. It gave the performances a heavy, dreamlike quality that fits the song.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              The Result
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              When the band saw it, the response was &quot;holy shit that&apos;s rad.&quot; We were thrilled with how it came out. &quot;Everything&apos;s Alright&quot; is still my favorite music video I&apos;ve shot. It is proof of what happens when a band trusts the process and a director and cinematographer treats a music video like a short film instead of a quick shoot.
            </p>
          </div>

          {/* CTA */}
          <div className="mt-16 p-8 bg-brand-charcoal/40 border border-brand-gold/20 text-center">
            <h3 className="font-heading text-xl uppercase tracking-editorial text-brand-gold mb-3">
              Need a Music Video Director in Las Vegas?
            </h3>
            <p className="font-body text-brand-gray mb-6 max-w-lg mx-auto">
              If you&apos;re a musician looking for a director and cinematographer who treats your song like a film, let&apos;s talk. Tell me the track and the vision, and I&apos;ll bring the rest. See more on our <Link href="/services/music-videos" className="text-brand-gold hover:underline">Las Vegas music video production page</Link>.
            </p>
            <Link
              href="/services/music-videos#contact"
              className="inline-block px-8 py-3 border border-brand-gold/60 text-brand-off-white font-body text-sm uppercase tracking-editorial hover:bg-brand-gold/10 transition-all duration-500"
            >
              Start Your Music Video
            </Link>
          </div>
        </article>
      </main>
      <Footer />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoLd) }} />
    </>
  );
}
