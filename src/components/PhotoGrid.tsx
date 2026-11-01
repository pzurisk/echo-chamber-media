"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { photoSrc, type Photo } from "@/lib/portfolio";

// Masonry gallery with a simple full screen viewer. Arrow keys and Escape work.
export default function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const step = useCallback(
    (d: number) => setOpen((i) => (i === null ? i : (i + d + photos.length) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      lastFocus.current?.focus();
    };
  }, [open, step]);

  const current = open === null ? null : photos[open];

  return (
    <>
      <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {photos.map((p, i) => (
          <li key={p.file} className="mb-4 break-inside-avoid">
            <button
              type="button"
              onClick={(e) => {
                lastFocus.current = e.currentTarget;
                setOpen(i);
              }}
              className="group relative block w-full overflow-hidden rounded-md bg-champagne"
              aria-label={`Open photo: ${p.alt}`}
            >
              <Image
                src={photoSrc(p)}
                alt={p.alt}
                width={p.w}
                height={p.h}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.04]"
              />
            </button>
          </li>
        ))}
      </ul>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.alt}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/92 p-4"
          onClick={() => setOpen(null)}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Close photo"
            className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full border border-ink/30 text-2xl text-ink hover:border-gilt hover:text-gilt"
          >
            ×
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); step(-1); }}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-ink/30 text-2xl text-ink hover:border-gilt hover:text-gilt"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); step(1); }}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-ink/30 text-2xl text-ink hover:border-gilt hover:text-gilt"
          >
            ›
          </button>
          <Image
            src={photoSrc(current)}
            alt={current.alt}
            width={current.w}
            height={current.h}
            sizes="100vw"
            priority
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] w-auto max-w-full rounded-md object-contain"
          />
        </div>
      )}
    </>
  );
}
