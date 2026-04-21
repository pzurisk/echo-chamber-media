import { Metadata } from "next";
import Navbar from "@/sections/Navbar";
import Footer from "@/sections/Footer";

export const metadata: Metadata = {
  title: "Links | Echo Chamber Media",
  description:
    "Everywhere Echo Chamber Media lives online. Services, portfolio, contact, and social links for Las Vegas video production.",
  alternates: { canonical: "https://echochambermedia.com/links" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Links | Echo Chamber Media",
    description:
      "Las Vegas video production. Weddings, corporate, music videos, documentaries, photography, and 360 walkthroughs.",
    url: "https://echochambermedia.com/links",
    type: "website",
    locale: "en_US",
  },
};

type LinkItem = {
  label: string;
  description: string;
  href: string;
  external?: boolean;
};

const primaryLinks: LinkItem[] = [
  {
    label: "Get a Free Quote",
    description: "Tell us about your project and we'll get back the same day.",
    href: "mailto:Echochambermediasales@gmail.com",
    external: true,
  },
  {
    label: "View Our Work",
    description: "Recent films, commercials, and event coverage.",
    href: "/#portfolio",
  },
];

const serviceLinks: LinkItem[] = [
  {
    label: "Wedding Videography",
    description: "Cinema-camera wedding films, shot like a short film.",
    href: "/services/wedding-videography",
  },
  {
    label: "Wedding Photography",
    description: "Editorial wedding photography across the Las Vegas valley.",
    href: "/services/wedding-photography",
  },
  {
    label: "Corporate & Commercial",
    description: "Brand films, product spots, and event recaps.",
    href: "/services/corporate",
  },
  {
    label: "Music Videos",
    description: "Concept, cinematography, and edit. You bring the song.",
    href: "/services/music-videos",
  },
  {
    label: "Documentary",
    description: "Long-form storytelling, start to finish.",
    href: "/services/documentary",
  },
  {
    label: "Las Vegas Photographer",
    description: "Proposals, bachelorette, tourist, and editorial shoots.",
    href: "/services/las-vegas-photographer",
  },
  {
    label: "360 Walkthroughs",
    description: "Immersive property and venue tours.",
    href: "/services/360-walkthroughs",
  },
];

const socialLinks: LinkItem[] = [
  {
    label: "Instagram",
    description: "@echochambermedia",
    href: "https://instagram.com/echochambermedia",
    external: true,
  },
  {
    label: "Facebook",
    description: "facebook.com/echochambermedia",
    href: "https://facebook.com/echochambermedia",
    external: true,
  },
  {
    label: "Email",
    description: "Echochambermediasales@gmail.com",
    href: "mailto:Echochambermediasales@gmail.com",
    external: true,
  },
];

function LinkCard({ item }: { item: LinkItem }) {
  const commonClasses =
    "group block rounded-lg border border-brand-gold border-opacity-30 bg-brand-charcoal p-6 transition-all hover:border-opacity-100 hover:bg-brand-black";

  const content = (
    <>
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-heading text-lg font-bold text-brand-gold tracking-editorial uppercase">
          {item.label}
        </h3>
        <span
          aria-hidden
          className="font-heading text-brand-gold opacity-60 transition-transform group-hover:translate-x-1 group-hover:opacity-100"
        >
          &rarr;
        </span>
      </div>
      <p className="font-body mt-2 text-sm text-brand-off-white leading-relaxed">
        {item.description}
      </p>
    </>
  );

  if (item.external) {
    return (
      <a
        href={item.href}
        target={item.href.startsWith("mailto:") ? undefined : "_blank"}
        rel={item.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
        className={commonClasses}
      >
        {content}
      </a>
    );
  }

  return (
    <a href={item.href} className={commonClasses}>
      {content}
    </a>
  );
}

export default function LinksPage() {
  return (
    <>
      <Navbar />
      <main className="bg-brand-black text-brand-off-white">
        {/* Hero */}
        <section className="px-6 pt-32 pb-12 lg:pt-40">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-body text-sm uppercase tracking-editorial text-brand-gray mb-4">
              Echo Chamber Media
            </p>
            <h1 className="font-heading text-5xl lg:text-6xl font-black text-brand-gold tracking-editorial leading-tight">
              ALL THE LINKS
            </h1>
            <p className="font-body mt-6 text-lg text-brand-off-white leading-relaxed">
              Las Vegas video production. Pick where you want to go.
            </p>
          </div>
        </section>

        {/* Primary actions */}
        <section className="px-6 pb-8">
          <div className="mx-auto max-w-2xl space-y-4">
            {primaryLinks.map((item) => (
              <LinkCard key={item.href} item={item} />
            ))}
          </div>
        </section>

        {/* Services */}
        <section className="px-6 py-12">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-heading text-sm uppercase tracking-editorial text-brand-gray mb-6 text-center">
              Services
            </h2>
            <div className="space-y-4">
              {serviceLinks.map((item) => (
                <LinkCard key={item.href} item={item} />
              ))}
            </div>
          </div>
        </section>

        {/* Social */}
        <section className="px-6 py-12">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-heading text-sm uppercase tracking-editorial text-brand-gray mb-6 text-center">
              Social & Contact
            </h2>
            <div className="space-y-4">
              {socialLinks.map((item) => (
                <LinkCard key={item.href} item={item} />
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl lg:text-4xl font-black text-brand-gold tracking-editorial mb-6">
              HAVE A PROJECT IN MIND?
            </h2>
            <p className="font-body text-brand-off-white mb-8 leading-relaxed">
              We handle video projects from concept through final delivery.
              Weddings, corporate, music videos, documentaries. Tell us what
              you need and we&apos;ll put a plan together.
            </p>
            <a
              href="mailto:Echochambermediasales@gmail.com"
              className="inline-block bg-brand-gold text-brand-black font-heading font-bold py-4 px-8 rounded-lg hover:bg-brand-gold-hover transition-all uppercase tracking-editorial"
            >
              Tell Us About Your Project
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
