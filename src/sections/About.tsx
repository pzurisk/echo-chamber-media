/* eslint-disable @next/next/no-img-element */
import fs from "fs";
import path from "path";

const PORTRAIT = "/images/billy-zurisk.webp";

export default function About() {
  // Render the portrait only when the file is present, so a missing file never ships as a broken image.
  const hasPortrait = fs.existsSync(path.join(process.cwd(), "public", PORTRAIT));

  return (
    <section id="about" className="scroll-mt-24 border-t border-gilt/20 bg-ivory px-4 py-16 md:px-16 md:py-[104px]">
      <div className="mx-auto grid max-w-[1312px] grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-x-10">
        {hasPortrait && (
          <div className="md:col-span-4">
            <img
              src={PORTRAIT}
              alt="Billy Zurisk, director and founder of Echo Chamber Media"
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] w-full rounded-lg object-cover"
              style={{ objectPosition: "50% 30%" }}
            />
          </div>
        )}
        <div className={`flex flex-col gap-6 ${hasPortrait ? "md:col-span-7 md:col-start-6" : "md:col-span-8 md:col-start-3"}`}>
          <span className="font-sans text-xs uppercase tracking-[0.3em] text-gilt">About</span>
          <h2 className="font-display text-[44px] font-normal leading-none tracking-[-0.01em] text-ink md:text-[64px]">
            Hi, I&apos;m <span className="italic text-gilt">Billy.</span>
          </h2>
          <div className="flex flex-col gap-5 font-sans text-[17px] leading-[1.65] text-muted md:text-lg">
            <p>
              Echo Chamber Media is a Las Vegas film company. I run every project myself, from the first call to the final color.
            </p>
            <p>
              The Classified Mind, which I co-wrote with Pete Miceli, has picked up festival awards including Best Horror and Best Short. That same care goes into a three minute elopement film and a music video.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
