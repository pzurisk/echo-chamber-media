import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';

export const metadata: Metadata = {
  title: 'Shooting My First Music Video: The Naked City Underground | Echo Chamber Media',
  description: 'Behind the scenes of the Naked City Underground music video shot in Las Vegas. Outlaw country meets surf punk — how we captured the raw energy of Coming To Me & Everything\'s Alright.',
  alternates: { canonical: 'https://echochambermedia.com/blog/naked-city-underground-music-video' },
  keywords: 'music video production Las Vegas, Naked City Underground, behind the scenes music video, cinematography breakdown, Echo Chamber Media',
  openGraph: {
    title: 'Shooting My First Music Video: The Naked City Underground',
    description: 'Behind the scenes of the Naked City Underground music video. Outlaw country meets surf punk — raw energy from Las Vegas\' genre-bending band.',
    url: 'https://echochambermedia.com/blog/naked-city-underground-music-video',
    type: 'article',
    locale: 'en_US',
  },
};

export default function NakedCityUndergroundPost() {
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
                Case Study
              </span>
              <span className="text-xs text-brand-gray font-body">April 2, 2026</span>
              <span className="text-xs text-brand-gray font-body">5 min read</span>
            </div>
            <h1 className="font-heading text-4xl lg:text-5xl uppercase tracking-editorial text-brand-off-white mb-6 leading-tight">
              Shooting My First Music Video: The Naked City Underground
            </h1>
            <div className="h-px w-16 bg-brand-gold mb-6" />
            <p className="font-body text-lg text-brand-gray leading-relaxed">
              How we captured the raw, genre-smashing energy of Las Vegas&apos; own outlaw country-surf punk outfit in their first music video.
            </p>
          </div>

          {/* Video Embed */}
          <div className="relative w-full aspect-video mb-12 border border-brand-gold/20">
            <iframe
              src="https://www.youtube.com/embed/x1yqQXmHCdY"
              title="The Naked City Underground — Music Video by Echo Chamber Media"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>

          {/* Article Body */}
          <div className="prose-ecm space-y-6">
            <p className="font-body text-brand-off-white leading-relaxed text-lg">
              Every filmmaker remembers their first music video. This one was mine. The Naked City Underground reached out looking for something that matched the feel of their sound — equal parts outlaw country grit and Southern California surf punk, with blues, jazz, and alternative rock mixed in for good measure. They&apos;re not a band you put in a box, and they didn&apos;t want a video you could put in one either.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              The Band
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              The Naked City Underground is a Las Vegas original. Two world-class flair bartenders who put the bottles down, picked up instruments, and started making music that comes straight from their souls. They teamed up with some of Sin City&apos;s best recording and live performing musicians to create something you can&apos;t quite pin down — their sound fills the gaps from Waylon Jennings to Nirvana to Sublime. They&apos;ve been featured on KOMP 92.3&apos;s Homegrown Show, and the tracks we shot — &quot;Coming To Me&quot; and &quot;Everything&apos;s Alright&quot; — have racked up a combined 74,000+ plays on Spotify.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              The Approach
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              The approach had to match their energy — raw, unpolished, and authentic. These guys are the exact opposite of a slick, over-produced machine, and that&apos;s what makes them great. I wanted the visuals to have that same quality: real moments, real grit, real Vegas. We leaned into dramatic contrast, handheld movement, and a pace that matched the swagger of the music.
            </p>
            <p className="font-body text-brand-off-white leading-relaxed">
              Las Vegas gave us everything we needed for locations. The desert, the dive bars, the neon — it all fed into the visual language of the video. This is a band born out of the Sin City bar scene, so we kept it rooted in that world. Every frame was shot with intention, treating it more like a short film than a traditional music video.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              The Technical Side
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              Being my first music video, I was hyper-focused on the fundamentals: camera movement that served the music, lighting that created mood without overpowering the performance, and color grading that unified everything into a cohesive visual world. Every shot was planned with the edit in mind — where the cuts would land, how the energy would build, where we&apos;d let a moment breathe.
            </p>
            <p className="font-body text-brand-off-white leading-relaxed">
              Post-production was where it really came together. The color grade leaned into warm tones and gritty texture — honky-tonk golds, desert heat, and just enough contrast to keep things cinematic without losing the raw, lived-in feel the band brings naturally.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              What I Learned
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              Shooting a music video is a completely different discipline than corporate work or weddings. The music is the edit. Every cut, every transition, every camera movement has to serve the rhythm. You&apos;re not telling a story in the traditional sense — you&apos;re building a feeling. That lesson carried into everything I&apos;ve shot since, including <Link href="/#featured-film" className="text-brand-gold hover:underline">The Classified Mind</Link>, our award-winning short film.
            </p>
            <p className="font-body text-brand-off-white leading-relaxed">
              This project also confirmed something I already suspected: Las Vegas is an incredible city for music video production. The locations, the light, the energy — it&apos;s all here. If you&apos;re an artist looking to shoot something cinematic in Vegas, <Link href="/#contact" className="text-brand-gold hover:underline">let&apos;s talk</Link>.
            </p>

            {/* Production Credits */}
            <div className="border-t border-brand-charcoal pt-8 mt-12">
              <h3 className="text-sm uppercase tracking-editorial text-brand-gold font-body mb-6">
                Production Credits
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                <div>
                  <span className="text-xs uppercase tracking-editorial text-brand-gray font-body">Artist</span>
                  <p className="text-brand-off-white font-body text-sm mt-0.5">The Naked City Underground</p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-editorial text-brand-gray font-body">Tracks</span>
                  <p className="text-brand-off-white font-body text-sm mt-0.5">Coming To Me &amp; Everything&apos;s Alright</p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-editorial text-brand-gray font-body">Cinematography</span>
                  <p className="text-brand-off-white font-body text-sm mt-0.5">Billy Zurisk</p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-editorial text-brand-gray font-body">Production</span>
                  <p className="text-brand-off-white font-body text-sm mt-0.5">Echo Chamber Media</p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-editorial text-brand-gray font-body">Location</span>
                  <p className="text-brand-off-white font-body text-sm mt-0.5">Las Vegas, Nevada</p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-editorial text-brand-gray font-body">Listen</span>
                  <p className="text-brand-off-white font-body text-sm mt-0.5">
                    <a href="https://open.spotify.com/artist/43ViaCnj8lJLmilAbhfD6j" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">
                      Spotify
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 p-8 bg-brand-charcoal/40 border border-brand-gold/20 text-center">
            <h3 className="font-heading text-xl uppercase tracking-editorial text-brand-gold mb-3">
              Ready to Shoot Your Music Video?
            </h3>
            <p className="font-body text-brand-gray mb-6 max-w-lg mx-auto">
              We bring cinematic production quality to every project. Tell us about your vision and let&apos;s create something unforgettable.
            </p>
            <Link
              href="/services/music-videos#contact"
              className="inline-block px-8 py-3 border border-brand-gold/60 text-brand-off-white font-body text-sm uppercase tracking-editorial hover:bg-brand-gold/10 transition-all duration-500"
            >
              Start Your Project
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
