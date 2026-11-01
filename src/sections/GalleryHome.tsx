import PhotoGrid from "@/components/PhotoGrid";
import Button from "@/components/Button";
import { HOME_PHOTOS } from "@/lib/portfolio";

export default function GalleryHome() {
  return (
    <section id="work" className="scroll-mt-24 bg-champagne px-4 py-16 md:px-16 md:py-[104px]">
      <div className="mx-auto max-w-[1312px]">
        <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gilt">Recent work</p>
        <h2 className="font-display text-4xl text-ink md:text-6xl">Real couples. Real Vegas.</h2>
        <p className="mt-3 max-w-[560px] font-sans text-[17px] leading-[1.6] text-muted">
          Venetian arches, neon, red rock at golden hour. Every shoot is planned around the light.
        </p>
        <div className="mt-10">
          <PhotoGrid photos={HOME_PHOTOS} />
        </div>
        <div className="mt-10 flex justify-center">
          <Button variant="ink-outline" href="/photos">See all photos</Button>
        </div>
      </div>
    </section>
  );
}
