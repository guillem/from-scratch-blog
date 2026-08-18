/** Keep processed scripts as files so CSP `script-src 'self'` can allow them. */
export function denyJsAssetInlining(filePath: string): boolean | undefined {
  if (filePath.endsWith(".js") || filePath.endsWith(".mjs")) {
    return false;
  }
  return undefined;
}
