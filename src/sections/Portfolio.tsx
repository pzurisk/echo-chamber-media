"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SectionWrapper from "@/components/SectionWrapper";
import Heading from "@/components/Heading";

const projects = [
  {
    title: "The Naked City Underground",
    type: "Music Video",
    description: "Outlaw country meets surf punk. Raw energy from Las Vegas' genre-bending band. \"Coming To Me\" & \"Everything's Alright.\"",
    youtubeId: "x1yqQXmHCdY",
    href: "/blog/naked-city-underground-music-video",
  },
];

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
  href: string;
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
          title={`${title} — Echo Chamber Media`}
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
      <Link
        href={href}
        className="text-xs uppercase tracking-editorial text-brand-gold font-body hover:text-brand-off-white transition-colors duration-300"
      >
        Read the Case Study →
      </Link>
    </div>
  );
}

export default function Portfolio() {
  return (
    <SectionWrapper id="portfolio" dark={false}>
      <div className="text-center mb-16">
        <p className="text-sm uppercase tracking-editorial text-brand-gold font-body mb-4">
          Our Work
        </p>
        <Heading as="h2">Portfolio</Heading>
        <div className="mt-4 h-px w-16 bg-brand-gold mx-auto" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {projects.map((project, i) => (
          <ProjectCard key={project.title} index={i} {...project} />
        ))}
      </div>
    </SectionWrapper>
  );
}
