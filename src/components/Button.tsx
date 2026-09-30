import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "outline" | "dark" | "ink" | "ink-outline" | "night-gold";
  href?: string;
  children: React.ReactNode;
}

export default function Button({
  variant = "gold",
  href,
  children,
  className = "",
  ...props
}: ButtonProps) {
  // Legacy square variants (gold, outline, dark) serve the dark pages.
  // Pill variants (ink, ink-outline, night-gold) serve the bridal pages.
  const isPill = variant === "ink" || variant === "ink-outline" || variant === "night-gold";

  const base = isPill
    ? "inline-flex items-center justify-center h-14 px-8 rounded-full font-sans font-semibold text-base transition-colors duration-300 cursor-pointer"
    : "inline-flex items-center justify-center px-8 py-3 text-sm font-body font-semibold uppercase tracking-editorial transition-all duration-300 cursor-pointer";

  const variants = {
    gold: "bg-brand-gold text-brand-black hover:bg-brand-gold-hover",
    outline:
      "border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-black",
    dark: "bg-brand-charcoal text-brand-off-white hover:bg-brand-gold hover:text-brand-black",
    ink: "bg-ink text-ivory hover:bg-gilt-hover",
    "ink-outline": "border border-ink text-ink hover:bg-ink hover:text-ivory",
    "night-gold": "bg-night-gold text-night hover:bg-[#F0C25C]",
  };

  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
