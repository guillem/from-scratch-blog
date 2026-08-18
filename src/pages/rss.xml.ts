import type { APIRoute } from "astro";
import { siteConfig, absoluteUrl } from "../config/site";
import { excerptFromMarkdown } from "../lib/markdown";
import { listPublishedPosts } from "../lib/posts";
import { escapeXml } from "../lib/xml";

export const GET: APIRoute = async () => {
  const posts = await listPublishedPosts();
  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/posts/${post.slug}`);
      const description = escapeXml(
        post.summary || excerptFromMarkdown(post.bodyMarkdown),
      );
      const pubDate = (post.publishedAt ?? post.createdAt).toUTCString();
      return `<item>
  <title>${escapeXml(post.title)}</title>
  <link>${url}</link>
  <guid>${url}</guid>
  <pubDate>${pubDate}</pubDate>
  <description>${description}</description>
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteConfig.title)}</title>
    <link>${absoluteUrl("/")}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
};
