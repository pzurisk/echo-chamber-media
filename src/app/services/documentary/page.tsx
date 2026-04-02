import { Metadata } from 'next'
import Navbar from '@/sections/Navbar'
import Footer from '@/sections/Footer'

export const metadata: Metadata = {
  title: 'Documentary Production | Echo Chamber Media Las Vegas',
  description: 'Documentary production in Las Vegas. From concept to distribution, we craft authentic stories with cinematic precision. Tell us about your project.',
  keywords: 'documentary production Las Vegas, documentary filmmaker, video production Las Vegas, documentary services, story-driven content',
  openGraph: {
    title: 'Documentary Production | Echo Chamber Media',
    description: 'Documentary production in Las Vegas. From concept to distribution, we craft authentic stories with cinematic precision. Tell us about your project.',
    type: 'website',
    url: 'https://echochambermedia.com/services/documentary',
    images: [
      {
        url: 'https://echochambermedia.com/og-documentary.jpg',
        width: 1200,
        height: 630,
        alt: 'Echo Chamber Media Documentary Production',
      },
    ],
  },
}

export default function DocumentaryPage() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-charcoal via-brand-black to-brand-black" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-gold rounded-full blur-3xl opacity-20" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-brand-gold rounded-full blur-3xl opacity-10" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-8 py-20 text-center">
          <h1 className="font-heading text-7xl md:text-8xl font-black text-brand-gold mb-6 tracking-editorial uppercase">
            Documentary Production
          </h1>
          <p className="font-body text-xl md:text-2xl text-brand-off-white mb-8 max-w-3xl mx-auto leading-relaxed">
            Tell the stories that matter. We craft feature-length documentaries, episodic series, and compelling short-form content with authentic storytelling and cinematic production value.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <a
              href="#showcase"
              className="px-8 py-4 bg-brand-gold text-brand-black font-heading font-black uppercase tracking-editorial hover:bg-opacity-90 transition duration-300 rounded-lg"
            >
              See Our Films
            </a>
            <a
              href="#contact"
              className="px-8 py-4 border-2 border-brand-gold text-brand-gold font-heading font-black uppercase tracking-editorial hover:bg-brand-gold hover:text-brand-black transition duration-300 rounded-lg"
            >
              Start Your Story
            </a>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="bg-brand-charcoal py-20 md:py-28 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-5xl md:text-6xl font-black text-brand-gold mb-16 tracking-editorial uppercase text-center">
            Why Choose Echo Chamber
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              {
                title: 'Authentic Storytelling',
                description: 'We dig deep to uncover the heart of your story, respecting your subjects and their narratives.',
              },
              {
                title: 'Cinematic Production Value',
                description: 'Professional cinematography, color grading, and sound design that elevates your documentary.',
              },
              {
                title: 'Interview Expertise',
                description: 'Experienced at drawing compelling performances and honest moments from your subjects.',
              },
              {
                title: 'Archival Integration',
                description: 'Seamless incorporation of archival footage, photos, and materials into your narrative.',
              },
              {
                title: 'Full Post-Production',
                description: 'Complete in-house editing, color correction, sound mixing, and music composition.',
              },
              {
                title: 'Festival & Distribution Ready',
                description: 'We understand spec requirements for festivals, streaming platforms, and broadcast.',
              },
            ].map((item, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-gold flex items-center justify-center">
                    <span className="text-brand-black font-heading font-bold text-lg">✓</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-heading font-black text-brand-gold mb-2 uppercase tracking-editorial">
                    {item.title}
                  </h3>
                  <p className="font-body text-brand-off-white text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section id="showcase" className="bg-brand-black py-20 md:py-28 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-5xl md:text-6xl font-black text-brand-gold mb-16 tracking-editorial uppercase text-center">
            Our Films
          </h2>

          {/* Feature-Length Documentaries */}
          <div className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="font-heading text-3xl md:text-4xl font-black text-brand-gold mb-6 uppercase tracking-editorial">
                  Feature-Length Documentaries
                </h3>
                <p className="font-body text-brand-off-white text-lg leading-relaxed mb-6">
                  In-depth explorations of compelling subjects, characters, and stories. Our feature documentaries span 60-90 minutes with cinematic production value, complex narratives, and professional distribution readiness.
                </p>
                <p className="font-body text-brand-gray text-base">
                  Perfect for film festivals, streaming platforms, and theatrical distribution.
                </p>
              </div>
              <div className="bg-brand-charcoal h-80 rounded-lg flex items-center justify-center border border-brand-gold border-opacity-30">
                <p className="font-body text-brand-gray text-lg">
                  [Documentary Demo - Feature Film]
                </p>
              </div>
            </div>
          </div>

          {/* Short-Form Documentaries */}
          <div className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="lg:order-2">
                <h3 className="font-heading text-3xl md:text-4xl font-black text-brand-gold mb-6 uppercase tracking-editorial">
                  Short-Form Documentaries
                </h3>
                <p className="font-body text-brand-off-white text-lg leading-relaxed mb-6">
                  Compelling stories told in 3-15 minutes. Ideal for social media, web platforms, and festival submissions. Still cinematic in production value without the time commitment of a feature.
                </p>
                <p className="font-body text-brand-gray text-base">
                  Maximize engagement and shareability across digital platforms.
                </p>
              </div>
              <div className="lg:order-1 bg-brand-charcoal h-80 rounded-lg flex items-center justify-center border border-brand-gold border-opacity-30">
                <p className="font-body text-brand-gray text-lg">
                  [Documentary Demo - Short Form]
                </p>
              </div>
            </div>
          </div>

          {/* Docuseries & Episodic */}
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="font-heading text-3xl md:text-4xl font-black text-brand-gold mb-6 uppercase tracking-editorial">
                  Docuseries & Episodic Content
                </h3>
                <p className="font-body text-brand-off-white text-lg leading-relaxed mb-6">
                  Multi-episode storytelling that builds narrative momentum. We handle arc development, episode structure, continuity, and the unique challenges of maintaining quality across multiple installments.
                </p>
                <p className="font-body text-brand-gray text-base">
                  Built for streaming platforms, broadcast, and subscription services.
                </p>
              </div>
              <div className="bg-brand-charcoal h-80 rounded-lg flex items-center justify-center border border-brand-gold border-opacity-30">
                <p className="font-body text-brand-gray text-lg">
                  [Documentary Demo - Docuseries]
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Approach Section */}
      <section className="bg-brand-charcoal py-20 md:py-28 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-5xl md:text-6xl font-black text-brand-gold mb-16 tracking-editorial uppercase text-center">
            Our Approach
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                number: '1',
                title: 'Development',
                items: [
                  'Research and story research',
                  'Subject identification and interviews',
                  'Story arc and structure',
                  'Treatment and pitch materials',
                ],
              },
              {
                number: '2',
                title: 'Production',
                items: [
                  'Interview cinematography',
                  'B-roll and verite shooting',
                  'Multi-camera setups',
                  'Professional audio capture',
                ],
              },
              {
                number: '3',
                title: 'Post-Production',
                items: [
                  'Creative editing and pacing',
                  'Color correction and grading',
                  'Sound design and mixing',
                  'Original and licensed music',
                ],
              },
              {
                number: '4',
                title: 'Distribution',
                items: [
                  'Festival submission strategy',
                  'Streaming platform optimization',
                  'Broadcast specifications',
                  'Marketing and promotion',
                ],
              },
            ].map((phase, index) => (
              <div key={index} className="bg-brand-black rounded-lg p-8 border border-brand-gold border-opacity-20">
                <div className="text-brand-gold font-heading text-5xl font-black mb-4">
                  {phase.number}
                </div>
                <h3 className="font-heading text-xl font-black text-brand-gold mb-6 uppercase tracking-editorial">
                  {phase.title}
                </h3>
                <ul className="space-y-3">
                  {phase.items.map((item, idx) => (
                    <li key={idx} className="font-body text-brand-off-white text-sm flex items-start gap-2">
                      <span className="text-brand-gold mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-brand-black py-20 md:py-28 px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading text-5xl md:text-6xl font-black text-brand-gold mb-16 tracking-editorial uppercase text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-8">
            {[
              {
                q: 'What types of documentaries do you specialize in?',
                a: 'We work across all documentary genres—historical, biographical, investigative, personal narrative, observational, and hybrid approaches. Our experience spans feature-length films, episodic series, and short-form content.',
              },
              {
                q: 'How long does a documentary typically take to produce?',
                a: 'Timeline varies significantly based on scope. A short-form documentary (5-15 min) might take 3-4 months. Feature-length documentaries typically require 6-18 months depending on subject complexity, shooting schedule, and post-production needs.',
              },
              {
                q: 'What subjects and topics do you cover?',
                a: 'We&apos;re open to diverse subjects. We&apos;ve worked with nonprofits, educational institutions, businesses, and individual storytellers. We evaluate each project on story merit, production feasibility, and alignment with our values.',
              },
              {
                q: 'Can you help with distribution and festival submissions?',
                a: 'Absolutely. Distribution strategy is part of our process. We understand festival requirements, streaming platform specs, and broadcast standards. We can guide submissions, optimize masters, and advise on distribution windows.',
              },
              {
                q: 'Do you include archival footage and photo integration?',
                a: 'Yes. We specialize in incorporating archival materials, historical photos, and B-roll into contemporary interviews and voiceover. We handle licensing, restoration, and creative integration.',
              },
            ].map((item, index) => (
              <div key={index} className="border-l-4 border-brand-gold pl-6 py-4">
                <h3 className="font-heading text-xl font-black text-brand-gold mb-3 uppercase tracking-editorial">
                  {item.q}
                </h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="bg-brand-charcoal py-20 md:py-28 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-5xl md:text-6xl font-black text-brand-gold mb-6 tracking-editorial uppercase">
            Ready to Tell Your Story?
          </h2>
          <p className="font-body text-xl text-brand-off-white mb-12 leading-relaxed">
            Let&apos;s discuss your documentary vision. We&apos;re here to bring authentic narratives to life with professional craft and creative passion.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href="mailto:hello@echochambermedia.com?subject=Documentary%20Production%20Inquiry"
              className="px-8 py-4 bg-brand-gold text-brand-black font-heading font-black uppercase tracking-editorial hover:bg-opacity-90 transition duration-300 rounded-lg"
            >
              Start a Conversation
            </a>
            <a
              href="/"
              className="px-8 py-4 border-2 border-brand-gold text-brand-gold font-heading font-black uppercase tracking-editorial hover:bg-brand-gold hover:text-brand-black transition duration-300 rounded-lg"
            >
              Back to Home
            </a>
          </div>

          <p className="font-body text-brand-gray text-sm">
            Based in Las Vegas. Available for projects worldwide.
          </p>
        </div>
      </section>

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'Echo Chamber Media - Documentary Production',
            description:
              'Professional documentary production and filmmaking services in Las Vegas. Feature-length documentaries, episodic series, and short-form content.',
            image: 'https://echochambermedia.com/og-documentary.jpg',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Las Vegas',
              addressRegion: 'NV',
              addressCountry: 'US',
            },
            url: 'https://echochambermedia.com/services/documentary',
            telephone: 'Contact for inquiry',
            sameAs: [
              'https://www.instagram.com/echochambermedia',
              'https://www.youtube.com/@echochambermedia',
            ],
            priceRange: 'Contact for quote',
            serviceType: [
              'Documentary Production',
              'Documentary Filmmaking',
              'Video Production',
              'Post-Production',
            ],
          }),
        }}
      />

      <Footer />
    </>
  )
}
