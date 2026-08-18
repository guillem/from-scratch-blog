export function isHostedNetlifyDeploy(): boolean {
  const context = process.env.CONTEXT;
  return (
    context === "production" ||
    context === "deploy-preview" ||
    context === "branch-deploy"
  );
}

/**
 * Local/CI-only admin impersonation. Hard-blocked on hosted Netlify deploys
 * even if the environment variables are set by mistake.
 */
export function isDevAuthBypassEnabled(): boolean {
  if (process.env.DEV_AUTH_BYPASS !== "true") {
    return false;
  }
  if (isHostedNetlifyDeploy()) {
    return false;
  }
  if (process.env.NETLIFY === "true" && process.env.NETLIFY_DEV !== "true") {
    return false;
  }
  return true;
}

export function shouldRefuseHostedSeed(): boolean {
  return isHostedNetlifyDeploy() && process.env.ALLOW_PROD_SEED !== "true";
}

export function isRemoteDatabaseUrl(url = process.env.NETLIFY_DB_URL): boolean {
  if (!url) {
    return false;
  }
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host !== "localhost" && host !== "127.0.0.1" && host !== "[::1]" && host !== "::1"
    );
  } catch {
    return !/(?:^|[/@])(?:localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(url);
  }
}

export function warnIfRemoteDatabaseUrl(url = process.env.NETLIFY_DB_URL): void {
  if (!isRemoteDatabaseUrl(url)) {
    return;
  }
  console.warn(
    "NETLIFY_DB_URL does not look like a local database. This command can change remote data.",
  );
}
