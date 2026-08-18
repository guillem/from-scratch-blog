export const siteConfig = {
  title: "From Scratch",
  description: "A small, calm personal blog.",
  author: "Site Owner",
  locale: "en",
} as const;

/**
 * Canonical origin for feeds, sitemap, and Open Graph.
 * SITE_URL is public configuration, not a secret.
 * Netlify provides URL (production) and DEPLOY_PRIME_URL (previews).
 */
export function getSiteUrl(): string {
  const candidate =
    process.env.SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "http://localhost:4321";
  return candidate.replace(/\/$/, "");
}

export function absoluteUrl(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getSiteUrl()}${path}`;
}
