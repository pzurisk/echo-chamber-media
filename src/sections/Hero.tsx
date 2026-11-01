import Image from "next/image";
import Button from "@/components/Button";

export default function Hero() {
  return (
    <section className="relative flex min-h-[640px] items-end overflow-hidden bg-ivory text-white md:h-screen">
      <Image
        src="/images/portfolio/high-roller-sunset-kiss.webp"
        alt="Couple kissing at sunset in front of the High Roller observation wheel in Las Vegas"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[50%_35%]"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/45" />
      <div className="relative mx-auto w-full max-w-[1312px] px-4 pb-14 pt-32 md:px-16 md:pb-24">
        <p className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gilt">
          Las Vegas photography and film
        </p>
        <h1 className="max-w-[900px] font-display text-[40px] leading-[1.05] sm:text-6xl lg:text-7xl">
          Las Vegas photos and films that feel like your best night.
        </h1>
        <p className="mt-5 max-w-[560px] font-sans text-[17px] leading-[1.6] text-white/90 md:text-xl">
          Engagements, elopements and weddings. Choose photos, film, or both. I run every shoot myself, and you get everything within 10 days.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Button variant="ink" href="#date">Check your date</Button>
          <a
            href="#work"
            className="inline-flex h-14 items-center justify-center rounded-full border border-white/70 px-8 font-sans text-base font-semibold text-white transition-colors hover:bg-white hover:text-black"
          >
            See the work
          </a>
        </div>
        <p className="mt-6 font-sans text-[15px] text-white/80">
          <span className="font-semibold text-white">Film from $1,000.</span> Photos add on for $500. A $500 deposit holds your date.
        </p>
      </div>
    </section>
  );
}
