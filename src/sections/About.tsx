import SectionWrapper from "@/components/SectionWrapper";
import Heading from "@/components/Heading";

export default function About() {
  return (
    <SectionWrapper id="about" dark={false}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* ── Image ── */}
        <div className="relative aspect-[4/3] overflow-hidden bg-brand-black">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url(/images/about-bts.jpg)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-charcoal/60 to-transparent" />
        </div>

        {/* ── Copy ── */}
        <div>
          <Heading as="h2" gold>
            About
          </Heading>
          <div className="mt-4 h-px w-16 bg-brand-gold" />

          <p className="mt-8 text-brand-off-white/90 font-body text-base md:text-lg leading-relaxed">
            Echo Chamber Media is a Las Vegas production company that handles
            video projects from concept through final delivery. Weddings,
            corporate content, property walk-throughs, documentaries, and music
            videos. We bring film-set gear and process to every shoot.
          </p>

          <p className="mt-4 text-brand-gray font-body text-base leading-relaxed">
            Billy Zurisk founded the company and runs every project. On the
            independent side, his feature &ldquo;The Classified Mind&rdquo; has
            picked up festival laurels, and the same standards that go into a
            feature go into a wedding or a corporate edit. Our Google reviews
            sit at 5.0 because we don&apos;t cut corners and we don&apos;t use
            templates.
          </p>

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-brand-charcoal" />
            <span className="text-sm text-brand-gold font-body uppercase tracking-editorial">
              Las Vegas, NV
            </span>
            <div className="h-px flex-1 bg-brand-charcoal" />
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
