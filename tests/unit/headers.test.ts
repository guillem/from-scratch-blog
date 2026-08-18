import { describe, expect, it } from "vitest";
import { denyJsAssetInlining } from "../../src/lib/client-assets";
import {
  cachePolicyForPath,
  SECURITY_HEADERS,
  withSecurityHeaders,
} from "../../src/lib/headers";

describe("SECURITY_HEADERS", () => {
  it("does not allow inline scripts", () => {
    const csp = SECURITY_HEADERS["Content-Security-Policy"];
    const scriptSrc = csp
      .split(";")
      .map((directive) => directive.trim())
      .find((directive) => directive.startsWith("script-src"));
    expect(scriptSrc).toBe("script-src 'self'");
  });

  it("keeps JavaScript out of the asset inliner so those scripts stay files", () => {
    expect(denyJsAssetInlining("AdminLayout.astro.js")).toBe(false);
    expect(denyJsAssetInlining("preview.mjs")).toBe(false);
    expect(denyJsAssetInlining("photo.png")).toBeUndefined();
  });
});

describe("cachePolicyForPath", () => {
  it("marks admin, login, and admin API responses private", () => {
    expect(cachePolicyForPath("/admin")).toBe("private");
    expect(cachePolicyForPath("/admin/posts/new")).toBe("private");
    expect(cachePolicyForPath("/login")).toBe("private");
    expect(cachePolicyForPath("/api/admin")).toBe("private");
    expect(cachePolicyForPath("/api/admin/preview")).toBe("private");
  });

  it("marks public pages cacheable", () => {
    expect(cachePolicyForPath("/")).toBe("public");
    expect(cachePolicyForPath("/posts/hello")).toBe("public");
    expect(cachePolicyForPath("/api/public")).toBe("public");
  });
});

describe("withSecurityHeaders", () => {
  it("adds HSTS only on hosted Netlify deploys", () => {
    const previous = process.env.CONTEXT;
    try {
      delete process.env.CONTEXT;
      const local = new Headers();
      withSecurityHeaders(local);
      expect(local.get("Strict-Transport-Security")).toBeNull();

      process.env.CONTEXT = "production";
      const hosted = new Headers();
      withSecurityHeaders(hosted);
      expect(hosted.get("Strict-Transport-Security")).toBe("max-age=31536000");
    } finally {
      if (previous === undefined) {
        delete process.env.CONTEXT;
      } else {
        process.env.CONTEXT = previous;
      }
    }
  });
});
