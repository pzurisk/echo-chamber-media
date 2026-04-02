import { Metadata } from 'next';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';

// This must be exported for Next.js metadata
export const metadata: Metadata = {
  title: 'Music Video Production Las Vegas | Cinematic Music Videos | Echo Chamber Media',
  description: 'Music video production in Las Vegas. Cinematic visuals for artists — performance, narrative & concept videos. Bring your sound to life today.',
  alternates: { canonical: 'https://echochambermedia.com/services/music-videos' },
  keywords: 'music video production Las Vegas, cinematic music videos, music video producer Las Vegas, professional music video production, artist music videos',
  openGraph: {
    title: 'Music Video Production Las Vegas | Echo Chamber Media',
    description: 'Music video production in Las Vegas. Cinematic visuals for artists — performance, narrative & concept videos. Bring your sound to life today.',
    url: 'https://echochambermedia.com/services/music-videos',
    type: 'website',
    locale: 'en_US',
  },
};

export default function MusicVideosPage() {
  return (
    <>
      <Navbar />
      <main className="bg-brand-black text-brand-off-white">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-32 pb-20 px-6">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-charcoal to-brand-black"></div>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-5xl lg:text-7xl font-black mb-6 text-brand-gold tracking-editorial leading-tight">
              CINEMATIC MUSIC VIDEOS
            </h1>
            <p className="font-body text-xl lg:text-2xl text-brand-off-white mb-8 leading-relaxed max-w-2xl mx-auto">
              Bring your artistic vision to life with cinematic production quality. From performance videos to concept narratives, we create music videos that captivate audiences and amplify your artistry.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#showcase"
                className="inline-block bg-brand-gold text-brand-black font-heading font-bold py-4 px-8 rounded-lg hover:bg-opacity-90 transition-all"
              >
                See Our Work
              </a>
              <a
                href="#contact"
                className="inline-block border-2 border-brand-gold text-brand-gold font-heading font-bold py-4 px-8 rounded-lg hover:bg-brand-gold hover:text-brand-black transition-all"
              >
                Start Your Project
              </a>
            </div>
          </div>
        </section>

        {/* Why Choose Echo Chamber Media */}
        <section className="py-20 px-6 bg-brand-charcoal">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-16 text-center tracking-editorial">
              Why Choose Echo Chamber Media for Your Music Video
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-gold flex items-center justify-center">
                    <span className="text-brand-black font-heading font-bold text-lg">✓</span>
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-brand-gold mb-2">Cinematic Production Quality</h3>
                    <p className="font-body text-brand-off-white">
                      We approach every music video as a cinematic film production. Professional cameras, lighting, color grading, and visual effects combine to create videos that stand out on all platforms.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-gold flex items-center justify-center">
                    <span className="text-brand-black font-heading font-bold text-lg">✓</span>
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-brand-gold mb-2">Performance Capture</h3>
                    <p className="font-body text-brand-off-white">
                      Your performance is the heart of the video. We capture authentic artist presence with dynamic camera work, creative angles, and editing that showcases your talent and stage presence.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-gold flex items-center justify-center">
                    <span className="text-brand-black font-heading font-bold text-lg">✓</span>
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-brand-gold mb-2">Narrative Storytelling</h3>
                    <p className="font-body text-brand-off-white">
                      Beyond performance, we excel at weaving cinematic narratives. Concept-driven videos with compelling visuals, thoughtful color palettes, and emotional depth that connect with your audience.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-gold flex items-center justify-center">
                    <span className="text-brand-black font-heading font-bold text-lg">✓</span>
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-brand-gold mb-2">Color Grading & Post</h3>
                    <p className="font-body text-brand-off-white">
                      Professional post-production elevates every frame. Advanced color grading, visual effects, motion graphics, and meticulous editing ensure your video has a polished, broadcast-quality look.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-gold flex items-center justify-center">
                    <span className="text-brand-black font-heading font-bold text-lg">✓</span>
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-brand-gold mb-2">Location Scouting Las Vegas</h3>
                    <p className="font-body text-brand-off-white">
                      Las Vegas is our home and our creative playground. From iconic desert landscapes to urban backdrops, intimate venues to sprawling locations, we know every location that can bring your vision to life.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-gold flex items-center justify-center">
                    <span className="text-brand-black font-heading font-bold text-lg">✓</span>
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-brand-gold mb-2">Artist-First Collaboration</h3>
                    <p className="font-body text-brand-off-white">
                      Your artistic vision drives every decision. We listen, collaborate, and push creative boundaries together. Your voice matters—we&apos;re here to amplify your artistry, not override it.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Work */}
        <section id="showcase" className="py-20 px-6 bg-brand-black">
          <div className="max-w-5xl mx-auto">
            <p className="text-sm uppercase tracking-editorial text-brand-gold font-body mb-4 text-center">
              Featured Work
            </p>
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-off-white mb-6 text-center tracking-editorial">
              The Naked City Underground
            </h2>
            <p className="font-body text-brand-gray text-center max-w-2xl mx-auto mb-12">
              &quot;Coming To Me&quot; &amp; &quot;Everything&apos;s Alright&quot; — Our debut music video production. A dark, atmospheric visual companion for Las Vegas&apos; own genre-bending outfit, blending outlaw country grit with surf punk energy.
            </p>

            {/* YouTube Embed */}
            <div className="relative w-full max-w-4xl mx-auto aspect-video mb-12 border border-brand-gold/20">
              <iframe
                src="https://www.youtube.com/embed/x1yqQXmHCdY"
                title="The Naked City Underground — Music Video by Echo Chamber Media"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>

            {/* Production Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
              <div className="bg-brand-charcoal/40 border border-brand-gold/10 p-6 text-center">
                <p className="text-xs uppercase tracking-editorial text-brand-gold font-body mb-1">Artist</p>
                <p className="text-brand-off-white font-body">The Naked City Underground</p>
              </div>
              <div className="bg-brand-charcoal/40 border border-brand-gold/10 p-6 text-center">
                <p className="text-xs uppercase tracking-editorial text-brand-gold font-body mb-1">Cinematography</p>
                <p className="text-brand-off-white font-body">Billy Zurisk</p>
              </div>
              <div className="bg-brand-charcoal/40 border border-brand-gold/10 p-6 text-center">
                <p className="text-xs uppercase tracking-editorial text-brand-gold font-body mb-1">Vibe</p>
                <p className="text-brand-off-white font-body">Dark &amp; Atmospheric</p>
              </div>
            </div>

            <div className="h-px w-full bg-brand-charcoal mb-16" />

            {/* Music Video Styles */}
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-16 text-center tracking-editorial">
              Our Music Video Styles
            </h2>

            <div className="space-y-12">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="md:w-1/2">
                  <h3 className="font-heading text-2xl font-bold text-brand-gold mb-4">Performance Videos</h3>
                  <p className="font-body text-brand-off-white text-lg leading-relaxed mb-4">
                    Capture your raw talent and stage presence with dynamic cinematography. We use creative camera movements, multiple angles, and professional lighting to showcase your performance with energy and authenticity. Perfect for showcasing vocal ability, instrumental skill, and connecting directly with your audience.
                  </p>
                </div>
                <div className="md:w-1/2 aspect-video bg-brand-charcoal rounded-lg flex items-center justify-center border border-brand-gold border-opacity-30 overflow-hidden">
                  <iframe
                    src="https://www.youtube.com/embed/x1yqQXmHCdY"
                    title="Performance Video Example — The Naked City Underground"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="md:w-1/2 h-64 bg-brand-charcoal rounded-lg flex items-center justify-center border border-brand-gold border-opacity-30 order-2 md:order-1">
                  <p className="text-brand-gray text-center font-body text-sm">More work coming soon</p>
                </div>
                <div className="md:w-1/2 order-1 md:order-2">
                  <h3 className="font-heading text-2xl font-bold text-brand-gold mb-4">Narrative &amp; Concept Videos</h3>
                  <p className="font-body text-brand-off-white text-lg leading-relaxed mb-4">
                    Tell a story that resonates with your audience. From surreal concept pieces to narrative-driven productions, we blend cinematic storytelling with your music. Beautiful cinematography, thoughtful production design, and emotionally compelling visuals create videos that elevate your artistry beyond the performance itself.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="md:w-1/2">
                  <h3 className="font-heading text-2xl font-bold text-brand-gold mb-4">Live Session &amp; Behind-the-Scenes</h3>
                  <p className="font-body text-brand-off-white text-lg leading-relaxed mb-4">
                    Authenticity matters. We document live sessions, studio moments, and behind-the-scenes content that brings fans closer to your creative process. These videos humanize your artistry and build deeper connections with your audience while maintaining cinematic visual quality throughout.
                  </p>
                </div>
                <div className="md:w-1/2 h-64 bg-brand-charcoal rounded-lg flex items-center justify-center border border-brand-gold border-opacity-30">
                  <p className="text-brand-gray text-center font-body text-sm">More work coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Process Section */}
        <section className="py-20 px-6 bg-brand-charcoal">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-16 text-center tracking-editorial">
              Our Music Video Process
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Pre-Production */}
              <div className="bg-brand-black p-8 rounded-lg border border-brand-gold border-opacity-30">
                <h3 className="font-heading text-2xl font-bold text-brand-gold mb-4">Pre-Production</h3>
                <ul className="font-body text-brand-off-white space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Concept development & creative direction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Storyboarding & shot lists</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Location scouting & logistics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Crew planning & scheduling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Budget & timeline review</span>
                  </li>
                </ul>
              </div>

              {/* Production Day */}
              <div className="bg-brand-black p-8 rounded-lg border border-brand-gold border-opacity-30">
                <h3 className="font-heading text-2xl font-bold text-brand-gold mb-4">Production Day</h3>
                <ul className="font-body text-brand-off-white space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Professional camera crew & equipment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Cinematic lighting design</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Creative direction & artist guidance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Multiple takes & angles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Professional audio sync</span>
                  </li>
                </ul>
              </div>

              {/* Post-Production */}
              <div className="bg-brand-black p-8 rounded-lg border border-brand-gold border-opacity-30">
                <h3 className="font-heading text-2xl font-bold text-brand-gold mb-4">Post-Production</h3>
                <ul className="font-body text-brand-off-white space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Professional editing & assembly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Color grading & visual enhancement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Visual effects & motion graphics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Sound design & audio mixing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Revisions & final approval</span>
                  </li>
                </ul>
              </div>

              {/* Delivery */}
              <div className="bg-brand-black p-8 rounded-lg border border-brand-gold border-opacity-30">
                <h3 className="font-heading text-2xl font-bold text-brand-gold mb-4">Delivery</h3>
                <ul className="font-body text-brand-off-white space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>High-resolution master files</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>YouTube & streaming formats</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Social media optimized versions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Vertical & square formats for TikTok/Reels</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Subtitle & caption options</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-6 bg-brand-black">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-16 text-center tracking-editorial">
              Frequently Asked Questions
            </h2>

            <div className="space-y-8">
              <div className="border-l-4 border-brand-gold pl-6">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">
                  How much does a music video cost?
                </h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  Music video pricing varies based on your vision, production complexity, locations, crew size, and post-production needs. A performance video has different requirements than a concept narrative. We create custom quotes for each project to match your artistic goals and budget. Contact us to discuss your project and get a tailored proposal.
                </p>
              </div>

              <div className="border-l-4 border-brand-gold pl-6">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">
                  What&apos;s included in the music video production?
                </h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  Our comprehensive packages include pre-production consultation, professional cinematography, on-set direction, post-production editing, color grading, sound design, and delivery in multiple formats. We handle everything from creative development to final files ready for distribution.
                </p>
              </div>

              <div className="border-l-4 border-brand-gold pl-6">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">
                  How long does it take from pre-production to final delivery?
                </h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  Typical timeline: 2-3 weeks pre-production, 1-3 days production depending on scope, 3-6 weeks post-production. Complex concept videos with VFX may take longer. We&apos;ll provide a detailed timeline during our initial consultation based on your specific project needs.
                </p>
              </div>

              <div className="border-l-4 border-brand-gold pl-6">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">
                  Can you work with artists of different genres?
                </h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  Absolutely. We&apos;ve produced music videos across hip-hop, pop, rock, indie, electronic, and many other genres. The production approach adapts to your music&apos;s energy, vibe, and message. Your genre doesn&apos;t limit us—your artistic vision does.
                </p>
              </div>

              <div className="border-l-4 border-brand-gold pl-6">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">
                  Do you shoot in Las Vegas or can you travel?
                </h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  Las Vegas is our base and we have unmatched knowledge of locations here. However, we can travel for music video production. We&apos;ll discuss travel costs, logistics, and timeline during your consultation. Many artists love filming in Las Vegas for its iconic landscapes and urban backdrops.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="py-20 px-6 bg-brand-charcoal">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-6 tracking-editorial">
              Ready to Bring Your Music to Life?
            </h2>
            <p className="font-body text-brand-off-white text-lg mb-10 leading-relaxed">
              Let&apos;s collaborate to create a music video that captures your artistry and resonates with your audience. Get in touch to discuss your vision, budget, and timeline.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:hello@echochambermedia.com"
                className="inline-block bg-brand-gold text-brand-black font-heading font-bold py-4 px-8 rounded-lg hover:bg-opacity-90 transition-all"
              >
                Inquire About Your Project
              </a>
              <a
                href="/"
                className="inline-block border-2 border-brand-gold text-brand-gold font-heading font-bold py-4 px-8 rounded-lg hover:bg-brand-gold hover:text-brand-black transition-all"
              >
                Back to Home
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'Echo Chamber Media - Music Video Production',
            image: 'https://echochambermedia.com/og-image.jpg',
            description: 'Professional music video production in Las Vegas. Cinematic music videos for artists, from performance captures to concept narratives.',
            telephone: '+1-702-555-ECHO',
            email: 'hello@echochambermedia.com',
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
            url: 'https://echochambermedia.com/services/music-videos',
            sameAs: [
              'https://instagram.com/echochambermedia',
              'https://facebook.com/echochambermedia',
            ],
            profession: ['Videographer', 'Music Video Producer', 'Cinematographer'],
            knowsAbout: [
              'Cinematic Music Video Production',
              'Performance Videography',
              'Narrative Video Production',
              'Music Video Editing',
              'Color Grading',
              'Las Vegas Video Production',
            ],
            service: {
              '@type': 'Service',
              name: 'Music Video Production',
              description: 'Cinematic music video production services for artists',
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

      <Footer />
    </>
  );
}
