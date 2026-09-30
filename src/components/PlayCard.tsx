/* eslint-disable @next/next/no-img-element */
// Poster image with a play button that opens the film on YouTube.
// No iframe on purpose (static pages, Error 153).
interface PlayCardProps {
  href: string;
  src: string;
  alt: string;
  label: string;
  tone?: "light" | "dark";
  size?: "lg" | "md" | "sm";
  caption?: string;
  className?: string;
  objectPosition?: string;
}

const sizes = {
  lg: { circle: "h-[68px] w-[68px] md:h-[104px] md:w-[104px]", icon: "h-6 w-6 md:h-[34px] md:w-[34px]" },
  md: { circle: "h-16 w-16 md:h-20 md:w-20", icon: "h-[22px] w-[22px] md:h-7 md:w-7" },
  sm: { circle: "h-14 w-14", icon: "h-5 w-5" },
};

export default function PlayCard({
  href,
  src,
  alt,
  label,
  tone = "light",
  size = "lg",
  caption,
  className = "",
  objectPosition = "center",
}: PlayCardProps) {
  const s = sizes[size];
  const circle = tone === "light" ? "bg-ivory" : "bg-night-gold";
  const icon = tone === "light" ? "fill-gilt" : "fill-night";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`group relative block overflow-hidden rounded-lg ${className}`}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        style={{ objectPosition }}
      />
      <span
        className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ${circle} ${s.circle} transition-transform duration-300 group-hover:scale-105`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className={`${icon} ${s.icon}`}>
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      {caption && (
        <span
          className={`absolute bottom-4 left-4 md:bottom-6 md:left-7 flex h-9 items-center rounded-full px-4 font-sans text-[11px] md:text-[13px] uppercase tracking-[0.16em] ${
            tone === "light" ? "bg-ivory/90 text-ink" : "bg-night/70 text-night-text"
          }`}
        >
          {caption}
        </span>
      )}
    </a>
  );
}
