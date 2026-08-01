import type { Metadata } from "next";
import { Archivo_Black, Montserrat } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://echochambermedia.com"),
  title: {
    default: "Las Vegas Video Production Company | Echo Chamber Media",
    template: "%s | Echo Chamber Media",
  },
  description:
    "Award-winning video production in Las Vegas. Cinematic wedding films, corporate video, documentaries & real estate tours. Get a free consultation today.",
  keywords: [
    "video production Las Vegas",
    "Las Vegas videographer",
    "cinematic wedding videography Las Vegas",
    "wedding videographer Las Vegas",
    "wedding photographer Las Vegas",
    "Las Vegas wedding photography",
    "Las Vegas photographer",
    "Vegas vacation photographer",
    "tourist photographer Las Vegas",
    "Las Vegas proposal photographer",
    "bachelorette party photographer Vegas",
    "corporate video production Las Vegas",
    "brand films Las Vegas",
    "documentary filmmaker Las Vegas",
    "real estate video tours Las Vegas",
    "commercial video production Nevada",
    "Echo Chamber Media",
    "Las Vegas film production",
    "cinematic storytelling",
  ],
  authors: [{ name: "Echo Chamber Media" }],
  creator: "Echo Chamber Media",
  publisher: "Echo Chamber Media",
  alternates: {
    canonical: "https://echochambermedia.com",
  },
  openGraph: {
    title: "Las Vegas Video Production Company | Echo Chamber Media",
    description:
      "Award-winning video production in Las Vegas. Cinematic wedding films, corporate video, documentaries & real estate tours. Get a free consultation today.",
    type: "website",
    locale: "en_US",
    url: "https://echochambermedia.com",
    siteName: "Echo Chamber Media",
  },
  twitter: {
    card: "summary_large_image",
    title: "Las Vegas Video Production Company | Echo Chamber Media",
    description:
      "Award-winning video production in Las Vegas. Cinematic wedding films, corporate video, documentaries & real estate tours. Get a free consultation today.",
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
  telephone: "+1-989-308-1633",
  email: "sales@echochambermedia.com",
  description:
    "Cinematic video production company based in Las Vegas specializing in wedding films, brand content, commercials, documentaries, music videos, and property walk-throughs.",
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
    name: "Video Production Services",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Wedding Videography" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Wedding Photography" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Corporate & Commercial Video" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Music Video Production" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Documentary Production" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Real Estate Videography" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "360 Virtual Walkthroughs" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Aerial Videography" } },
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
        className={`${archivoBlack.variable} ${montserrat.variable} font-body antialiased bg-brand-black text-brand-off-white`}
      >
        {children}
      </body>
    </html>
  );
}
