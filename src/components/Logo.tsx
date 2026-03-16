import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className = "", size = "md" }: LogoProps) {
  const sizes = {
    sm: "text-xl md:text-2xl",
    md: "text-3xl md:text-4xl",
    lg: "text-4xl md:text-6xl lg:text-7xl",
  };

  return (
    <div className={`font-heading uppercase tracking-editorial ${className}`}>
      <span className={`${sizes[size]} text-brand-off-white block leading-none`}>
        Echo Chamber
      </span>
      <span
        className={`${
          size === "lg" ? "text-lg md:text-2xl" : "text-sm md:text-base"
        } text-brand-gold tracking-[0.25em] block mt-1`}
      >
        Media
      </span>
    </div>
  );
}
