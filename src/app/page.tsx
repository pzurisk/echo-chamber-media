import Navbar from "@/sections/Navbar";
import Hero from "@/sections/Hero";
import TrustStrip from "@/sections/TrustStrip";
import FeaturedFilm from "@/sections/FeaturedFilm";
import FilmStrip from "@/sections/FilmStrip";
import HowItWorks from "@/sections/HowItWorks";
import PackagesTeaser from "@/sections/PackagesTeaser";
import Reviews from "@/sections/Reviews";
import AfterDark from "@/sections/AfterDark";
import About from "@/sections/About";
import CTA from "@/sections/CTA";
import Footer from "@/sections/Footer";
import MobileCta from "@/sections/MobileCta";

export default function Home() {
  return (
    <div className="bg-ivory font-sans text-ink">
      <Navbar />
      <main>
        <Hero />
        <TrustStrip />
        <FeaturedFilm />
        <FilmStrip />
        <HowItWorks />
        <PackagesTeaser />
        <Reviews />
        <AfterDark />
        <About />
        <CTA />
      </main>
      <Footer />
      <MobileCta />
    </div>
  );
}
