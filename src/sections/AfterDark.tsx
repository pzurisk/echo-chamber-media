/* eslint-disable @next/next/no-img-element */
import Button from "@/components/Button";
import PlayCard from "@/components/PlayCard";
import { FILMS, IMG, ytThumb } from "@/lib/site";

export default function AfterDark() {
  return (
    <section className="bg-night px-4 py-14 text-night-text md:px-16 md:py-[120px]">
      <div className="mx-auto grid max-w-[1312px] grid-cols-1 items-center gap-8 md:grid-cols-12 md:gap-x-6">
        <div className="flex flex-col gap-5 md:col-span-5 md:gap-[26px]">
          <span className="font-script-dark text-[42px] leading-none text-night-gold md:text-[56px]">After dark</span>
          <h2 className="font-display text-[46px] font-normal leading-none tracking-[-0.01em] md:text-[72px] md:leading-[0.98]">
            Music videos, <span className="italic">made like movies.</span>
          </h2>
          <p className="font-sans text-base leading-[1.6] text-night-muted md:text-lg">
            When the sun goes down we shoot for artists. Concept, locations, lighting, performance, edit, and color. From the team behind The Classified Mind, Best Horror at the Las Vegas Indie Film Festival.
          </p>
          <div className="flex flex-col gap-2 font-sans text-xs uppercase tracking-[0.16em] text-night-gold md:flex-row md:gap-6">
            <span>Best Horror · LVIFF</span>
            <span>Best Short · Golden Nugget IFF</span>
          </div>
          <Button variant="night-gold" href="/music-videos" className="md:mt-2 md:self-start">
            Make a music video
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 md:col-span-6 md:col-start-7">
          <PlayCard
            href={FILMS.nakedCity.url}
            src={ytThumb(FILMS.nakedCity.id)}
            alt="The Naked City Underground, Everything's Alright"
            label="Play The Naked City Underground, Everything's Alright, on YouTube"
            tone="dark"
            size="md"
            caption="The Naked City Underground · Everything's Alright"
            className="col-span-2 h-[220px] rounded-md md:h-[380px]"
          />
          <a
            href={FILMS.classifiedMind.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Watch The Classified Mind on YouTube"
            className="block h-[140px] overflow-hidden rounded-md md:h-[220px]"
          >
            <img
              src={IMG.classifiedMind}
              alt="Still from The Classified Mind"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </a>
          <PlayCard
            href={FILMS.yourWay.url}
            src={ytThumb(FILMS.yourWay.id)}
            alt="Nas Da Realest in the music video for Your Way"
            label="Play Nas Da Realest, Your Way, on YouTube"
            tone="dark"
            size="sm"
            objectPosition="22% center"
            className="h-[140px] rounded-md md:h-[220px]"
          />
        </div>
      </div>
    </section>
  );
}
