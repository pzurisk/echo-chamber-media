import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';

export const metadata = {
  title: 'Las Vegas Photographer & Videographer | Professional Photos & Video in Vegas | Echo Chamber Media',
  description: 'Professional Las Vegas photographer & videographer for tourists and visitors. Vacation photoshoots, proposals, bachelorette parties, and content creation. Book your Vegas memories today.',
  canonical: 'https://echochambermedia.com/services/las-vegas-photographer',
  keywords: 'Las Vegas photographer, Vegas vacation photographer, tourist photographer Las Vegas, professional photos Las Vegas, Las Vegas proposal photographer, bachelorette party photographer Vegas, Las Vegas content creator, Vegas photoshoot',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Echo Chamber Media - Las Vegas Photographer',
  description: 'Professional photography and videography services for Las Vegas visitors and tourists',
  image: 'https://echochambermedia.com/images/las-vegas-photographer-hero.jpg',
  url: 'https://echochambermedia.com/services/las-vegas-photographer',
  telephone: '+1-702-XXX-XXXX',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Las Vegas, NV',
    addressLocality: 'Las Vegas',
    addressRegion: 'NV',
    postalCode: '89101',
    addressCountry: 'US',
  },
  areaServed: 'Las Vegas',
  priceRange: '$$',
  serviceType: 'Photography, Videography',
  knowsAbout: ['portrait photography', 'event photography', 'proposal photography', 'vacation photography', 'content creation'],
};

