"use client";

import { useRef, useState } from "react";
import Logo from "@/components/Logo";
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
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      {/* SEO H1 — hidden visually, present for crawlers and screen readers */}
      <h1 className="sr-only">
        Echo Chamber Media — Las Vegas Video Production Company
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
      <div className="absolute inset-0 bg-black/50" />

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
      <div className="relative z-10 text-center px-6">
        <Logo size="lg" className="mx-auto" />

        <div className="mt-8 h-px w-24 bg-brand-gold mx-auto" />

        <p className="mt-6 text-lg md:text-xl text-brand-off-white/90 font-body font-light tracking-wide max-w-xl mx-auto">
          Las Vegas Video Production. Film-set gear and process on every shoot.
        </p>
      </div>

      {/* ── Scroll Indicator ── */}
      <ScrollIndicator />
    </section>
  );
}
