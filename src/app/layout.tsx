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
    default: "Echo Chamber Media | Cinematic Video Production in Las Vegas",
    template: "%s | Echo Chamber Media",
  },
  description:
    "Echo Chamber Media is a cinematic video production company based in Las Vegas, NV. We produce wedding films, brand content, commercials, documentaries, real estate walk-throughs, and live event coverage.",
  keywords: [
    "video production Las Vegas",
    "Las Vegas videographer",
    "cinematic wedding videography Las Vegas",
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
    title: "Echo Chamber Media | Cinematic Video Production in Las Vegas",
    description:
      "Cinematic storytelling for the stories that matter. Wedding films, brand content, commercials, and documentaries based in Las Vegas, NV.",
    type: "website",
    locale: "en_US",
    url: "https://echochambermedia.com",
    siteName: "Echo Chamber Media",
  },
  twitter: {
    card: "summary_large_image",
    title: "Echo Chamber Media | Cinematic Video Production in Las Vegas",
    description:
      "Cinematic storytelling for the stories that matter. Wedding films, brand content, commercials, and documentaries based in Las Vegas, NV.",
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
  "@type": "VideoProductionCompany",
  name: "Echo Chamber Media",
  url: "https://echochambermedia.com",
  description:
    "Cinematic video production company based in Las Vegas specializing in wedding films, brand content, commercials, documentaries, and live events.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Las Vegas",
    addressRegion: "NV",
    addressCountry: "US",
  },
  areaServed: {
    "@type": "Place",
    name: "Las Vegas, Nevada",
  },
  serviceType: [
    "Wedding Videography",
    "Corporate Video Production",
    "Commercial Production",
    "Documentary Filmmaking",
    "Real Estate Video Tours",
    "Live Event Coverage",
  ],
  founder: {
    "@type": "Person",
    name: "Billy Zurisk",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${archivoBlack.variable} ${montserrat.variable} font-body antialiased bg-brand-black text-brand-off-white`}
      >
        {children}
      </body>
    </html>
  );
}
