import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Wedding Videographer Las Vegas | Cinematic Wedding Films | Echo Chamber Media',
  description:
    'Award-winning Las Vegas wedding videographer. Cinematic wedding films with stunning storytelling and premium editing. Get a free quote today.',
  alternates: { canonical: 'https://echochambermedia.com/services/wedding-videography' },
  openGraph: {
    title: 'Wedding Videographer Las Vegas | Cinematic Wedding Films | Echo Chamber Media',
    description:
      'Award-winning Las Vegas wedding videographer. Cinematic wedding films with stunning storytelling and premium editing. Get a free quote today.',
    url: 'https://echochambermedia.com/services/wedding-videography',
    type: 'website',
  },
};

export default function WeddingVideographyPage() {
  return (
    <>
      <Navbar />
      
      <main className="bg-brand-black text-brand-off-white font-body">
        {/* Hero Section with Background Image */}
        <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
          <Image
            src="/images/wedding/string-lights.jpg"
            alt="Bride and groom under string lights at night"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-brand-black/30" />

          <div className="relative z-10 text-center max-w-4xl mx-auto">
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-black mb-6 text-brand-off-white tracking-editorial drop-shadow-lg">
              Your Wedding Story,{' '}
              <span className="text-brand-gold">Beautifully Told</span>
            </h1>
            <p className="text-lg sm:text-xl text-brand-off-white/90 mb-8 leading-relaxed drop-shadow-md">
              Award-winning wedding videographer in Las Vegas. We create cinematic wedding films that capture the emotion, joy, and intimacy of your special day.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#contact"
                className="inline-block px-8 py-4 bg-brand-gold text-brand-black font-heading font-black rounded hover:bg-opacity-90 transition-all"
              >
                Book Your Consultation
              </a>
              <Link
                href="/"
                className="inline-block px-8 py-4 border-2 border-brand-gold text-brand-gold font-heading font-black rounded hover:bg-brand-gold hover:text-brand-black transition-all backdrop-blur-sm bg-black/20"
              >
                View Our Work
              </Link>
            </div>
          </div>
        </section>

        {/* What&apos;s Included Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-brand-charcoal">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-heading text-4xl sm:text-5xl font-black mb-4 text-brand-gold tracking-editorial">
              What&apos;s Included in Your Wedding Video Package
            </h2>
            <p className="text-brand-gray text-lg mb-12">
              Our Las Vegas wedding videography packages are designed to deliver cinematic wedding films that you&apos;ll treasure for a lifetime.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-brand-black p-8 rounded-lg border border-brand-gold border-opacity-30">
                <h3 className="font-heading text-2xl font-black text-brand-gold mb-4 tracking-editorial">
                  Ceremony & Reception Coverage
                </h3>
                <ul className="space-y-3 text-brand-gray">
                  <li className="flex items-start">
                    <span className="text-brand-gold mr-3 font-black">✓</span>
                    <span>Full coverage from ceremony through final dance</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-gold mr-3 font-black">✓</span>
                    <span>Multiple camera angles for cinematic storytelling</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-gold mr-3 font-black">✓</span>
                    <span>Professional audio with lav microphones for vows</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-gold mr-3 font-black">✓</span>
                    <span>Drone footage if location permits</span>
                  </li>
                </ul>
              </div>

              <div className="bg-brand-black p-8 rounded-lg border border-brand-gold border-opacity-30">
                <h3 className="font-heading text-2xl font-black text-brand-gold mb-4 tracking-editorial">
                  Premium Post-Production
                </h3>
                <ul className="space-y-3 text-brand-gray">
                  <li className="flex items-start">
                    <span className="text-brand-gold mr-3 font-black">✓</span>
                    <span>Color grading for a cohesive, cinematic look</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-gold mr-3 font-black">✓</span>
                    <span>Custom soundtracking and audio mastering</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-gold mr-3 font-black">✓</span>
                    <span>4K resolution delivery</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-gold mr-3 font-black">✓</span>
                    <span>Teaser reel, highlights reel, and full wedding film</span>
                  </li>
                </ul>
              </div>

              <div className="bg-brand-black p-8 rounded-lg border border-brand-gold border-opacity-30">
                <h3 className="font-heading text-2xl font-black text-brand-gold mb-4 tracking-editorial">
                  Couple&apos;s Interviews & Details
                </h3>
                <ul className="space-y-3 text-brand-gray">
                  <li className="flex items-start">
                    <span className="text-brand-gold mr-3 font-black">✓</span>
                    <span>Bride & groom intimate interview session</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-gold mr-3 font-black">✓</span>
                    <span>Getting ready footage and detailed coverage</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-gold mr-3 font-black">✓</span>
                    <span>Candid moments with family and friends</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-gold mr-3 font-black">✓</span>
                    <span>Reception highlights and dance floor energy</span>
                  </li>
                </ul>
              </div>

              <div className="bg-brand-black p-8 rounded-lg border border-brand-gold border-opacity-30">
                <h3 className="font-heading text-2xl font-black text-brand-gold mb-4 tracking-editorial">
                  Deliverables & Support
                </h3>
                <ul className="space-y-3 text-brand-gray">
                  <li className="flex items-start">
                    <span className="text-brand-gold mr-3 font-black">✓</span>
                    <span>Cloud storage access to download all footage</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-gold mr-3 font-black">✓</span>
                    <span>USB drive with all final videos</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-gold mr-3 font-black">✓</span>
                    <span>Shareable online gallery for guests</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-gold mr-3 font-black">✓</span>
                    <span>Lifetime customer support and revisions</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        {/* Our Process Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-brand-black">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-heading text-4xl sm:text-5xl font-black mb-4 text-brand-gold tracking-editorial">
              The Echo Chamber Process
            </h2>
            <p className="text-brand-gray text-lg mb-12">
              From your first conversation through the final frame, our Las Vegas wedding videography process is designed with your vision in mind.
            </p>

            <div className="space-y-8">
              <div className="flex gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-brand-gold text-brand-black font-heading font-black text-2xl">
                    1
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="font-heading text-2xl font-black text-brand-off-white mb-2 tracking-editorial">
                    Discovery & Planning
                  </h3>
                  <p className="text-brand-gray">
                    We start with an in-depth consultation to understand your vision, wedding day timeline, and unique story. We&apos;ll discuss your preferences for the Las Vegas wedding video style, music, and overall tone.
                  </p>
                </div>
              </div>

              <div className="flex gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-brand-gold text-brand-black font-heading font-black text-2xl">
                    2
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="font-heading text-2xl font-black text-brand-off-white mb-2 tracking-editorial">
                    Preparation & Coordination
                  </h3>
                  <p className="text-brand-gray">
                    We&apos;ll scout your wedding venue, coordinate with your photographer, and prepare our equipment. We provide a detailed shot list and timeline to ensure nothing important is missed on your wedding day.
                  </p>
                </div>
              </div>

              <div className="flex gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-brand-gold text-brand-black font-heading font-black text-2xl">
                    3
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="font-heading text-2xl font-black text-brand-off-white mb-2 tracking-editorial">
                    Capture Your Day
                  </h3>
                  <p className="text-brand-gray">
                    Our experienced wedding videographers work discreetly throughout your day, capturing cinematic wedding footage that tells your unique love story. We use professional-grade equipment and multiple angles for the best possible wedding film.
                  </p>
                </div>
              </div>

              <div className="flex gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-brand-gold text-brand-black font-heading font-black text-2xl">
                    4
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="font-heading text-2xl font-black text-brand-off-white mb-2 tracking-editorial">
                    Post-Production Excellence
                  </h3>
                  <p className="text-brand-gray">
                    We invest weeks into editing, color grading, and sound design. Every frame is carefully crafted to create a cinematic wedding film that&apos;s perfect for sharing with family and reliving those precious moments.
                  </p>
                </div>
              </div>

              <div className="flex gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-brand-gold text-brand-black font-heading font-black text-2xl">
                    5
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="font-heading text-2xl font-black text-brand-off-white mb-2 tracking-editorial">
                    Delivery & Support
                  </h3>
                  <p className="text-brand-gray">
                    You&apos;ll receive your complete wedding video package with revisions included. We provide ongoing support and are always available if you need any adjustments or additional edits to your Las Vegas wedding videography.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-brand-charcoal">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-heading text-4xl sm:text-5xl font-black mb-4 text-brand-gold tracking-editorial">
              Why Choose Echo Chamber Media for Your Wedding Videography
            </h2>
            <p className="text-brand-gray text-lg mb-12">
              Led by owner Billy Zurisk, we bring cinematic storytelling expertise to every Las Vegas wedding videographer project.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-brand-black p-8 rounded-lg">
                <h3 className="font-heading text-2xl font-black text-brand-gold mb-4 tracking-editorial">
                  Cinematic Vision
                </h3>
                <p className="text-brand-gray">
                  We treat every wedding like a film production. Our approach to wedding videography Las Vegas style goes beyond documentation—we create art that tells your story.
                </p>
              </div>

              <div className="bg-brand-black p-8 rounded-lg">
                <h3 className="font-heading text-2xl font-black text-brand-gold mb-4 tracking-editorial">
                  Experience & Expertise
                </h3>
                <p className="text-brand-gray">
                  With years of experience producing wedding films across Las Vegas, we know how to capture every meaningful moment and transform them into compelling narratives.
                </p>
              </div>

              <div className="bg-brand-black p-8 rounded-lg">
                <h3 className="font-heading text-2xl font-black text-brand-gold mb-4 tracking-editorial">
                  Premium Quality
                </h3>
                <p className="text-brand-gray">
                  From 4K cameras to professional audio equipment, we invest in the best gear to ensure your wedding videographer Las Vegas experience results in the highest quality film.
                </p>
              </div>

              <div className="bg-brand-black p-8 rounded-lg">
                <h3 className="font-heading text-2xl font-black text-brand-gold mb-4 tracking-editorial">
                  Personal Attention
                </h3>
                <p className="text-brand-gray">
                  You work directly with us—not a large corporate studio. We&apos;re invested in understanding your vision and delivering a wedding video that exceeds expectations.
                </p>
              </div>

              <div className="bg-brand-black p-8 rounded-lg">
                <h3 className="font-heading text-2xl font-black text-brand-gold mb-4 tracking-editorial">
                  Full Creative Control
                </h3>
                <p className="text-brand-gray">
                  Music selection, editing style, color grade—you have input throughout the process. Your wedding film should reflect your unique love story and personal style.
                </p>
              </div>

              <div className="bg-brand-black p-8 rounded-lg">
                <h3 className="font-heading text-2xl font-black text-brand-gold mb-4 tracking-editorial">
                  Trusted in Las Vegas
                </h3>
                <p className="text-brand-gray">
                  Couples throughout Las Vegas trust us for wedding videography because we consistently deliver cinematic films that capture the emotion and joy of their special day.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* FAQ Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-brand-black">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-4xl sm:text-5xl font-black mb-4 text-brand-gold tracking-editorial">
              Wedding Videography FAQs
            </h2>
            <p className="text-brand-gray text-lg mb-12">
              Common questions about our Las Vegas wedding videography services.
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="font-heading text-2xl font-black text-brand-off-white mb-3 tracking-editorial">
                  How much does a Las Vegas wedding videographer cost?
                </h3>
                <p className="text-brand-gray">
                  Our wedding videography packages vary based on coverage time, travel, and deliverables. We offer flexible options to fit different budgets. Contact us for a custom quote tailored to your wedding videographer Las Vegas needs.
                </p>
              </div>

              <div>
                <h3 className="font-heading text-2xl font-black text-brand-off-white mb-3 tracking-editorial">
                  When should I book my wedding videographer?
                </h3>
                <p className="text-brand-gray">
                  We recommend booking your wedding videographer as soon as you set your date. Popular dates in Las Vegas fill quickly, and early booking ensures you get the cinematographer you want for your special day.
                </p>
              </div>

              <div>
                <h3 className="font-heading text-2xl font-black text-brand-off-white mb-3 tracking-editorial">
                  How long does it take to get my wedding film?
                </h3>
                <p className="text-brand-gray">
                  We typically deliver your complete wedding videography package within 6-8 weeks of your wedding date. This timeline allows us to provide the premium editing, color grading, and sound design that makes your film truly cinematic.
                </p>
              </div>

              <div>
                <h3 className="font-heading text-2xl font-black text-brand-off-white mb-3 tracking-editorial">
                  Can you work at my specific Las Vegas wedding venue?
                </h3>
                <p className="text-brand-gray">
                  Yes! We film weddings at all Las Vegas venues—from intimate chapels to grand ballrooms and outdoor desert locations. We&apos;ll coordinate with your venue to understand any specific requirements for our wedding videography coverage.
                </p>
              </div>

              <div>
                <h3 className="font-heading text-2xl font-black text-brand-off-white mb-3 tracking-editorial">
                  What if I want to use a different song for my wedding film?
                </h3>
                <p className="text-brand-gray">
                  Absolutely. We work with you to select the perfect music for your wedding video. If you have a specific song in mind, we can license it and incorporate it into your cinematic wedding film. If not, we&apos;ll suggest music that matches your vision.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-brand-charcoal to-brand-black">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-heading text-4xl sm:text-5xl font-black mb-4 text-brand-gold tracking-editorial">
              Ready to Tell Your Story?
            </h2>
            <p className="text-brand-gray text-lg mb-8 leading-relaxed">
              Let&apos;s create a cinematic wedding film that you&apos;ll treasure forever. Contact us today to discuss your Las Vegas wedding videography needs and schedule a free consultation with our team.
            </p>
            <a
              href="/?contact=true"
              className="inline-block px-8 py-4 bg-brand-gold text-brand-black font-heading font-black rounded hover:bg-opacity-90 transition-all text-lg"
            >
              Book Your Consultation
            </a>
          </div>
        </section>

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'VideoProductionCompany',
              name: 'Echo Chamber Media',
              image: 'https://echochambermedia.com/logo.png',
              description:
                'Award-winning wedding videographer in Las Vegas specializing in cinematic wedding films and professional wedding video production.',
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
              url: 'https://echochambermedia.com',
              priceRange: '$$',
              serviceType: 'Wedding Videography',
              founder: {
                '@type': 'Person',
                name: 'Billy Zurisk',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '5',
                ratingCount: '50',
              },
              service: {
                '@type': 'Service',
                name: 'Wedding Videography',
                description:
                  'Cinematic wedding video production for Las Vegas weddings',
              },
            }),
          }}
        />
      </main>

      <Footer />
    </>
  );
}