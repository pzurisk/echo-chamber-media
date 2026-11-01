// Photo and film packages. One source for the homepage teaser, /elopements, and Offer schema.
// Terms match the Video Production Agreement: $500 deposit, 15 minute grace period,
// $100/hour overtime, one consolidated revision round, delivery about 10 days after the shoot.
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

export const INCLUDED = "Every package includes planning help, cinema camera coverage, color grading, and licensed music.";

export const PACKAGES: Package[] = [
  {
    id: "film",
    name: "The Film",
    price: 1000,
    priceLabel: "$1,000",
    tagline: "Your day, shot like a movie.",
    summary: "2 hours of coverage. Finished videos up to 1 minute 30 seconds each.",
    features: [
      "2 hours of coverage",
      "Finished videos, each up to 1 minute 30 seconds",
      "Help picking your location and timing",
      "One round of revisions included",
      "Delivered within 10 days of your shoot",
    ],
  },
  {
    id: "film-photos",
    name: "Film + Photos",
    price: 1500,
    priceLabel: "$1,500",
    tagline: "The whole day, in motion and in stills.",
    summary: "The film, plus edited photos from the same shoot.",
    badge: "Most popular",
    features: [
      "Everything in The Film",
      "Edited photos from the same shoot",
      "Photos and videos delivered together",
      "Delivered within 10 days of your shoot",
    ],
  },
  {
    id: "film-photos-location",
    name: "Two Locations",
    price: 1750,
    priceLabel: "$1,750",
    tagline: "Two looks in one session.",
    summary: "Film, photos, and a second nearby location.",
    features: [
      "Everything in Film + Photos",
      "A second nearby location in the same booking",
      "Both locations fit inside your booked time",
      "Delivered within 10 days of your shoot",
    ],
  },
];

// Add-ons and policies. Prices from the agreement and Billy's pricing decision (2026-11-01).
export const ADDONS: { name: string; price: string; note: string }[] = [
  { name: "Photos from the same shoot", price: "+$500", note: "Added to The Film." },
  { name: "Second nearby location", price: "+$250", note: "Fits inside your booked time." },
  { name: "Extra time", price: "$100 per hour", note: "If you want us to stay past your end time, when we are free." },
  { name: "Longer video", price: "Quoted first", note: "You see the price before any editing starts." },
  { name: "Extra revision round", price: "$100", note: "One round is included." },
];

export const BOOKING_TERMS = "A $500 deposit holds your date. The balance is due right after the shoot.";
