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
            Echo Chamber Media is a Las Vegas-based production company built on
            one idea: every story deserves to be told cinematically. From
            weddings and corporate spots to independent documentaries, we handle
            everything - concept through delivery.
          </p>

          <p className="mt-4 text-brand-gray font-body text-base leading-relaxed">
            Founded by Billy Zurisk, we bring film-set precision to every
            project. No templates. No shortcuts. Just clean, intentional work
            that looks and feels like the real thing - because it is.
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
