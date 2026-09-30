import Link from "next/link";
import { SITE } from "@/lib/site";

const link = "font-sans text-[15px] text-muted transition-colors hover:text-gilt";

export default function Footer() {
  return (
    <footer className="border-t border-gilt/20 bg-champagne px-4 py-12 md:px-16 md:py-14">
      <div className="mx-auto flex max-w-[1312px] flex-col gap-10 md:flex-row md:justify-between">
        <div className="flex flex-col gap-2">
          <span className="font-display text-[26px] text-ink">Echo Chamber Media</span>
          <span className="font-sans text-[15px] text-muted">Elopement films and music videos. Las Vegas, NV.</span>
        </div>
        <div className="flex gap-12 md:gap-16">
          <div className="flex flex-col gap-2.5">
            <Link href="/elopements" className={link}>Weddings & Elopements</Link>
            <Link href="/music-videos" className={link}>Music Videos</Link>
            <Link href="/blog" className={link}>Blog</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <a href={SITE.phoneTel} className={link}>{SITE.phoneDisplay}</a>
            <a href={`mailto:${SITE.email}`} className={`${link} break-all`}>{SITE.email}</a>
            <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" className={link}>Instagram</a>
            <a href={SITE.tiktok} target="_blank" rel="noopener noreferrer" className={link}>TikTok</a>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-[1312px] border-t border-gilt/20 pt-6 font-sans text-xs text-muted">
        &copy; 2026 Echo Chamber Media. All rights reserved.
      </p>
    </footer>
  );
}
