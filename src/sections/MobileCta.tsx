"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/lib/site";

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

// Phone only. A slim bar pinned to the bottom once the visitor scrolls past the hero,
// hidden again while the inquiry form (#date) is on screen so it never covers the submit button.
export default function MobileCta({ dateHref = "/elopements#date" }: { dateHref?: string }) {
  const [past, setPast] = useState(false);
  const [formInView, setFormInView] = useState(false);

  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const form = document.getElementById("date");
    const io = form ? new IntersectionObserver(([e]) => setFormInView(e.isIntersecting)) : null;
    if (form && io) io.observe(form);

    return () => {
      window.removeEventListener("scroll", onScroll);
      io?.disconnect();
    };
  }, []);

  const show = past && !formInView;

  return (
    <>
      {/* Keeps the footer clear of the bar. */}
      <div aria-hidden="true" className="h-[76px] bg-champagne md:hidden" />
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-gilt/25 bg-ivory/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm transition-transform duration-300 md:hidden ${
          show ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!show}
      >
        <div className="flex gap-3">
          <a
            href={dateHref}
            tabIndex={show ? 0 : -1}
            className="flex h-[52px] flex-[1.4] items-center justify-center rounded-full bg-ink font-sans text-[15px] font-semibold text-ivory"
          >
            Check your date
          </a>
          <a
            href={SITE.phoneSms}
            tabIndex={show ? 0 : -1}
            onClick={() => (window as GtagWindow).gtag?.("event", "text_click", { event_category: "engagement", event_label: "mobile_bar", value: 1 })}
            className="flex h-[52px] flex-1 items-center justify-center rounded-full border border-ink/40 font-sans text-[15px] font-semibold text-ink"
          >
            Text us
          </a>
        </div>
      </div>
    </>
  );
}
