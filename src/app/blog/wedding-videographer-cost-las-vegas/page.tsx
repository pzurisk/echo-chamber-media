// This post now lives in content/blog/wedding-videographer-cost-las-vegas.md.
// This folder stays only so the URL keeps working. It can be deleted with Billy's okay,
// because the [slug] route will then serve the same post.
import PostPage, { generateMetadata as baseMetadata } from "../[slug]/page";

const SLUG = "wedding-videographer-cost-las-vegas";

export const generateMetadata = () => baseMetadata({ params: { slug: SLUG } });

export default function Page() {
  return PostPage({ params: { slug: SLUG } });
}
