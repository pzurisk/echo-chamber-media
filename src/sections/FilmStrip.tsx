/* eslint-disable @next/next/no-img-element */
import { IMG } from "@/lib/site";

interface Still {
  src: string;
  alt: string;
  pos: string;
}

const HOME_STILLS: Still[] = [
  { src: IMG.handHold, alt: "Hands held close", pos: "center" },
  { src: IMG.neonKiss, alt: "A kiss under neon signs", pos: "60% center" },
  { src: IMG.streetEmbrace, alt: "An embrace in the middle of a downtown street", pos: "50% center" },
  { src: IMG.danceBulbs, alt: "Couple dancing under marquee bulbs", pos: "55% center" },
];

export const ELOPEMENT_STILLS: Still[] = [
  ...HOME_STILLS,
  { src: IMG.glanceBack, alt: "A bride glancing back over her shoulder on Fremont Street", pos: "45% center" },
  { src: IMG.hero, alt: "A couple laughing together beneath a canopy of gold lights", pos: "55% center" },
];

export default function FilmStrip({ stills = HOME_STILLS }: { stills?: Still[] }) {
  const cols = stills.length === 6 ? "md:grid-cols-3" : "md:grid-cols-4";
  return (
    <section aria-label="Stills from the film" className="bg-champagne px-4 pb-14 pt-2 md:px-16 md:pb-16 md:pt-4">
      <div className={`mx-auto grid max-w-[1312px] grid-cols-2 gap-3 md:gap-4 ${cols}`}>
        {stills.map((s) => (
          <img
            key={s.alt}
            src={s.src}
            alt={s.alt}
            loading="lazy"
            decoding="async"
            className="h-[180px] w-full rounded-md object-cover md:h-[360px]"
            style={{ objectPosition: s.pos }}
          />
        ))}
      </div>
    </section>
  );
}
