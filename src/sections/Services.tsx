import SectionWrapper from "@/components/SectionWrapper";
import Heading from "@/components/Heading";

const services = [
  {
    title: "Weddings",
    description: "Your day, told like a film. Cinematic coverage that captures every moment.",
    anchor: "#portfolio-weddings",
    image: "/images/service-weddings.jpg",
  },
  {
    title: "Corporate",
    description: "Brand films, commercials, and internal content that command attention.",
    anchor: "#portfolio-corporate",
    image: "/images/service-corporate.jpg",
  },
  {
    title: "Walk-throughs",
    description: "Real estate and venue tours with cinematic movement and precision.",
    anchor: "#portfolio-walkthroughs",
    image: "/images/service-walkthroughs.jpg",
  },
  {
    title: "Documentaries",
    description: "Long-form storytelling. Real stories. No shortcuts.",
    anchor: "#portfolio-documentaries",
    image: "/images/service-documentaries.jpg",
  },
];

function ServiceCard({ title, description, anchor, image }: (typeof services)[0]) {
  return (
    <a href={anchor} className="group relative block aspect-[4/3] overflow-hidden bg-brand-charcoal">
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="absolute inset-0 bg-black/40 transition-colors duration-500 group-hover:bg-black/60" />
      <div className="relative z-10 flex h-full flex-col justify-end p-6 md:p-8">
        <h3 className="font-heading text-2xl md:text-3xl uppercase tracking-editorial text-brand-off-white">
          {title}
        </h3>
        <p className="mt-2 text-sm md:text-base text-brand-gray font-body leading-relaxed max-w-xs">
          {description}
        </p>
        <div className="mt-4 overflow-hidden">
          <span className="inline-block translate-y-full opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 text-sm uppercase tracking-editorial text-brand-gold border-b border-brand-gold pb-1 font-body font-semibold">
            View Work
          </span>
        </div>
      </div>
    </a>
  );
}

export default function Services() {
  return (
    <SectionWrapper id="services">
      <div className="text-center mb-16">
        <Heading as="h2" gold>
          What We Do
        </Heading>
        <div className="mt-4 h-px w-16 bg-brand-gold mx-auto" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {services.map((service) => (
          <ServiceCard key={service.title} {...service} />
        ))}
      </div>
    </SectionWrapper>
  );
}
