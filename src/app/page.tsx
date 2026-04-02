import Navbar from "@/sections/Navbar";
import Hero from "@/sections/Hero";
import Services from "@/sections/Services";
import FeaturedFilm from "@/sections/FeaturedFilm";
import Portfolio from "@/sections/Portfolio";
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
        <Services />
        <FeaturedFilm />
        <Portfolio />
        <About />
        <Reviews />
        <Contact />
      </main>
      <Footer />
    </>
  );
}