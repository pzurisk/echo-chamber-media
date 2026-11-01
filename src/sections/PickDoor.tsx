import Image from "next/image";
import Link from "next/link";

const doors = [
  {
    href: "/photos",
    title: "Photos",
    text: "Engagement, pre-wedding and elopement portraits.",
    img: "/images/portfolio/red-rock-bouquet-gaze.webp",
    alt: "Couple looking at each other with a bouquet in Red Rock Canyon",
  },
  {
    href: "/elopements",
    title: "Films",
    text: "Cinematic elopement and wedding films.",
    img: "/images/elopements/under-the-lights.webp",
    alt: "Couple smiling at each other under marquee lights in downtown Las Vegas",
  },
];

export default function PickDoor() {
  return (
    <section id="pick" className="bg-ivory px-4 py-16 md:px-16 md:py-[104px]">
      <div className="mx-auto max-w-[1312px]">
        <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gilt">What do you need</p>
        <h2 className="font-display text-4xl text-ink md:text-6xl">Pick your door.</h2>
        <p className="mt-3 max-w-[560px] font-sans text-[17px] leading-[1.6] text-muted">
          Most couples do both. Add photos to any film for $500.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {doors.map((d) => (
            <Link key={d.title} href={d.href} className="group relative block aspect-[4/5] overflow-hidden rounded-md md:aspect-[5/6]">
              <Image src={d.img} alt={d.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute inset-x-6 bottom-6 text-white md:inset-x-8 md:bottom-8">
                <h3 className="font-display text-3xl md:text-4xl">{d.title}</h3>
                <p className="mt-1 font-sans text-[15px] text-white/85">{d.text}</p>
                <span className="mt-3 inline-block font-sans text-sm font-semibold text-gilt">See the work →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
