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

export function isProductionSeedForbidden(): boolean {
  return isHostedNetlifyDeploy() || process.env.ALLOW_PROD_SEED === "false";
}
