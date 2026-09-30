/* eslint-disable @next/next/no-img-element */
import Button from "@/components/Button";
import { IMG } from "@/lib/site";

export default function ElopementHero() {
  return (
    <section className="bg-ivory px-4 pb-12 pt-[88px] md:px-16 md:pb-[88px] md:pt-[120px]">
      <div className="mx-auto grid max-w-[1312px] grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-x-14">
        <div className="relative h-[380px] overflow-hidden rounded-lg bg-champagne sm:h-[480px] lg:col-span-6 lg:h-[640px]">
          <img
            src={IMG.fremontWalk}
            alt="A bride and groom walking hand in hand down Fremont Street in Las Vegas"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: "68% center" }}
          />
        </div>

        <div className="flex flex-col gap-5 lg:col-span-6 lg:gap-6">
          <span className="font-script text-[40px] leading-[1.1] text-gilt md:text-[56px] md:leading-none">
            Elope in Las Vegas
          </span>
          <h1 className="font-display text-[54px] font-normal leading-[0.98] tracking-[-0.015em] text-ink sm:text-[72px] lg:leading-[0.95] xl:text-[88px]">
            Small wedding. <span className="whitespace-nowrap italic">Big film.</span>
          </h1>
          <p className="font-sans text-[17px] leading-[1.55] text-muted md:text-xl md:leading-[1.6]">
            Las Vegas wedding and elopement films for couples who want it small, personal, and beautiful. Chapel, downtown, or desert. Shot on cinema cameras by a director who makes movies.
          </p>
          <div className="flex flex-col gap-4 md:flex-row lg:mt-1">
            <Button variant="ink" href="#date">Check your date</Button>
            <Button variant="ink-outline" href="#packages">See packages</Button>
          </div>
          <p className="font-sans text-[15px] text-ink">
            <span className="font-semibold">Films from $500.</span>{" "}
            <span className="text-muted">Delivered in 3 to 4 weeks.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
