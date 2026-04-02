import { Metadata } from 'next';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';

// This must be exported for Next.js metadata
export const metadata: Metadata = {
  title: '360 Video Walkthrough Las Vegas | Real Estate Video Tours | Echo Chamber Media',
  description: 'Professional 360 video walkthroughs in Las Vegas. Real estate tours for MLS, Airbnb & commercial listings. Fast turnaround, stunning results.',
  alternates: { canonical: 'https://echochambermedia.com/services/360-walkthroughs' },
  keywords: '360 video walkthrough Las Vegas, real estate video tour Las Vegas, property walkthrough video, MLS video tour, Airbnb virtual tour, commercial property video tour',
  openGraph: {
    title: '360 Video Walkthrough Las Vegas | Echo Chamber Media',
    description: 'Professional 360 video walkthroughs in Las Vegas. Real estate tours for MLS, Airbnb & commercial listings. Fast turnaround, stunning results.',
    url: 'https://echochambermedia.com/services/360-walkthroughs',
    type: 'website',
    locale: 'en_US',
  },
};

export default function VideoWalkthroughPage() {
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
              360 VIDEO WALKTHROUGHS
            </h1>
            <p className="font-body text-xl lg:text-2xl text-brand-off-white mb-8 leading-relaxed max-w-2xl mx-auto">
              Immersive property tours that showcase every detail. From residential luxury homes to commercial spaces, 360 video walkthroughs engage buyers and tenants like nothing else.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#showcase"
                className="inline-block bg-brand-gold text-brand-black font-heading font-bold py-4 px-8 rounded-lg hover:bg-opacity-90 transition-all"
              >
                View Our Work
              </a>
              <a
                href="#contact"
                className="inline-block border-2 border-brand-gold text-brand-gold font-heading font-bold py-4 px-8 rounded-lg hover:bg-brand-gold hover:text-brand-black transition-all"
              >
                Get a Quote
              </a>
            </div>
          </div>
        </section>

        {/* Why Choose Echo Chamber Media */}
        <section className="py-20 px-6 bg-brand-charcoal">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-16 text-center tracking-editorial">
              Why Choose Echo Chamber Media for Your 360 Video Walkthroughs
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-gold flex items-center justify-center">
                    <span className="text-brand-black font-heading font-bold text-lg">✓</span>
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-brand-gold mb-2">Immersive Property Experience</h3>
                    <p className="font-body text-brand-off-white">
                      360 video gives potential buyers and tenants a true sense of space and layout. They can explore every room, corner, and detail from anywhere, anytime.
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
                    <h3 className="font-heading text-xl font-bold text-brand-gold mb-2">Real Estate Expertise</h3>
                    <p className="font-body text-brand-off-white">
                      We understand what sells properties. Our team knows how to frame spaces, highlight features, and guide viewers through the narrative flow of your listing.
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
                    <h3 className="font-heading text-xl font-bold text-brand-gold mb-2">Smooth Cinematic Movement</h3>
                    <p className="font-body text-brand-off-white">
                      Unlike static 360 photos, our video walkthroughs feature smooth, professional transitions. Viewers follow a guided path through the property for a cinematic experience.
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
                    <h3 className="font-heading text-xl font-bold text-brand-gold mb-2">Fast Turnaround</h3>
                    <p className="font-body text-brand-off-white">
                      We deliver edited, ready-to-publish 360 video walkthroughs in as little as 5-7 business days. Perfect for fast-moving listings and time-sensitive properties.
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
                    <h3 className="font-heading text-xl font-bold text-brand-gold mb-2">MLS & Web Ready</h3>
                    <p className="font-body text-brand-off-white">
                      Your 360 walkthroughs are delivered in formats compatible with MLS listings, real estate websites, social media, and your own marketing materials.
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
                    <h3 className="font-heading text-xl font-bold text-brand-gold mb-2">Virtual Staging Compatible</h3>
                    <p className="font-body text-brand-off-white">
                      Need to stage an empty property? 360 video works seamlessly with virtual staging software to show furnished versions of vacant spaces.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Showcase — Kuula 360 Portfolio */}
        <section id="showcase" className="py-20 px-6 bg-brand-black">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-6 text-center tracking-editorial">
              Explore Our 360 Tours
            </h2>
            <p className="font-body text-brand-gray text-center max-w-2xl mx-auto mb-12">
              Browse our portfolio of interactive 360 walkthroughs below. Click, drag, and explore — this is exactly what your clients will experience.
            </p>

            {/* Kuula Embed */}
            <div className="w-full border border-brand-gold/20">
              <iframe
                src="https://kuula.co/share/collection/7Hrpm?logo=1&info=1&fs=1&vr=0&sd=1&thumbs=1"
                title="Echo Chamber Media — 360 Walkthrough Portfolio"
                width="100%"
                height="640"
                frameBorder="0"
                allowFullScreen
                allow="xr-spatial-tracking; gyroscope; accelerometer"
                className="w-full"
                style={{ minHeight: '400px' }}
              />
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-20 px-6 bg-brand-charcoal">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-16 text-center tracking-editorial">
              Where 360 Video Walkthroughs Work Best
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-brand-black p-8 rounded-lg border border-brand-gold border-opacity-30 hover:border-opacity-100 transition-all">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">Real Estate Listings</h3>
                <p className="font-body text-brand-off-white">
                  Residential and commercial properties get more qualified interest with 360 walkthroughs. Buyers pre-qualify themselves before scheduling showings.
                </p>
              </div>

              <div className="bg-brand-black p-8 rounded-lg border border-brand-gold border-opacity-30 hover:border-opacity-100 transition-all">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">Airbnb & Vacation Rentals</h3>
                <p className="font-body text-brand-off-white">
                  Travelers book faster when they can virtually explore the entire property. 360 walkthroughs increase occupancy rates and reduce booking hesitation.
                </p>
              </div>

              <div className="bg-brand-black p-8 rounded-lg border border-brand-gold border-opacity-30 hover:border-opacity-100 transition-all">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">Commercial Leasing</h3>
                <p className="font-body text-brand-off-white">
                  Office and retail prospects evaluate multiple spaces. 360 walkthroughs let them compare options efficiently and move faster to lease negotiations.
                </p>
              </div>

              <div className="bg-brand-black p-8 rounded-lg border border-brand-gold border-opacity-30 hover:border-opacity-100 transition-all">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">New Construction Marketing</h3>
                <p className="font-body text-brand-off-white">
                  Pre-sell units with 360 walkthroughs before physical completion. Show finishes, layouts, and amenities in fully rendered or constructed units.
                </p>
              </div>

              <div className="bg-brand-black p-8 rounded-lg border border-brand-gold border-opacity-30 hover:border-opacity-100 transition-all">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">Property Management</h3>
                <p className="font-body text-brand-off-white">
                  Help tenants and property managers show units remotely. Reduce in-person tours and speed up tenant placement cycles.
                </p>
              </div>

              <div className="bg-brand-black p-8 rounded-lg border border-brand-gold border-opacity-30 hover:border-opacity-100 transition-all">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">Open House Alternative</h3>
                <p className="font-body text-brand-off-white">
                  Showcase properties 24/7 without hosting physical open houses. Qualified buyers can explore privately on their own time.
                </p>
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
                  What&apos;s the difference between 360 photos and 360 video walkthroughs?
                </h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  360 photos are static images you can pan around. 360 video walkthroughs are immersive moving tours—your camera flows smoothly through the property, creating a cinematic experience. Video feels more natural and engages viewers longer than static photos alone.
                </p>
              </div>

              <div className="border-l-4 border-brand-gold pl-6">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">
                  How long does it take to complete a 360 video walkthrough?
                </h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  We deliver finished 360 walkthroughs in 5-7 business days after filming. The shoot itself typically takes 2-4 hours depending on property size. We can rush delivery for time-sensitive listings—contact us for expedited options.
                </p>
              </div>

              <div className="border-l-4 border-brand-gold pl-6">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">
                  What equipment and technology do you use?
                </h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  We use professional 360 camera rigs, stabilization equipment, and color-grading software. Our workflows produce broadcast-quality 360 content optimized for web viewing, MLS integration, and social sharing. All files are delivered in current web standards.
                </p>
              </div>

              <div className="border-l-4 border-brand-gold pl-6">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">
                  Which platforms support 360 video walkthroughs?
                </h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  360 walkthroughs work on websites, YouTube, Zillow, Realtor.com, MLS systems, Facebook, and more. We deliver files in formats compatible with all major real estate platforms. Viewers can watch on desktop, mobile, or VR headsets.
                </p>
              </div>

              <div className="border-l-4 border-brand-gold pl-6">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">
                  How do I book a 360 video walkthrough?
                </h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  Contact us at hello@echochambermedia.com or use the form below. We&apos;ll discuss your property, timeline, and vision. Once you&apos;re ready, we&apos;ll schedule a shoot date and get started on creating an immersive tour for your listing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="py-20 px-6 bg-brand-charcoal">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-6 tracking-editorial">
              Ready to Showcase Your Property?
            </h2>
            <p className="font-body text-brand-off-white text-lg mb-10 leading-relaxed">
              Let&apos;s create an immersive 360 video walkthrough that gets your property noticed. Fast turnaround, professional quality, and results that sell. Get in touch to discuss your project.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:hello@echochambermedia.com"
                className="inline-block bg-brand-gold text-brand-black font-heading font-bold py-4 px-8 rounded-lg hover:bg-opacity-90 transition-all"
              >
                Get a Quote
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
            name: 'Echo Chamber Media - 360 Video Walkthroughs',
            image: 'https://echochambermedia.com/og-image.jpg',
            description: 'Professional 360 video walkthroughs for real estate in Las Vegas. Immersive property tours for MLS listings, Airbnb, commercial leasing, and new construction marketing.',
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
            url: 'https://echochambermedia.com/services/360-walkthroughs',
            sameAs: [
              'https://instagram.com/echochambermedia',
              'https://facebook.com/echochambermedia',
            ],
            profession: ['Videographer', 'Real Estate Photographer'],
            knowsAbout: [
              '360 Video Walkthroughs',
              'Real Estate Video Tours',
              'Virtual Property Tours',
              'MLS Video Tours',
              'Commercial Property Video',
              'Immersive Property Marketing',
            ],
            serviceArea: {
              '@type': 'City',
              name: 'Las Vegas',
            },
          }),
        }}
      />

      <Footer />
    </>
  );
}
