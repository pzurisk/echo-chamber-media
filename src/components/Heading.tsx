import React from "react";

interface HeadingProps {
  as?: "h1" | "h2" | "h3" | "h4";
  children: React.ReactNode;
  className?: string;
  gold?: boolean;
}

export default function Heading({
  as: Tag = "h2",
  children,
  className = "",
  gold = false,
}: HeadingProps) {
  const sizes = {
    h1: "text-4xl md:text-6xl lg:text-7xl",
    h2: "text-3xl md:text-5xl",
    h3: "text-2xl md:text-3xl",
    h4: "text-xl md:text-2xl",
  };

  return (
    <Tag
      className={`font-heading uppercase tracking-editorial leading-tight ${
        sizes[Tag]
      } ${gold ? "text-brand-gold" : "text-brand-off-white"} ${className}`}
    >
      {children}
    </Tag>
  );
}
