import { describe, expect, it } from "vitest";
import { renderMarkdown } from "../../src/lib/markdown";

describe("renderMarkdown", () => {
  it("renders standard markdown and fenced code", () => {
    const html = renderMarkdown(
      "# Hello\n\nA **bold** word.\n\n```js\nconst n = 1;\n```\n",
    );
    expect(html).toContain("<h1");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<pre>");
    expect(html).toContain("const n = 1;");
  });

  it("strips raw HTML and event handlers", () => {
    const html = renderMarkdown(
      '<script>alert(1)</script>\n<img src="x" onerror="alert(1)">\n<iframe src="https://evil.example"></iframe>',
    );
    expect(html.toLowerCase()).not.toContain("<script");
    expect(html.toLowerCase()).not.toContain("onerror");
    expect(html.toLowerCase()).not.toContain("<iframe");
  });

  it("rejects javascript URLs", () => {
    const html = renderMarkdown("[click](javascript:alert(1))");
    expect(html.toLowerCase()).not.toContain("javascript:");
  });
});
