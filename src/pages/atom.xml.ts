import type { APIRoute } from "astro";
import { siteConfig, absoluteUrl } from "../config/site";
import { excerptFromMarkdown } from "../lib/markdown";
import { listPublishedPosts } from "../lib/posts";
import { escapeXml } from "../lib/xml";

export const GET: APIRoute = async () => {
  const posts = await listPublishedPosts();
  const updated = (posts[0]?.publishedAt ?? new Date()).toISOString();
  const entries = posts
    .map((post) => {
      const url = absoluteUrl(`/posts/${post.slug}`);
      const summary = escapeXml(post.summary || excerptFromMarkdown(post.bodyMarkdown));
      return `<entry>
  <title>${escapeXml(post.title)}</title>
  <link href="${url}" rel="alternate" />
  <id>${url}</id>
  <updated>${(post.updatedAt ?? post.publishedAt ?? post.createdAt).toISOString()}</updated>
  <published>${(post.publishedAt ?? post.createdAt).toISOString()}</published>
  <summary>${summary}</summary>
</entry>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(siteConfig.title)}</title>
  <subtitle>${escapeXml(siteConfig.description)}</subtitle>
  <link href="${absoluteUrl("/atom.xml")}" rel="self" />
  <link href="${absoluteUrl("/")}" />
  <id>${absoluteUrl("/")}</id>
  <updated>${updated}</updated>
  ${entries}
</feed>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
    },
  });
};
