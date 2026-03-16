import Logo from "@/components/Logo";
import ScrollIndicator from "@/components/ScrollIndicator";

export default function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      {/* ── Background Video / Fallback Image ── */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/images/hero-still.jpg"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/video/hero-reel.mp4" type="video/mp4" />
      </video>

      {/* ── 50% Dim Overlay ── */}
      <div className="absolute inset-0 bg-black/50" />

      {/* ── Subtle Vignette ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-transparent opacity-80" />

      {/* ── Content ── */}
      <div className="relative z-10 text-center px-6">
        <Logo size="lg" className="mx-auto" />

        <div className="mt-8 h-px w-24 bg-brand-gold mx-auto" />

        <p className="mt-6 text-lg md:text-xl text-brand-off-white/90 font-body font-light tracking-wide max-w-xl mx-auto">
          Cinematic storytelling for the stories that matter.
        </p>
      </div>

      {/* ── Scroll Indicator ── */}
      <ScrollIndicator />
    </section>
  );
}
