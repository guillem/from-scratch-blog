import { describe, expect, it } from "vitest";
import { assertAdmin, isAdmin, type AppUser } from "../../src/lib/auth";
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
