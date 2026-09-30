// Elopement packages. One source for the homepage teaser, /elopements, and Offer schema.
export interface Package {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  tagline: string;
  summary: string;
  badge?: string;
  features: string[];
}

export const INCLUDED = "Every package includes planning help, cinema camera coverage, a color graded film, and licensed music.";

export const PACKAGES: Package[] = [
  {
    id: "chapel",
    name: "The Chapel",
    price: 500,
    priceLabel: "$500",
    tagline: "Short, sweet, and done right.",
    summary: "1 hour of coverage. A 2 to 3 minute film.",
    features: [
      "1 hour of coverage",
      "Ceremony plus one nearby spot",
      "2 to 3 minute film",
      "Full ceremony audio",
      "Delivered in 3 weeks",
    ],
  },
  {
    id: "downtown",
    name: "Downtown",
    price: 750,
    priceLabel: "$750",
    tagline: "Say your vows, then walk the lights.",
    summary: "2 hours of coverage. A 3 to 4 minute film plus a teaser.",
    badge: "The Luciano & Muriel day",
    features: [
      "2 hours of coverage",
      "Ceremony plus Fremont Street walk",
      "3 to 4 minute film plus a 30 second teaser",
      "Full ceremony audio",
      "Delivered in 3 weeks",
    ],
  },
  {
    id: "desert",
    name: "Desert & Lights",
    price: 1000,
    priceLabel: "$1,000",
    tagline: "Red rock at golden hour, city lights after dark.",
    summary: "4 hours of coverage. A 4 to 5 minute film plus a teaser.",
    features: [
      "4 hours of coverage, drive time included",
      "Desert location plus downtown or Strip",
      "4 to 5 minute film plus a 30 second teaser",
      "Drone shots where allowed",
      "Delivered in 4 weeks",
    ],
  },
];
