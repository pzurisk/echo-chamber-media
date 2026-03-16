import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "outline" | "dark";
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
  const base =
    "inline-flex items-center justify-center px-8 py-3 text-sm font-body font-semibold uppercase tracking-editorial transition-all duration-300 cursor-pointer";

  const variants = {
    gold: "bg-brand-gold text-brand-black hover:bg-brand-gold-hover",
    outline:
      "border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-black",
    dark: "bg-brand-charcoal text-brand-off-white hover:bg-brand-gold hover:text-brand-black",
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
