"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SectionWrapper from "@/components/SectionWrapper";
import Heading from "@/components/Heading";

const projects: {
  title: string;
  type: string;
  description: string;
  youtubeId: string;
  href?: string;
  // uploadDate: the video's real publish date (YYYY-MM-DD). Required for VideoObject
  // schema. Update these to each clip's actual YouTube publish date.
  uploadDate: string;
}[] = [
  {
    title: "The Naked City Underground",
    type: "Music Video",
    description: "Outlaw country meets surf punk. Raw energy from Las Vegas' genre-bending band. \"Coming To Me\" & \"Everything's Alright.\"",
    youtubeId: "x1yqQXmHCdY",
    href: "/blog/naked-city-underground-music-video",
    uploadDate: "2023-06-26",
  },
  {
    title: "Doritos, Spec Commercial",
    type: "Commercial / Spec",
    description: "Spec commercial for Doritos. Cinematic execution and full production process. The same playbook we bring to paid national campaigns.",
    youtubeId: "zFlXJVtnv-U",
    uploadDate: "2026-04-02", // TODO: set to the real YouTube publish date
  },
];

const videoJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: projects.map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "VideoObject",
      name: `${p.title}, Echo Chamber Media`,
      description: p.description,
      thumbnailUrl: `https://i.ytimg.com/vi/${p.youtubeId}/maxresdefault.jpg`,
      uploadDate: p.uploadDate,
      contentUrl: `https://www.youtube.com/watch?v=${p.youtubeId}`,
      embedUrl: `https://www.youtube.com/embed/${p.youtubeId}`,
      publisher: {
        "@type": "Organization",
        name: "Echo Chamber Media",
        url: "https://echochambermedia.com",
      },
    },
  })),
};

function Showreel() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="max-w-4xl mx-auto mb-20">
      <div className="text-center mb-8">
        <p className="text-sm uppercase tracking-editorial text-brand-gold font-body mb-4">
          Showreel
        </p>
        <p className="text-brand-gray font-body leading-relaxed max-w-xl mx-auto">
          A quick look at what we bring to a project, from concept to final cut.
        </p>
      </div>

      <div className="relative w-full aspect-video border border-brand-gold/20 bg-brand-charcoal overflow-hidden">
        {playing ? (
          <video
            src="/video/trailer.mp4"
            poster="/images/reel-poster.jpg"
            controls
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            aria-label="Play Echo Chamber Media showreel"
            className="group absolute inset-0 w-full h-full"
          >
            {/* Poster */}
            <span
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/images/reel-poster.jpg')" }}
            />
            {/* Dim overlay */}
            <span className="absolute inset-0 bg-black/50 transition-colors duration-300 group-hover:bg-black/40" />
            {/* Play button */}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex items-center justify-center w-20 h-20 rounded-full border border-brand-gold/60 bg-brand-black/50 backdrop-blur-sm text-brand-gold transition-all duration-300 group-hover:bg-brand-gold/20 group-hover:scale-105">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function ProjectCard({
  title,
  type,
  description,
  youtubeId,
  href,
  index,
}: {
  title: string;
  type: string;
  description: string;
  youtubeId: string;
  href?: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 200}ms` }}
    >
      {/* Video Embed */}
      <div className="relative w-full aspect-video mb-6 border border-brand-gold/20 bg-brand-charcoal">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title={`${title}, Echo Chamber Media`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 w-full h-full"
        />
      </div>

      {/* Info */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs uppercase tracking-editorial text-brand-gold font-body">
          {type}
        </span>
      </div>
      <h3 className="font-heading text-xl uppercase tracking-editorial text-brand-off-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-brand-gray font-body leading-relaxed mb-4">
        {description}
      </p>
      {href && (
        <Link
          href={href}
          className="text-xs uppercase tracking-editorial text-brand-gold font-body hover:text-brand-off-white transition-colors duration-300"
        >
          Read the Case Study →
        </Link>
      )}
    </div>
  );
}

export default function Portfolio() {
  return (
    <SectionWrapper id="portfolio" dark={false}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
      />
      <div className="text-center mb-16">
        <p className="text-sm uppercase tracking-editorial text-brand-gold font-body mb-4">
          Our Work
        </p>
        <Heading as="h2">Portfolio</Heading>
        <div className="mt-4 h-px w-16 bg-brand-gold mx-auto" />
      </div>

      <Showreel />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {projects.map((project, i) => (
          <ProjectCard key={project.title} index={i} {...project} />
        ))}
      </div>
    </SectionWrapper>
  );
}
