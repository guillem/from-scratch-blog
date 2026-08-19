import { afterEach, describe, expect, it } from "vitest";
import { absoluteUrl, getSiteUrl } from "../../src/config/site";

const keys = ["SITE_URL", "URL", "DEPLOY_PRIME_URL"] as const;
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

describe("getSiteUrl", () => {
  it("prefers SITE_URL and strips a trailing slash", () => {
    setEnv("SITE_URL", "https://blog.example/");
    setEnv("URL", "https://ignored.example");
    expect(getSiteUrl()).toBe("https://blog.example");
  });

  it("falls back to localhost when nothing is set", () => {
    for (const key of keys) {
      setEnv(key, undefined);
    }
    expect(getSiteUrl()).toBe("http://localhost:4321");
  });
});

describe("absoluteUrl", () => {
  it("joins the origin and path", () => {
    setEnv("SITE_URL", "https://blog.example");
    expect(absoluteUrl("/posts/hello")).toBe("https://blog.example/posts/hello");
    expect(absoluteUrl("posts/hello")).toBe("https://blog.example/posts/hello");
  });
});
