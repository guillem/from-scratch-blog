import { afterEach, describe, expect, it } from "vitest";
import { isRemoteDatabaseUrl, shouldRefuseHostedSeed } from "../../src/lib/env";

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
});
