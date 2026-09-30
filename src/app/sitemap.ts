import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { getAllPosts } from "@/lib/blog";

const BASE = "https://echochambermedia.com";

// List immediate subfolders under src/app/<dir> that are real pages.
function subRoutes(dir: string): string[] {
  try {
    const full = path.join(process.cwd(), "src/app", dir);
    return fs
      .readdirSync(full, { withFileTypes: true })
      .filter(
        (d) =>
          d.isDirectory() &&
          !d.name.startsWith("[") &&
          fs.existsSync(path.join(full, d.name, "page.tsx"))
      )
      .map((d) => d.name)
      .sort();
  } catch {
    return [];
  }
}

// Blog folders whose URLs redirect (see next.config.mjs). They stay out of the sitemap.
const REDIRECTED_BLOG = new Set(["what-ai-ad-production-costs", "the-chair-tattoo-documentary"]);

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const posts = Array.from(
    new Set([
      ...subRoutes("blog").filter((s) => !REDIRECTED_BLOG.has(s)).map((s) => `/blog/${s}`),
      ...getAllPosts().map((p) => `/blog/${p.slug}`),
    ])
  );

  const routes = ["", "/elopements", "/music-videos", "/blog", "/links", ...posts];

  return routes.map((route) => ({
    url: `${BASE}${route}`,
    lastModified: now,
    changeFrequency: route === "" || route === "/blog" ? "weekly" : "monthly",
    priority:
      route === ""
        ? 1
        : route === "/elopements" || route === "/music-videos"
        ? 0.9
        : route === "/blog"
        ? 0.8
        : 0.7,
  }));
}
