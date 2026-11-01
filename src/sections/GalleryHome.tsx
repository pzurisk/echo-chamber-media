import PhotoCarousel from "@/components/PhotoCarousel";
import { CAROUSEL_PHOTOS } from "@/lib/portfolio";

export default function GalleryHome() {
  return (
    <section id="work" className="scroll-mt-24 overflow-hidden bg-ivory py-16 md:py-[104px]">
      <div className="mx-auto max-w-[1440px] pl-4 md:pl-16">
        <div className="flex flex-col gap-6 pr-4 md:flex-row md:items-end md:justify-between md:pr-16">
          <div>
            <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-muted">Photography</p>
            <h2 className="mt-3 font-display text-5xl text-ink md:text-[56px]">
              Moments, <em className="italic">held still</em>.
            </h2>
          </div>
          <a
            href="/photos"
            className="self-start border-b border-ink pb-1.5 font-sans text-xs uppercase tracking-[0.24em] text-ink transition-colors hover:border-gilt hover:text-gilt"
          >
            View all photography
          </a>
        </div>
        <div className="mt-10 pr-4 md:pr-0">
          <PhotoCarousel photos={CAROUSEL_PHOTOS} />
        </div>
      </div>
    </section>
  );
}
