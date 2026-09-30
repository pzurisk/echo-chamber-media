// File-based blog. Each post is a markdown file in content/blog with frontmatter.
// Files whose names start with "_" are notes or templates and are skipped.
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

const DIR = path.join(process.cwd(), "content/blog");

export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  updated?: string;
  category: string;
  image?: string;
  imageAlt?: string;
  keywords?: string;
  cta: "elopement" | "music";
  draft: boolean;
  faq?: { q: string; a: string }[];
  readMinutes: number;
  html: string;
}

// Drafts show in `next dev` and when SHOW_DRAFTS=1. They never reach a production build otherwise.
const showDrafts = () => process.env.NODE_ENV === "development" || process.env.SHOW_DRAFTS === "1";

function toDateString(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v ?? "");
}

function load(file: string): Post {
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  const { data, content } = matter(raw);
  const words = content.split(/\s+/).filter(Boolean).length;
  return {
    slug: file.replace(/\.md$/, ""),
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    date: toDateString(data.date),
    updated: data.updated ? toDateString(data.updated) : undefined,
    category: String(data.category ?? "Guide"),
    image: data.image ? String(data.image) : undefined,
    imageAlt: data.imageAlt ? String(data.imageAlt) : undefined,
    keywords: data.keywords ? String(data.keywords) : undefined,
    cta: data.cta === "music" ? "music" : "elopement",
    draft: data.draft === true,
    faq: Array.isArray(data.faq) ? data.faq.map((f: { q: unknown; a: unknown }) => ({ q: String(f.q), a: String(f.a) })) : undefined,
    readMinutes: Math.max(1, Math.round(words / 220)),
    html: marked.parse(content, { async: false }) as string,
  };
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map(load)
    .filter((p) => showDrafts() || !p.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
