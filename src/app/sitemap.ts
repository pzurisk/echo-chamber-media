import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

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
          fs.existsSync(path.join(full, d.name, "page.tsx"))
      )
      .map((d) => d.name)
      .sort();
  } catch {
    return [];
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const services = subRoutes("services").map((s) => `/services/${s}`);
  const posts = subRoutes("blog").map((s) => `/blog/${s}`);

  const routes = ["", "/blog", "/links", ...services, ...posts];

  return routes.map((route) => ({
    url: `${BASE}${route}`,
    lastModified: now,
    changeFrequency: route === "" || route === "/blog" ? "weekly" : "monthly",
    priority:
      route === ""
        ? 1
        : route.startsWith("/services")
        ? 0.9
        : route === "/blog"
        ? 0.8
        : 0.7,
  }));
}
