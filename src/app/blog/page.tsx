import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';

export const metadata: Metadata = {
  title: 'Blog | Behind the Scenes & Production Insights | Echo Chamber Media',
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
    slug: 'naked-city-underground-music-video',
    title: 'Shooting My First Music Video: The Naked City Underground',
    excerpt: 'How we captured the raw, genre-smashing energy of Las Vegas\' own outlaw country-surf punk outfit. Behind the scenes of the "Coming To Me" & "Everything\'s Alright" music video.',
    date: 'April 2, 2026',
    category: 'Case Study',
    readTime: '5 min read',
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
