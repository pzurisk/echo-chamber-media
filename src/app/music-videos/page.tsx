import type { Metadata } from "next";
import Navbar from "@/sections/Navbar";
import { MusicHero, MusicWork, MusicWhat } from "@/sections/MusicPage";
import Contact from "@/sections/Contact";
import Footer from "@/sections/Footer";
import { SITE } from "@/lib/site";

const URL = "https://echochambermedia.com/music-videos";
const DESCRIPTION =
  "Music video production in Las Vegas. Cinematic performance and concept videos from the team behind an award-winning horror film. Start your music video.";

export const metadata: Metadata = {
  title: "Music Video Production Las Vegas",
  description: DESCRIPTION,
  keywords:
    "music video production Las Vegas, Las Vegas music video director, cinematic music videos, artist music videos, band music video Las Vegas",
  alternates: { canonical: URL },
  openGraph: {
    title: "Music Video Production Las Vegas | Echo Chamber Media",
    description: DESCRIPTION,
    url: URL,
    type: "website",
    locale: "en_US",
  },
};

const serviceLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Las Vegas Music Video Production",
  serviceType: "Music video production",
  areaServed: { "@type": "City", name: "Las Vegas" },
  provider: {
    "@type": "ProfessionalService",
    name: "Echo Chamber Media",
    url: "https://echochambermedia.com",
    telephone: "+1-916-468-9419",
    email: SITE.email,
  },
};

export default function MusicVideosPage() {
  return (
    <>
      <Navbar />
      <main className="bg-night font-sans text-night-text">
        <MusicHero />
        <MusicWork />
        <MusicWhat />
        <Contact kind="music" />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
    </>
  );
}
