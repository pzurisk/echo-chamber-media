"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/* ── Review Data ── */
const reviews = [
  {
    text: "I'm a tattoo artist on the Strip and needed quality video and photos to promote myself. Echo Chamber Media far exceeded my expectations! They were extremely professional to work with and their quality of work was exceptional. I've gotten more notice on my website and social media platforms. I highly recommend them!",
    name: "Melissa Phillips",
    role: "Tattoo Artist, Las Vegas",
    initials: "MP",
    photo: "",
  },
  {
    text: "Billy and the Echo Chamber team filmed our wedding and we couldn't be happier. Every moment was captured perfectly — the ceremony, the reception, even the little candid moments we didn't know were being filmed. The final edit had us in tears. Worth every penny.",
    name: "Jessica & Ryan M.",
    role: "Wedding Client",
    initials: "JR",
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
  },  {
    text: "We hired Echo Chamber Media to produce a commercial for our restaurant opening on Fremont Street. The turnaround was fast, the production quality was insane, and it actually looked like something you'd see on TV. Already planning our next project with them.",
    name: "David Torres",
    role: "Restaurant Owner, Las Vegas",
    initials: "DT",
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    text: "Needed a professional walkthrough video for a luxury listing in Summerlin. Echo Chamber Media made the property look like something out of Architectural Digest. My client loved it and it helped the home sell within the first week. These guys know what they're doing.",
    name: "Sarah Kim",
    role: "Real Estate Agent, Henderson",
    initials: "SK",
    photo: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    text: "Echo Chamber filmed a music video for my latest single and the result was absolutely cinematic. Billy has a real eye for storytelling — he understood the vision from the first conversation and brought it to life in ways I didn't even imagine. Can't wait to work together again.",
    name: "Marcus James",
    role: "Recording Artist",
    initials: "MJ",
    photo: "https://randomuser.me/api/portraits/men/75.jpg",
  },
];