export default function LasVegasPhotographerPage() {
  return (
    <>
      <Navbar />
      
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-brand-black to-brand-charcoal text-brand-off-white overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-gold rounded-full blur-3xl opacity-20"></div>
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h1 className="font-heading text-5xl lg:text-7xl font-black tracking-editorial mb-6 text-brand-gold">
              Capture Your Vegas Story
            </h1>
            <p className="font-body text-xl lg:text-2xl text-brand-off-white mb-8 max-w-3xl mx-auto leading-relaxed">
              You came to Las Vegas to make memories. Let our award-winning photographers and videographers capture the magic of your trip with stunning professional content you&apos;ll treasure forever.
            </p>
            <p className="font-body text-lg text-brand-gray mb-12">
              From the glittering Strip to iconic desert landscapes, we know every corner of Vegas and how to make you look incredible in every shot.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="bg-brand-gold text-brand-black font-heading font-bold py-4 px-10 rounded-lg hover:bg-opacity-90 transition-all text-lg">
                Book Your Session
              </button>
              <button className="border-2 border-brand-gold text-brand-gold font-heading font-bold py-4 px-10 rounded-lg hover:bg-brand-gold hover:text-brand-black transition-all text-lg">
                View Gallery
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services/Use Cases Section */}
      <section className="bg-brand-off-white py-20 lg:py-32">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <h2 className="font-heading text-4xl lg:text-5xl font-black tracking-editorial text-brand-black text-center mb-4">
            Your Vegas. Your Story.
          </h2>
          <p className="font-body text-center text-brand-gray mb-16 text-lg max-w-2xl mx-auto">
            Whether you&apos;re celebrating a special moment or capturing content for your followers, we&apos;ve got the perfect Las Vegas photography solution.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Vacation Photoshoots */}
            <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow border-t-4 border-brand-gold">
              <h3 className="font-heading text-2xl font-bold text-brand-black mb-4">Vacation Photoshoots</h3>
              <p className="font-body text-brand-gray leading-relaxed">
                Forget blurry selfies and awkward group photos. Get professional vacation portraits against Vegas backdrops that make your friends jealous.
              </p>
            </div>

            {/* Proposal Photography */}
            <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow border-t-4 border-brand-gold">
              <h3 className="font-heading text-2xl font-bold text-brand-black mb-4">Proposal Photography</h3>
              <p className="font-body text-brand-gray leading-relaxed">
                Pop the question in Vegas and have a photographer capture every tear, smile, and celebration. Your proposal story deserves to be told perfectly.
              </p>
            </div>

            {/* Bachelorette Parties */}
            <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow border-t-4 border-brand-gold">
              <h3 className="font-heading text-2xl font-bold text-brand-black mb-4">Bachelorette Parties</h3>
              <p className="font-body text-brand-gray leading-relaxed">
                Vegas bachelorettes are a vibe. We&apos;ll follow your crew, capture all the fun moments, and create content for those Instagram posts.
              </p>
            </div>

            {/* Anniversary Celebrations */}
            <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow border-t-4 border-brand-gold">
              <h3 className="font-heading text-2xl font-bold text-brand-black mb-4">Anniversary Celebrations</h3>
              <p className="font-body text-brand-gray leading-relaxed">
                Celebrate your milestone in Vegas with couples photos that capture the romance, adventure, and joy of your relationship.
              </p>
            </div>

            {/* Content Creator Shoots */}
            <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow border-t-4 border-brand-gold">
              <h3 className="font-heading text-2xl font-bold text-brand-black mb-4">Content Creator Sessions</h3>
              <p className="font-body text-brand-gray leading-relaxed">
                Travel influencers and creators flock to Vegas. Get professional photos and videos for your brand that stand out from the competition.
              </p>
            </div>

            {/* Birthday Celebrations */}
            <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow border-t-4 border-brand-gold">
              <h3 className="font-heading text-2xl font-bold text-brand-black mb-4">Birthday Celebrations</h3>
              <p className="font-body text-brand-gray leading-relaxed">
                Birthday in Vegas is legendary. We&apos;ll document the glamour, fun, and unforgettable moments with stunning photos and videos.
              </p>
            </div>

            {/* Corporate Headshots */}
            <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow border-t-4 border-brand-gold">
              <h3 className="font-heading text-2xl font-bold text-brand-black mb-4">Corporate Headshots</h3>
              <p className="font-body text-brand-gray leading-relaxed">
                Attending a conference or convention? Get professional headshots between meetings for LinkedIn and your corporate needs.
              </p>
            </div>

            {/* Couples Sessions */}
            <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow border-t-4 border-brand-gold">
              <h3 className="font-heading text-2xl font-bold text-brand-black mb-4">Couples on the Strip</h3>
              <p className="font-body text-brand-gray leading-relaxed">
                Iconic Vegas backdrops with professional poses and lighting. Get the couple photos you&apos;ll frame and share for years.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Locations Section */}
      <section className="bg-brand-black text-brand-off-white py-20 lg:py-32">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <h2 className="font-heading text-4xl lg:text-5xl font-black tracking-editorial text-center mb-4 text-brand-gold">
            Vegas Spots You&apos;ll Love
          </h2>
          <p className="font-body text-center text-brand-gray mb-16 text-lg max-w-2xl mx-auto">
            We know Las Vegas inside and out. Every location is scouted, lit perfectly, and ready for your close-up.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-brand-charcoal rounded-lg p-8 border-l-4 border-brand-gold">
              <h3 className="font-heading text-2xl font-bold text-brand-gold mb-3">The Strip</h3>
              <p className="font-body text-brand-off-white leading-relaxed">
                The Bellagio Fountains, Welcome to Vegas sign, Caesars Palace—we&apos;ll get you in front of iconic Vegas landmarks with perfect lighting and minimal crowds.
              </p>
            </div>

            <div className="bg-brand-charcoal rounded-lg p-8 border-l-4 border-brand-gold">
              <h3 className="font-heading text-2xl font-bold text-brand-gold mb-3">Fremont Street Experience</h3>
              <p className="font-body text-brand-off-white leading-relaxed">
                The vintage Vegas vibe with neon, history, and character. Perfect for moody, cool photos that tell a different Vegas story.
              </p>
            </div>

            <div className="bg-brand-charcoal rounded-lg p-8 border-l-4 border-brand-gold">
              <h3 className="font-heading text-2xl font-bold text-brand-gold mb-3">Red Rock Canyon</h3>
              <p className="font-body text-brand-off-white leading-relaxed">
                Desert landscape beauty just 30 minutes from Vegas. Stunning natural backdrops with dramatic red rock formations and golden hour magic.
              </p>
            </div>

            <div className="bg-brand-charcoal rounded-lg p-8 border-l-4 border-brand-gold">
              <h3 className="font-heading text-2xl font-bold text-brand-gold mb-3">Valley of Fire State Park</h3>
              <p className="font-body text-brand-off-white leading-relaxed">
                Otherworldly desert landscape with fiery red rocks and colorful striations. The most dramatic Vegas-area backdrop you can imagine.
              </p>
            </div>

            <div className="bg-brand-charcoal rounded-lg p-8 border-l-4 border-brand-gold">
              <h3 className="font-heading text-2xl font-bold text-brand-gold mb-3">Neon Museum</h3>
              <p className="font-body text-brand-off-white leading-relaxed">
                Vintage Vegas neon signs in one incredible location. Nostalgic, colorful, and utterly unique—perfect for creative and artistic sessions.
              </p>
            </div>

            <div className="bg-brand-charcoal rounded-lg p-8 border-l-4 border-brand-gold">
              <h3 className="font-heading text-2xl font-bold text-brand-gold mb-3">Downtown Las Vegas</h3>
              <p className="font-body text-brand-off-white leading-relaxed">
                Urban textures, street art, and modern Vegas vibes. Industrial backdrops perfect for edgy fashion and lifestyle content.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-brand-off-white py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <h2 className="font-heading text-4xl lg:text-5xl font-black tracking-editorial text-center mb-16 text-brand-black">
            Vegas Photographer FAQs
          </h2>
          
          <div className="space-y-8">
            {/* FAQ 1 */}
            <div className="bg-white rounded-lg p-8 shadow-md border-b-4 border-brand-gold">
              <h3 className="font-heading text-2xl font-bold text-brand-black mb-4">
                How far in advance should I book?
              </h3>
              <p className="font-body text-brand-gray leading-relaxed">
                Peak Vegas season (weekends, holidays) books 2-3 weeks ahead. But we love spontaneous sessions too. Contact us and we&apos;ll find a time that works. Many of our best shoots happen on last-minute bookings when people decide they need professional photos while already in Vegas.
              </p>
            </div>

            {/* FAQ 2 */}
            <div className="bg-white rounded-lg p-8 shadow-md border-b-4 border-brand-gold">
              <h3 className="font-heading text-2xl font-bold text-brand-black mb-4">
                What should I wear for my shoot?
              </h3>
              <p className="font-body text-brand-gray leading-relaxed">
                Wear something that makes you feel confident and fabulous. Vegas is all about glamour, so we recommend bold colors, statement pieces, or elegant outfits. We&apos;ll guide you on what works best for your chosen locations and the vibe you&apos;re going for. Pro tip: The Strip looks amazing in dress clothes or cocktail attire. Desert locations suit casual but stylish looks.
              </p>
            </div>

            {/* FAQ 3 */}
            <div className="bg-white rounded-lg p-8 shadow-md border-b-4 border-brand-gold">
              <h3 className="font-heading text-2xl font-bold text-brand-black mb-4">
                How quickly do I get my photos?
              </h3>
              <p className="font-body text-brand-gray leading-relaxed">
                We deliver edited photos within 5-7 business days for standard sessions. If you need photos faster for social media, ask about our rush turnaround options. We understand you want to share your Vegas memories ASAP.
              </p>
            </div>

            {/* FAQ 4 */}
            <div className="bg-white rounded-lg p-8 shadow-md border-b-4 border-brand-gold">
              <h3 className="font-heading text-2xl font-bold text-brand-black mb-4">
                Do you offer videography too?
              </h3>
              <p className="font-body text-brand-gray leading-relaxed">
                Absolutely. We specialize in both photography and videography. Combine them for a complete coverage package—short social videos, highlight reels, and full edited videos. Video content from Vegas is pure gold for your memories and content.
              </p>
            </div>

            {/* FAQ 5 */}
            <div className="bg-white rounded-lg p-8 shadow-md border-b-4 border-brand-gold">
              <h3 className="font-heading text-2xl font-bold text-brand-black mb-4">
                Can you shoot in different locations?
              </h3>
              <p className="font-body text-brand-gray leading-relaxed">
                Yes! Multi-location shoots are our specialty. Want the Strip, a desert backdrop, and Fremont Street all in one session? We&apos;ll make it happen. Just let us know your vision and we&apos;ll create a shot list that maximizes locations and lighting throughout the day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-r from-brand-black to-brand-charcoal text-brand-off-white py-20 lg:py-28">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-gold rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 lg:px-12">
          <h2 className="font-heading text-4xl lg:text-5xl font-black tracking-editorial mb-6 text-brand-gold">
            Ready to Capture Your Vegas Adventure?
          </h2>
          <p className="font-body text-xl text-brand-off-white mb-12 leading-relaxed">
            Your Vegas trip is once-in-a-lifetime. Make sure you have professional photos and videos to prove it. Echo Chamber Media photographers are ready to make you look incredible.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="bg-brand-gold text-brand-black font-heading font-bold py-4 px-12 rounded-lg hover:bg-opacity-90 transition-all text-lg">
              Book Your Photographer
            </button>
            <button className="border-2 border-brand-gold text-brand-gold font-heading font-bold py-4 px-12 rounded-lg hover:bg-brand-gold hover:text-brand-black transition-all text-lg">
              Get Pricing Info
            </button>
          </div>
          <p className="font-body text-brand-gray mt-8 text-sm">
            Questions? Contact us at hello@echochambermedia.com or call (702) XXX-XXXX
          </p>
        </div>
      </section>

      {/* Trust Signals Section */}
      <section className="bg-brand-off-white py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="font-heading text-4xl font-black text-brand-gold mb-2">500+</p>
              <p className="font-body text-brand-gray">Happy Vegas Visitors</p>
            </div>
            <div>
              <p className="font-heading text-4xl font-black text-brand-gold mb-2">10+</p>
              <p className="font-body text-brand-gray">Years Experience</p>
            </div>
            <div>
              <p className="font-heading text-4xl font-black text-brand-gold mb-2">24/7</p>
              <p className="font-body text-brand-gray">Available to Book</p>
            </div>
            <div>
              <p className="font-heading text-4xl font-black text-brand-gold mb-2">All Locations</p>
              <p className="font-body text-brand-gray">Vegas & Desert Shoots</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}