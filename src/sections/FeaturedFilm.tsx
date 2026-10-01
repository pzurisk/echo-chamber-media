import PlayCard from "@/components/PlayCard";
import { FILMS, IMG } from "@/lib/site";

const DESCRIPTION =
  "One afternoon in downtown Las Vegas. A ceremony at the Little Church of the West, the Carousel Bar, marquee lights, and a slow dance on the sidewalk to close it out.";

// Dates and duration are the real values from the YouTube upload.
const videoLd = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: "Luciano & Muriel | Little Church of the West Las Vegas Elopement",
  description: DESCRIPTION,
  thumbnailUrl: "https://echochambermedia.com/images/og/elopements.jpg",
  uploadDate: "2026-09-30T12:52:32-07:00",
  duration: "PT2M43S",
  embedUrl: `https://www.youtube.com/embed/${FILMS.lucianoMuriel.id}`,
  contentUrl: FILMS.lucianoMuriel.url,
};

export default function FeaturedFilm() {
  return (
    <section id="work" className="scroll-mt-24 bg-champagne px-4 pb-6 pt-14 md:px-16 md:pb-10 md:pt-28">
      <div className="mx-auto flex max-w-[1312px] flex-col gap-8 md:gap-10">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <span className="font-sans text-[11px] uppercase tracking-[0.3em] text-gilt md:text-xs">
            Featured elopement
          </span>
          <span className="font-script text-5xl leading-[1.1] text-ink md:text-[76px]">
            Luciano &amp; Muriel
          </span>
          <p className="max-w-[620px] font-sans text-base leading-[1.6] text-muted md:text-lg">
            {DESCRIPTION}
          </p>
        </div>
        <PlayCard
          href={FILMS.lucianoMuriel.url}
          youtubeId={FILMS.lucianoMuriel.id}
          src={IMG.marqueeLaugh}
          alt="Luciano and Muriel laughing together under the gold marquee lights"
          label="Play the Luciano and Muriel elopement film"
          caption={`Watch the film · ${FILMS.lucianoMuriel.length}`}
          className="h-[260px] md:h-[600px]"
          objectPosition="center 40%"
        />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoLd) }} />
    </section>
  );
}
