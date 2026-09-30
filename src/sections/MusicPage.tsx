/* eslint-disable @next/next/no-img-element */
import Button from "@/components/Button";
import PlayCard from "@/components/PlayCard";
import { FILMS, IMG, ytThumb } from "@/lib/site";

export function MusicHero() {
  return (
    <section className="bg-night px-4 pb-14 pt-[104px] text-night-text md:px-16 md:pb-[104px] md:pt-[144px]">
      <div className="mx-auto grid max-w-[1312px] grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-x-12">
        <div className="flex flex-col gap-5 lg:col-span-5 lg:gap-[26px]">
          <span className="font-script-dark text-[44px] leading-none text-night-gold md:text-[60px]">After dark</span>
          <h1 className="font-display text-[54px] font-normal leading-[0.98] tracking-[-0.015em] sm:text-[72px] xl:text-[88px]">
            Music videos, <span className="italic">made like movies.</span>
          </h1>
          <p className="font-sans text-[17px] leading-[1.6] text-night-muted md:text-xl">
            Concept, locations, lighting, performance, edit, and color, all from one Las Vegas crew. You bring the song. We bring the film.
          </p>
          <div className="flex flex-col gap-4 md:flex-row md:mt-1">
            <Button variant="night-gold" href="#contact">Start your music video</Button>
            <a
              href="#work"
              className="inline-flex h-14 items-center justify-center rounded-full border border-night-gold/60 px-8 font-sans text-base font-semibold text-night-gold transition-colors hover:bg-night-gold hover:text-night"
            >
              Watch the work
            </a>
          </div>
        </div>
        <div className="lg:col-span-7">
          <PlayCard
            href={FILMS.nakedCity.url}
            src={ytThumb(FILMS.nakedCity.id)}
            alt="The Naked City Underground performing in the music video Everything's Alright"
            label="Play The Naked City Underground, Everything's Alright, on YouTube"
            tone="dark"
            size="lg"
            caption="The Naked City Underground · Everything's Alright"
            className="h-[240px] sm:h-[360px] lg:h-[460px]"
          />
        </div>
      </div>
    </section>
  );
}

const CREDITS = [
  { k: "Artist", v: "The Naked City Underground" },
  { k: "Cinematography", v: "Billy Zurisk" },
  { k: "Vibe", v: "Outlaw country and surf punk" },
];

export function MusicWork() {
  return (
    <section id="work" className="scroll-mt-24 bg-night px-4 pb-16 pt-2 text-night-text md:px-16 md:pb-[112px] md:pt-4">
      <div className="mx-auto flex max-w-[1312px] flex-col gap-10 md:gap-14">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-night-gold/25 bg-night-gold/25 md:grid-cols-3">
          {CREDITS.map((c) => (
            <div key={c.k} className="flex flex-col gap-1.5 bg-night p-6 text-center">
              <span className="font-sans text-[11px] uppercase tracking-[0.25em] text-night-gold">{c.k}</span>
              <span className="font-display text-2xl text-night-text">{c.v}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="font-display text-5xl font-normal leading-none tracking-[-0.01em] md:text-[64px]">
            More from <span className="italic text-night-gold">the vault.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <PlayCard
            href={FILMS.yourWay.url}
            src={ytThumb(FILMS.yourWay.id)}
            alt="Nas Da Realest in the music video for Your Way"
            label="Play Nas Da Realest, Your Way, on YouTube"
            tone="dark"
            size="md"
            caption="Nas Da Realest · Your Way"
            className="h-[240px] md:h-[360px]"
          />
          <PlayCard
            href={FILMS.comingToMe.url}
            src={ytThumb(FILMS.comingToMe.id)}
            alt="The Naked City Underground in the music video for Coming To Me"
            label="Play The Naked City Underground, Coming To Me, on YouTube"
            tone="dark"
            size="md"
            caption="The Naked City Underground · Coming To Me"
            className="h-[240px] md:h-[360px]"
          />
        </div>

        <div className="flex flex-col items-center gap-3 pt-6 text-center md:pt-10">
          <h2 className="font-display text-5xl font-normal leading-none tracking-[-0.01em] md:text-[64px]">
            From the team behind <span className="italic text-night-gold">The Classified Mind.</span>
          </h2>
          <div className="mt-2 flex flex-col gap-2 font-sans text-xs uppercase tracking-[0.16em] text-night-gold md:flex-row md:gap-8">
            <span>Best Horror · Las Vegas Indie Film Festival</span>
            <span>Best Short · Golden Nugget IFF</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <PlayCard
            href={FILMS.classifiedMind.url}
            src={IMG.classifiedMind}
            alt="Still from The Classified Mind"
            label="Watch The Classified Mind on YouTube"
            tone="dark"
            size="md"
            className="h-[240px] md:h-[360px]"
          />
          <a
            href="#contact"
            className="flex h-[240px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-night-gold/50 p-6 text-center transition-colors hover:border-night-gold md:h-[360px]"
          >
            <span className="font-display text-4xl italic text-night-text md:text-5xl">Your song could be next.</span>
            <span className="font-sans text-xs uppercase tracking-[0.16em] text-night-gold">Start your music video →</span>
          </a>
        </div>
      </div>
    </section>
  );
}

const WHAT = [
  {
    t: "Performance that feels alive",
    d: "Your performance is the heart of the video. Dynamic camera work, strong angles, and an edit that shows off your stage presence.",
  },
  {
    t: "Concept and story",
    d: "Beyond performance, we build concept-driven videos with thoughtful color and real emotional weight, the way we make films.",
  },
  {
    t: "Color and finish",
    d: "Every video gets a full color grade and a careful edit, so it looks polished on every screen it lands on.",
  },
  {
    t: "Las Vegas locations",
    d: "Las Vegas is home. Desert, neon, dive bars, rooftops. We know the spots that make a video look like nowhere else.",
  },
];

export function MusicWhat() {
  return (
    <section className="bg-[#1A140E] px-4 py-16 text-night-text md:px-16 md:py-[104px]">
      <div className="mx-auto flex max-w-[1312px] flex-col gap-10 md:gap-14">
        <h2 className="text-center font-display text-5xl font-normal leading-none tracking-[-0.01em] md:text-[64px]">
          How we make <span className="italic text-night-gold">yours.</span>
        </h2>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-16 md:gap-y-12 lg:grid-cols-4 lg:gap-x-8">
          {WHAT.map((w) => (
            <div key={w.t} className="flex flex-col gap-3 border-t border-night-gold/40 pt-5">
              <h3 className="font-display text-[26px] leading-[1.15] text-night-text">{w.t}</h3>
              <p className="font-sans text-base leading-[1.65] text-night-muted">{w.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
