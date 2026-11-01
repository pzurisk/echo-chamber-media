"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { photoSrc, type Photo } from "@/lib/portfolio";

// Large photo carousel. Glides to the next photo every few seconds, pauses the moment
// a visitor touches, hovers or focuses it, and never auto-advances for people who
// prefer reduced motion. Arrows and swipe always work.
export default function PhotoCarousel({ photos }: { photos: Photo[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  const goTo = useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    const n = photos.length;
    const next = ((i % n) + n) % n;
    const child = el.children[next] as HTMLElement | undefined;
    if (child) el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: "smooth" });
  }, [photos.length]);

  // Keep the counter in step with manual scrolling.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => {
      let best = 0;
      let bestDist = Infinity;
      Array.from(el.children).forEach((c, i) => {
        const d = Math.abs((c as HTMLElement).offsetLeft - el.offsetLeft - el.scrollLeft);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      setIndex(best);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Gentle auto-advance.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (!paused.current) goTo(index + 1);
    }, 4800);
    return () => window.clearInterval(id);
  }, [index, goTo]);

  const pause = () => { paused.current = true; };
  const resume = () => { paused.current = false; };

  return (
    <div onMouseEnter={pause} onMouseLeave={resume} onFocus={pause} onBlur={resume} onTouchStart={pause}>
      <ul
        ref={track}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-5 [&::-webkit-scrollbar]:hidden"
        aria-label="Photo carousel"
      >
        {photos.map((p, i) => (
          <li key={p.file} className="shrink-0 snap-start">
            <Image
              src={photoSrc(p)}
              alt={p.alt}
              width={p.w}
              height={p.h}
              sizes="(min-width: 768px) 700px, 85vw"
              priority={i < 2}
              className="h-[340px] w-auto max-w-none object-cover md:h-[480px]"
            />
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-center gap-6">
        <div className="relative h-px flex-1 bg-ink/20" aria-hidden="true">
          <div
            className="absolute -top-px h-[3px] bg-ink transition-all duration-500"
            style={{ width: `${100 / photos.length}%`, left: `${(index * 100) / photos.length}%` }}
          />
        </div>
        <p className="font-display text-xl tracking-widest text-ink" aria-live="polite">
          {String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={() => goTo(index - 1)} aria-label="Previous photo" className="flex h-11 w-11 items-center justify-center border border-ink text-lg text-ink transition-colors hover:bg-ink hover:text-ivory">←</button>
          <button type="button" onClick={() => goTo(index + 1)} aria-label="Next photo" className="flex h-11 w-11 items-center justify-center border border-ink text-lg text-ink transition-colors hover:bg-ink hover:text-ivory">→</button>
        </div>
      </div>
    </div>
  );
}
