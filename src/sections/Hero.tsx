"use client";

import { useRef, useState } from "react";
import Logo from "@/components/Logo";
import ScrollIndicator from "@/components/ScrollIndicator";

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [entered, setEntered] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [fading, setFading] = useState(false);
  const handleEnter = () => {
    setFading(true);
    const video = videoRef.current;
    if (video) {
      video.muted = false;
      video.currentTime = 0;
      video.play();
    }
    setTimeout(() => {
      setEntered(true);
    }, 800);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };
  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      {/* ── Background Video (muted until enter) ── */}
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
      {/* ── Splash Overlay ── */}
      {!entered && (
        <div
          className={`absolute inset-0 z-30 flex flex-col items-center justify-center bg-brand-black transition-opacity duration-700 ${
            fading ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <p className="font-heading text-sm uppercase tracking-[0.3em] text-brand-gold mb-6">
            Echo Chamber Media Presents
          </p>
          <button
            onClick={handleEnter}
            className="group relative px-10 py-4 border border-brand-gold/60 text-brand-off-white font-body text-sm uppercase tracking-editorial hover:bg-brand-gold/10 transition-all duration-500"
          >
            <span className="relative z-10 flex items-center gap-3">
              {/* Play triangle */}
              <svg width="16" height="18" viewBox="0 0 16 18" fill="none" className="text-brand-gold">
                <path d="M1 1L15 9L1 17V1Z" fill="currentColor" />
              </svg>
              Enter
            </span>
          </button>
          <p className="mt-6 text-xs text-brand-gray/60 font-body">
            Best experienced with sound
          </p>
        </div>
      )}
      {/* ── Mute / Unmute Toggle ── */}
      {entered && (
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
      )}
      {/* ── Content ── */}
      <div className="relative z-10 text-center px-6">
        <Logo size="lg" className="mx-auto" />

        <div className="mt-8 h-px w-24 bg-brand-gold mx-auto" />

        <p className="mt-6 text-lg md:text-xl text-brand-off-white/90 font-body font-light tracking-wide max-w-xl mx-auto">
          Cinematic storytelling for the stories that matter.
        </p>
      </div>

      {/* ── Scroll Indicator ── */}
      <ScrollIndicator />
    </section>
  );
}