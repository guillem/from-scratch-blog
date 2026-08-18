import type { APIRoute } from "astro";
import { absoluteUrl } from "../config/site";
import { listPublishedPosts } from "../lib/posts";
import { listTagsUsedByPublishedPosts } from "../lib/tags";
import { escapeXml } from "../lib/xml";

export const GET: APIRoute = async () => {
  const [posts, tags] = await Promise.all([
    listPublishedPosts(),
    listTagsUsedByPublishedPosts(),
  ]);
  const urls = [
    "/",
    "/tags",
    ...posts.map((post) => `/posts/${post.slug}`),
    ...tags.map((tag) => `/tags/${tag.slug}`),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (path) => `  <url>
    <loc>${escapeXml(absoluteUrl(path))}</loc>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
