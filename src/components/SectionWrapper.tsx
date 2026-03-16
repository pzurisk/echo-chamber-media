import React from "react";

interface SectionWrapperProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}

export default function SectionWrapper({
  id,
  children,
  className = "",
  dark = true,
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={`relative w-full px-6 py-24 md:py-32 lg:px-16 ${
        dark ? "bg-brand-black" : "bg-brand-charcoal"
      } ${className}`}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}
