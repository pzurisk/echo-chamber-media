// Photo portfolio. One source for the homepage gallery and /photos.
// Files live in public/images/portfolio. Alt text describes the picture, never names the couple.
export interface Photo {
  file: string;
  alt: string;
  w: number;
  h: number;
  place: "Venetian" | "Casino" | "Downtown" | "High Roller" | "Red Rock";
}

const L = (file: string, alt: string, place: Photo["place"]): Photo => ({ file, alt, place, w: 2000, h: 1333 });
const P = (file: string, alt: string, place: Photo["place"]): Photo => ({ file, alt, place, w: 1333, h: 2000 });

// Order is the story order: emotion first, then range.
export const PHOTOS: Photo[] = [
  L("high-roller-sunset-kiss", "Couple kissing at sunset in front of the High Roller observation wheel in Las Vegas", "High Roller"),
  P("high-roller-smile", "Groom touching his partner's face as she smiles, with the High Roller wheel glowing behind them at dusk", "High Roller"),
  P("venetian-gold-fountain", "Couple standing beside a marble fountain under a giant golden armillary sphere inside the Venetian", "Venetian"),
  P("venetian-gold-portrait", "Close portrait of a smiling couple in front of a gold lion sculpture at the Venetian", "Venetian"),
  P("doges-palace-embrace", "Couple embracing in the plaza in front of the Doge's Palace facade at the Venetian", "Venetian"),
  P("venetian-door-dance", "Couple dancing in an embrace in front of tall wooden doors, the bride in a sparkling blue gown", "Venetian"),
  P("casino-slot-win", "Couple cheering and laughing beside a glowing slot machine in a Las Vegas casino", "Casino"),
  L("casino-walk-bw", "Black and white photo of a couple walking through a casino hall with a marble floor", "Casino"),
  L("viva-las-vegas-sign", "Couple on either side of a neon Viva Las Vegas welcome sign at night", "Downtown"),
  P("red-rock-forehead", "Couple touching foreheads in front of the red cliffs at Red Rock Canyon", "Red Rock"),
  P("red-rock-bouquet-gaze", "Couple looking at each other with a bouquet of roses, Red Rock Canyon behind them", "Red Rock"),
  L("red-rock-cheer", "Couple in the desert holding up a bouquet and cheering, red rock mountains behind them", "Red Rock"),
  L("corvette-moonrise", "Couple beside a red Corvette convertible at moonrise with red rock hills in the distance", "Red Rock"),
  L("corvette-smile", "Smiling woman resting her arms on the door of a red convertible at Red Rock Canyon", "Red Rock"),
  P("engagement-ring-embrace", "Close detail of an engagement ring on a hand resting on a partner's shoulder", "Red Rock"),
];

export const photoSrc = (p: Photo) => `/images/portfolio/${p.file}.webp`;

// The nine used on the homepage, in display order.
export const HOME_PHOTOS: Photo[] = [
  "venetian-gold-fountain",
  "casino-slot-win",
  "red-rock-forehead",
  "corvette-moonrise",
  "venetian-gold-portrait",
  "casino-walk-bw",
  "viva-las-vegas-sign",
  "red-rock-bouquet-gaze",
  "corvette-smile",
].map((f) => PHOTOS.find((p) => p.file === f)!);
