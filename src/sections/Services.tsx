"use client";

import { useEffect, useRef, useState } from "react";
import SectionWrapper from "@/components/SectionWrapper";
import Heading from "@/components/Heading";

const services = [
  {
    title: "Weddings",
    description: "Your day, told like a film.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    title: "Corporate",
    description: "Content that commands attention.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="m10 9 5 3-5 3V9Z" />
      </svg>
    ),
  },
  {
    title: "Walk-throughs",
    description: "Cinematic movement and precision.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    title: "Documentaries",
    description: "Real stories. No shortcuts.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <circle cx="12" cy="12" r="10" />
        <polygon points="10 8 16 12 10 16 10 8" />
      </svg>
    ),
  },
];

interface ServicePanelProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}

function ServicePanel({ title, description, icon, index }: ServicePanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`group relative flex flex-col items-center justify-center text-center
        border-r border-brand-charcoal last:border-r-0
        bg-gradient-to-b from-brand-charcoal/40 to-brand-black
        px-4 py-12 md:py-20
        transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      {/* Top gold line on hover */}
      <div className="absolute top-0 left-0 right-0 h-[2px] w-0 bg-brand-gold transition-all duration-500 group-hover:w-full mx-auto" />

      {/* Icon */}
      <div className="text-brand-gold mb-5 transition-transform duration-500 group-hover:scale-110">
        {icon}
      </div>

      {/* Title */}
      <h3 className="font-heading text-lg md:text-xl uppercase tracking-editorial text-brand-off-white mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-xs md:text-sm text-brand-gray font-body leading-relaxed max-w-[160px]">
        {description}
      </p>

      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-b from-brand-gold/5 to-transparent" />
    </div>
  );
}

export default function Services() {
  return (
    <SectionWrapper id="services">
      <div className="text-center mb-16">
        <Heading as="h2" gold>
          What We Do
        </Heading>
        <div className="mt-4 h-px w-16 bg-brand-gold mx-auto" />
      </div>

      {/* Comic strip panel layout — 4 tall rectangles in a row */}
      <div className="border border-brand-charcoal">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {services.map((service, i) => (
            <ServicePanel key={service.title} index={i} {...service} />
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
