import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/sections/Navbar";
import Footer from "@/sections/Footer";
import Button from "@/components/Button";
import { getAllPosts, getPost, formatDate } from "@/lib/blog";
import { OG_IMAGE } from "@/lib/site";

const BASE = "https://echochambermedia.com";

// Only slugs from markdown files are generated. The older hand-coded posts keep their own folders.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPost(params.slug);
  if (!post) return {};
  const url = `${BASE}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    robots: post.draft ? { index: false, follow: false } : undefined,
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      locale: "en_US",
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      images: post.image ? [{ url: `${BASE}${post.image}` }] : [OG_IMAGE],
    },
  };
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) notFound();

  const url = `${BASE}/blog/${post.slug}`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    mainEntityOfPage: url,
    image: post.image ? `${BASE}${post.image}` : undefined,
    author: { "@type": "Person", name: "Billy Zurisk" },
    publisher: { "@type": "Organization", name: "Echo Chamber Media", url: BASE },
  };
  const faqLd = post.faq?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: post.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;
  const music = post.cta === "music";

  return (
    <>
      <Navbar />
      <main className="bg-ivory font-sans text-ink">
        <article className="px-4 pb-16 pt-[110px] md:px-16 md:pb-24 md:pt-[150px]">
          <div className="mx-auto max-w-[760px]">
            <Link href="/blog" className="font-sans text-sm text-gilt hover:text-gilt-hover">
              ← All posts
            </Link>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-xs uppercase tracking-[0.2em] text-gilt">
              <span>{post.category}</span>
              <span className="text-muted">{formatDate(post.date)}</span>
              <span className="text-muted">{post.readMinutes} min read</span>
              {post.draft && <span className="rounded bg-ink px-2 py-0.5 text-ivory">Draft</span>}
            </div>
            <h1 className="mt-4 font-display text-[40px] font-normal leading-[1.05] tracking-[-0.01em] md:text-[64px]">
              {post.title}
            </h1>
            <p className="mt-5 font-sans text-lg leading-[1.6] text-muted md:text-xl">{post.description}</p>
            {post.image && (
              <Image
                src={post.image}
                alt={post.imageAlt ?? ""}
                width={1200}
                height={675}
                priority
                sizes="(min-width: 768px) 768px, 100vw"
                className="mt-8 aspect-[16/9] h-auto w-full rounded-lg object-cover"
              />
            )}
            <div className="post mt-10" dangerouslySetInnerHTML={{ __html: post.html }} />

            <div className="mt-14 rounded-xl border border-gilt/25 bg-champagne p-8 text-center md:p-10">
              <p className="font-script text-4xl text-gilt md:text-5xl">
                {music ? "Start your project" : "Let's make your film"}
              </p>
              <h2 className="mt-2 font-display text-3xl md:text-4xl">
                {music ? "Got a song that needs a video?" : "Tell us your date."}
              </h2>
              <p className="mx-auto mt-3 max-w-[460px] font-sans text-base text-muted">
                {music
                  ? "Send us a link and a few lines. We reply within 24 hours."
                  : "Free 20 minute call. We reply within 24 hours, usually faster."}
              </p>
              <div className="mt-6 flex justify-center">
                <Button variant="ink" href={music ? "/music-videos#contact" : "/elopements#date"}>
                  {music ? "Start your music video" : "Check your date"}
                </Button>
              </div>
            </div>
          </div>
        </article>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
    </>
  );
}
