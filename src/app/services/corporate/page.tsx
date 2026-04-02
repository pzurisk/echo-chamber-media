import { Metadata } from 'next';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';

// This must be exported for Next.js metadata
export const metadata: Metadata = {
  title: 'Corporate Video Production Las Vegas | Commercial Video Services | Echo Chamber Media',
  description: 'Corporate video production in Las Vegas. Brand films, commercials, product showcases & event coverage. Cinematic content that drives results.',
  alternates: { canonical: 'https://echochambermedia.com/services/corporate' },
  keywords: 'corporate video production Las Vegas, commercial video Las Vegas, business video production, brand film Las Vegas, product video, event videography Las Vegas, corporate video services',
  openGraph: {
    title: 'Corporate Video Production Las Vegas | Echo Chamber Media',
    description: 'Corporate video production in Las Vegas. Brand films, commercials, product showcases & event coverage. Cinematic content that drives results.',
    url: 'https://echochambermedia.com/services/corporate',
    type: 'website',
    locale: 'en_US',
  },
};

export default function CorporateVideoPage() {
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
              CORPORATE & COMMERCIAL VIDEO
            </h1>
            <p className="font-body text-xl lg:text-2xl text-brand-off-white mb-8 leading-relaxed max-w-2xl mx-auto">
              Professional video content that elevates your brand, tells your story, and connects with your audience. From concept to delivery, we create compelling corporate videos that drive results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#showcase"
                className="inline-block bg-brand-gold text-brand-black font-heading font-bold py-4 px-8 rounded-lg hover:bg-opacity-90 transition-all"
              >
                View Our Reel
              </a>
              <a
                href="#contact"
                className="inline-block border-2 border-brand-gold text-brand-gold font-heading font-bold py-4 px-8 rounded-lg hover:bg-brand-gold hover:text-brand-black transition-all"
              >
                Request a Quote
              </a>
            </div>
          </div>
        </section>

        {/* Why Choose Echo Chamber Media */}
        <section className="py-20 px-6 bg-brand-charcoal">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-16 text-center tracking-editorial">
              WHY CHOOSE ECHO CHAMBER MEDIA
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-gold flex items-center justify-center">
                    <span className="text-brand-black font-heading font-bold text-lg">✓</span>
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-brand-gold mb-2">Brand-Focused Storytelling</h3>
                    <p className="font-body text-brand-off-white text-sm">
                      We don&apos;t just record—we craft narratives that align with your brand values and resonate with your target audience.
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
                    <h3 className="font-heading text-lg font-bold text-brand-gold mb-2">Professional Production Crew</h3>
                    <p className="font-body text-brand-off-white text-sm">
                      Experienced videographers, editors, and color graders ensure broadcast-quality production every time.
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
                    <h3 className="font-heading text-lg font-bold text-brand-gold mb-2">Fast Turnaround</h3>
                    <p className="font-body text-brand-off-white text-sm">
                      We understand your timeline. Our efficient workflow means you get polished videos without the wait.
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
                    <h3 className="font-heading text-lg font-bold text-brand-gold mb-2">Multi-Platform Delivery</h3>
                    <p className="font-body text-brand-off-white text-sm">
                      From social media to broadcast, we optimize every video for your distribution channels.
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
                    <h3 className="font-heading text-lg font-bold text-brand-gold mb-2">On-Location or Studio</h3>
                    <p className="font-body text-brand-off-white text-sm">
                      Whether we&apos;re shooting on your property or at a controlled studio, we handle any environment.
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
                    <h3 className="font-heading text-lg font-bold text-brand-gold mb-2">Las Vegas Business Expertise</h3>
                    <p className="font-body text-brand-off-white text-sm">
                      We understand the Las Vegas market and know how to position your business for success.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Grid Section */}
        <section id="showcase" className="py-20 px-6 bg-brand-black">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-16 text-center tracking-editorial">
              WHAT WE CREATE
            </h2>

            <div className="space-y-16">
              {/* Brand Films & Company Stories */}
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="md:w-1/2">
                  <h3 className="font-heading text-2xl font-bold text-brand-gold mb-4">Brand Films & Company Stories</h3>
                  <p className="font-body text-brand-off-white text-lg leading-relaxed mb-4">
                    Transform your company&apos;s mission into a compelling visual story. We craft brand films that communicate your values, introduce your team, and establish emotional connections with your audience. Perfect for your website, investor meetings, and corporate events.
                  </p>
                  <p className="font-body text-brand-gray text-sm">
                    Ideal for: Mission statements, company culture, executive introductions, brand positioning
                  </p>
                </div>
                <div className="md:w-1/2 h-64 bg-brand-charcoal rounded-lg flex items-center justify-center border border-brand-gold border-opacity-30">
                  <p className="text-brand-gray text-center">[Corporate Video Demo - Brand Film]</p>
                </div>
              </div>

              {/* Product & Service Showcases */}
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="md:w-1/2 h-64 bg-brand-charcoal rounded-lg flex items-center justify-center border border-brand-gold border-opacity-30 order-2 md:order-1">
                  <p className="text-brand-gray text-center">[Corporate Video Demo - Product Showcase]</p>
                </div>
                <div className="md:w-1/2 order-1 md:order-2">
                  <h3 className="font-heading text-2xl font-bold text-brand-gold mb-4">Product & Service Showcases</h3>
                  <p className="font-body text-brand-off-white text-lg leading-relaxed mb-4">
                    Demonstrate your product or service in action. We create engaging product videos that highlight features, show real-world applications, and convert viewers into customers. Professional demonstrations that build confidence and drive sales.
                  </p>
                  <p className="font-body text-brand-gray text-sm">
                    Ideal for: Product launches, feature explanations, tutorials, sales enablement, promotional content
                  </p>
                </div>
              </div>

              {/* Event Coverage & Recaps */}
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="md:w-1/2">
                  <h3 className="font-heading text-2xl font-bold text-brand-gold mb-4">Event Coverage & Recaps</h3>
                  <p className="font-body text-brand-off-white text-lg leading-relaxed mb-4">
                    Capture the energy and impact of your corporate events. From conferences and product launches to gala dinners and networking events, we provide professional coverage and polished recap videos that extend your event&apos;s reach far beyond the live audience.
                  </p>
                  <p className="font-body text-brand-gray text-sm">
                    Ideal for: Live event coverage, highlight reels, conference recaps, awards ceremonies, networking events
                  </p>
                </div>
                <div className="md:w-1/2 h-64 bg-brand-charcoal rounded-lg flex items-center justify-center border border-brand-gold border-opacity-30">
                  <p className="text-brand-gray text-center">[Corporate Video Demo - Event Recap]</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Industries We Serve */}
        <section className="py-20 px-6 bg-brand-charcoal">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-16 text-center tracking-editorial">
              INDUSTRIES WE SERVE
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-brand-black p-8 rounded-lg border border-brand-gold border-opacity-30 hover:border-opacity-100 transition-all">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">Hospitality & Resorts</h3>
                <p className="font-body text-brand-off-white">
                  Showcase luxury amenities, guest experiences, and the unique appeal of your property.
                </p>
              </div>

              <div className="bg-brand-black p-8 rounded-lg border border-brand-gold border-opacity-30 hover:border-opacity-100 transition-all">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">Real Estate & Development</h3>
                <p className="font-body text-brand-off-white">
                  Virtual tours, property showcases, and developer introductions that sell the vision.
                </p>
              </div>

              <div className="bg-brand-black p-8 rounded-lg border border-brand-gold border-opacity-30 hover:border-opacity-100 transition-all">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">Entertainment & Events</h3>
                <p className="font-body text-brand-off-white">
                  Event promotion, venue showcases, and entertainment highlight reels that drive attendance.
                </p>
              </div>

              <div className="bg-brand-black p-8 rounded-lg border border-brand-gold border-opacity-30 hover:border-opacity-100 transition-all">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">Healthcare & Medical</h3>
                <p className="font-body text-brand-off-white">
                  Patient testimonials, facility tours, and patient education videos with sensitivity and professionalism.
                </p>
              </div>

              <div className="bg-brand-black p-8 rounded-lg border border-brand-gold border-opacity-30 hover:border-opacity-100 transition-all">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">Technology & Startups</h3>
                <p className="font-body text-brand-off-white">
                  Pitch videos, SaaS demonstrations, investor presentations, and founder stories.
                </p>
              </div>

              <div className="bg-brand-black p-8 rounded-lg border border-brand-gold border-opacity-30 hover:border-opacity-100 transition-all">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">Restaurants & Nightlife</h3>
                <p className="font-body text-brand-off-white">
                  Ambiance videos, menu showcases, chef features, and venue promotional content.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-6 bg-brand-black">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-16 text-center tracking-editorial">
              FREQUENTLY ASKED QUESTIONS
            </h2>

            <div className="space-y-8">
              <div className="border-l-4 border-brand-gold pl-6">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">
                  How does the corporate video production process work?
                </h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  We begin with a discovery consultation to understand your goals, target audience, and brand voice. From there, we develop a creative concept, plan the shoot, execute professional production, and deliver beautifully edited final videos. You&apos;re involved at every stage, with revision rounds included.
                </p>
              </div>

              <div className="border-l-4 border-brand-gold pl-6">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">
                  What&apos;s the typical timeline for a corporate video project?
                </h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  Timeline varies based on scope, but a standard corporate video typically takes 3-6 weeks from start to finish. This includes pre-production planning, shoot day, editing, and revisions. We can accelerate timelines for rush projects—just let us know your deadline.
                </p>
              </div>

              <div className="border-l-4 border-brand-gold pl-6">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">
                  What should we expect on shoot day?
                </h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  Our team arrives early to set up lighting and audio equipment. We&apos;ll coordinate interviews, capture B-roll, manage talent comfort, and keep production on schedule. Professional crews mean minimal disruption to your day while maximizing production value. We provide clear direction and make the process smooth and collaborative.
                </p>
              </div>

              <div className="border-l-4 border-brand-gold pl-6">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">
                  Can we use corporate video content across multiple platforms?
                </h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  Absolutely. We deliver videos optimized for multiple formats—full-length for your website, short versions for social media, vertical cuts for mobile, and more. Licensing includes unlimited use across your own channels, making your investment work harder.
                </p>
              </div>

              <div className="border-l-4 border-brand-gold pl-6">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">
                  Do you provide location scouting or can we shoot at multiple locations?
                </h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  Yes to both. We help scout locations to maximize visual impact, handle all logistics, and can shoot at multiple locations in a single project. Whether on-location at your business, on-location around Las Vegas, or at a controlled studio set, we adapt our approach to your vision and budget.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="py-20 px-6 bg-brand-charcoal">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-6 tracking-editorial">
              Ready to Elevate Your Brand?
            </h2>
            <p className="font-body text-brand-off-white text-lg mb-10 leading-relaxed">
              Let&apos;s discuss your corporate video project. We&apos;ll work with you to understand your goals, develop a strategy, and create video content that delivers results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:hello@echochambermedia.com"
                className="inline-block bg-brand-gold text-brand-black font-heading font-bold py-4 px-8 rounded-lg hover:bg-opacity-90 transition-all"
              >
                Request a Quote
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
            name: 'Echo Chamber Media - Corporate Video Production',
            image: 'https://echochambermedia.com/og-image.jpg',
            description: 'Professional corporate and commercial video production in Las Vegas. Brand films, product videos, event coverage, and more.',
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
            url: 'https://echochambermedia.com/services/corporate',
            sameAs: [
              'https://instagram.com/echochambermedia',
              'https://facebook.com/echochambermedia',
            ],
            profession: ['Videographer', 'Video Producer', 'Corporate Video Producer'],
            knowsAbout: [
              'Corporate Video Production',
              'Commercial Videography',
              'Brand Films',
              'Product Videos',
              'Event Videography',
              'Video Editing',
              'Las Vegas Video Production',
            ],
            hasOfferingType: [
              {
                '@type': 'Service',
                name: 'Brand Films & Company Stories',
                description: 'Professional brand storytelling videos that communicate company values and mission',
              },
              {
                '@type': 'Service',
                name: 'Product & Service Showcases',
                description: 'Engaging product demonstration videos that drive sales and engagement',
              },
              {
                '@type': 'Service',
                name: 'Event Coverage & Recaps',
                description: 'Professional event videography and highlight reel production',
              },
            ],
            review: {
              '@type': 'Review',
              reviewRating: {
                '@type': 'Rating',
                ratingValue: '5',
                bestRating: '5',
              },
              author: {
                '@type': 'Organization',
                name: 'Corporate Clients',
              },
            },
          }),
        }}
      />

      <Footer />
    </>
  );
}
