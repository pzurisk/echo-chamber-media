export default function TrustStrip() {
  const items = [
    {
      label: "5.0 on Google",
      icon: (
        <span className="text-brand-gold text-base tracking-[2px]" aria-label="5 stars">
          ★★★★★
        </span>
      ),
    },
    {
      label: "6× Festival Selections",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-brand-gold"
        >
          <circle cx="12" cy="8" r="6" />
          <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
        </svg>
      ),
    },
    {
      label: "Award-Winning Feature Film",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-brand-gold"
        >
          <path d="M12 2L8 6h8l-4-4z" />
          <rect x="3" y="6" width="18" height="13" rx="1" />
          <path d="M3 10h18" />
        </svg>
      ),
    },
    {
      label: "Las Vegas · Available Worldwide",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-brand-gold"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
  ];

  return (
    <section
      aria-label="Credibility highlights"
      className="bg-brand-black border-t border-b border-brand-charcoal/60"
    >
      <div className="mx-auto max-w-6xl px-6 py-6 md:py-7">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 md:gap-x-14">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 text-brand-off-white font-body text-sm md:text-[15px] tracking-wide"
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
