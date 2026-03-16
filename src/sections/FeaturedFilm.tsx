"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import SectionWrapper from "@/components/SectionWrapper";
import Heading from "@/components/Heading";

/* ── Credits ── */
const credits = [
  { role: "Directed by", name: "Pete Miceli" },
  { role: "Written by", name: "Billy Zurisk & Pete Miceli" },
  { role: "Produced by", name: "Billy Zurisk" },
  { role: "Cinematography", name: "Billy Zurisk" },
  { role: "Starring", name: "Mark Vanis & Milla Dawn" },
  { role: "Original Score", name: "Tim Legvold" },
  { role: "Special Effects", name: "Billy Zurisk" },
];
/* ── Laurels ── */
const laurels = [
  { festival: "Las Vegas Indie Film Festival 2026", type: "Official Selection" },
  { festival: "The Dunwich Horror Fest", type: "Award Winner" },
];

export default function FeaturedFilm() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <SectionWrapper id="featured-film" dark={false}>
      <div ref={sectionRef}>
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-editorial text-brand-gold font-body mb-4">
            Featured Film
          </p>
          <Heading as="h2">
            The Classified Mind
          </Heading>
          <div className="mt-4 h-px w-16 bg-brand-gold mx-auto" />
        </div>

        {/* Poster + Details grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Poster */}
          <div
            className={`relative aspect-[2/3] overflow-hidden transition-all duration-1000 ${
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >            <Image
              src="/images/the classified mind.png"
              alt="The Classified Mind Official Movie Poster"
              fill
              className="object-cover object-top"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            {/* Subtle gold border glow */}
            <div className="absolute inset-0 ring-1 ring-brand-gold/20 pointer-events-none" />
          </div>

          {/* Details column */}
          <div
            className={`flex flex-col justify-center transition-all duration-1000 delay-300 ${
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Synopsis */}
            <p className="text-brand-off-white font-body text-lg leading-relaxed mb-2">
              An Echo Chamber Media Production
            </p>
            <p className="text-brand-gray font-body leading-relaxed mb-4">
              Gideon lives in his mother&apos;s basement, alone with his
              theories. The boards are covered. The patterns are there. He
              knows something is watching. He can feel it. But the closer
              he gets to the truth, the less certain he becomes of what the
              truth actually is.
            </p>
            <p className="text-brand-gray font-body leading-relaxed italic mb-4">
              He might be wrong about everything. Then again, he might not be.
            </p>
            <p className="text-brand-gray/60 font-body text-sm leading-relaxed mb-8">
              Shot on DJI Ronin 4D. Color graded in DaVinci Resolve.
            </p>
            {/* Laurels */}
            <div className="flex flex-wrap gap-6 mb-10">
              {laurels.map((l) => (
                <div
                  key={l.festival}
                  className="flex items-center gap-3 bg-brand-black/60 px-4 py-3 border border-brand-gold/20"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-brand-gold flex-shrink-0"
                  >
                    <path
                      d="M12 2L9 7L3 8.5L7 13L6 19L12 16L18 19L17 13L21 8.5L15 7L12 2Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div>
                    <span className="block text-xs uppercase tracking-editorial text-brand-gold font-body">
                      {l.type}
                    </span>
                    <span className="text-sm text-brand-off-white font-body">
                      {l.festival}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {/* Credits */}
            <div className="border-t border-brand-charcoal pt-8">
              <h3 className="text-sm uppercase tracking-editorial text-brand-gold font-body mb-6">
                Credits
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {credits.map((c) => (
                  <div key={c.role}>
                    <span className="text-xs uppercase tracking-editorial text-brand-gray font-body">
                      {c.role}
                    </span>
                    <p className="text-brand-off-white font-body text-sm mt-0.5">
                      {c.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}