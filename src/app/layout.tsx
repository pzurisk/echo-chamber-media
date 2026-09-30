import type { Metadata } from "next";
import {
  Archivo_Black,
  Montserrat,
  Cormorant_Garamond,
  Instrument_Sans,
  Pinyon_Script,
  Yellowtail,
} from "next/font/google";
import "./globals.css";

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo-black",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

// Bridal palette faces (homepage, /elopements, music videos). Self-hosted by
// next/font, so no new CSP host is needed.
const cormorant = Cormorant_Garamond({
  weight: ["400", "500"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const pinyon = Pinyon_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pinyon",
  display: "swap",
});

const yellowtail = Yellowtail({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-yellowtail",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://echochambermedia.com"),
  title: {
    default: "Las Vegas Elopement Films and Music Videos | Echo Chamber Media",
    template: "%s | Echo Chamber Media",
  },
  description:
    "Cinematic Las Vegas elopement films and music videos from a filmmaker who makes movies. Chapel, downtown, or desert. Check your date.",
  keywords: [
    "Las Vegas elopement videographer",
    "Las Vegas elopement film",
    "elopement videographer Las Vegas",
    "Las Vegas wedding videographer",
    "cinematic wedding film Las Vegas",
    "Fremont Street wedding video",
    "Las Vegas chapel wedding video",
    "music video production Las Vegas",
    "Las Vegas music video director",
    "cinematic music videos",
    "Echo Chamber Media",
  ],
  authors: [{ name: "Echo Chamber Media" }],
  creator: "Echo Chamber Media",
  publisher: "Echo Chamber Media",
  alternates: {
    canonical: "https://echochambermedia.com",
  },
  openGraph: {
    title: "Las Vegas Elopement Films and Music Videos | Echo Chamber Media",
    description:
      "Cinematic Las Vegas elopement films and music videos from a filmmaker who makes movies. Chapel, downtown, or desert. Check your date.",
    type: "website",
    locale: "en_US",
    url: "https://echochambermedia.com",
    siteName: "Echo Chamber Media",
  },
  twitter: {
    card: "summary_large_image",
    title: "Las Vegas Elopement Films and Music Videos | Echo Chamber Media",
    description:
      "Cinematic Las Vegas elopement films and music videos from a filmmaker who makes movies. Chapel, downtown, or desert. Check your date.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "ProfessionalService"],
  name: "Echo Chamber Media",
  url: "https://echochambermedia.com",
  image: "https://echochambermedia.com/images/the%20classified%20mind.png",
  telephone: "+1-916-468-9419",
  email: "echochambermediasales@gmail.com",
  description:
    "Las Vegas film company making cinematic elopement films and music videos.",
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Las Vegas",
    addressRegion: "NV",
    addressCountry: "US",
  },
  areaServed: [
    { "@type": "City", name: "Las Vegas" },
    { "@type": "City", name: "Henderson" },
    { "@type": "City", name: "North Las Vegas" },
    { "@type": "City", name: "Paradise" },
    { "@type": "City", name: "Summerlin" },
    { "@type": "City", name: "Spring Valley" },
    { "@type": "City", name: "Enterprise" },
  ],
  sameAs: [
    "https://instagram.com/chunkdude",
    "https://www.tiktok.com/@billyzurisk",
    "https://www.facebook.com/share/18S1WRCyMq/",
  ],
  founder: {
    "@type": "Person",
    name: "Billy Zurisk",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Film Services",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Las Vegas Elopement Videography" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Music Video Production" } },
    ],
  },
};

// GA4 Measurement ID, Echo Chamber Media production stream.
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "G-C2R4NNXYCY";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hasGA = GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== "G-XXXXXXXXXX";

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {hasGA && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_MEASUREMENT_ID}', {
                    anonymize_ip: true,
                    send_page_view: true
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body
        className={`${archivoBlack.variable} ${montserrat.variable} ${cormorant.variable} ${instrumentSans.variable} ${pinyon.variable} ${yellowtail.variable} font-body antialiased bg-brand-black text-brand-off-white`}
      >
        {children}
      </body>
    </html>
  );
}
