import { describe, expect, it } from "vitest";
import { escapeXml } from "../../src/lib/xml";

describe("escapeXml", () => {
  it("escapes characters that would break feed URLs", () => {
    expect(escapeXml("https://example.com/posts/a&b")).toBe(
      "https://example.com/posts/a&amp;b",
    );
    expect(escapeXml(`https://example.com/"x"`)).toBe(
      "https://example.com/&quot;x&quot;",
    );
  });
});
