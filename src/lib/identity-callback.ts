/** Hash prefixes GoTrue puts on invite, recovery, confirmation, and OAuth links. */
export const AUTH_HASH_PATTERN =
  /^#(confirmation_token|recovery_token|invite_token|email_change_token|access_token)=/;

/**
 * Identity emails land on the site URL (usually `/`) with a hash token.
 * Only `/login` runs `handleAuthCallback()`, so other paths must forward.
 */
export function loginPathForAuthHash(
  pathname: string,
  search: string,
  hash: string,
): string | null {
  if (pathname === "/login") {
    return null;
  }
  if (!AUTH_HASH_PATTERN.test(hash)) {
    return null;
  }
  return `/login${search}${hash}`;
}
