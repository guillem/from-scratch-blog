import type { APIRoute } from "astro";
import { absoluteUrl } from "../config/site";

export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /login
Sitemap: ${absoluteUrl("/sitemap.xml")}
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
