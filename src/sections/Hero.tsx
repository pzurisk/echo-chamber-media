"use client";

import { useEffect, useRef, useState } from "react";
import ScrollIndicator from "@/components/ScrollIndicator";

// Scroll-driven day to night timelapse.
// Desktop with motion allowed: the video is scrubbed by scroll position.
// Phones and reduced-motion: day still crossfades to night still on scroll.
// The day still is the first paint on every device, so the hero never waits on the video.

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useVideo, setUseVideo] = useState(false);
  const [progress, setProgress] = useState(0);

  // Decide once on the client whether this device gets the scrubbed video.
  useEffect(() => {
    const mq = window.matchMedia(
      "(min-width: 768px) and (prefers-reduced-motion: no-preference)"
    );
    setUseVideo(mq.matches);
    const onChange = () => setUseVideo(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Track scroll progress through the hero, eased so the scrub feels smooth.
  useEffect(() => {
    let raf = 0;
    let target = 0;
    let current = 0;

    const readTarget = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      target = scrollable > 0 ? clamp(-rect.top / scrollable) : 0;
    };

    const tick = () => {
      current += (target - current) * 0.14;
      if (Math.abs(target - current) < 0.0005) current = target;
      setProgress((prev) => (Math.abs(prev - current) > 0.0005 ? current : prev));

      const video = videoRef.current;
      if (video && video.duration && Number.isFinite(video.duration)) {
        const t = current * video.duration;
        if (Math.abs(video.currentTime - t) > 0.02) video.currentTime = t;
      }
      raf = requestAnimationFrame(tick);
    };

    readTarget();
    window.addEventListener("scroll", readTarget, { passive: true });
    window.addEventListener("resize", readTarget);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("scroll", readTarget);
      window.removeEventListener("resize", readTarget);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[190vh] md:h-[260vh]"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* ── Day still: first paint on every device ── */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-day.jpg"
          srcSet="/images/hero-day-mobile.jpg 1080w, /images/hero-day.jpg 1920w"
          sizes="100vw"
          alt=""
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* ── Night still: crossfades in on phones and reduced-motion ── */}
        {!useVideo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/images/hero-night.jpg"
            srcSet="/images/hero-night-mobile.jpg 1080w, /images/hero-night.jpg 1920w"
            sizes="100vw"
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: progress }}
          />
        )}

        {/* ── Scrubbed timelapse: desktop only, loads after first paint ── */}
        {useVideo && (
          <video
            ref={videoRef}
            muted
            playsInline
            preload="auto"
            poster="/images/hero-day.jpg"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/video/hero-timelapse.mp4" type="video/mp4" />
          </video>
        )}

        {/* ── Legibility overlays: left shade for text, deepens toward night ── */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent"
          style={{ opacity: 0.75 + progress * 0.25 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black/70 via-transparent to-transparent" />

        {/* ── Content ── */}
        <div className="relative z-10 flex h-full items-center">
          <div className="w-full px-6 md:px-16 lg:px-24 text-center md:text-left max-w-3xl">
            <p className="font-body text-[11px] md:text-xs font-semibold tracking-[0.3em] uppercase text-brand-gold mb-6">
              Las Vegas Video Production
            </p>

            <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl uppercase tracking-editorial text-brand-off-white leading-[1.05] [text-shadow:0_2px_24px_rgba(0,0,0,0.45)]">
              Wedding films.
              <br />
              <span className="text-brand-gold">Music videos.</span>
              <span className="sr-only">
                {" "}
                by Echo Chamber Media, a Las Vegas video production company
              </span>
            </h1>

            <div className="mt-8 h-px w-24 bg-brand-gold mx-auto md:mx-0" />

            <p className="mt-6 text-base md:text-lg text-brand-off-white/90 font-body font-light tracking-wide max-w-xl mx-auto md:mx-0 leading-relaxed [text-shadow:0_1px_12px_rgba(0,0,0,0.5)]">
              Shot on cinema cameras and edited like a feature. One filmmaker from first call to final cut.
            </p>

            {/* Two paths, equal weight */}
            <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center md:justify-start gap-4">
              <a
                href="/services/wedding-videography"
                className="px-8 py-4 bg-brand-gold text-brand-black font-body font-semibold text-sm uppercase tracking-[0.15em] text-center hover:bg-brand-gold-hover transition-all duration-300 hover:-translate-y-0.5"
              >
                Wedding &amp; Elopement Films
              </a>
              <a
                href="/services/music-videos"
                className="px-8 py-4 border border-brand-gold text-brand-off-white bg-black/25 backdrop-blur-sm font-body font-semibold text-sm uppercase tracking-[0.15em] text-center hover:bg-brand-gold hover:text-brand-black transition-all duration-300 hover:-translate-y-0.5"
              >
                Music Videos
              </a>
            </div>

            <p className="mt-7 text-sm text-brand-off-white/70 font-body">
              Prefer to talk? Call our 24/7 booking line:{" "}
              <a
                href="tel:+19893081633"
                className="text-brand-gold font-semibold border-b border-transparent hover:border-brand-gold transition-colors"
              >
                (989) 308-1633
              </a>
            </p>
          </div>
        </div>

        <ScrollIndicator />
      </div>
    </section>
  );
}
