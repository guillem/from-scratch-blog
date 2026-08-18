import { describe, expect, it } from "vitest";
import { isValidSlug, normalizeSlug, slugify } from "../../src/lib/slugs";

describe("slugs", () => {
  it("slugifies titles", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
  });

  it("accepts only lowercase hyphenated slugs", () => {
    expect(isValidSlug("hello-world")).toBe(true);
    expect(isValidSlug("Hello")).toBe(false);
    expect(isValidSlug("hello--world")).toBe(false);
  });

  it("normalizes invalid input from a fallback title", () => {
    expect(normalizeSlug("Nope!", "Better Title")).toBe("better-title");
  });
});
