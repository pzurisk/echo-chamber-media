import type { Metadata } from "next";
import Navbar from "@/sections/Navbar";
import Footer from "@/sections/Footer";
import MobileCta from "@/sections/MobileCta";
import PhotoGrid from "@/components/PhotoGrid";
import Button from "@/components/Button";
import { PHOTOS } from "@/lib/portfolio";

const URL = "https://echochambermedia.com/photos";
const TITLE = "Las Vegas Engagement and Wedding Photographer | Echo Chamber Media";
const DESCRIPTION =
  "Las Vegas engagement, elopement and wedding photos at the Venetian, downtown, the High Roller and Red Rock Canyon. Add photos to any film for $500. Check your date.";
const SHARE = { url: "/images/og/photos-share.jpg", width: 1200, height: 630, alt: "Couple kissing at sunset in front of the High Roller observation wheel in Las Vegas" };

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords:
    "Las Vegas engagement photographer, Las Vegas elopement photographer, Las Vegas wedding photographer, Red Rock Canyon engagement photos, Venetian engagement photos",
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, type: "website", locale: "en_US", images: [SHARE] },
};

const serviceLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Las Vegas Engagement and Wedding Photography",
  serviceType: "Photography",
  areaServed: { "@type": "City", name: "Las Vegas" },
  provider: { "@type": "ProfessionalService", name: "Echo Chamber Media", url: "https://echochambermedia.com" },
  offers: { "@type": "Offer", price: 500, priceCurrency: "USD", description: "Photo add-on to any film package" },
};

export default function PhotosPage() {
  return (
    <>
      <Navbar />
      <main className="bg-ivory font-sans text-ink">
        <section className="px-4 pb-10 pt-[120px] md:px-16 md:pb-14 md:pt-[168px]">
          <div className="mx-auto max-w-[1312px]">
            <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gilt">Photography</p>
            <h1 className="max-w-[900px] font-display text-4xl text-ink md:text-6xl lg:text-7xl">
              Las Vegas engagement and wedding photos.
            </h1>
            <p className="mt-5 max-w-[620px] text-[17px] leading-[1.6] text-muted md:text-lg">
              The Venetian, downtown neon, the High Roller and Red Rock at golden hour. Add photos to any film for $500, shot in the same session.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button variant="ink" href="/#date">Check your date</Button>
              <Button variant="ink-outline" href="/elopements#packages">See pricing</Button>
            </div>
          </div>
        </section>
        <section className="px-4 pb-16 md:px-16 md:pb-[104px]">
          <div className="mx-auto max-w-[1312px]">
            <PhotoGrid photos={PHOTOS} />
          </div>
        </section>
        <section className="bg-champagne px-4 py-16 text-center md:px-16 md:py-[104px]">
          <div className="mx-auto flex max-w-[640px] flex-col items-center gap-4">
            <h2 className="font-display text-3xl text-ink md:text-5xl">Tell me your date.</h2>
            <p className="text-[17px] leading-[1.6] text-muted">Free 20 minute call. I reply within 24 hours.</p>
            <Button variant="ink" href="/#date">Check your date</Button>
          </div>
        </section>
      </main>
      <Footer />
      <MobileCta />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
    </>
  );
}
