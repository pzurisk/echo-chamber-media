import Image from "next/image";
import Button from "@/components/Button";

// Video-led hero. The poster sits under the video, so phones that block autoplay and
// visitors who prefer reduced motion still see a still frame, never a blank box.
export default function Hero() {
  return (
    <section className="relative flex min-h-[640px] items-end justify-center overflow-hidden bg-[#14110F] text-ivory md:h-screen">
      <Image
        src="/images/redrock-reel-poster.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <video
        className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
        src="/video/redrock-reel.mp4"
        poster="/images/redrock-reel-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/60" />
      <div className="relative mx-auto flex w-full max-w-[1100px] flex-col items-center px-4 pb-14 pt-32 text-center md:pb-16">
        <p className="mb-5 font-sans text-[11px] uppercase tracking-[0.3em] text-[#E3D5BE] md:text-xs md:tracking-[0.34em]">
          Las Vegas weddings, elopements and engagements
        </p>
        <h1 className="font-display text-[52px] leading-[1.02] sm:text-7xl lg:text-[84px]">
          Films made to be <em className="italic">felt</em>.
        </h1>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <Button variant="light-outline" href="#date">Check your date</Button>
          <a
            href="#work"
            className="font-sans text-xs uppercase tracking-[0.24em] text-ivory/90 underline-offset-8 transition-colors hover:text-white hover:underline"
          >
            See the work
          </a>
        </div>
        <p className="mt-6 font-sans text-sm font-light text-ivory/85">
          Film from $1,000. Photos add on for $500. Everything delivered within 10 days.
        </p>
      </div>
    </section>
  );
}
