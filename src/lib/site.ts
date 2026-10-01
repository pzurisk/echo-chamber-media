// Single source of truth for contact details and film links on the bridal pages.
export const SITE = {
  phoneDisplay: "(916) 468-9419",
  phoneTel: "tel:+19164689419",
  phoneSms: "sms:+19164689419",
  // Public by design (Web3Forms access key). Delivers to the verified sales inbox.
  web3formsKey: "2eaf6a4e-0416-4ed6-95c0-e4b93b7518f5",
  email: "echochambermediasales@gmail.com",
  googleReviews: "https://g.page/r/CeKYhZnRAYC1EBM",
  booking: "https://calendar.app.google/V6EFC7Cv3rJHxAdGA",
  instagram: "https://instagram.com/chunkdude",
  tiktok: "https://www.tiktok.com/@billyzurisk",
} as const;

// Default share image (1200x630) for link previews. Resolved against metadataBase.
export const OG_IMAGE = {
  url: "/images/og/elopements.jpg",
  width: 1200,
  height: 630,
  alt: "Luciano and Muriel laughing under gold marquee lights in Las Vegas",
} as const;

export const FILMS = {
  // Full Little Church of the West film, 2:42. The 1:27 Fremont cut is not linked on the site.
  lucianoMuriel: { id: "JlPJKf9Btvs", url: "https://youtu.be/JlPJKf9Btvs", length: "2:42" },
  nakedCity: { id: "UnqTEQxPWwo", url: "https://youtu.be/UnqTEQxPWwo" },
  classifiedMind: { id: "wGoX4MbAKCw", url: "https://youtu.be/wGoX4MbAKCw" },
  yourWay: { id: "aOIj4laYYPU", url: "https://youtu.be/aOIj4laYYPU" }, // Nas Da Realest
  comingToMe: { id: "x1yqQXmHCdY", url: "https://youtu.be/x1yqQXmHCdY" }, // The Naked City Underground
} as const;

// i.ytimg.com is already allowed in the CSP. No iframes on static pages.
export const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;

export const IMG = {
  hero: "/images/elopements/under-the-lights.webp",
  marqueeLaugh: "/images/elopements/marquee-laugh.webp",
  fremontWalk: "/images/elopements/fremont-walk.webp",
  glanceBack: "/images/elopements/glance-back.webp",
  handHold: "/images/elopements/hand-hold.webp",
  neonKiss: "/images/elopements/neon-kiss.webp",
  streetEmbrace: "/images/elopements/street-embrace.webp",
  danceBulbs: "/images/elopements/dance-bulbs.webp",
  classifiedMind: "/images/the classified mind.png",
} as const;
