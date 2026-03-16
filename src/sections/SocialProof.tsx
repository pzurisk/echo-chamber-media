"use client";

import { useEffect, useRef, useState } from "react";

const awards = [
  "Official Selection — Las Vegas Indie Film Festival 2026",
  "Winner — The Dunwich Horror Fest",
];

const stats = [
  { label: "Projects Delivered", target: 50, suffix: "+" },
  { label: "Years in Las Vegas", target: 5, suffix: "" },
  { label: "Award-Winning Films", target: 3, suffix: "" },
];

function useCountUp(target: number, inView: boolean, duration = 1600) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setCount(current);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [inView, target, duration]);

  return count;
}

function StatItem({ label, target, suffix, inView }: (typeof stats)[0] & { inView: boolean }) {
  const count = useCountUp(target, inView);
  return (
    <div className="text-center">
      <span className="font-heading text-4xl md:text-5xl text-brand-gold">{count}{suffix}</span>
      <p className="mt-2 text-sm uppercase tracking-editorial text-brand-gray font-body">{label}</p>
    </div>
  );
}

export default function SocialProof() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative w-full py-20 md:py-28 bg-brand-black border-t border-b border-brand-charcoal">
      <div className="mx-auto max-w-4xl px-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mb-16">
          {awards.map((award) => (
            <div key={award} className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-brand-gold flex-shrink-0">
                <path d="M12 2L9 7L3 8.5L7 13L6 19L12 16L18 19L17 13L21 8.5L15 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              <span className="text-sm md:text-base text-brand-off-white font-body tracking-wide">{award}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {stats.map((stat) => (<StatItem key={stat.label} {...stat} inView={inView} />))}
        </div>
      </div>
    </section>
  );
}
