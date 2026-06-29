import Navbar from "@/sections/Navbar";
import Hero from "@/sections/Hero";
import TrustStrip from "@/sections/TrustStrip";
import Services from "@/sections/Services";
import Portfolio from "@/sections/Portfolio";
import FeaturedFilm from "@/sections/FeaturedFilm";
import About from "@/sections/About";
import Reviews from "@/sections/Reviews";
import Contact from "@/sections/Contact";
import Footer from "@/sections/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustStrip />
        <Services />
        <Portfolio />
        <FeaturedFilm />
        <About />
        <Reviews />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
