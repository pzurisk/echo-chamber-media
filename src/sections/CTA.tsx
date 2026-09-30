/* eslint-disable @next/next/no-img-element */
import Button from "@/components/Button";
import { IMG, SITE } from "@/lib/site";

export default function CTA() {
  return (
    <section className="relative overflow-hidden px-4 py-20 md:px-16 md:py-0">
      <img
        src={IMG.fremontWalk}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center 35%" }}
      />
      <div className="absolute inset-0 bg-ivory/[0.86]" />
      <div className="relative mx-auto flex max-w-[1312px] flex-col items-center justify-center gap-5 text-center md:min-h-[560px] md:gap-[22px]">
        <span className="font-script text-5xl leading-[1.1] text-gilt md:text-[58px]">Let&apos;s make your film</span>
        <h2 className="font-display text-5xl font-normal tracking-[-0.01em] text-ink md:text-[76px]">Tell us your date.</h2>
        <p className="font-sans text-[17px] text-muted md:text-[19px]">Free 20 minute call. We reply within 24 hours.</p>
        <div className="mt-2 flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
          <Button variant="ink" href="/elopements#date">Check your date</Button>
          <Button variant="ink-outline" href={SITE.phoneTel}>Call or text {SITE.phoneDisplay}</Button>
        </div>
      </div>
    </section>
  );
}
