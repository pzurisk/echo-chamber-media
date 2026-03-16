export default function ScrollIndicator() {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-scroll-bounce">
      <span className="text-xs uppercase tracking-[0.2em] text-brand-gray font-body">
        Scroll
      </span>
      <svg
        width="20"
        height="30"
        viewBox="0 0 20 30"
        fill="none"
        className="text-brand-gold"
      >
        <rect
          x="1"
          y="1"
          width="18"
          height="28"
          rx="9"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="10" cy="10" r="2.5" fill="currentColor">
          <animate
            attributeName="cy"
            values="10;20;10"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="1;0.3;1"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}
