import { describe, expect, it } from "vitest";
import { assertAdmin, isAdmin, requireAdmin, type AppUser } from "../../src/lib/auth";
import { isDevAuthBypassEnabled } from "../../src/lib/env";

const admin: AppUser = { id: "1", email: "a@example.com", roles: ["admin"] };
const member: AppUser = { id: "2", email: "b@example.com", roles: [] };

describe("authorization helpers", () => {
  it("treats only the admin role as privileged", () => {
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin(member)).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });

  it("rejects missing and non-admin users", () => {
    expect(() => assertAdmin(null)).toThrow(/Authentication required/);
    expect(() => assertAdmin(member)).toThrow(/Administrator access required/);
    expect(assertAdmin(admin)).toEqual(admin);
  });

  it("requireAdmin uses the local bypass when it is enabled", async () => {
    const previousBypass = process.env.DEV_AUTH_BYPASS;
    const previousContext = process.env.CONTEXT;
    const previousEmail = process.env.DEV_ADMIN_EMAIL;
    const previousNetlifyDev = process.env.NETLIFY_DEV;
    try {
      process.env.DEV_AUTH_BYPASS = "true";
      process.env.NETLIFY_DEV = "true";
      delete process.env.CONTEXT;
      process.env.DEV_ADMIN_EMAIL = "ci-admin@localhost";
      const user = await requireAdmin();
      expect(user.email).toBe("ci-admin@localhost");
      expect(user.roles).toContain("admin");
    } finally {
      process.env.DEV_AUTH_BYPASS = previousBypass;
      process.env.DEV_ADMIN_EMAIL = previousEmail;
      process.env.NETLIFY_DEV = previousNetlifyDev;
      if (previousContext === undefined) {
        delete process.env.CONTEXT;
      } else {
        process.env.CONTEXT = previousContext;
      }
    }
  });

  it("does not enable the local bypass on hosted Netlify deploys", () => {
    const previousBypass = process.env.DEV_AUTH_BYPASS;
    const previousContext = process.env.CONTEXT;
    const previousNetlify = process.env.NETLIFY;
    try {
      process.env.DEV_AUTH_BYPASS = "true";
      process.env.CONTEXT = "production";
      process.env.NETLIFY = "true";
      expect(isDevAuthBypassEnabled()).toBe(false);
    } finally {
      process.env.DEV_AUTH_BYPASS = previousBypass;
      process.env.CONTEXT = previousContext;
      process.env.NETLIFY = previousNetlify;
    }
  });
});
