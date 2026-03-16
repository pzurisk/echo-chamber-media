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
  title: "Echo Chamber Media | Cinematic Production, Las Vegas",
  description:
    "Cinematic storytelling for the stories that matter. Video production, brand films, commercials, and live events based in Las Vegas, NV.",
  keywords: [
    "video production",
    "Las Vegas videographer",
    "cinematic production",
    "brand films",
    "wedding videography",
    "corporate video",
    "Echo Chamber Media",
  ],
  openGraph: {
    title: "Echo Chamber Media",
    description: "Cinematic storytelling for the stories that matter.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${archivoBlack.variable} ${montserrat.variable} font-body antialiased bg-brand-black text-brand-off-white`}
      >
        {children}
      </body>
    </html>
  );
}
