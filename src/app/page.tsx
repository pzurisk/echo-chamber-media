import Navbar from "@/sections/Navbar";
import Hero from "@/sections/Hero";
import Services from "@/sections/Services";
import FeaturedFilm from "@/sections/FeaturedFilm";
import SocialProof from "@/sections/SocialProof";
import About from "@/sections/About";
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
        <SocialProof />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}