/* ── Momentum physics constants ── */
const FRICTION = 0.95; // deceleration per frame (lower = stops faster)
const MIN_VELOCITY = 0.5; // stop animating below this speed
/* ── Star SVG ── */
function Star() {
  return (
    <svg className="w-4 h-4 fill-brand-gold" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/* ── Google Icon ── */
function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
/* ── Avatar with error fallback ── */
function Avatar({ photo, name, initials }: { photo: string; name: string; initials: string }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!photo || imgFailed) {
    return (
      <div className="w-11 h-11 rounded-full bg-brand-gold/15 flex items-center justify-center font-heading text-sm text-brand-gold flex-shrink-0">
        {initials}
      </div>
    );
  }

  return (
    <img
      src={photo}
      alt={name}
      className="w-11 h-11 rounded-full object-cover flex-shrink-0 border-2 border-brand-gold/30"
      onError={() => setImgFailed(true)}
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  );
}

/* ── Review Card ── */
function ReviewCard({ text, name, role, initials, photo }: (typeof reviews)[0]) {
  return (
    <div className="flex-shrink-0 w-[340px] md:w-[380px] bg-brand-charcoal border border-brand-charcoal hover:border-brand-gold rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 relative group select-none">
      {/* Big quote */}
      <span className="absolute top-2 left-5 font-heading text-7xl text-brand-gold/10 leading-none pointer-events-none select-none">
        &ldquo;
      </span>

      {/* Stars */}
      <div className="flex gap-0.5 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} />
        ))}
      </div>

      {/* Review text */}
      <p className="text-brand-off-white/90 font-body text-sm md:text-[0.95rem] leading-relaxed mb-6 relative z-10">
        {text}
      </p>

      {/* Reviewer */}
      <div className="flex items-center gap-3 border-t border-brand-black/50 pt-5">
        <Avatar photo={photo} name={name} initials={initials} />
        <div className="flex-1">
          <div className="font-body font-semibold text-sm text-brand-off-white">{name}</div>
          <div className="font-body text-xs text-brand-gray mt-0.5">{role}</div>
        </div>
        <GoogleIcon />
      </div>
    </div>
  );
}
/* ── Main Reviews Section ── */
export default function Reviews() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<number | null>(null);
  const momentumRef = useRef<number | null>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isPaused, setIsPaused] = useState(false);

  /* Velocity tracking for momentum */
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);

  const SPEED = 1; // pixels per frame for auto-scroll

  /* ── Seamless loop wrap helper ── */
  const wrapScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const halfScroll = el.scrollWidth / 2;
    if (el.scrollLeft >= halfScroll) {
      el.scrollLeft -= halfScroll;
    } else if (el.scrollLeft < 0) {
      el.scrollLeft += halfScroll;
    }
  }, []);

  /* ── Auto-scroll loop ── */
  const startAutoScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const step = () => {
      if (!containerRef.current) return;
      const el = containerRef.current;
      el.scrollLeft += SPEED;
      const halfScroll = el.scrollWidth / 2;
      if (el.scrollLeft >= halfScroll) {
        el.scrollLeft -= halfScroll;
      }
      autoScrollRef.current = requestAnimationFrame(step);
    };
    autoScrollRef.current = requestAnimationFrame(step);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }, []);

  const stopMomentum = useCallback(() => {
    if (momentumRef.current) {
      cancelAnimationFrame(momentumRef.current);
      momentumRef.current = null;
    }
    velocity.current = 0;
  }, []);

  /* ── Momentum coast animation ── */
  const startMomentum = useCallback(() => {
    if (momentumRef.current) cancelAnimationFrame(momentumRef.current);
    const coast = () => {
      const el = containerRef.current;
      if (!el) return;
      velocity.current *= FRICTION;
      if (Math.abs(velocity.current) < MIN_VELOCITY) {
        velocity.current = 0;
        momentumRef.current = null;
        // Resume auto-scroll after momentum dies
        if (resumeTimer.current) clearTimeout(resumeTimer.current);
        resumeTimer.current = setTimeout(() => {
          setIsPaused(false);
          startAutoScroll();
        }, 2000);
        return;
      }
      el.scrollLeft += velocity.current;
      wrapScroll();
      momentumRef.current = requestAnimationFrame(coast);
    };
    momentumRef.current = requestAnimationFrame(coast);
  }, [startAutoScroll, wrapScroll]);

  /* Resume auto-scroll after inactivity */
  const scheduleResume = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      setIsPaused(false);
      startAutoScroll();
    }, 3000);
  }, [startAutoScroll]);

  /* ── Duplicate cards for seamless loop + start auto-scroll ── */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const children = Array.from(track.children);
    children.forEach((child) => {
      const clone = child.cloneNode(true) as HTMLElement;
      track.appendChild(clone);
    });
    startAutoScroll();
    return () => {
      stopAutoScroll();
      stopMomentum();
    };
  }, [startAutoScroll, stopAutoScroll, stopMomentum]);

  /* ── Touch swipe handlers (mobile) — with velocity tracking ── */
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    stopAutoScroll();
    stopMomentum();
    setIsPaused(true);
    const touch = e.touches[0];
    startX.current = touch.clientX;
    scrollStart.current = containerRef.current?.scrollLeft ?? 0;
    lastX.current = touch.clientX;
    lastTime.current = Date.now();
    velocity.current = 0;
  }, [stopAutoScroll, stopMomentum]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const touch = e.touches[0];
    const now = Date.now();
    const dt = now - lastTime.current;

    // Track velocity (pixels per frame at ~16ms)
    if (dt > 0) {
      const dx = lastX.current - touch.clientX;
      velocity.current = (dx / dt) * 16; // normalize to ~60fps
    }
    lastX.current = touch.clientX;
    lastTime.current = now;

    const diff = startX.current - touch.clientX;
    containerRef.current.scrollLeft = scrollStart.current + diff;
    wrapScroll();
  }, [wrapScroll]);

  const onTouchEnd = useCallback(() => {
    // Kick off momentum coast if there's velocity
    if (Math.abs(velocity.current) > MIN_VELOCITY) {
      startMomentum();
    } else {
      scheduleResume();
    }
  }, [scheduleResume, startMomentum]);

  /* ── Mouse drag handlers (desktop) — with velocity tracking ── */
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    stopAutoScroll();
    stopMomentum();
    setIsPaused(true);
    startX.current = e.clientX;
    scrollStart.current = containerRef.current?.scrollLeft ?? 0;
    lastX.current = e.clientX;
    lastTime.current = Date.now();
    velocity.current = 0;
    if (containerRef.current) containerRef.current.style.cursor = "grabbing";
  }, [stopAutoScroll, stopMomentum]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    e.preventDefault();
    const now = Date.now();
    const dt = now - lastTime.current;

    if (dt > 0) {
      const dx = lastX.current - e.clientX;
      velocity.current = (dx / dt) * 16;
    }
    lastX.current = e.clientX;
    lastTime.current = now;

    const diff = startX.current - e.clientX;
    containerRef.current.scrollLeft = scrollStart.current + diff;
    wrapScroll();
  }, [wrapScroll]);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    if (containerRef.current) containerRef.current.style.cursor = "grab";
    if (Math.abs(velocity.current) > MIN_VELOCITY) {
      startMomentum();
    } else {
      scheduleResume();
    }
  }, [scheduleResume, startMomentum]);

  const onMouseLeave = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      if (containerRef.current) containerRef.current.style.cursor = "grab";
      if (Math.abs(velocity.current) > MIN_VELOCITY) {
        startMomentum();
      } else {
        scheduleResume();
      }
    }
  }, [scheduleResume, startMomentum]);

  /* ── Hover pause (desktop, non-drag) ── */
  const onMouseEnter = useCallback(() => {
    if (!isDragging.current) {
      stopAutoScroll();
      stopMomentum();
      setIsPaused(true);
    }
  }, [stopAutoScroll, stopMomentum]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _onContainerMouseLeave = useCallback(() => {
    if (!isDragging.current) {
      setIsPaused(false);
      startAutoScroll();
    }
  }, [startAutoScroll]);
  return (
    <section className="relative w-full py-20 md:py-28 bg-brand-black overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-gold/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-4 relative z-10">
        <span className="font-body text-xs font-semibold tracking-[0.25em] uppercase text-brand-gold block mb-3">
          Client Testimonials
        </span>
        <h2 className="font-heading text-3xl md:text-5xl uppercase tracking-editorial text-brand-off-white">
          What They&apos;re Saying
        </h2>

        {/* Rating */}
        <div className="flex items-center justify-center gap-3 mt-5">
          <span className="font-heading text-4xl text-brand-gold">5.0</span>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} />
            ))}
          </div>
          <span className="text-sm text-brand-gray font-body">on Google</span>
        </div>

        <div className="w-16 h-0.5 bg-brand-gold mx-auto mt-6 rounded-full" />
      </div>
      {/* Scrolling track with swipe/drag */}
      <div className="relative mt-12">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 md:w-28 bg-gradient-to-r from-brand-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 md:w-28 bg-gradient-to-l from-brand-black to-transparent z-10 pointer-events-none" />

        <div
          ref={containerRef}
          className="overflow-hidden cursor-grab"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onMouseEnter={onMouseEnter}
        >
          <div
            ref={trackRef}
            className="flex gap-6"
            style={{ width: "max-content" }}
          >
            {reviews.map((review) => (
              <ReviewCard key={review.name} {...review} />
            ))}
          </div>
        </div>
      </div>
      {/* CTA */}
      <div className="text-center mt-12 relative z-10">
        <a
          href="https://g.page/r/CeKYhZnRAYC1EBM/review"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-body text-sm font-semibold uppercase tracking-editorial text-brand-gold border border-brand-gold rounded-md px-7 py-3 transition-all duration-300 hover:bg-brand-gold hover:text-brand-black"
        >
          Leave a Review
          <svg className="w-4 h-4 fill-current transition-transform group-hover:translate-x-1" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </section>
  );
}