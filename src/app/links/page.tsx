import { Metadata } from "next";
import Image from "next/image";
import Navbar from "@/sections/Navbar";
import Footer from "@/sections/Footer";

export const metadata: Metadata = {
  title: "Links",
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

type SocialItem = {
  label: string;
  handle: string;
  href: string;
  icon: React.ReactNode;
};

const primaryLinks: LinkItem[] = [
  {
    label: "Get a Free Quote",
    description: "Tell us about your project and we'll get back the same day.",
    href: "mailto:sales@echochambermedia.com",
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

/* ── Inline SVG icons (kept minimal, Apple-style) ── */
const TikTokIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-5 w-5">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z" />
  </svg>
);

const InstagramIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-5 w-5">
    <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const FacebookIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-5 w-5">
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12z" />
  </svg>
);

const MailIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-5 w-5">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const socials: SocialItem[] = [
  {
    label: "TikTok",
    handle: "@billyzurisk",
    href: "https://www.tiktok.com/@billyzurisk",
    icon: TikTokIcon,
  },
  {
    label: "Instagram",
    handle: "@chunkdude",
    href: "https://instagram.com/chunkdude",
    icon: InstagramIcon,
  },
  {
    label: "Facebook",
    handle: "Philip Zurisk",
    href: "https://www.facebook.com/share/18S1WRCyMq/",
    icon: FacebookIcon,
  },
  {
    label: "Email",
    handle: "sales@echochambermedia.com",
    href: "mailto:sales@echochambermedia.com",
    icon: MailIcon,
  },
];

function SocialPill({ item }: { item: SocialItem }) {
  const isMail = item.href.startsWith("mailto:");
  return (
    <a
      href={item.href}
      target={isMail ? undefined : "_blank"}
      rel={isMail ? undefined : "noopener noreferrer"}
      aria-label={`${item.label}, ${item.handle}`}
      className="group flex flex-col items-center gap-2 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-brand-gold/40 bg-brand-charcoal text-brand-gold transition-all duration-300 group-hover:scale-105 group-hover:border-brand-gold group-hover:bg-brand-gold group-hover:text-brand-black">
        {item.icon}
      </span>
      <span className="font-body text-[11px] uppercase tracking-editorial text-brand-gray transition-colors group-hover:text-brand-off-white">
        {item.label}
      </span>
    </a>
  );
}

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
      <main className="bg-brand-black text-brand-off-white overflow-hidden">
        {/* ── Hero: Portrait + Identity + Socials ── */}
        <section className="relative px-6 pt-32 pb-16 lg:pt-40">
          {/* Soft radial glow backdrop */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-start justify-center"
          >
            <div className="mt-20 h-[420px] w-[420px] rounded-full bg-brand-gold/10 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-2xl text-center">
            {/* Portrait with gold accent ring */}
            <div className="mx-auto mb-8 w-fit">
              <div className="relative">
                {/* Outer gold ring */}
                <div className="absolute -inset-[3px] rounded-[28px] bg-gradient-to-br from-brand-gold via-brand-gold/40 to-brand-gold/10" />
                {/* Image container */}
                <div className="relative h-60 w-60 overflow-hidden rounded-[26px] bg-brand-charcoal shadow-2xl shadow-black/60 sm:h-72 sm:w-72">
                  <Image
                    src="/images/billy-portrait.jpg"
                    alt="Billy Zurisk, Founder, Echo Chamber Media"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 640px) 240px, 288px"
                    priority
                  />
                  {/* Subtle inner vignette */}
                  <div className="pointer-events-none absolute inset-0 rounded-[26px] ring-1 ring-inset ring-white/5" />
                </div>
              </div>
            </div>

            {/* Identity */}
            <p className="font-body text-xs uppercase tracking-[0.25em] text-brand-gray mb-3">
              Billy Zurisk
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black text-brand-gold tracking-editorial leading-[1.05]">
              ECHO CHAMBER
              <br />
              MEDIA
            </h1>
            <p className="font-body mx-auto mt-5 max-w-md text-base sm:text-lg text-brand-off-white/90 leading-relaxed">
              Las Vegas video production. Films, commercials, stories.
            </p>

            {/* Social row */}
            <div className="mt-10 flex items-start justify-center gap-6 sm:gap-8">
              {socials.map((item) => (
                <SocialPill key={item.href} item={item} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Thin gold divider ── */}
        <div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent" />

        {/* ── Primary actions ── */}
        <section className="px-6 pt-16 pb-8">
          <div className="mx-auto max-w-2xl space-y-4">
            {primaryLinks.map((item) => (
              <LinkCard key={item.href} item={item} />
            ))}
          </div>
        </section>

        {/* ── Services ── */}
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

        {/* ── Closing CTA ── */}
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
              href="mailto:sales@echochambermedia.com"
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
