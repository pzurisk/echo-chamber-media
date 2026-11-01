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
  L("corvette-doors-sunset", "Couple standing behind a red Corvette with its doors open at sunset, a full moon over Red Rock Canyon", "Red Rock"),
  P("corvette-hood-portrait", "Couple posing close together on the hood of a red Corvette at dusk with red rock mountains behind them", "Red Rock"),
  L("corvette-roses-couple", "Couple standing beside a red convertible, the bride holding a bouquet of pale roses with mountains behind them", "Red Rock"),
  L("corvette-wide-lean", "Groom leaning on a red Corvette convertible with his partner seated on the rear deck and mountains behind them", "Red Rock"),
  L("red-rock-roses-raised", "Bride in a black dress holding a bouquet of roses high in the desert at Red Rock Canyon", "Red Rock"),
  P("moon-heart-rooftop", "Couple in a suit and a blue gown making a heart with their hands around the full moon on a rooftop at dusk", "Downtown"),
  P("moon-heart-hands", "Two hands forming a heart around the full moon against a purple dusk sky", "Downtown"),
  P("venetian-plaza-embrace", "Couple embracing in front of the pink and white patterned facade at the Venetian", "Venetian"),
  L("venetian-arches-portrait", "Couple standing in front of white arches and tall wooden doors at the Venetian", "Venetian"),
  P("high-roller-fountain", "Couple posing at a fountain with the High Roller observation wheel rising behind them at dusk", "High Roller"),
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

// Eight strongest photos for the homepage carousel, in display order.
export const CAROUSEL_PHOTOS: Photo[] = [
  "high-roller-sunset-kiss",
  "high-roller-smile",
  "venetian-gold-fountain",
  "venetian-door-dance",
  "doges-palace-embrace",
  "red-rock-forehead",
  "red-rock-bouquet-gaze",
  "corvette-moonrise",
].map((f) => PHOTOS.find((p) => p.file === f)!);
