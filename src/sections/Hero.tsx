"use client";

import { useRef, useState } from "react";
import ScrollIndicator from "@/components/ScrollIndicator";

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      {/* SEO H1, hidden visually, present for crawlers and screen readers */}
      <h1 className="sr-only">
        Echo Chamber Media, Las Vegas Video Production Company
      </h1>

      {/* ── Background Video (autoplays muted; user can unmute) ── */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        poster="/images/hero-still.jpg"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/video/hero-reel.mp4" type="video/mp4" />
      </video>

      {/* ── Dim Overlay ── */}
      <div className="absolute inset-0 bg-black/55" />

      {/* ── Vignette ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-transparent opacity-80" />

      {/* ── Mute / Unmute Toggle ── */}
      <button
        onClick={toggleMute}
        aria-label={isMuted ? "Unmute video" : "Mute video"}
        className="absolute bottom-8 right-8 z-20 flex items-center justify-center w-12 h-12 rounded-full border border-brand-gold/40 bg-brand-black/60 backdrop-blur-sm text-brand-gold hover:bg-brand-gold/20 transition-all duration-300"
      >
        {isMuted ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>

      {/* ── Content ── */}
      <div className="relative z-10 text-center px-6 py-24 max-w-4xl">
        {/* Eyebrow */}
        <p className="font-body text-[11px] md:text-xs font-semibold tracking-[0.3em] uppercase text-brand-gold mb-6">
          Las Vegas Video Production
        </p>

        {/* Aria-hidden visual headline (real H1 is in sr-only above for SEO) */}
        <p
          aria-hidden="true"
          className="font-heading text-4xl sm:text-5xl md:text-7xl uppercase tracking-editorial text-brand-off-white leading-[1.05]"
        >
          Film-Quality Video.
          <br />
          <span className="text-brand-gold">For Every Project.</span>
        </p>

        {/* Gold divider */}
        <div className="mt-8 h-px w-24 bg-brand-gold mx-auto" />

        {/* Sub-headline */}
        <p className="mt-6 text-base md:text-lg text-brand-off-white/85 font-body font-light tracking-wide max-w-2xl mx-auto leading-relaxed">
          Weddings, commercials, music videos, walk-throughs, and documentaries, shot with cinema cameras, lit like a film set, edited like a feature.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#contact"
            className="w-full sm:w-auto px-8 py-4 bg-brand-gold text-brand-black font-body font-semibold text-sm uppercase tracking-[0.15em] hover:bg-brand-gold-hover transition-all duration-300 hover:-translate-y-0.5"
          >
            Get a Free Quote
          </a>
          <a
            href="#portfolio"
            className="w-full sm:w-auto px-8 py-4 border border-brand-off-white/30 text-brand-off-white font-body font-semibold text-sm uppercase tracking-[0.15em] hover:border-brand-gold hover:text-brand-gold transition-all duration-300"
          >
            See Our Work
          </a>
        </div>

        {/* Phone call line */}
        <p className="mt-7 text-sm text-brand-gray font-body">
          Or call our 24/7 AI booking line:{" "}
          <a
            href="tel:+19893081633"
            className="text-brand-gold font-semibold border-b border-transparent hover:border-brand-gold transition-colors"
          >
            (989) 308-1633
          </a>
        </p>
      </div>

      {/* ── Scroll Indicator ── */}
      <ScrollIndicator />
    </section>
  );
}
