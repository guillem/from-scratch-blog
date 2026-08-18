/**
 * Same-origin relative path for post-login redirects.
 * Rejects absolute URLs, protocol-relative URLs, and backslash tricks.
 */
export function safeNextPath(
  raw: string | null | undefined,
  fallback = "/admin",
): string {
  if (!raw) {
    return fallback;
  }
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return fallback;
  }
  if (raw.includes("\\") || /[\u0000-\u001F\u007F]/.test(raw)) {
    return fallback;
  }
  return raw;
}
