import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';

export const metadata: Metadata = {
  title: 'Blog | Behind the Scenes & Production Insights',
  description: 'Behind-the-scenes stories, production insights, and filmmaking tips from Echo Chamber Media in Las Vegas. Case studies, gear breakdowns, and creative process.',
  alternates: { canonical: 'https://echochambermedia.com/blog' },
  keywords: 'video production blog, filmmaking Las Vegas, behind the scenes, production insights, cinematography tips',
  openGraph: {
    title: 'Blog | Echo Chamber Media',
    description: 'Behind-the-scenes stories, production insights, and filmmaking tips from Echo Chamber Media in Las Vegas.',
    url: 'https://echochambermedia.com/blog',
    type: 'website',
    locale: 'en_US',
  },
};

const posts = [
  {
    slug: 'what-ai-ad-production-costs',
    title: 'What AI Ad Production Actually Costs',
    excerpt: 'A straight answer on 2026 AI ad production pricing, how it compares to a traditional commercial shoot, and what you actually get at each price point.',
    date: 'August 7, 2026',
    category: 'Pricing Guide',
    readTime: '6 min read',
  },
  {
    slug: 'the-chair-tattoo-documentary',
    title: 'Behind The Chair',
    excerpt: 'How we made a short documentary portrait of a Las Vegas tattoo artist on a working shop floor. Finding the idea before the shoot, getting sound in a loud room, cutting from a transcript instead of the timeline, and why a doc outperforms an ad.',
    date: 'July 26, 2026',
    category: 'Case Study',
    readTime: '6 min read',
  },
  {
    slug: 'classified-mind-behind-the-scenes',
    title: 'Behind The Classified Mind',
    excerpt: 'How we built an award-winning indie horror in-house — writing, shooting, cutting, scoring, and finishing under one roof. Multi-festival winner including Best Horror and Best Film Score at Las Vegas Indie Film Festival, Award Winner at The Dunwich Horror Fest, and Finalist at the RED Movie Awards.',
    date: 'July 23, 2026',
    category: 'Case Study',
    readTime: '7 min read',
  },
  {
    slug: 'best-las-vegas-wedding-venues-for-video',
    title: 'Best Las Vegas Wedding Venues for Cinematic Video',
    excerpt: 'The venues that actually film well, picked by a working videographer. Rooftops above the Strip, Red Rock desert gardens, luxury ballrooms, and an old west ghost town.',
    date: 'June 29, 2026',
    category: 'Venue Guide',
    readTime: '8 min read',
  },
  {
    slug: 'wedding-videographer-cost-las-vegas',
    title: 'How Much Does a Wedding Videographer Cost in Las Vegas?',
    excerpt: 'A straight answer on 2026 pricing, what actually drives the number, and how to tell a real wedding video package from a cheap one.',
    date: 'June 29, 2026',
    category: 'Pricing Guide',
    readTime: '7 min read',
  },
  {
    slug: 'naked-city-underground-music-video',
    title: 'Behind The Naked City Underground',
    excerpt: 'A Las Vegas music video director and cinematographer breaks down the shoot: a 90s inspired look, a DIY cardboard backdrop, anamorphic lenses, and the grade behind "Everything\'s Alright" and "Coming To Me."',
    date: 'April 2, 2026',
    category: 'Case Study',
    readTime: '6 min read',
  },
];

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main className="bg-brand-black text-brand-off-white min-h-screen pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-20">
            <p className="text-sm uppercase tracking-editorial text-brand-gold font-body mb-4">
              From the Field
            </p>
            <h1 className="font-heading text-5xl lg:text-6xl uppercase tracking-editorial text-brand-off-white mb-4">
              Blog
            </h1>
            <div className="h-px w-16 bg-brand-gold mx-auto mb-6" />
            <p className="font-body text-brand-gray max-w-lg mx-auto">
              Behind-the-scenes stories, production breakdowns, and lessons from the field.
            </p>
          </div>

          {/* Posts */}
          <div className="space-y-8">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block bg-brand-charcoal/30 border border-brand-charcoal hover:border-brand-gold/30 p-8 transition-all duration-500"
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-xs uppercase tracking-editorial text-brand-gold font-body bg-brand-gold/10 px-3 py-1">
                    {post.category}
                  </span>
                  <span className="text-xs text-brand-gray font-body">{post.date}</span>
                  <span className="text-xs text-brand-gray font-body">{post.readTime}</span>
                </div>
                <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-off-white group-hover:text-brand-gold transition-colors duration-300 mb-3">
                  {post.title}
                </h2>
                <p className="font-body text-brand-gray leading-relaxed">
                  {post.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
