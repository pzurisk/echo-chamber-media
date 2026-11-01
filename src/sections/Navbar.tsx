"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const leftLinks = [
  { label: "Films", href: "/elopements" },
  { label: "Photography", href: "/photos" },
  { label: "Music Videos", href: "/music-videos" },
];
const rightLinks = [
  { label: "Journal", href: "/blog" },
  { label: "Inquire", href: "/#date" },
];
const allLinks = [...leftLinks, ...rightLinks];

// overlay: sits transparent over a full-bleed hero (the homepage) and fills in with
// ivory once the visitor scrolls. Everywhere else it is solid ivory from the start.
export default function Navbar({ overlay = false }: { overlay?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const clear = overlay && !scrolled && !menuOpen;
  const text = clear ? "text-ivory" : "text-ink";
  const link = "font-sans text-xs uppercase tracking-[0.22em] transition-colors hover:text-gilt";

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        clear ? "bg-transparent" : "bg-ivory/95 backdrop-blur-sm shadow-[0_1px_0_rgba(28,24,21,0.12)]"
      } ${text}`}
    >
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 md:h-24 md:px-16">
        <div className="hidden flex-1 items-center gap-9 lg:flex">
          {leftLinks.map((l) => (
            <Link key={l.label} href={l.href} className={link}>{l.label}</Link>
          ))}
        </div>

        <Link href="/" className="whitespace-nowrap font-display text-[22px] uppercase tracking-[0.28em] md:text-[28px]" onClick={() => setMenuOpen(false)}>
          Echo Chamber
        </Link>

        <div className="hidden flex-1 items-center justify-end gap-9 lg:flex">
          {rightLinks.map((l) => (
            <Link key={l.label} href={l.href} className={link}>{l.label}</Link>
          ))}
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-11 w-11 items-center justify-center lg:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
          </svg>
        </button>
      </div>

      <div className={`overflow-hidden bg-ivory text-ink transition-all duration-500 lg:hidden ${menuOpen ? "max-h-[420px] border-t border-ink/10" : "max-h-0"}`}>
        <div className="flex flex-col px-4 pb-6 pt-2 font-sans">
          {allLinks.map((l) => (
            <Link key={l.label} href={l.href} onClick={() => setMenuOpen(false)} className="py-3.5 text-sm uppercase tracking-[0.22em]">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
