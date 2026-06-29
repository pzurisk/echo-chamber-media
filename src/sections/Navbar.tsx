"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const serviceLinks = [
  { label: "Wedding Videography", href: "/services/wedding-videography" },
  { label: "Wedding Photography", href: "/services/wedding-photography" },
  { label: "Corporate & Commercial", href: "/services/corporate" },
  { label: "Music Videos", href: "/services/music-videos" },
  { label: "Documentary", href: "/services/documentary" },
  { label: "360 Walkthroughs", href: "/services/360-walkthroughs" },
  { label: "Las Vegas Photographer", href: "/services/las-vegas-photographer" },
];

const navLinks = [
  { label: "Blog", href: "/blog" },
  { label: "Links", href: "/links" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 60);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-brand-black/95 backdrop-blur-sm border-b border-brand-charcoal/50"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4 md:py-5">
        <a href="/" className="font-heading text-lg uppercase tracking-editorial text-brand-off-white hover:text-brand-gold transition-colors">
          Echo Chamber
          <span className="text-brand-gold ml-1">Media</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {/* Services Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setServicesOpen(!servicesOpen)}
              className="text-sm uppercase tracking-editorial text-brand-gray hover:text-brand-gold font-body transition-colors duration-300 flex items-center gap-1"
            >
              Services
              <svg
                className={`w-3 h-3 transition-transform duration-300 ${servicesOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div
              className={`absolute top-full left-1/2 -translate-x-1/2 mt-4 w-56 bg-brand-charcoal/95 backdrop-blur-sm border border-brand-gold/20 rounded-lg overflow-hidden transition-all duration-300 ${
                servicesOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
            >
              {serviceLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setServicesOpen(false)}
                  className="block px-5 py-3 text-xs uppercase tracking-editorial text-brand-off-white hover:text-brand-gold hover:bg-brand-black/50 font-body transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm uppercase tracking-editorial text-brand-gray hover:text-brand-gold font-body transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}

          {/* Phone link */}
          <a
            href="tel:+19893081633"
            className="hidden lg:flex items-center gap-2 text-xs uppercase tracking-editorial text-brand-off-white hover:text-brand-gold font-body transition-colors duration-300"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-gold">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </svg>
            (989) 308-1633
          </a>

          {/* Quote CTA, primary conversion button */}
          <a
            href="#contact"
            className="text-xs uppercase tracking-editorial text-brand-black bg-brand-gold border border-brand-gold px-4 py-2 hover:bg-brand-gold-hover transition-all duration-300 font-body font-semibold"
          >
            Get a Quote
          </a>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-1.5 w-6"
          aria-label="Toggle menu"
        >
          <span className={`block h-px bg-brand-off-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-[3.5px]" : ""}`} />
          <span className={`block h-px bg-brand-off-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-px bg-brand-off-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-[3.5px]" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-500 ${menuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"} bg-brand-black/95 backdrop-blur-sm`}>
        <div className="px-6 pb-6 flex flex-col gap-4">
          <p className="text-[10px] uppercase tracking-editorial text-brand-gold font-body mt-2">Services</p>
          {serviceLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm uppercase tracking-editorial text-brand-gray hover:text-brand-gold font-body transition-colors duration-300 pl-3 touch-manipulation"
            >
              {link.label}
            </Link>
          ))}
          <div className="h-px bg-brand-charcoal/50 my-1" />
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm uppercase tracking-editorial text-brand-gray hover:text-brand-gold font-body transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
          <a
            href="tel:+19893081633"
            onClick={() => setMenuOpen(false)}
            className="text-sm uppercase tracking-editorial text-brand-off-white font-body transition-colors duration-300 flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-gold">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </svg>
            (989) 308-1633
          </a>
          <a
            href="#contact"
            onClick={() => setMenuOpen(false)}
            className="text-sm uppercase tracking-editorial text-brand-black bg-brand-gold font-body transition-colors duration-300 px-4 py-3 mt-2 inline-block w-fit font-semibold"
          >
            Get a Quote
          </a>
        </div>
      </div>
    </nav>
  );
}
