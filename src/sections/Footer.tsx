import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-brand-black border-t border-brand-charcoal/30">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          {/* Brand + Location */}
          <div>
            <p className="font-heading text-lg uppercase tracking-editorial text-brand-off-white">
              Echo Chamber<span className="text-brand-gold ml-1">Media</span>
            </p>
            <p className="mt-4 text-sm text-brand-gray font-body leading-relaxed">
              Las Vegas video production. Weddings, corporate, music videos,
              documentaries, and walk-throughs.
            </p>
            <p className="mt-3 text-xs uppercase tracking-editorial text-brand-gold font-body">
              Las Vegas, NV
            </p>
          </div>

          {/* Get in touch */}
          <div>
            <p className="text-xs uppercase tracking-editorial text-brand-gold font-body mb-4">
              Get in touch
            </p>
            <a
              href="tel:+19893081633"
              className="block text-sm text-brand-off-white hover:text-brand-gold font-body transition-colors duration-300 mb-2"
            >
              (989) 308-1633
            </a>
            <a
              href="mailto:sales@echochambermedia.com"
              className="block text-sm text-brand-gray hover:text-brand-gold font-body transition-colors duration-300 break-all"
            >
              sales@echochambermedia.com
            </a>
            <Link
              href="/#contact"
              className="mt-4 inline-block text-xs uppercase tracking-editorial text-brand-black bg-brand-gold border border-brand-gold px-4 py-2 hover:bg-brand-gold-hover transition-all duration-300 font-body font-semibold"
            >
              Get a Free Quote
            </Link>
          </div>

          {/* Social */}
          <div>
            <p className="text-xs uppercase tracking-editorial text-brand-gold font-body mb-4">
              Follow
            </p>
            <ul className="flex flex-col gap-2 text-sm font-body">
              <li>
                <a
                  href="https://instagram.com/chunkdude"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-gray hover:text-brand-gold transition-colors duration-300"
                >
                  Instagram &mdash; @chunkdude
                </a>
              </li>
              <li>
                <a
                  href="https://www.tiktok.com/@billyzurisk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-gray hover:text-brand-gold transition-colors duration-300"
                >
                  TikTok &mdash; @billyzurisk
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/share/18S1WRCyMq/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-gray hover:text-brand-gold transition-colors duration-300"
                >
                  Facebook &mdash; Philip Zurisk
                </a>
              </li>
              <li>
                <Link
                  href="/links"
                  className="text-brand-gray hover:text-brand-gold transition-colors duration-300"
                >
                  All Links
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-brand-charcoal/30 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-xs text-brand-gray font-body">
            &copy; 2026 Echo Chamber Media. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-brand-gray font-body uppercase tracking-editorial">
            <Link href="/blog" className="hover:text-brand-gold transition-colors duration-300">
              Blog
            </Link>
            <Link href="/links" className="hover:text-brand-gold transition-colors duration-300">
              Links
            </Link>
            <Link href="/#contact" className="hover:text-brand-gold transition-colors duration-300">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
