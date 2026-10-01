"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import Image from "next/image";

// Poster image with a play button. With a youtubeId the film plays in place when clicked
// (the iframe is only loaded on click). Without one it opens the film on YouTube.
// YouTube embeds work on this site (checked live 2026-09-30); the Error 153 problem was on
// the static sites, which send no referrer.
interface PlayCardProps {
  href: string;
  src: string;
  alt: string;
  label: string;
  tone?: "light" | "dark";
  size?: "lg" | "md" | "sm";
  caption?: string;
  className?: string;
  objectPosition?: string;
  youtubeId?: string;
  sizes?: string;
}

const circles = {
  lg: { circle: "h-[68px] w-[68px] md:h-[104px] md:w-[104px]", icon: "h-6 w-6 md:h-[34px] md:w-[34px]" },
  md: { circle: "h-16 w-16 md:h-20 md:w-20", icon: "h-[22px] w-[22px] md:h-7 md:w-7" },
  sm: { circle: "h-14 w-14", icon: "h-5 w-5" },
};

export default function PlayCard({
  href,
  src,
  alt,
  label,
  tone = "light",
  size = "lg",
  caption,
  className = "",
  objectPosition = "center",
  youtubeId,
  sizes = "(min-width: 1312px) 1312px, 100vw",
}: PlayCardProps) {
  const [playing, setPlaying] = useState(false);
  const s = circles[size];
  const circle = tone === "light" ? "bg-ivory" : "bg-night-gold";
  const icon = tone === "light" ? "fill-gilt" : "fill-night";
  const imgClass = "absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]";

  if (playing && youtubeId) {
    return (
      <div className={`relative overflow-hidden rounded-lg bg-black ${className}`}>
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title={alt}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onClick={
        youtubeId
          ? (e) => {
              e.preventDefault();
              setPlaying(true);
            }
          : undefined
      }
      className={`group relative block overflow-hidden rounded-lg ${className}`}
    >
      {src.startsWith("/") ? (
        <Image src={src} alt={alt} fill sizes={sizes} className={imgClass} style={{ objectPosition }} />
      ) : (
        <img src={src} alt={alt} loading="lazy" decoding="async" className={imgClass} style={{ objectPosition }} />
      )}
      <span
        className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ${circle} ${s.circle} transition-transform duration-300 group-hover:scale-105`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className={`${icon} ${s.icon}`}>
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      {caption && (
        <span
          className={`absolute bottom-4 left-4 md:bottom-6 md:left-7 flex h-9 items-center rounded-full px-4 font-sans text-[11px] md:text-[13px] uppercase tracking-[0.16em] ${
            tone === "light" ? "bg-ivory/90 text-ink" : "bg-night/70 text-night-text"
          }`}
        >
          {caption}
        </span>
      )}
    </a>
  );
}
