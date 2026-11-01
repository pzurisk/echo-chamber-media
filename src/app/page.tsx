import Navbar from "@/sections/Navbar";
import Hero from "@/sections/Hero";
import TrustStrip from "@/sections/TrustStrip";
import PickDoor from "@/sections/PickDoor";
import GalleryHome from "@/sections/GalleryHome";
import FeaturedFilm from "@/sections/FeaturedFilm";
import PackagesTeaser from "@/sections/PackagesTeaser";
import HowItWorks from "@/sections/HowItWorks";
import Reviews from "@/sections/Reviews";
import AfterDark from "@/sections/AfterDark";
import About from "@/sections/About";
import FAQ from "@/sections/FAQ";
import Contact from "@/sections/Contact";
import Footer from "@/sections/Footer";
import MobileCta from "@/sections/MobileCta";

export default function Home() {
  return (
    <div className="bg-ivory font-sans text-ink">
      <Navbar />
      <main>
        <Hero />
        <TrustStrip />
        <PickDoor />
        <GalleryHome />
        <FeaturedFilm />
        <PackagesTeaser />
        <HowItWorks />
        <Reviews />
        <AfterDark />
        <About />
        <FAQ />
        <Contact kind="elopement" />
      </main>
      <Footer />
      <MobileCta />
    </div>
  );
}
