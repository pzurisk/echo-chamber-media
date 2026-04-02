"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const serviceLinks = [
  { label: "Wedding Photography", href: "/services/wedding-photography" },
  { label: "360 Walkthroughs", href: "/services/360-walkthroughs" },
  { label: "Music Videos", href: "/services/music-videos" },
  { label: "Corporate & Commercial", href: "/services/corporate" },
  { label: "Documentary", href: "/services/documentary" },
  { label: "Las Vegas Photographer", href: "/services/las-vegas-photographer" },
];

const navLinks = [
  { label: "Blog", href: "/blog" },
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
        </div>
      </div>
    </nav>
  );
}
