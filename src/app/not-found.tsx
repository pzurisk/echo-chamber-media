import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center px-6">
      {/* Gold accent line */}
      <div className="h-px w-16 bg-brand-gold mb-8" />

      <h1 className="font-heading text-6xl md:text-8xl uppercase tracking-editorial text-brand-gold mb-4">
        404
      </h1>

      <p className="text-brand-off-white font-body text-lg mb-2">
        This page doesn&apos;t exist.
      </p>
      <p className="text-brand-gray font-body text-sm mb-10">
        The page you&apos;re looking for may have moved or been removed.
      </p>

      <Link
        href="/"
        className="group relative px-8 py-3 border border-brand-gold/60 text-brand-off-white font-body text-sm uppercase tracking-editorial hover:bg-brand-gold/10 transition-all duration-500"
      >
        Back to Home
      </Link>

      {/* Gold accent line */}
      <div className="h-px w-16 bg-brand-gold mt-8" />
    </div>
  );
}
