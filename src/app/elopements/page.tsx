import type { Metadata } from "next";
import Navbar from "@/sections/Navbar";
import ElopementHero from "@/sections/ElopementHero";
import FeaturedFilm from "@/sections/FeaturedFilm";
import FilmStrip, { ELOPEMENT_STILLS } from "@/sections/FilmStrip";
import PackagesFull from "@/sections/PackagesFull";
import Reviews from "@/sections/Reviews";
import FAQ, { FAQS } from "@/sections/FAQ";
import Contact from "@/sections/Contact";
import Footer from "@/sections/Footer";
import { PACKAGES } from "@/lib/packages";
import { SITE } from "@/lib/site";

const URL = "https://echochambermedia.com/elopements";
const DESCRIPTION =
  "Las Vegas wedding and elopement videographer. Cinematic films from $500, shot at the chapel, downtown, or in the desert. Check your date.";

export const metadata: Metadata = {
  title: "Las Vegas Wedding and Elopement Videographer",
  description: DESCRIPTION,
  keywords:
    "Las Vegas elopement videographer, Las Vegas wedding videographer, Las Vegas elopement film, Las Vegas chapel wedding video, elopement videography packages",
  alternates: { canonical: URL },
  openGraph: {
    title: "Las Vegas Wedding and Elopement Videographer | Echo Chamber Media",
    description: DESCRIPTION,
    url: URL,
    type: "website",
    locale: "en_US",
  },
};

// No aggregateRating and no review markup on purpose.
const serviceLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Las Vegas Wedding and Elopement Videography",
  serviceType: "Wedding videography",
  areaServed: { "@type": "City", name: "Las Vegas" },
  provider: {
    "@type": "ProfessionalService",
    name: "Echo Chamber Media",
    url: "https://echochambermedia.com",
    telephone: "+1-916-468-9419",
    email: SITE.email,
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Elopement film packages",
    itemListElement: PACKAGES.map((p) => ({
      "@type": "Offer",
      name: p.name,
      description: p.summary,
      price: p.price,
      priceCurrency: "USD",
      url: `${URL}#packages`,
    })),
  },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function ElopementsPage() {
  return (
    <>
      <Navbar />
      <main className="bg-ivory font-sans text-ink">
        <ElopementHero />
        <FeaturedFilm />
        <FilmStrip stills={ELOPEMENT_STILLS} />
        <PackagesFull />
        <Reviews />
        <FAQ />
        <Contact kind="elopement" />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </>
  );
}
