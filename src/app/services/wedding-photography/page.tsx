import { Metadata } from 'next';
import Image from 'next/image';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';

// This must be exported for Next.js metadata
export const metadata: Metadata = {
  title: 'Wedding Photographer Las Vegas | Cinematic Wedding Photography | Echo Chamber Media',
  description: 'Las Vegas wedding photographer specializing in cinematic, editorial coverage. Elopements, ceremonies & receptions. View our portfolio and book today.',
  alternates: { canonical: 'https://echochambermedia.com/services/wedding-photography' },
  keywords: 'wedding photographer Las Vegas, Las Vegas wedding photography, wedding photos Las Vegas, Las Vegas wedding photographer, elopement photographer Las Vegas, cinematic wedding photography',
  openGraph: {
    title: 'Wedding Photographer Las Vegas | Echo Chamber Media',
    description: 'Las Vegas wedding photographer specializing in cinematic, editorial coverage. Elopements, ceremonies & receptions. View our portfolio and book today.',
    url: 'https://echochambermedia.com/services/wedding-photography',
    type: 'website',
    locale: 'en_US',
  },
};

export default function WeddingPhotographyPage() {
  return (
    <>
      <Navbar />
      <main className="bg-brand-black text-brand-off-white">
        {/* Hero Section with Background Image */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-32 pb-20 px-6">
          <Image
            src="/images/wedding/petal-toss.jpg"
            alt="Bride and groom celebrating with flower petals"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-brand-black/40" />

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-5xl lg:text-7xl font-black mb-6 text-brand-gold tracking-editorial leading-tight drop-shadow-lg">
              Wedding Photographer Las Vegas
            </h1>
            <p className="font-body text-xl lg:text-2xl text-brand-off-white mb-8 leading-relaxed max-w-2xl mx-auto drop-shadow-md">
              Cinematic wedding photography that captures the emotion, intimacy, and joy of your wedding day. From intimate elopements to grand celebrations, Echo Chamber Media delivers stunning Las Vegas wedding photos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#gallery"
                className="inline-block bg-brand-gold text-brand-black font-heading font-bold py-4 px-8 rounded-lg hover:bg-opacity-90 transition-all"
              >
                View Our Work
              </a>
              <a
                href="#contact"
                className="inline-block border-2 border-brand-gold text-brand-gold font-heading font-bold py-4 px-8 rounded-lg hover:bg-brand-gold hover:text-brand-black transition-all backdrop-blur-sm bg-black/20"
              >
                Book a Consultation
              </a>
            </div>
          </div>
        </section>

        {/* Why Choose Echo Chamber Media */}
        <section className="py-20 px-6 bg-brand-charcoal">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-16 text-center tracking-editorial">
              Why Choose Echo Chamber Media for Your Las Vegas Wedding Photos
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-gold flex items-center justify-center">
                    <span className="text-brand-black font-heading font-bold text-lg">✓</span>
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-brand-gold mb-2">Cinematic Excellence</h3>
                    <p className="font-body text-brand-off-white">
                      We bring our award-winning videography expertise to wedding photography, creating images with cinematic depth, color grading, and narrative storytelling.
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
                    <h3 className="font-heading text-xl font-bold text-brand-gold mb-2">Editorial & Candid Style</h3>
                    <p className="font-body text-brand-off-white">
                      We blend editorial posing with authentic candid moments, capturing the real emotions and connections that make your wedding day unique.
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
                    <h3 className="font-heading text-xl font-bold text-brand-gold mb-2">Las Vegas Local Expertise</h3>
                    <p className="font-body text-brand-off-white">
                      Serving the Las Vegas wedding photography market for years, we know every venue in the valley—from intimate chapel elopements to luxury resort ballrooms.
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
                    <h3 className="font-heading text-xl font-bold text-brand-gold mb-2">Premium Deliverables</h3>
                    <p className="font-body text-brand-off-white">
                      Every image is professionally edited, color graded, and delivered in high-resolution formats. You get gallery-ready photos, not just snapshots.
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
                    <h3 className="font-heading text-xl font-bold text-brand-gold mb-2">Video Integration</h3>
                    <p className="font-body text-brand-off-white">
                      As videographers first, we understand the interplay between moving and still imagery, creating a cohesive visual story across all mediums.
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
                    <h3 className="font-heading text-xl font-bold text-brand-gold mb-2">All-Inclusive Service</h3>
                    <p className="font-body text-brand-off-white">
                      From pre-wedding consultations to final album delivery, we handle every detail so you can focus on your day.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Photo Gallery — Attention Grabber */}
        <section id="gallery" className="py-20 px-6 bg-brand-black">
          <div className="max-w-6xl mx-auto">
            <p className="text-sm uppercase tracking-editorial text-brand-gold font-body mb-4 text-center">
              Our Work
            </p>
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-6 text-center tracking-editorial">
              Every Moment, Preserved
            </h2>
            <p className="font-body text-brand-gray text-center max-w-2xl mx-auto mb-16">
              We don&apos;t just take photos — we capture the feeling. The nervous hands, the joyful tears, the golden light. Here&apos;s a glimpse of what we see.
            </p>

            {/* Masonry-style Gallery Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {/* Ring Exchange — tall */}
              <div className="relative row-span-2 overflow-hidden group">
                <Image
                  src="/images/wedding/ring-exchange.jpg"
                  alt="Groom placing ring on bride's finger during ceremony"
                  width={600}
                  height={900}
                  className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <p className="absolute bottom-4 left-4 text-sm font-body text-brand-off-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 drop-shadow-lg">
                  The Moment
                </p>
              </div>

              {/* Petal Toss — wide */}
              <div className="relative col-span-2 overflow-hidden group">
                <Image
                  src="/images/wedding/petal-toss.jpg"
                  alt="Newlyweds walking through a shower of flower petals"
                  width={1200}
                  height={600}
                  className="object-cover w-full h-64 md:h-72 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <p className="absolute bottom-4 left-4 text-sm font-body text-brand-off-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 drop-shadow-lg">
                  The Celebration
                </p>
              </div>

              {/* Overhead Couple */}
              <div className="relative overflow-hidden group">
                <Image
                  src="/images/wedding/overhead-couple.jpg"
                  alt="Bride and groom photographed from above with bouquet"
                  width={600}
                  height={600}
                  className="object-cover w-full h-64 md:h-72 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <p className="absolute bottom-4 left-4 text-sm font-body text-brand-off-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 drop-shadow-lg">
                  The Portrait
                </p>
              </div>

              {/* String Lights — wide bottom */}
              <div className="relative col-span-2 md:col-span-3 overflow-hidden group">
                <Image
                  src="/images/wedding/string-lights.jpg"
                  alt="Bride and groom holding hands under string lights at night"
                  width={1200}
                  height={500}
                  className="object-cover w-full h-64 md:h-80 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <p className="absolute bottom-4 left-4 text-sm font-body text-brand-off-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 drop-shadow-lg">
                  The Magic Hour
                </p>
              </div>
            </div>

            {/* CTA under gallery */}
            <div className="mt-12 text-center">
              <a
                href="#contact"
                className="inline-block px-10 py-4 border border-brand-gold/60 text-brand-off-white font-body text-sm uppercase tracking-editorial hover:bg-brand-gold/10 transition-all duration-500"
              >
                Book Your Wedding Shoot
              </a>
            </div>
          </div>
        </section>

        {/* Our Approach — Text sections */}
        <section className="py-20 px-6 bg-brand-black">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-16 text-center tracking-editorial">
              Our Wedding Photography Approach
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="relative w-full h-48 mb-6 overflow-hidden">
                  <Image
                    src="/images/wedding/ring-exchange.jpg"
                    alt="Cinematic wedding detail shot"
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">Cinematic Storytelling</h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  We treat each wedding like a film production. Professional lighting, thoughtful composition, and color grading that gives every image depth and visual impact.
                </p>
              </div>

              <div className="text-center">
                <div className="relative w-full h-48 mb-6 overflow-hidden">
                  <Image
                    src="/images/wedding/petal-toss.jpg"
                    alt="Candid wedding celebration moment"
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">Authentic Moments</h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  The nervous smile during vows, the quiet glance across the reception, genuine laughter with friends — we capture the real emotions with an artist&apos;s eye.
                </p>
              </div>

              <div className="text-center">
                <div className="relative w-full h-48 mb-6 overflow-hidden">
                  <Image
                    src="/images/wedding/string-lights.jpg"
                    alt="Evening wedding photography with dramatic lighting"
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">Complete Coverage</h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  From getting ready to the last dance, we&apos;re there documenting every moment. Full-day coverage, multiple photographers, and a timeline that ensures nothing is missed.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Packages */}
        <section id="packages" className="py-20 px-6 bg-brand-charcoal">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-4 text-center tracking-editorial">
              Wedding Photography Packages
            </h2>
            <p className="font-body text-brand-gray text-center mb-16 text-lg">
              Flexible packages designed for couples of all styles. Custom quotes available for unique needs.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Elopement */}
              <div className="bg-brand-black p-8 rounded-lg border border-brand-gold border-opacity-30 hover:border-opacity-100 transition-all">
                <h3 className="font-heading text-2xl font-bold text-brand-gold mb-2">Elopement</h3>
                <p className="font-body text-brand-gray mb-6">Perfect for intimate ceremonies</p>
                <p className="font-heading text-3xl font-bold text-brand-gold mb-8">Starting at $2,500</p>
                <ul className="font-body text-brand-off-white space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>8 Hours of Coverage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>1-2 Locations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>400+ Edited Images</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Online Gallery & Download</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Edited Digital Files</span>
                  </li>
                </ul>
                <a
                  href="#contact"
                  className="block text-center bg-brand-gold text-brand-black font-heading font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-all"
                >
                  Inquire
                </a>
              </div>

              {/* Standard Wedding */}
              <div className="bg-brand-black p-8 rounded-lg border-2 border-brand-gold hover:border-opacity-100 transition-all relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-brand-gold text-brand-black px-4 py-1 rounded-full font-heading font-bold text-sm">
                  Most Popular
                </div>
                <h3 className="font-heading text-2xl font-bold text-brand-gold mb-2">Standard Wedding</h3>
                <p className="font-body text-brand-gray mb-6">Our most requested package</p>
                <p className="font-heading text-3xl font-bold text-brand-gold mb-8">Starting at $4,500</p>
                <ul className="font-body text-brand-off-white space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>12 Hours of Coverage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>2 Photographers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>800+ Edited Images</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Online Gallery & Download</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Heirloom Album</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Engagement Session</span>
                  </li>
                </ul>
                <a
                  href="#contact"
                  className="block text-center bg-brand-gold text-brand-black font-heading font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-all"
                >
                  Book Now
                </a>
              </div>

              {/* Premium */}
              <div className="bg-brand-black p-8 rounded-lg border border-brand-gold border-opacity-30 hover:border-opacity-100 transition-all">
                <h3 className="font-heading text-2xl font-bold text-brand-gold mb-2">Premium</h3>
                <p className="font-body text-brand-gray mb-6">For luxury celebrations</p>
                <p className="font-heading text-3xl font-bold text-brand-gold mb-8">Starting at $7,500</p>
                <ul className="font-body text-brand-off-white space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>16+ Hours of Coverage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>3 Photographers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>1,500+ Edited Images</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Premium Leather Album</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Coffee Table Book</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold">✓</span>
                    <span>Video Highlight Reel</span>
                  </li>
                </ul>
                <a
                  href="#contact"
                  className="block text-center bg-brand-gold text-brand-black font-heading font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-all"
                >
                  Inquire
                </a>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="font-body text-brand-gray text-lg">
                All packages include professional editing, color grading, and digital delivery. Custom packages available for unique wedding styles and timelines.
              </p>
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
                  What&apos;s the difference between your wedding photography and videography?
                </h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  Wedding photography provides still images—carefully composed, edited, and color-graded for your albums and wall art. Our videography captures moving footage for highlight reels and full wedding films. Many couples choose both to tell a complete visual story of their day.
                </p>
              </div>

              <div className="border-l-4 border-brand-gold pl-6">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">
                  Are you available for elopements across the Las Vegas valley?
                </h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  Absolutely. Whether you&apos;re saying vows at Red Rock Canyon, Valley of Fire, a downtown Las Vegas chapel, or anywhere in between, we handle elopement photography across the entire valley. We know all the best locations and can guide you on logistics.
                </p>
              </div>

              <div className="border-l-4 border-brand-gold pl-6">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">
                  How long does it take to receive edited photos after the wedding?
                </h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  Professional editing takes time to do right. You&apos;ll receive your gallery of edited, color-graded images within 4-6 weeks. We also provide a sneak peek of select photos within 48 hours so you can share on social media.
                </p>
              </div>

              <div className="border-l-4 border-brand-gold pl-6">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">
                  Can we book wedding photography and videography together?
                </h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  Yes! We offer combined photo + video packages at discounted rates. Our team works seamlessly together, and the cinematic style carries through both mediums. This is a popular choice for couples who want comprehensive coverage.
                </p>
              </div>

              <div className="border-l-4 border-brand-gold pl-6">
                <h3 className="font-heading text-xl font-bold text-brand-gold mb-3">
                  Do you offer engagement sessions or bridal portraits?
                </h3>
                <p className="font-body text-brand-off-white leading-relaxed">
                  Engagement sessions are included in most packages and are a great way to get comfortable in front of the camera before the wedding day. We also offer standalone bridal portrait sessions and can photograph rehearsals. Contact us to discuss add-ons.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="py-20 px-6 bg-brand-charcoal">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-4xl lg:text-5xl font-black text-brand-gold mb-6 tracking-editorial">
              Ready to Preserve Your Wedding Day?
            </h2>
            <p className="font-body text-brand-off-white text-lg mb-10 leading-relaxed">
              Let&apos;s create stunning wedding photos that tell your unique love story. Book a free consultation to discuss your vision, timeline, and what makes your Las Vegas wedding special.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:hello@echochambermedia.com"
                className="inline-block bg-brand-gold text-brand-black font-heading font-bold py-4 px-8 rounded-lg hover:bg-opacity-90 transition-all"
              >
                Start Your Consultation
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
            name: 'Echo Chamber Media - Wedding Photography',
            image: 'https://echochambermedia.com/og-image.jpg',
            description: 'Professional wedding photographer in Las Vegas. Cinematic and editorial wedding photography for couples throughout the Las Vegas valley.',
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
            priceRange: '$$',
            url: 'https://echochambermedia.com/services/wedding-photography',
            sameAs: [
              'https://instagram.com/echochambermedia',
              'https://facebook.com/echochambermedia',
            ],
            profession: ['Photographer', 'Wedding Photographer'],
            knowsAbout: [
              'Cinematic Photography',
              'Wedding Photography',
              'Editorial Photography',
              'Elopement Photography',
              'Las Vegas Weddings',
            ],
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'USD',
              lowPrice: '2500',
              highPrice: '7500',
              offerCount: '3',
              offers: [
                {
                  '@type': 'Offer',
                  name: 'Elopement Photography Package',
                  price: '2500',
                  priceCurrency: 'USD',
                  description: '8 hours of coverage for intimate ceremonies',
                },
                {
                  '@type': 'Offer',
                  name: 'Standard Wedding Package',
                  price: '4500',
                  priceCurrency: 'USD',
                  description: '12 hours of coverage with 2 photographers',
                },
                {
                  '@type': 'Offer',
                  name: 'Premium Wedding Package',
                  price: '7500',
                  priceCurrency: 'USD',
                  description: '16+ hours of coverage with 3 photographers',
                },
              ],
            },
            review: {
              '@type': 'Review',
              reviewRating: {
                '@type': 'Rating',
                ratingValue: '5',
                bestRating: '5',
              },
              author: {
                '@type': 'Person',
                name: 'Verified Wedding Couples',
              },
            },
          }),
        }}
      />

      <Footer />
    </>
  );
}
