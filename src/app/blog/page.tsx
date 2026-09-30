import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';
import { getAllPosts, formatDate } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Las Vegas Elopement and Music Video Blog',
  description: 'Las Vegas elopement guides, wedding film tips, and behind-the-scenes stories from Echo Chamber Media.',
  alternates: { canonical: 'https://echochambermedia.com/blog' },
  keywords: 'Las Vegas elopement blog, Las Vegas elopement guide, wedding videography tips, music video behind the scenes',
  openGraph: {
    title: 'Las Vegas Elopement and Music Video Blog | Echo Chamber Media',
    description: 'Las Vegas elopement guides, wedding film tips, and behind-the-scenes stories from Echo Chamber Media.',
    url: 'https://echochambermedia.com/blog',
    type: 'website',
    locale: 'en_US',
  },
};

const legacyPosts = [
  {
    slug: 'classified-mind-behind-the-scenes',
    iso: '2026-07-23',
    title: 'Behind The Classified Mind',
    excerpt: 'How we built an award-winning indie horror in-house: writing, shooting, cutting, scoring, and finishing under one roof. Multi-festival winner including Best Horror and Best Film Score at Las Vegas Indie Film Festival, Award Winner at The Dunwich Horror Fest, and Finalist at the RED Movie Awards.',
    date: 'July 23, 2026',
    category: 'Case Study',
    readTime: '7 min read',
  },
  {
    slug: 'best-las-vegas-wedding-venues-for-video',
    iso: '2026-06-29',
    title: 'Best Las Vegas Wedding Venues for Cinematic Video',
    excerpt: 'The venues that actually film well, picked by a working videographer. Rooftops above the Strip, Red Rock desert gardens, luxury ballrooms, and an old west ghost town.',
    date: 'June 29, 2026',
    category: 'Venue Guide',
    readTime: '8 min read',
  },
  {
    slug: 'naked-city-underground-music-video',
    iso: '2026-04-02',
    title: 'Behind The Naked City Underground',
    excerpt: 'A Las Vegas music video director and cinematographer breaks down the shoot: a 90s inspired look, a DIY cardboard backdrop, anamorphic lenses, and the grade behind "Everything\'s Alright" and "Coming To Me."',
    date: 'April 2, 2026',
    category: 'Case Study',
    readTime: '6 min read',
  },
];

interface Entry {
  slug: string;
  iso: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
  draft?: boolean;
}

export default function BlogPage() {
  // Markdown posts from content/blog plus the older hand-coded posts, newest first.
  const fresh: Entry[] = getAllPosts().map((p) => ({
    slug: p.slug,
    iso: p.date,
    title: p.title,
    excerpt: p.description,
    date: formatDate(p.date),
    category: p.category,
    readTime: `${p.readMinutes} min read`,
    draft: p.draft,
  }));
  const posts: Entry[] = [...fresh, ...legacyPosts].sort((a, b) => b.iso.localeCompare(a.iso));

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ivory px-4 pb-20 pt-[110px] font-sans text-ink md:px-16 md:pt-[150px]">
        <div className="mx-auto max-w-[900px]">
          <div className="mb-14 flex flex-col items-center gap-3 text-center md:mb-20">
            <span className="font-script text-[44px] leading-[1.1] text-gilt md:text-[56px]">The journal</span>
            <h1 className="font-display text-5xl font-normal leading-none tracking-[-0.01em] md:text-[72px]">
              Elopement guides <span className="italic text-gilt">and stories.</span>
            </h1>
            <p className="max-w-[560px] text-[17px] leading-[1.6] text-muted md:text-lg">
              Planning help for Las Vegas weddings and elopements, plus behind-the-scenes looks at our films and music videos.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block rounded-xl border border-gilt/20 bg-white p-7 transition-shadow hover:shadow-[0_12px_40px_rgba(43,33,26,0.08)] md:p-9"
              >
                <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs uppercase tracking-[0.2em] text-gilt">
                  <span>{post.category}</span>
                  <span className="text-muted">{post.date}</span>
                  <span className="text-muted">{post.readTime}</span>
                  {post.draft && <span className="rounded bg-ink px-2 py-0.5 text-ivory">Draft</span>}
                </div>
                <h2 className="mb-3 font-display text-[28px] leading-[1.15] transition-colors group-hover:text-gilt md:text-[34px]">
                  {post.title}
                </h2>
                <p className="leading-relaxed text-muted">{post.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
