"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const navLinks = [
  { label: "Weddings & Elopements", href: "/elopements" },
  { label: "Music Videos", href: "/music-videos" },
  { label: "Work", href: "/#work" },
  { label: "About", href: "/#about" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 bg-ivory/95 backdrop-blur-sm transition-shadow duration-300 ${
        scrolled ? "shadow-[0_1px_0_rgba(140,106,36,0.25)]" : ""
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 md:h-24 md:px-16">
        <Link href="/" className="flex flex-col gap-0.5 text-ink" onClick={() => setMenuOpen(false)}>
          <span className="font-display text-[22px] font-medium tracking-[0.02em] md:text-[26px]">
            Echo Chamber Media
          </span>
          <span className="font-sans text-[9px] uppercase tracking-[0.3em] text-gilt md:text-[11px] md:tracking-[0.32em]">
            Las Vegas Film Co.
          </span>
        </Link>

        <div className="hidden items-center gap-10 font-sans text-[15px] lg:flex">
          {navLinks.map((l) => (
            <Link key={l.label} href={l.href} className="text-ink transition-colors hover:text-gilt">
              {l.label}
            </Link>
          ))}
          <Link
            href="/elopements#date"
            className="flex h-12 items-center rounded-full bg-ink px-6 font-semibold text-ivory transition-colors hover:bg-gilt-hover"
          >
            Check your date
          </Link>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/35 lg:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-ink" aria-hidden="true">
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
          </svg>
        </button>
      </div>

      <div className={`overflow-hidden bg-ivory transition-all duration-500 lg:hidden ${menuOpen ? "max-h-[420px] border-t border-gilt-accent/30" : "max-h-0"}`}>
        <div className="flex flex-col gap-1 px-4 pb-6 pt-3 font-sans">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="py-3 text-lg text-ink"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/elopements#date"
            onClick={() => setMenuOpen(false)}
            className="mt-3 flex h-[54px] items-center justify-center rounded-full bg-ink font-semibold text-ivory"
          >
            Check your date
          </Link>
        </div>
      </div>
    </nav>
  );
}
