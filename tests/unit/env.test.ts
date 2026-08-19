import { afterEach, describe, expect, it } from "vitest";
import {
  isDevAuthBypassEnabled,
  isRemoteDatabaseUrl,
  shouldRefuseHostedSeed,
  warnIfRemoteDatabaseUrl,
} from "../../src/lib/env";

const previous = new Map<string, string | undefined>();

function setEnv(name: string, value: string | undefined): void {
  if (!previous.has(name)) {
    previous.set(name, process.env[name]);
  }
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

afterEach(() => {
  for (const [name, value] of previous) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
  previous.clear();
});

describe("shouldRefuseHostedSeed", () => {
  it("allows seeding outside hosted Netlify contexts", () => {
    setEnv("CONTEXT", undefined);
    setEnv("ALLOW_PROD_SEED", undefined);
    expect(shouldRefuseHostedSeed()).toBe(false);
  });

  it("refuses hosted deploys unless ALLOW_PROD_SEED is true", () => {
    setEnv("CONTEXT", "production");
    setEnv("ALLOW_PROD_SEED", undefined);
    expect(shouldRefuseHostedSeed()).toBe(true);
    setEnv("ALLOW_PROD_SEED", "true");
    expect(shouldRefuseHostedSeed()).toBe(false);
  });
});

describe("isRemoteDatabaseUrl", () => {
  it("treats loopback hosts as local", () => {
    expect(isRemoteDatabaseUrl("postgres://user:pass@127.0.0.1:5432/db")).toBe(false);
    expect(isRemoteDatabaseUrl("postgres://user:pass@localhost/db")).toBe(false);
  });

  it("treats hosted hosts as remote", () => {
    expect(
      isRemoteDatabaseUrl("postgres://user:pass@ep-example.us-east-1.aws.neon.tech/db"),
    ).toBe(true);
  });

  it("treats unparseable non-local strings as remote", () => {
    expect(isRemoteDatabaseUrl("not-a-url")).toBe(true);
  });
});

describe("warnIfRemoteDatabaseUrl", () => {
  it("warns only for remote hosts", () => {
    const warn = console.warn;
    const calls: unknown[][] = [];
    console.warn = (...args: unknown[]) => {
      calls.push(args);
    };
    try {
      warnIfRemoteDatabaseUrl("postgres://user:pass@127.0.0.1:5432/db");
      expect(calls).toHaveLength(0);
      warnIfRemoteDatabaseUrl("postgres://user:pass@ep.neon.tech/db");
      expect(calls.length).toBeGreaterThan(0);
    } finally {
      console.warn = warn;
    }
  });
});

describe("isDevAuthBypassEnabled", () => {
  it("is off when DEV_AUTH_BYPASS is not true", () => {
    setEnv("DEV_AUTH_BYPASS", "false");
    expect(isDevAuthBypassEnabled()).toBe(false);
  });

  it("is off on hosted Netlify even without CONTEXT when NETLIFY is set", () => {
    setEnv("DEV_AUTH_BYPASS", "true");
    setEnv("CONTEXT", undefined);
    setEnv("NETLIFY", "true");
    setEnv("NETLIFY_DEV", undefined);
    expect(isDevAuthBypassEnabled()).toBe(false);
  });
});
