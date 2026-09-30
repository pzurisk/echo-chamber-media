/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Button from "@/components/Button";
import { FILMS } from "@/lib/site";

export default function Hero() {
  return (
    <section className="bg-ivory px-4 pb-10 pt-[88px] md:px-16 md:pb-[72px] md:pt-[120px]">
      <div className="mx-auto grid max-w-[1312px] grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-x-10">
        <div className="order-2 flex flex-col gap-5 lg:order-1 lg:col-span-5 lg:gap-6">
          <span className="font-script text-[40px] leading-[1.1] text-gilt md:text-[56px] md:leading-none">
            Las Vegas elopements
          </span>
          <h1 className="font-display text-[54px] font-normal leading-[0.98] tracking-[-0.015em] text-ink sm:text-[72px] lg:leading-[0.95] xl:text-[88px]">
            Say yes in Vegas. <span className="italic">Keep it forever.</span>
          </h1>
          <p className="font-sans text-[17px] leading-[1.55] text-muted md:text-xl md:leading-[1.6]">
            Cinematic wedding films for couples who want it small, personal, and beautiful.
            <span className="hidden md:inline"> Shot on cinema cameras by a director who makes movies.</span>
          </p>
          <div className="flex flex-col gap-4 md:flex-row lg:mt-1">
            <Button variant="ink" href="/elopements#date">Check your date</Button>
            <Button variant="ink-outline" href="/elopements#packages">See packages</Button>
          </div>
          <p className="font-sans text-[15px] text-ink">
            <span className="font-semibold">Elopement films from $500.</span>{" "}
            <span className="text-muted">Delivered in 1 week.</span>
          </p>
          <span className="font-sans text-[15px] text-muted">
            Artist or band?{" "}
            <Link href="/music-videos" className="font-semibold text-gilt hover:text-gilt-hover">
              We make music videos too →
            </Link>
          </span>
        </div>

        <div className="relative order-1 h-[360px] overflow-hidden rounded-lg bg-champagne sm:h-[460px] lg:order-2 lg:col-span-7 lg:h-[560px]">
          <img
            src="/images/elopements/hero-poster.webp"
            alt=""
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/images/elopements/hero-poster.webp"
            aria-label="Luciano and Muriel laughing and walking down a gold lit arcade in Las Vegas"
            className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
          >
            <source src="/video/elopement-hero.mp4" type="video/mp4" />
          </video>
          <a
            href={FILMS.lucianoMuriel.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 left-4 flex h-11 items-center gap-2.5 rounded-full bg-ivory/95 pl-3 pr-5 font-sans text-[13px] font-semibold text-ink transition-colors hover:bg-white md:bottom-6 md:left-6"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gilt">
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-ivory" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
            </span>
            Watch Luciano &amp; Muriel · {FILMS.lucianoMuriel.length}
          </a>
        </div>
      </div>
    </section>
  );
}
